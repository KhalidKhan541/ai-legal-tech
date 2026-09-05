import { getAIClient, type AIMessage } from "./provider";
import type { ClauseCategory } from "./contract-review";

export type ObligationType = "affirmative" | "negative" | "conditional" | "payment" | "delivery" | "reporting" | "compliance";
export type RightType = "terminate" | "modify" | "assign" | "access" | "audit" | "license" | " remedies" | "information";
export type ConditionType = "precedent" | "subsequent" | "concurrent" | "optional";
export type FinancialTermType = "payment" | "penalty" | "bonus" | "royalty" | "fee" | "deposit" | "credit" | "insurance_premium" | "expense";

export interface Obligation {
  id: string;
  party: string;
  type: ObligationType;
  category: ClauseCategory;
  description: string;
  fullText: string;
  deadline?: string;
  conditions?: string[];
  consequences?: string;
  sectionReference?: string;
  assignable: boolean;
}

export interface Right {
  id: string;
  holder: string;
  type: RightType;
  category: ClauseCategory;
  description: string;
  fullText: string;
  conditions?: string[];
  waivable: boolean;
  exclusive: boolean;
  sectionReference?: string;
}

export interface Condition {
  id: string;
  type: ConditionType;
  category: ClauseCategory;
  trigger: string;
  consequence: string;
  fullText: string;
  timeBound: boolean;
  deadline?: string;
  sectionReference?: string;
}

export interface Deadline {
  id: string;
  description: string;
  date: string;
  relativeDate?: string;
  category: ClauseCategory;
  obligationId?: string;
  consequences?: string;
  extendable: boolean;
  notice_required?: string;
}

export interface FinancialTerm {
  id: string;
  type: FinancialTermType;
  category: ClauseCategory;
  amount?: string;
  description: string;
  fullText: string;
  paymentSchedule?: string;
  conditions?: string[];
  penalties?: string;
  sectionReference?: string;
}

export interface LiabilityClause {
  id: string;
  type: "limitation" | "exclusion" | " cap" | "indemnity" | "warranty" | "consequential";
  description: string;
  fullText: string;
  capAmount?: string;
  exclusions: string[];
  inclusions: string[];
  survivalPeriod?: string;
  sectionReference?: string;
}

export interface IndemnificationClause {
  id: string;
  indemnifyingParty: string;
  indemnifiedParty: string;
  scope: string;
  triggers: string[];
  exclusions: string[];
  caps?: string;
  procedures: string[];
  survivalPeriod?: string;
  fullText: string;
  sectionReference?: string;
}

export interface ContractAnalysisResult {
  contractId: string;
  analyzedAt: string;
  obligations: Obligation[];
  rights: Right[];
  conditions: Condition[];
  deadlines: Deadline[];
  financialTerms: FinancialTerm[];
  liabilityClauses: LiabilityClause[];
  indemnificationClauses: IndemnificationClause[];
  summary: {
    totalObligations: number;
    totalRights: number;
    totalConditions: number;
    totalDeadlines: number;
    totalFinancialTerms: number;
    partyObligations: Record<string, number>;
    partyRights: Record<string, number>;
    criticalDeadlines: Deadline[];
    financialExposure: string;
  };
  processingTimeMs: number;
}

const ANALYSIS_SYSTEM_PROMPT = `You are an expert legal AI performing deep contract analysis. You extract obligations, rights, conditions, deadlines, financial terms, liability provisions, and indemnification clauses with extreme precision. Always provide structured JSON output. Reference specific sections when possible.`;

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
    : firstBrace !== -1
      ? firstBrace
      : firstBracket;

  if (start === -1) throw new Error("No JSON found in response");

  const textAfterStart = text.substring(start);
  let depth = 0;
  let end = -1;
  const openChar = text[start] === "{" ? "}" : "]";

  for (let i = 0; i < textAfterStart.length; i++) {
    if (textAfterStart[i] === (openChar === "}" ? "{" : "[")) depth++;
    if (textAfterStart[i] === openChar) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) throw new Error("Unbalanced JSON in response");
  return JSON.parse(textAfterStart.substring(0, end + 1)) as T;
}

export async function extractObligations(
  contractText: string,
  contractType?: string
): Promise<Obligation[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract ALL obligations from this ${contractType ?? "contract"}. For each obligation provide:
- party: who is obligated
- type: affirmative, negative, conditional, payment, delivery, reporting, or compliance
- category: clause category (payment, termination, liability, etc.)
- description: plain English description
- fullText: exact contract text
- deadline: if time-bound
- conditions: conditions that must be met
- consequences: what happens if breached
- sectionReference: section number
- assignable: whether the obligation can be assigned

Return as JSON array. Be exhaustive — do not miss any obligation.

Contract:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<Obligation, "id">>>(response.content);
  return raw.map((o) => ({ ...o, id: generateId() }));
}

export async function extractRights(
  contractText: string,
  contractType?: string
): Promise<Right[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract ALL rights and remedies from this ${contractType ?? "contract"}. For each right provide:
- holder: who holds the right
- type: terminate, modify, assign, access, audit, license, remedies, or information
- category: clause category
- description: plain English description
- fullText: exact contract text
- conditions: when the right can be exercised
- waivable: whether the right can be waived
- exclusive: whether it's an exclusive right
- sectionReference: section number

Return as JSON array.

Contract:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<Right, "id">>>(response.content);
  return raw.map((r) => ({ ...r, id: generateId() }));
}

