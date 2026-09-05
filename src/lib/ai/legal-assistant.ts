import { getAIClient, type AIMessage, type AICompletionResponse } from "./provider";

export type LegalDomain =
  | "contract"
  | "litigation"
  | "corporate"
  | "ip"
  | "employment"
  | "real_estate"
  | "tax"
  | "criminal"
  | "family"
  | "immigration"
  | "environmental"
  | "regulatory"
  | "healthcare"
  | "finance"
  | "international"
  | "general";

export type RiskAssessmentLevel = "very_high" | "high" | "moderate" | "low" | "very_low";

export interface LegalQA {
  id: string;
  question: string;
  answer: string;
  domain: LegalDomain;
  confidence: number;
  disclaimers: string[];
  sources: Array<{
    citation: string;
    relevance: string;
  }>;
  followUpQuestions: string[];
  processingTimeMs: number;
}

export interface ConceptExplanation {
  id: string;
  concept: string;
  domain: LegalDomain;
  definition: string;
  plainEnglish: string;
  examples: string[];
  relatedConcepts: string[];
  jurisdictionNotes?: string;
  commonMisconceptions?: string[];
  practicalImplications: string;
}

export interface StrategySuggestion {
  id: string;
  objective: string;
  domain: LegalDomain;
  strategies: Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    riskLevel: RiskAssessmentLevel;
    estimatedCost?: string;
    estimatedTimeline?: string;
    successProbability?: string;
  }>;
  recommendedStrategy: string;
  alternativeApproaches: string[];
  keyConsiderations: string[];
  warnings: string[];
}

export interface RiskAssessment {
  id: string;
  situation: string;
  domain: LegalDomain;
  overallRisk: RiskAssessmentLevel;
  riskScore: number;
  risks: Array<{
    description: string;
    level: RiskAssessmentLevel;
    probability: string;
    impact: string;
    mitigation: string;
  }>;
  recommendations: string[];
  insuranceConsiderations?: string[];
  complianceRequirements?: string[];
}

export interface CasePrediction {
  id: string;
  caseSummary: string;
  jurisdiction: string;
  legalIssues: string[];
  prediction: {
    outcome: string;
    confidence: number;
    reasoning: string;
  };
  alternativeOutcomes: Array<{
    outcome: string;
    probability: string;
    conditions: string[];
  }>;
  keyFactors: Array<{
    factor: string;
    favoring: "plaintiff" | "defendant" | "neutral";
    weight: number;
  }>;
  settlementRange?: {
    low: string;
    mid: string;
    high: string;
  };
  precedents: Array<{
    caseName: string;
    citation: string;
    relevance: string;
    outcome: string;
  }>;
  disclaimer: string;
}

