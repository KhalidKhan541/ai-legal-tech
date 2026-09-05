import crypto from "node:crypto";

export type AIProvider = "openai" | "anthropic" | "gemini";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  jsonMode?: boolean;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "unknown";
  latencyMs: number;
  cached: boolean;
}

export interface AIStreamChunk {
  delta: string;
  done: boolean;
  usage?: AICompletionResponse["usage"];
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  provider: AIProvider;
  dimensions: number;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

interface CacheEntry {
  response: AICompletionResponse;
  timestamp: number;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.5-pro",
};

const EMBEDDING_MODELS: Record<AIProvider, string> = {
  openai: "text-embedding-3-small",
  anthropic: "text-embedding-3-small",
  gemini: "text-embedding-004",
};

export class AIClient {
  private providers: Map<AIProvider, ProviderConfig> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number = 1000 * 60 * 5;
  private requestCount: number = 0;
  private totalLatency: number = 0;
  private errorCount: number = 0;

  registerProvider(provider: AIProvider, config: ProviderConfig): void {
    this.providers.set(provider, config);
  }

  getRegisteredProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  setCacheTTL(ms: number): void {
    this.cacheTTL = ms;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      averageLatency:
        this.requestCount > 0 ? this.totalLatency / this.requestCount : 0,
      errorCount: this.errorCount,
      cacheSize: this.cache.size,
    };
  }

  private getCacheKey(
    provider: AIProvider,
    messages: AIMessage[],
    options: AICompletionOptions
  ): string {
    const payload = JSON.stringify({ provider, messages, options });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  private checkCache(key: string): AICompletionResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return { ...entry.response, cached: true };
  }

  private storeCache(key: string, response: AICompletionResponse): void {
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  private getProviderConfig(provider: AIProvider): ProviderConfig {
    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(
        `Provider "${provider}" not registered. Available: ${this.getRegisteredProviders().join(", ")}`
      );
    }
    return config;
  }

  private inferProvider(model: string): AIProvider {
    if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
    if (model.startsWith("claude")) return "anthropic";
    if (model.startsWith("gemini")) return "gemini";
    throw new Error(`Cannot infer provider for model: ${model}`);
  }

