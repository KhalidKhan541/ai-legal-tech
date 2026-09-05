import { getAIClient, type AIMessage, type AICompletionResponse } from "./provider";

export type RiskLevel = "critical" | "high" | "medium" | "low" | "negligible";
export type ComplianceStatus = "compliant" | "non_compliant" | "needs_review" | "unknown";
export type ClauseCategory =
  | "payment"
  | "termination"
  | "liability"
  | "indemnification"
  | "confidentiality"
  | "ip"
  | "dispute_resolution"
  | "governing_law"
  | "force_majeure"
  | "warranty"
  | "insurance"
  | "assignment"
  | "amendment"
  | "severability"
  | "entire_agreement"
  | "notice"
  | "compliance"
  | "data_protection"
  | "non_compete"
  | "non_solicitation"
  | "other";

export interface ExtractedClause {
  id: string;
  category: ClauseCategory;
  title: string;
  content: string;
  summary: string;
  startPosition: number;
  endPosition: number;
  sectionReference?: string;
  keyTerms: string[];
}

export interface Risk {
  id: string;
  clauseId?: string;
  level: RiskLevel;
  category: ClauseCategory;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  precedent?: string;
}

export interface ComplianceItem {
  id: string;
  requirement: string;
  status: ComplianceStatus;
  clauseId?: string;
  notes: string;
  regulation?: string;
  jurisdiction?: string;
}

export interface ContractDifference {
  id: string;
  category: ClauseCategory;
  clauseTitle: string;
  versionA: string;
  versionB: string;
  significance: RiskLevel;
  analysis: string;
}

export interface RedFlag {
  id: string;
  severity: RiskLevel;
  category: ClauseCategory;
  clauseId?: string;
  title: string;
  description: string;
  legalBasis: string;
  suggestedAction: string;
}

export interface ContractSummary {
  title: string;
  type: string;
  parties: Array<{ name: string; role: string }>;
  effectiveDate?: string;
  expirationDate?: string;
  totalClauses: number;
  summary: string;
  keyObligations: string[];
  keyRights: string[];
  financialTerms: string[];
  criticalDates: string[];
  overallRiskLevel: RiskLevel;
}

export interface NegotiationSuggestion {
  id: string;
  clauseId?: string;
  category: ClauseCategory;
  currentTerm: string;
  suggestedTerm: string;
  rationale: string;
  priority: RiskLevel;
  alternativeTerms?: string[];
}

export interface ContractReviewResult {
  contractId: string;
  reviewedAt: string;
  summary: ContractSummary;
  clauses: ExtractedClause[];
  risks: Risk[];
  compliance: ComplianceItem[];
  redFlags: RedFlag[];
  negotiationSuggestions: NegotiationSuggestion[];
  overallScore: number;
  riskScore: number;
  completenessScore: number;
  processingTimeMs: number;
}

export interface ContractComparisonResult {
  contractAId: string;
  contractBId: string;
  differences: ContractDifference[];
  summary: string;
  recommendation: string;
  riskDelta: number;
}

const LEGAL_SYSTEM_PROMPT = `You are an expert legal AI assistant specializing in contract review and analysis.
You have deep knowledge of contract law across multiple jurisdictions including the US, UK, EU, and international commercial law.
You must provide precise, actionable analysis. Always identify risks, missing clauses, and unusual terms.
When extracting clauses, provide accurate position references. When identifying risks, explain the legal basis and provide concrete recommendations.
Never provide legal advice as a definitive conclusion — always frame analysis as professional observations requiring attorney verification.`;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function parseJSONResponse<T>(text: string): T {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(text.substring(firstBrace, lastBrace + 1)) as T;
  }

  return JSON.parse(text) as T;
}