const ASSISTANT_SYSTEM_PROMPT = `You are an expert AI legal assistant with deep knowledge across all areas of law. You provide helpful, accurate legal information while always clarifying that your responses do not constitute legal advice. You explain complex legal concepts in plain English, suggest strategies, assess risks, and predict case outcomes based on legal principles and precedent.

Key principles:
1. Always include appropriate disclaimers that this is not legal advice
2. Be thorough but accessible in explanations
3. Consider jurisdiction-specific nuances
4. Provide balanced perspectives on contentious issues
5. Recommend consulting with a licensed attorney for specific situations
6. Be honest about uncertainty and limitations of AI analysis`;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function parseJSONResponse<T>(text: string): T {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;

  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const start = firstBrace !== -1 && firstBracket !== -1
    ? Math.min(firstBrace, firstBracket)
    : firstBrace !== -1 ? firstBrace : firstBracket;
  if (start === -1) throw new Error("No JSON found in response");

  const textAfterStart = text.substring(start);
  let depth = 0;
  let end = -1;
  const openChar = text[start] === "{" ? "}" : "]";
  for (let i = 0; i < textAfterStart.length; i++) {
    if (textAfterStart[i] === (openChar === "}" ? "{" : "[")) depth++;
    if (textAfterStart[i] === openChar) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Unbalanced JSON");
  return JSON.parse(textAfterStart.substring(0, end + 1)) as T;
}

export async function askLegalQuestion(
  question: string,
  options: {
    domain?: LegalDomain;
    jurisdiction?: string;
    context?: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  } = {}
): Promise<LegalQA> {
  const client = getAIClient();
  const startTime = Date.now();

  const messages: AIMessage[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
  ];

  if (options.conversationHistory) {
    for (const msg of options.conversationHistory.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({
    role: "user",
    content: `Legal Question: "${question}"
${options.domain ? `Domain: ${options.domain}` : ""}
${options.jurisdiction ? `Jurisdiction: ${options.jurisdiction}` : ""}
${options.context ? `Additional Context:\n${options.context}` : ""}

Provide a comprehensive response as JSON with:
- answer: detailed answer to the question
- domain: the primary legal domain
- confidence: 0-1 confidence level
- disclaimers: array of applicable disclaimers
- sources: array of {citation, relevance} for relevant legal authorities
- followUpQuestions: array of suggested follow-up questions

Be thorough but accessible. Explain legal concepts in plain English where possible.`,
  });

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<LegalQA, "id" | "question" | "processingTimeMs">>(response.content);

  return {
    ...raw,
    id: generateId(),
    question,
    processingTimeMs: Date.now() - startTime,
  };
}

export async function explainLegalConcept(
  concept: string,
  options: {
    domain?: LegalDomain;
    jurisdiction?: string;
    audienceLevel?: "beginner" | "intermediate" | "advanced";
  } = {}
): Promise<ConceptExplanation> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Explain the legal concept: "${concept}"
${options.domain ? `Domain: ${options.domain}` : ""}
${options.jurisdiction ? `Jurisdiction: ${options.jurisdiction}` : ""}
Audience Level: ${options.audienceLevel ?? "intermediate"}

Provide a comprehensive explanation as JSON with:
- concept: the concept name
- domain: primary legal domain
- definition: formal legal definition
- plainEnglish: plain English explanation
- examples: array of practical examples
- relatedConcepts: array of related legal concepts
- jurisdictionNotes: any jurisdiction-specific variations
- commonMisconceptions: array of common misunderstandings
- practicalImplications: how this concept applies in practice

Make the explanation thorough but accessible.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 6144,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<ConceptExplanation, "id">>(response.content);
  return { ...raw, id: generateId() };
}

export async function suggestStrategies(
  objective: string,
  options: {
    domain?: LegalDomain;
    jurisdiction?: string;
    constraints?: string[];
    budget?: string;
    timeline?: string;
    riskTolerance?: "low" | "medium" | "high";
  } = {}
): Promise<StrategySuggestion> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Suggest legal strategies for achieving the following objective:
"${objective}"

${options.domain ? `Domain: ${options.domain}` : ""}
${options.jurisdiction ? `Jurisdiction: ${options.jurisdiction}` : ""}
${options.constraints?.length ? `Constraints:\n${options.constraints.map((c) => `- ${c}`).join("\n")}` : ""}
${options.budget ? `Budget: ${options.budget}` : ""}
${options.timeline ? `Timeline: ${options.timeline}` : ""}
${options.riskTolerance ? `Risk Tolerance: ${options.riskTolerance}` : ""}

Provide as JSON with:
- objective: restated objective
- domain: primary legal domain
- strategies: array of {name, description, pros, cons, riskLevel (very_high/high/moderate/low/very_low), estimatedCost, estimatedTimeline, successProbability}
- recommendedStrategy: which strategy to recommend and why
- alternativeApproaches: other creative approaches
- keyConsiderations: important factors to consider
- warnings: potential pitfalls and red flags

Be practical and realistic. Consider both legal and business implications.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<StrategySuggestion, "id">>(response.content);
  return { ...raw, id: generateId() };
}

export async function assessRisk(
  situation: string,
  options: {
    domain?: LegalDomain;
    jurisdiction?: string;
    parties?: Array<{ name: string; role: string }>;
    financialExposure?: string;
  } = {}
): Promise<RiskAssessment> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Assess the legal risks for the following situation:
"${situation}"

${options.domain ? `Domain: ${options.domain}` : ""}
${options.jurisdiction ? `Jurisdiction: ${options.jurisdiction}` : ""}
${options.parties?.length ? `Parties:\n${options.parties.map((p) => `- ${p.name} (${p.role})`).join("\n")}` : ""}
${options.financialExposure ? `Financial Exposure: ${options.financialExposure}` : ""}

Provide a comprehensive risk assessment as JSON with:
- situation: restated situation
- domain: primary legal domain
- overallRisk: very_high, high, moderate, low, or very_low
- riskScore: 0-100 risk score
- risks: array of {description, level, probability, impact, mitigation}
- recommendations: array of risk mitigation recommendations
- insuranceConsiderations: relevant insurance considerations
- complianceRequirements: applicable compliance requirements

Be thorough and realistic in your assessment.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<RiskAssessment, "id">>(response.content);
  return { ...raw, id: generateId() };
}

export async function predictCaseOutcome(
  caseSummary: string,
  options: {
    jurisdiction?: string;
    legalIssues?: string[];
    partyRole?: "plaintiff" | "defendant";
    includeSettlementRange?: boolean;
  } = {}
): Promise<CasePrediction> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Predict the likely outcome of the following case:
"${caseSummary}"

${options.jurisdiction ? `Jurisdiction: ${options.jurisdiction}` : ""}
${options.legalIssues?.length ? `Legal Issues:\n${options.legalIssues.map((i) => `- ${i}`).join("\n")}` : ""}
${options.partyRole ? `Analyzing from ${options.partyRole} perspective` : "Analyzing from both perspectives"}