  async complete(
    messages: AIMessage[],
    options: AICompletionOptions = {},
    preferredProvider?: AIProvider
  ): Promise<AICompletionResponse> {
    const provider =
      preferredProvider ?? this.inferProvider(options.model ?? "");
    const config = this.getProviderConfig(provider);
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS[provider];

    const mergedOptions = { ...options, model };

    if (!options.temperature || options.temperature <= 1) {
      const cacheKey = this.getCacheKey(provider, messages, mergedOptions);
      const cached = this.checkCache(cacheKey);
      if (cached) return cached;
    }

    const startTime = Date.now();
    this.requestCount++;

    try {
      let response: AICompletionResponse;

      switch (provider) {
        case "openai":
          response = await this.callOpenAI(config, messages, mergedOptions);
          break;
        case "anthropic":
          response = await this.callAnthropic(config, messages, mergedOptions);
          break;
        case "gemini":
          response = await this.callGemini(config, messages, mergedOptions);
          break;
      }

      response.latencyMs = Date.now() - startTime;
      this.totalLatency += response.latencyMs;

      const cacheKey = this.getCacheKey(provider, messages, mergedOptions);
      this.storeCache(cacheKey, response);

      return response;
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  async completeWithFallback(
    messages: AIMessage[],
    options: AICompletionOptions = {},
    providerOrder: AIProvider[] = ["openai", "anthropic", "gemini"]
  ): Promise<AICompletionResponse> {
    const errors: Error[] = [];

    for (const provider of providerOrder) {
      if (!this.providers.has(provider)) continue;
      try {
        return await this.complete(messages, options, provider);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    throw new Error(
      `All providers failed. Errors:\n${errors.map((e) => e.message).join("\n")}`
    );
  }

  async *stream(
    messages: AIMessage[],
    options: AICompletionOptions = {},
    preferredProvider?: AIProvider
  ): AsyncGenerator<AIStreamChunk> {
    const provider =
      preferredProvider ?? this.inferProvider(options.model ?? "");
    const config = this.getProviderConfig(provider);
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS[provider];

    switch (provider) {
      case "openai":
        yield* this.streamOpenAI(config, messages, { ...options, model });
        break;
      case "anthropic":
        yield* this.streamAnthropic(config, messages, { ...options, model });
        break;
      case "gemini":
        yield* this.streamGemini(config, messages, { ...options, model });
        break;
    }
  }

  async embed(
    texts: string[],
    options: EmbeddingOptions = {},
    provider: AIProvider = "openai"
  ): Promise<EmbeddingResponse[]> {
    const config = this.getProviderConfig(provider);
    const model =
      options.model ?? EMBEDDING_MODELS[provider];

    if (provider === "openai") {
      return this.embedOpenAI(config, texts, model);
    }

    throw new Error(`Embeddings not yet supported for provider: ${provider}`);
  }

  private async callOpenAI(
    config: ProviderConfig,
    messages: AIMessage[],
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS.openai;
    const url = `${config.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`;

    const body: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    };

    if (options.topP !== undefined) body.top_p = options.topP;
    if (options.stopSequences) body.stop = options.stopSequences;
    if (options.jsonMode) body.response_format = { type: "json_object" };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...(config.organization
          ? { "OpenAI-Organization": config.organization }
          : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs ?? 60_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI API error ${response.status}: ${errorBody}`
      );
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: { content: string };
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      model: string;
    };

    const choice = data.choices[0];
    return {
      content: choice.message.content,
      model: data.model,
      provider: "openai",
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason:
        choice.finish_reason === "stop"
          ? "stop"
          : choice.finish_reason === "length"
            ? "length"
            : "unknown",
      latencyMs: 0,
      cached: false,
    };
  }

  private async callAnthropic(
    config: ProviderConfig,
    messages: AIMessage[],
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS.anthropic;
    const url = `${config.baseUrl ?? "https://api.anthropic.com/v1"}/messages`;

    let systemPrompt: string | undefined;
    const userMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = (systemPrompt ? systemPrompt + "\n" : "") + msg.content;
      } else {
        userMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const body: Record<string, unknown> = {
      model,
      messages: userMessages,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
    };

    if (systemPrompt) body.system = systemPrompt;
    if (options.topP !== undefined) body.top_p = options.topP;
    if (options.stopSequences) body.stop_sequences = options.stopSequences;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs ?? 60_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Anthropic API error ${response.status}: ${errorBody}`
      );
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      model: string;
      usage: {
        input_tokens: number;
        output_tokens: number;
      };
      stop_reason: string;
    };

    return {
      content: data.content.map((c) => c.text).join(""),
      model: data.model,
      provider: "anthropic",
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason:
        data.stop_reason === "end_turn"
          ? "stop"
          : data.stop_reason === "max_tokens"
            ? "length"
            : "unknown",
      latencyMs: 0,
      cached: false,
    };
  }

  private async callGemini(
    config: ProviderConfig,
    messages: AIMessage[],
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS.gemini;
    const url = `${config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta"}/models/${model}:generateContent?key=${config.apiKey}`;

    const contents: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        contents.unshift({
          role: "user",
          parts: [{ text: msg.content }],
        });
        contents.push({
          role: "model",
          parts: [{ text: "Understood." }],
        });
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    };

    if (options.topP !== undefined) {
      (body.generationConfig as Record<string, unknown>).topP = options.topP;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs ?? 60_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini API error ${response.status}: ${errorBody}`
      );
    }

    const data = (await response.json()) as {
      candidates: Array<{
        content: { parts: Array<{ text: string }> };
        finishReason: string;
      }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    const candidate = data.candidates[0];
    return {
      content: candidate.content.parts.map((p) => p.text).join(""),
      model,
      provider: "gemini",
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      finishReason:
        candidate.finishReason === "STOP"
          ? "stop"
          : candidate.finishReason === "MAX_TOKENS"
            ? "length"
            : "unknown",
      latencyMs: 0,
      cached: false,
    };
  }

  private async *streamOpenAI(
    config: ProviderConfig,
    messages: AIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS.openai;
    const url = `${config.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      }),
      signal: AbortSignal.timeout(config.timeoutMs ?? 120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI streaming error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          yield { delta: "", done: true };
          return;
        }
        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{
              delta: { content?: string };
              finish_reason: string | null;
            }>;
          };
          const choice = parsed.choices[0];
          yield {
            delta: choice.delta.content ?? "",
            done: choice.finish_reason !== null,
          };
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  private async *streamAnthropic(
    config: ProviderConfig,
    messages: AIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS.anthropic;
    const url = `${config.baseUrl ?? "https://api.anthropic.com/v1"}/messages`;

    let systemPrompt: string | undefined;
    const userMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = (systemPrompt ? systemPrompt + "\n" : "") + msg.content;
      } else {
        userMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const body: Record<string, unknown> = {
      model,
      messages: userMessages,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
    };
    if (systemPrompt) body.system = systemPrompt;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs ?? 120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic streaming error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        try {
          const parsed = JSON.parse(data) as {
            type: string;
            delta?: { text?: string };
          };
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            yield { delta: parsed.delta.text, done: false };
          }
          if (parsed.type === "message_stop") {
            yield { delta: "", done: true };
            return;
          }
        } catch {
          // skip
        }
      }
    }
  }

  private async *streamGemini(
    config: ProviderConfig,
    messages: AIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    const model = options.model ?? config.defaultModel ?? DEFAULT_MODELS.gemini;
    const url = `${config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta"}/models/${model}:streamGenerateContent?key=${config.apiKey}&alt=sse`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const msg of messages) {
      if (msg.role === "system") {
        contents.unshift({ role: "user", parts: [{ text: msg.content }] });
        contents.push({ role: "model", parts: [{ text: "Understood." }] });
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      }),
      signal: AbortSignal.timeout(config.timeoutMs ?? 120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini streaming error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        try {
          const parsed = JSON.parse(data) as {
            candidates: Array<{
              content: { parts: Array<{ text: string }> };
              finishReason?: string;
            }>;
          };
          const text = parsed.candidates?.[0]?.content?.parts
            ?.map((p) => p.text)
            .join("");
          if (text) {
            yield {
              delta: text,
              done: parsed.candidates?.[0]?.finishReason === "STOP",
            };
          }
        } catch {
          // skip
        }
      }
    }
  }

  private async embedOpenAI(
    config: ProviderConfig,
    texts: string[],
    model: string
  ): Promise<EmbeddingResponse[]> {
    const url = `${config.baseUrl ?? "https://api.openai.com/v1"}/embeddings`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ model, input: texts }),
      signal: AbortSignal.timeout(config.timeoutMs ?? 30_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI embedding error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
      model: string;
      usage: { prompt_tokens: number; total_tokens: number };
    };

    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => ({
        embedding: item.embedding,
        model: data.model,
        provider: "openai" as AIProvider,
        dimensions: item.embedding.length,
      }));
  }
}

let defaultClient: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!defaultClient) {
    defaultClient = new AIClient();
  }
  return defaultClient;
}

export function configureAIClient(configs: {
  openai?: ProviderConfig;
  anthropic?: ProviderConfig;
  gemini?: ProviderConfig;
}): AIClient {
  const client = getAIClient();
  if (configs.openai) client.registerProvider("openai", configs.openai);
  if (configs.anthropic) client.registerProvider("anthropic", configs.anthropic);
  if (configs.gemini) client.registerProvider("gemini", configs.gemini);
  return client;
}

export function createAIClient(): AIClient {
  return new AIClient();
}