export async function extractConditions(
  contractText: string,
  contractType?: string
): Promise<Condition[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract ALL conditions, contingencies, and triggers from this ${contractType ?? "contract"}. For each condition provide:
- type: precedent, subsequent, concurrent, or optional
- category: clause category
- trigger: what triggers or activates this condition
- consequence: what happens when triggered
- fullText: exact contract text
- timeBound: whether there is a time limit
- deadline: if time-bound
- sectionReference: section number

Return as JSON array.

Contract:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 6144,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<Condition, "id">>>(response.content);
  return raw.map((c) => ({ ...c, id: generateId() }));
}

export async function extractDeadlines(
  contractText: string,
  contractType?: string
): Promise<Deadline[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract ALL deadlines, due dates, and time-sensitive provisions from this ${contractType ?? "contract"}. For each deadline provide:
- description: what the deadline is for
- date: specific date if stated
- relativeDate: relative time (e.g., "30 days after signing")
- category: clause category
- obligationId: related obligation description
- consequences: what happens if missed
- extendable: whether the deadline can be extended
- notice_required: notice period required

Return as JSON array.

Contract:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 6144,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<Deadline, "id">>>(response.content);
  return raw.map((d) => ({ ...d, id: generateId() }));
}

export async function analyzeFinancialTerms(
  contractText: string,
  contractType?: string
): Promise<FinancialTerm[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract ALL financial terms from this ${contractType ?? "contract"}. For each financial term provide:
- type: payment, penalty, bonus, royalty, fee, deposit, credit, insurance_premium, or expense
- category: clause category
- amount: specific monetary amount or rate
- description: plain English description
- fullText: exact contract text
- paymentSchedule: payment timing and frequency
- conditions: conditions for payment
- penalties: late payment or breach penalties
- sectionReference: section number

Return as JSON array. Be thorough — capture every financial obligation, right, and term.

Contract:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<FinancialTerm, "id">>>(response.content);
  return raw.map((f) => ({ ...f, id: generateId() }));
}

export async function analyzeLiability(
  contractText: string,
  contractType?: string
): Promise<LiabilityClause[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze ALL liability provisions in this ${contractType ?? "contract"}. For each liability clause provide:
- type: limitation, exclusion, cap, indemnity, warranty, or consequential
- description: plain English description
- fullText: exact contract text
- capAmount: maximum liability amount if capped
- exclusions: what is excluded from liability
- inclusions: what is included in liability
- survivalPeriod: how long liability survives
- sectionReference: section number

Return as JSON array.

Contract:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 6144,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<LiabilityClause, "id">>>(response.content);
  return raw.map((l) => ({ ...l, id: generateId() }));
}

export async function analyzeIndemnification(
  contractText: string,
  contractType?: string
): Promise<IndemnificationClause[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze ALL indemnification provisions in this ${contractType ?? "contract"}. For each indemnification clause provide:
- indemnifyingParty: who indemnifies
- indemnifiedParty: who is indemnified
- scope: what is covered
- triggers: events that trigger indemnification
- exclusions: what is excluded
- caps: maximum indemnification amount
- procedures: claim procedures
- survivalPeriod: how long indemnification survives
- fullText: exact contract text
- sectionReference: section number

Return as JSON array.

Contract:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 6144,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<IndemnificationClause, "id">>>(response.content);
  return raw.map((i) => ({ ...i, id: generateId() }));
}

export async function analyzeContract(
  contractText: string,
  options: {
    contractType?: string;
    contractId?: string;
  } = {}
): Promise<ContractAnalysisResult> {
  const startTime = Date.now();

  const [obligations, rights, conditions, deadlines, financialTerms, liabilityClauses, indemnificationClauses] =
    await Promise.all([
      extractObligations(contractText, options.contractType),
      extractRights(contractText, options.contractType),
      extractConditions(contractText, options.contractType),
      extractDeadlines(contractText, options.contractType),
      analyzeFinancialTerms(contractText, options.contractType),
      analyzeLiability(contractText, options.contractType),
      analyzeIndemnification(contractText, options.contractType),
    ]);

  const partyObligations: Record<string, number> = {};
  for (const o of obligations) {
    partyObligations[o.party] = (partyObligations[o.party] ?? 0) + 1;
  }

  const partyRights: Record<string, number> = {};
  for (const r of rights) {
    partyRights[r.holder] = (partyRights[r.holder] ?? 0) + 1;
  }

  const criticalDeadlines = deadlines.filter(
    (d) => d.consequences && (d.consequences.includes("breach") || d.consequences.includes("terminat"))
  );

  const financialExposure = financialTerms
    .filter((f) => f.type === "penalty" || f.type === "payment")
    .map((f) => f.amount ?? f.description)
    .join("; ") || "No significant financial exposure identified";

  return {
    contractId: options.contractId ?? generateId(),
    analyzedAt: new Date().toISOString(),
    obligations,
    rights,
    conditions,
    deadlines,
    financialTerms,
    liabilityClauses,
    indemnificationClauses,
    summary: {
      totalObligations: obligations.length,
      totalRights: rights.length,
      totalConditions: conditions.length,
      totalDeadlines: deadlines.length,
      totalFinancialTerms: financialTerms.length,
      partyObligations,
      partyRights,
      criticalDeadlines,
      financialExposure,
    },
    processingTimeMs: Date.now() - startTime,
  };
}