Provide as JSON with:
- caseSummary: restated summary
- jurisdiction: jurisdiction
- legalIssues: array of key legal issues
- prediction: {outcome, confidence (0-1), reasoning}
- alternativeOutcomes: array of {outcome, probability, conditions}
- keyFactors: array of {factor, favoring (plaintiff/defendant/neutral), weight (0-1)}
- settlementRange: {low, mid, high} if applicable
- precedents: array of {caseName, citation, relevance, outcome}
- disclaimer: appropriate disclaimer about AI predictions

Be realistic and balanced. Consider all relevant factors.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.4,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<CasePrediction, "id">>(response.content);
  return { ...raw, id: generateId() };
}

export async function chatWithAssistant(
  message: string,
  options: {
    domain?: LegalDomain;
    jurisdiction?: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    systemPrompt?: string;
  } = {}
): Promise<AICompletionResponse> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    {
      role: "system",
      content: options.systemPrompt ?? ASSISTANT_SYSTEM_PROMPT,
    },
  ];

  if (options.conversationHistory) {
    for (const msg of options.conversationHistory.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: message });

  return client.complete(messages, {
    temperature: 0.5,
    maxTokens: 4096,
  });
}

export async function batchLegalAnalysis(
  queries: Array<{
    question: string;
    domain?: LegalDomain;
    jurisdiction?: string;
  }>
): Promise<LegalQA[]> {
  const results = await Promise.all(
    queries.map((q) =>
      askLegalQuestion(q.question, {
        domain: q.domain,
        jurisdiction: q.jurisdiction,
      })
    )
  );
  return results;
}

export function formatAssistantResponse(response: LegalQA): string {
  const lines: string[] = [];
  lines.push(`# Legal Question & Answer`);
  lines.push(`**Question:** ${response.question}`);
  lines.push(`**Domain:** ${response.domain}`);
  lines.push(`**Confidence:** ${(response.confidence * 100).toFixed(0)}%`);
  lines.push(`**Processing Time:** ${(response.processingTimeMs / 1000).toFixed(1)}s`);
  lines.push("");
  lines.push(`## Answer`);
  lines.push(response.answer);
  lines.push("");

  if (response.sources.length > 0) {
    lines.push(`## Sources`);
    for (const s of response.sources) {
      lines.push(`- ${s.citation}: ${s.relevance}`);
    }
    lines.push("");
  }

  if (response.followUpQuestions.length > 0) {
    lines.push(`## Follow-Up Questions`);
    for (const q of response.followUpQuestions) {
      lines.push(`- ${q}`);
    }
    lines.push("");
  }

  if (response.disclaimers.length > 0) {
    lines.push(`## Disclaimers`);
    for (const d of response.disclaimers) {
      lines.push(`> ${d}`);
    }
  }

  return lines.join("\n");
}

export function formatPredictionReport(prediction: CasePrediction): string {
  const lines: string[] = [];
  lines.push(`# Case Outcome Prediction`);
  lines.push(`**Jurisdiction:** ${prediction.jurisdiction}`);
  lines.push(`**Legal Issues:** ${prediction.legalIssues.join(", ")}`);
  lines.push("");

  lines.push(`## Prediction`);
  lines.push(`**Outcome:** ${prediction.prediction.outcome}`);
  lines.push(`**Confidence:** ${(prediction.prediction.confidence * 100).toFixed(0)}%`);
  lines.push(`**Reasoning:** ${prediction.prediction.reasoning}`);
  lines.push("");

  if (prediction.alternativeOutcomes.length > 0) {
    lines.push(`## Alternative Outcomes`);
    for (const alt of prediction.alternativeOutcomes) {
      lines.push(`- **${alt.outcome}** (${alt.probability})`);
      if (alt.conditions.length) {
        lines.push(`  Conditions: ${alt.conditions.join("; ")}`);
      }
    }
    lines.push("");
  }

  if (prediction.keyFactors.length > 0) {
    lines.push(`## Key Factors`);
    for (const f of prediction.keyFactors) {
      const icon = f.favoring === "plaintiff" ? "↑" : f.favoring === "defendant" ? "↓" : "—";
      lines.push(`- ${icon} ${f.factor} (weight: ${(f.weight * 100).toFixed(0)}%)`);
    }
    lines.push("");
  }

  if (prediction.settlementRange) {
    lines.push(`## Settlement Range`);
    lines.push(`Low: ${prediction.settlementRange.low}`);
    lines.push(`Mid: ${prediction.settlementRange.mid}`);
    lines.push(`High: ${prediction.settlementRange.high}`);
    lines.push("");
  }

  lines.push(`> **Disclaimer:** ${prediction.disclaimer}`);
  return lines.join("\n");
}
