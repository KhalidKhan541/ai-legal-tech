export interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  retryOn?: number[];
  interceptors?: {
    request?: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
    response?: Array<(response: Response) => Response | Promise<Response>>;
  };
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface HttpError<T = unknown> extends Error {
  response?: HttpResponse<T>;
  request?: Request;
  code?: string;
  isAxiosError: true;
}

interface InternalRequestConfig extends RequestConfig {
  url?: string;
  method?: string;
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;
  signal?: AbortSignal;
}

let globalConfig: RequestConfig = {};

export function configureHttp(config: RequestConfig): void {
  globalConfig = { ...globalConfig, ...config };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(
  baseURL: string | undefined,
  url: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  let fullUrl = url;
  if (baseURL && !url.startsWith("http")) {
    fullUrl = `${baseURL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  }

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      fullUrl += `?${qs}`;
    }
  }

  return fullUrl;
}

function mergeHeaders(
  defaults: Record<string, string> | undefined,
  custom: Record<string, string> | undefined
): Record<string, string> {
  return { ...defaults, ...custom };
}

async function executeRequest<T>(
  config: InternalRequestConfig
): Promise<HttpResponse<T>> {
  const mergedConfig: RequestConfig = {
    ...globalConfig,
    ...config,
    headers: mergeHeaders(globalConfig.headers, config.headers),
  };

  // Run request interceptors
  let finalConfig = { ...mergedConfig } as InternalRequestConfig;
  if (mergedConfig.interceptors?.request) {
    for (const interceptor of mergedConfig.interceptors.request) {
      finalConfig = { ...finalConfig, ...(await interceptor(finalConfig)) };
    }
  }

  const url = buildUrl(finalConfig.baseURL, finalConfig.url || "", finalConfig.params);
  const controller = new AbortController();
  const timeoutId = finalConfig.timeout
    ? setTimeout(() => controller.abort(), finalConfig.timeout)
    : undefined;

  try {
    const fetchOptions: RequestInit = {
      method: finalConfig.method || "GET",
      headers: finalConfig.headers as Record<string, string>,
      signal: finalConfig.signal ?? controller.signal,
    };

    if (finalConfig.data && finalConfig.method !== "GET") {
      if (
        finalConfig.data instanceof FormData ||
        finalConfig.data instanceof Blob ||
        finalConfig.data instanceof ArrayBuffer
      ) {
        fetchOptions.body = finalConfig.data as BodyInit;
      } else if (typeof finalConfig.data === "string") {
        fetchOptions.body = finalConfig.data;
        if (!fetchOptions.headers || !("Content-Type" in (fetchOptions.headers as Record<string, string>))) {
          (fetchOptions.headers as Record<string, string>) = {
            ...(fetchOptions.headers as Record<string, string>),
            "Content-Type": "application/json",
          };
        }
      } else {
        fetchOptions.body = JSON.stringify(finalConfig.data);
        if (!fetchOptions.headers || !("Content-Type" in (fetchOptions.headers as Record<string, string>))) {
          (fetchOptions.headers as Record<string, string>) = {
            ...(fetchOptions.headers as Record<string, string>),
            "Content-Type": "application/json",
          };
        }
      }
    }

    let response = await fetch(url, fetchOptions);

    // Run response interceptors
    if (mergedConfig.interceptors?.response) {
      for (const interceptor of mergedConfig.interceptors.response) {
        response = await interceptor(response);
      }
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let data: T;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text as T;
      }
    }

    const result: HttpResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      config: mergedConfig,
    };

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`) as HttpError<T>;
      error.response = result;
      error.isAxiosError = true;
      throw error;
    }

    return result;
  } catch (error) {
    if (error instanceof Error && "isAxiosError" in error) {
      throw error;
    }
    const httpError = new Error(
      error instanceof Error ? error.message : "Request failed"
    ) as HttpError<T>;
    httpError.isAxiosError = true;
    throw httpError;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function requestWithRetry<T>(
  config: InternalRequestConfig
): Promise<HttpResponse<T>> {
  const maxRetries = config.retries ?? globalConfig.retries ?? 0;
  const retryDelay = config.retryDelay ?? globalConfig.retryDelay ?? 1000;
  const retryOn = config.retryOn ?? globalConfig.retryOn ?? [408, 429, 500, 502, 503, 504];

  let lastError: HttpError<T> | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeRequest<T>(config);
    } catch (error) {
      lastError = error as HttpError<T>;

      if (attempt < maxRetries) {
        const statusCode = lastError.response?.status;
        const shouldRetry =
          !statusCode || retryOn.includes(statusCode) || lastError.code === "ECONNABORTED";

        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, attempt);
          await sleep(delay);
        } else {
          throw lastError;
        }
      }
    }
  }

  throw lastError;
}

// ─── Public API (Axios-like) ─────────────────────────────────────────────────

export const http = {
  async get<T>(url: string, config?: InternalRequestConfig): Promise<HttpResponse<T>> {
    return requestWithRetry<T>({ ...config, url, method: "GET" });
  },

  async post<T>(url: string, data?: unknown, config?: InternalRequestConfig): Promise<HttpResponse<T>> {
    return requestWithRetry<T>({ ...config, url, method: "POST", data });
  },

  async put<T>(url: string, data?: unknown, config?: InternalRequestConfig): Promise<HttpResponse<T>> {
    return requestWithRetry<T>({ ...config, url, method: "PUT", data });
  },

  async patch<T>(url: string, data?: unknown, config?: InternalRequestConfig): Promise<HttpResponse<T>> {
    return requestWithRetry<T>({ ...config, url, method: "PATCH", data });
  },

  async delete<T>(url: string, config?: InternalRequestConfig): Promise<HttpResponse<T>> {
    return requestWithRetry<T>({ ...config, url, method: "DELETE" });
  },

  async head<T>(url: string, config?: InternalRequestConfig): Promise<HttpResponse<T>> {
    return requestWithRetry<T>({ ...config, url, method: "HEAD" });
  },

  async options<T>(url: string, config?: InternalRequestConfig): Promise<HttpResponse<T>> {
    return requestWithRetry<T>({ ...config, url, method: "OPTIONS" });
  },

  create(defaultConfig: RequestConfig): typeof http {
    const merged = { ...globalConfig, ...defaultConfig };
    return {
      get: <T>(url: string, config?: InternalRequestConfig) =>
        requestWithRetry<T>({ ...merged, ...config, url, method: "GET" }),
      post: <T>(url: string, data?: unknown, config?: InternalRequestConfig) =>
        requestWithRetry<T>({ ...merged, ...config, url, method: "POST", data }),
      put: <T>(url: string, data?: unknown, config?: InternalRequestConfig) =>
        requestWithRetry<T>({ ...merged, ...config, url, method: "PUT", data }),
      patch: <T>(url: string, data?: unknown, config?: InternalRequestConfig) =>
        requestWithRetry<T>({ ...merged, ...config, url, method: "PATCH", data }),
      delete: <T>(url: string, config?: InternalRequestConfig) =>
        requestWithRetry<T>({ ...merged, ...config, url, method: "DELETE" }),
      head: <T>(url: string, config?: InternalRequestConfig) =>
        requestWithRetry<T>({ ...merged, ...config, url, method: "HEAD" }),
      options: <T>(url: string, config?: InternalRequestConfig) =>
        requestWithRetry<T>({ ...merged, ...config, url, method: "OPTIONS" }),
      create: (dc: RequestConfig) => http.create({ ...merged, ...dc }),
    };
  },

  defaults: globalConfig,
};

export default http;