export async function extractClauses(
  contractText: string,
  contractType?: string
): Promise<ExtractedClause[]> {
  const client = getAIClient();
  const messages: AIMessage[] = [
    {
      role: "system",
      content: LEGAL_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Extract and categorize ALL clauses from this ${contractType ?? "contract"}. For each clause provide:
- category (from: payment, termination, liability, indemnification, confidentiality, ip, dispute_resolution, governing_law, force_majeure, warranty, insurance, assignment, amendment, severability, entire_agreement, notice, compliance, data_protection, non_compete, non_solicitation, other)
- title: a descriptive title
- content: the full clause text
- summary: 1-2 sentence plain English summary
- startPosition: approximate character position in document
- endPosition: approximate character position
- sectionReference: section/article number if present
- keyTerms: array of important defined terms or concepts

Return as a JSON array. Be thorough — extract every distinct clause.

Contract text:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<ExtractedClause, "id">>>(response.content);
  return raw.map((clause) => ({ ...clause, id: generateId() }));
}

export async function identifyRisks(
  contractText: string,
  clauses: ExtractedClause[],
  contractType?: string,
  jurisdiction?: string
): Promise<Risk[]> {
  const client = getAIClient();

  const clauseSummaries = clauses
    .map(
      (c, i) =>
        `[${i + 1}] (${c.category}) ${c.title}: ${c.summary}`
    )
    .join("\n");

  const messages: AIMessage[] = [
    {
      role: "system",
      content: LEGAL_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Analyze this ${contractType ?? "contract"}${jurisdiction ? ` under ${jurisdiction} law` : ""} for legal and business risks. 

Detected clauses:
${clauseSummaries}

For each risk found, provide:
- clauseId: the ID of the related clause (from the list above by index+1)
- level: critical, high, medium, low, or negligible
- category: the clause category
- title: short risk title
- description: detailed description of the risk
- impact: potential consequences if the risk materializes
- recommendation: specific action to mitigate
- precedent: relevant legal precedent if applicable

Focus on:
1. Unfavorable terms that strongly favor one party
2. Missing standard protections
3. Ambiguous language that could be disputed
4. Unusual or non-standard clauses
5. Financial exposure risks
6. Compliance risks
7. Intellectual property risks
8. Termination and exit risks

Return as a JSON array. Be thorough and specific.

Full contract text:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<Risk, "id">>>(response.content);
  return raw.map((risk) => ({ ...risk, id: generateId() }));
}

export async function checkCompliance(
  contractText: string,
  regulations: string[],
  jurisdiction?: string
): Promise<ComplianceItem[]> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    {
      role: "system",
      content: LEGAL_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Check this contract for compliance with the following regulations/requirements:
${regulations.map((r) => `- ${r}`).join("\n")}${jurisdiction ? `\nJurisdiction: ${jurisdiction}` : ""}

For each requirement, provide:
- requirement: the regulation or requirement being checked
- status: compliant, non_compliant, needs_review, or unknown
- clauseId: related clause if found
- notes: detailed explanation
- regulation: specific regulation name/number
- jurisdiction: applicable jurisdiction

Return as a JSON array.

Contract text:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 6144,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<ComplianceItem, "id">>>(response.content);
  return raw.map((item) => ({ ...item, id: generateId() }));
}

export async function compareContracts(
  contractAText: string,
  contractBText: string,
  contractAId: string,
  contractBId: string
): Promise<ContractComparisonResult> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    {
      role: "system",
      content: LEGAL_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Compare these two contracts and identify all material differences.

CONTRACT A:
${contractAText.substring(0, 10000)}

CONTRACT B:
${contractBText.substring(0, 10000)}

For each difference, provide:
- category: clause category
- clauseTitle: the clause being compared
- versionA: what Contract A says
- versionB: what Contract B says
- significance: critical, high, medium, low, or negligible
- analysis: legal and business analysis of the difference

Also provide:
- summary: overall comparison summary
- recommendation: which contract is more favorable and why
- riskDelta: numeric score difference (-100 to 100, positive = B is riskier)

Return as JSON with fields: differences, summary, recommendation, riskDelta.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<ContractComparisonResult, "contractAId" | "contractBId">>(
    response.content
  );

  return {
    ...raw,
    contractAId,
    contractBId,
    differences: raw.differences.map((d) => ({ ...d, id: generateId() })),
  };
}

export async function detectRedFlags(
  contractText: string,
  contractType?: string,
  jurisdiction?: string
): Promise<RedFlag[]> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    {
      role: "system",
      content: LEGAL_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Perform a red flag analysis on this ${contractType ?? "contract"}${jurisdiction ? ` (jurisdiction: ${jurisdiction})` : ""}.

Identify ALL red flags including but not limited to:
1. Unconscionable terms
2. Excessive penalties or liquidated damages
3. Unreasonable non-compete or non-solicitation
4. IP ownership issues (work-for-hire overreach)
5. Unlimited liability provisions
6. Missing limitation of liability
7. One-sided termination rights
8. Unfavorable indemnification
9. Missing force majeure
10. Confidentiality exceptions that are too broad
11. Dispute resolution that limits remedies
12. Auto-renewal traps
13. Payment terms that disadvantage one party
14. Warranty disclaimers that are unreasonable
15. Data protection gaps (GDPR, CCPA)
16. Missing compliance provisions
17. Forum selection that is inconvenient
18. Waiver of jury trial without consideration
19. Excessive attorney fees provisions
20. Ambiguity in critical terms

For each red flag:
- severity: critical, high, medium, low
- category: clause category
- clauseId: related clause
- title: short title
- description: what the red flag is
- legalBasis: why it's problematic legally
- suggestedAction: specific fix

Return as a JSON array.

Contract text:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<RedFlag, "id">>>(response.content);
  return raw.map((flag) => ({ ...flag, id: generateId() }));
}

export async function generateSummary(
  contractText: string,
  contractType?: string
): Promise<ContractSummary> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    {
      role: "system",
      content: LEGAL_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Generate a comprehensive summary of this ${contractType ?? "contract"}. Provide:
- title: contract title or description
- type: type of contract (e.g., SaaS Agreement, Employment, NDA, etc.)
- parties: array of {name, role} for each party
- effectiveDate: if stated
- expirationDate: if stated
- totalClauses: approximate count
- summary: 3-5 sentence executive summary
- keyObligations: array of key obligations for each party
- keyRights: array of key rights
- financialTerms: all financial terms (amounts, rates, penalties)
- criticalDates: all important dates/deadlines
- overallRiskLevel: critical, high, medium, low, or negligible

Return as JSON.

Contract text:
${contractText.substring(0, 15000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 4096,
    jsonMode: true,
  });

  return parseJSONResponse<ContractSummary>(response.content);
}

export async function generateNegotiationSuggestions(
  contractText: string,
  clauses: ExtractedClause[],
  risks: Risk[],
  partyRole: "buyer" | "seller" | "employer" | "employee" | "licensor" | "licensee" | "tenant" | "landlord" | "general"
): Promise<NegotiationSuggestion[]> {
  const client = getAIClient();

  const riskSummaries = risks
    .map((r) => `[${r.level}] ${r.title}: ${r.description}`)
    .join("\n");

  const messages: AIMessage[] = [
    {
      role: "system",
      content: LEGAL_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Based on the identified risks and contract analysis, generate negotiation suggestions for the ${partyRole} party.

RISKS IDENTIFIED:
${riskSummaries}

For each suggestion provide:
- clauseId: related clause
- category: clause category
- currentTerm: what the contract currently says
- suggestedTerm: what it should say
- rationale: why this change benefits the ${partyRole}
- priority: critical, high, medium, low
- alternativeTerms: 1-2 alternative acceptable terms

Focus on the highest-priority changes first. Be specific with alternative language.
Return as a JSON array.

Contract text:
${contractText.substring(0, 12000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 6144,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<NegotiationSuggestion, "id">>>(response.content);
  return raw.map((s) => ({ ...s, id: generateId() }));
}

function calculateOverallScore(
  risks: Risk[],
  compliance: ComplianceItem[],
  redFlags: RedFlag[],
  totalClauses: number
): { overall: number; risk: number; completeness: number } {
  const criticalRisks = risks.filter((r) => r.level === "critical").length;
  const highRisks = risks.filter((r) => r.level === "high").length;
  const mediumRisks = risks.filter((r) => r.level === "medium").length;

  const criticalFlags = redFlags.filter((f) => f.severity === "critical").length;
  const highFlags = redFlags.filter((f) => f.severity === "high").length;

  const nonCompliant = compliance.filter((c) => c.status === "non_compliant").length;
  const needsReview = compliance.filter((c) => c.status === "needs_review").length;

  const riskPenalty =
    criticalRisks * 15 + highRisks * 10 + mediumRisks * 5 +
    criticalFlags * 12 + highFlags * 8 +
    nonCompliant * 10 + needsReview * 3;

  const riskScore = Math.max(0, 100 - riskPenalty);

  const expectedClauses = 15;
  const completenessScore = Math.min(100, Math.round((totalClauses / expectedClauses) * 100));

  const overall = Math.round(riskScore * 0.6 + completenessScore * 0.4);

  return { overall: Math.min(100, overall), risk: riskScore, completeness: completenessScore };
}

export async function reviewContract(
  contractText: string,
  options: {
    contractType?: string;
    jurisdiction?: string;
    regulations?: string[];
    partyRole?: "buyer" | "seller" | "employer" | "employee" | "licensor" | "licensee" | "tenant" | "landlord" | "general";
    includeNegotiation?: boolean;
    contractId?: string;
  } = {}
): Promise<ContractReviewResult> {
  const startTime = Date.now();

  const clauses = await extractClauses(contractText, options.contractType);

  const [risks, compliance, redFlags, summary] = await Promise.all([
    identifyRisks(contractText, clauses, options.contractType, options.jurisdiction),
    options.regulations
      ? checkCompliance(contractText, options.regulations, options.jurisdiction)
      : Promise.resolve([]),
    detectRedFlags(contractText, options.contractType, options.jurisdiction),
    generateSummary(contractText, options.contractType),
  ]);

  let negotiationSuggestions: NegotiationSuggestion[] = [];
  if (options.includeNegotiation !== false) {
    negotiationSuggestions = await generateNegotiationSuggestions(
      contractText,
      clauses,
      risks,
      options.partyRole ?? "general"
    );
  }

  const scores = calculateOverallScore(risks, compliance, redFlags, clauses.length);

  return {
    contractId: options.contractId ?? generateId(),
    reviewedAt: new Date().toISOString(),
    summary,
    clauses,
    risks,
    compliance,
    redFlags,
    negotiationSuggestions,
    overallScore: scores.overall,
    riskScore: scores.risk,
    completenessScore: scores.completeness,
    processingTimeMs: Date.now() - startTime,
  };
}

export function formatReviewReport(result: ContractReviewResult): string {
  const lines: string[] = [];

  lines.push(`# Contract Review Report`);
  lines.push(`Reviewed: ${result.reviewedAt}`);
  lines.push(`Processing Time: ${(result.processingTimeMs / 1000).toFixed(1)}s`);
  lines.push("");

  lines.push(`## Scores`);
  lines.push(`- Overall: ${result.overallScore}/100`);
  lines.push(`- Risk Score: ${result.riskScore}/100`);
  lines.push(`- Completeness: ${result.completenessScore}/100`);
  lines.push("");

  lines.push(`## Summary`);
  lines.push(`**Type:** ${result.summary.type}`);
  lines.push(`**Parties:** ${result.summary.parties.map((p) => `${p.name} (${p.role})`).join(", ")}`);
  lines.push(`**Risk Level:** ${result.summary.overallRiskLevel.toUpperCase()}`);
  lines.push(result.summary.summary);
  lines.push("");

  if (result.redFlags.length > 0) {
    lines.push(`## Red Flags (${result.redFlags.length})`);
    for (const flag of result.redFlags) {
      lines.push(`### [${flag.severity.toUpperCase()}] ${flag.title}`);
      lines.push(flag.description);
      lines.push(`**Suggested Action:** ${flag.suggestedAction}`);
      lines.push("");
    }
  }

  if (result.risks.length > 0) {
    lines.push(`## Risks (${result.risks.length})`);
    for (const risk of result.risks) {
      lines.push(`### [${risk.level.toUpperCase()}] ${risk.title}`);
      lines.push(risk.description);
      lines.push(`**Impact:** ${risk.impact}`);
      lines.push(`**Recommendation:** ${risk.recommendation}`);
      lines.push("");
    }
  }

  if (result.negotiationSuggestions.length > 0) {
    lines.push(`## Negotiation Suggestions (${result.negotiationSuggestions.length})`);
    for (const s of result.negotiationSuggestions) {
      lines.push(`### [${s.priority.toUpperCase()}] ${s.category}`);
      lines.push(`**Current:** ${s.currentTerm}`);
      lines.push(`**Suggested:** ${s.suggestedTerm}`);
      lines.push(`**Rationale:** ${s.rationale}`);
      if (s.alternativeTerms?.length) {
        lines.push(`**Alternatives:** ${s.alternativeTerms.join(" | ")}`);
      }
      lines.push("");
    }
  }

  if (result.compliance.length > 0) {
    lines.push(`## Compliance (${result.compliance.length})`);
    for (const c of result.compliance) {
      lines.push(`- [${c.status.toUpperCase()}] ${c.requirement}: ${c.notes}`);
    }
  }

  return lines.join("\n");
}
