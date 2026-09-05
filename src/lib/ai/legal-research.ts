import { getAIClient, type AIMessage } from "./provider";

export type ResearchType = "case_law" | "statute" | "regulation" | "secondary_source" | "all";
export type Jurisdiction = "federal" | "state" | "international" | "uk" | "eu" | "ca" | "au" | string;
export type CaseTreatment = "affirmed" | "reversed" | "overruled" | "distinguished" | "followed" | "cited" | "modified" | "superseded";

export interface CaseLawResult {
  id: string;
  caseName: string;
  citation: string;
  court: string;
  jurisdiction: string;
  dateDecided: string;
  judge?: string;
  summary: string;
  holding: string;
  keyFacts: string[];
  legalPrinciples: string[];
  relevanceScore: number;
  treatment?: CaseTreatment;
  sourceUrl?: string;
}

export interface StatuteResult {
  id: string;
  title: string;
  citation: string;
  jurisdiction: string;
  effectiveDate: string;
  lastAmended?: string;
  summary: string;
  keyProvisions: string[];
  relevantSections: Array<{
    sectionNumber: string;
    title: string;
    summary: string;
  }>;
  relevanceScore: number;
  sourceUrl?: string;
}

export interface RegulationResult {
  id: string;
  title: string;
  citation: string;
  agency: string;
  jurisdiction: string;
  effectiveDate: string;
  summary: string;
  keyProvisions: string[];
  complianceRequirements: string[];
  penalties?: string;
  relevanceScore: number;
  sourceUrl?: string;
}

export interface CitationAnalysis {
  id: string;
  caseName: string;
  citation: string;
  citingCases: Array<{
    caseName: string;
    citation: string;
    treatment: CaseTreatment;
    context: string;
  }>;
  citedBy: Array<{
    caseName: string;
    citation: string;
    treatment: CaseTreatment;
  }>;
  citationCount: number;
  influenceScore: number;
  recentCitations: number;
  keyTopics: string[];
}

export interface PrecedentFinding {
  id: string;
  caseName: string;
  citation: string;
  court: string;
  relevanceScore: number;
  matchType: "exact" | "analogous" | "distinguishable" | "conflicting";
  reasoning: string;
  keyRatio: string;
  facts: string;
  distinguishingFactors?: string[];
}

export interface LegalArgument {
  id: string;
  position: "for" | "against" | "neutral";
  argument: string;
  supportingCases: Array<{
    caseName: string;
    citation: string;
    relevance: string;
  }>;
  supportingStatutes?: Array<{
    title: string;
    citation: string;
    section: string;
  }>;
  strength: "strong" | "moderate" | "weak";
  counterArguments?: string[];
  rebuttal?: string;
  jurisdiction: string;
}

export interface LegalResearchResult {
  query: string;
  researchType: ResearchType;
  jurisdiction?: string;
  caseLaw: CaseLawResult[];
  statutes: StatuteResult[];
  regulations: RegulationResult[];
  citationAnalyses: CitationAnalysis[];
  precedents: PrecedentFinding[];
  legalArguments: LegalArgument[];
  summary: string;
  keyFindings: string[];
  researchNotes: string;
  gapsIdentified: string[];
  suggestedFollowUp: string[];
  processingTimeMs: number;
}

const RESEARCH_SYSTEM_PROMPT = `You are an expert legal research AI with comprehensive knowledge of case law, statutes, and regulations across multiple jurisdictions. You perform thorough legal research with accurate citations, precise analysis of holdings and legal principles, and identification of relevant precedents. Always provide accurate citation formats (e.g., 123 F.3d 456, 1 U.S.C. § 101, 17 CFR § 240.10b-5). Distinguish between binding and persuasive authority. Note when information may be outdated.`;

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

export async function searchCaseLaw(
  query: string,
  options: {
    jurisdiction?: Jurisdiction;
    dateRange?: { start?: string; end?: string };
    court?: string;
    maxResults?: number;
  } = {}
): Promise<CaseLawResult[]> {
  const client = getAIClient();
  const jurisdictionFilter = options.jurisdiction ? ` in ${options.jurisdiction} jurisdiction` : "";
  const dateFilter = options.dateRange
    ? ` decided between ${options.dateRange.start ?? "beginning"} and ${options.dateRange.end ?? "present"}`
    : "";
  const courtFilter = options.court ? ` from ${options.court}` : "";

  const messages: AIMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Search for case law related to: "${query}"${jurisdictionFilter}${dateFilter}${courtFilter}

Return the ${options.maxResults ?? 10} most relevant cases. For each case provide:
- caseName: full case name (e.g., "Smith v. Jones")
- citation: proper citation (e.g., "123 F.3d 456 (2d Cir. 2020)")
- court: court name
- jurisdiction: jurisdiction
- dateDecided: decision date
- judge: presiding judge if notable
- summary: 2-3 sentence summary
- holding: the court's holding
- keyFacts: array of key factual findings
- legalPrinciples: array of legal principles established
- relevanceScore: 0-1 relevance score
- sourceUrl: if known

Return as JSON array.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 12288,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<CaseLawResult, "id">>>(response.content);
  return raw.map((c) => ({ ...c, id: generateId() }));
}

export async function searchStatutes(
  query: string,
  options: {
    jurisdiction?: Jurisdiction;
    code?: string;
    maxResults?: number;
  } = {}
): Promise<StatuteResult[]> {
  const client = getAIClient();
  const jurisdictionFilter = options.jurisdiction ? ` in ${options.jurisdiction}` : "";
  const codeFilter = options.code ? ` in the ${options.code}` : "";

  const messages: AIMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Search for statutes related to: "${query}"${jurisdictionFilter}${codeFilter}

Return the ${options.maxResults ?? 10} most relevant statutes. For each statute provide:
- title: statute title
- citation: proper citation (e.g., "42 U.S.C. § 1983")
- jurisdiction: jurisdiction
- effectiveDate: when enacted/effective
- lastAmended: most recent amendment date
- summary: plain English summary
- keyProvisions: array of key provisions
- relevantSections: array of {sectionNumber, title, summary}
- relevanceScore: 0-1 relevance score
- sourceUrl: if known

Return as JSON array.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 12288,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<StatuteResult, "id">>>(response.content);
  return raw.map((s) => ({ ...s, id: generateId() }));
}

export async function searchRegulations(
  query: string,
  options: {
    jurisdiction?: Jurisdiction;
    agency?: string;
    maxResults?: number;
  } = {}
): Promise<RegulationResult[]> {
  const client = getAIClient();
  const jurisdictionFilter = options.jurisdiction ? ` in ${options.jurisdiction}` : "";
  const agencyFilter = options.agency ? ` from ${options.agency}` : "";

  const messages: AIMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Search for regulations related to: "${query}"${jurisdictionFilter}${agencyFilter}

Return the ${options.maxResults ?? 10} most relevant regulations. For each regulation provide:
- title: regulation title
- citation: proper citation (e.g., "17 CFR § 240.10b-5")
- agency: issuing agency
- jurisdiction: jurisdiction
- effectiveDate: effective date
- summary: plain English summary
- keyProvisions: array of key provisions
- complianceRequirements: array of compliance requirements
- penalties: penalty provisions
- relevanceScore: 0-1 relevance score
- sourceUrl: if known

Return as JSON array.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 12288,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<RegulationResult, "id">>>(response.content);
  return raw.map((r) => ({ ...r, id: generateId() }));
}

export async function analyzeCitations(
  caseName: string,
  citation: string
): Promise<CitationAnalysis> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze the citation network for: "${caseName}" (${citation}).

Provide:
- citingCases: array of cases that cite this case, each with {caseName, citation, treatment (affirmed/reversed/overruled/distinguished/followed/cited/modified), context}
- citedBy: array of cases this case cites, with treatment
- citationCount: total number of citations
- influenceScore: 0-1 score reflecting the case's influence
- recentCitations: number of citations in last 5 years
- keyTopics: main legal topics

Treatment types: affirmed, reversed, overruled, distinguished, followed, cited, modified, superseded.

Return as JSON.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<CitationAnalysis, "id">>(response.content);
  return { ...raw, id: generateId() };
}

export async function findPrecedents(
  legalIssue: string,
  options: {
    jurisdiction?: Jurisdiction;
    maxResults?: number;
    dateRange?: { start?: string; end?: string };
  } = {}
): Promise<PrecedentFinding[]> {
  const client = getAIClient();
  const jurisdictionFilter = options.jurisdiction ? ` in ${options.jurisdiction}` : "";
  const dateFilter = options.dateRange
    ? ` from ${options.dateRange.start ?? "any time"} to ${options.dateRange.end ?? "present"}`
    : "";

  const messages: AIMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Find precedents for the following legal issue${jurisdictionFilter}${dateFilter}:

"${legalIssue}"

Return the ${options.maxResults ?? 10} most relevant precedents. For each:
- caseName: full case name
- citation: proper citation
- court: court name
- relevanceScore: 0-1
- matchType: exact, analogous, distinguishable, or conflicting
- reasoning: why this case is relevant
- keyRatio: the ratio decidendi
- facts: key facts
- distinguishingFactors: if distinguishable, what differentiates it

Return as JSON array.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 12288,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<PrecedentFinding, "id">>>(response.content);
  return raw.map((p) => ({ ...p, id: generateId() }));
}

export async function generateLegalArguments(
  legalIssue: string,
  options: {
    jurisdiction?: Jurisdiction;
    party?: string;
    position?: "for" | "against" | "both";
  } = {}
): Promise<LegalArgument[]> {
  const client = getAIClient();
  const positionFilter = options.position === "both" || !options.position
    ? "Generate arguments for BOTH sides (for and against)."
    : `Generate arguments ${options.position === "for" ? "supporting" : "opposing"} the position.`;

  const messages: AIMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Generate legal arguments for the following issue${options.jurisdiction ? ` in ${options.jurisdiction}` : ""}:

"${legalIssue}"

${positionFilter}

For each argument provide:
- position: "for", "against", or "neutral"
- argument: the legal argument
- supportingCases: array of {caseName, citation, relevance}
- supportingStatutes: array of {title, citation, section}
- strength: strong, moderate, or weak
- counterArguments: opposing arguments
- rebuttal: how to counter the opposing arguments
- jurisdiction: applicable jurisdiction

Return as JSON array. Be thorough and provide well-reasoned arguments.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 12288,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<LegalArgument, "id">>>(response.content);
  return raw.map((a) => ({ ...a, id: generateId() }));
}

export async function conductLegalResearch(
  query: string,
  options: {
    researchType?: ResearchType;
    jurisdiction?: Jurisdiction;
    maxResults?: number;
    includeArguments?: boolean;
    dateRange?: { start?: string; end?: string };
  } = {}
): Promise<LegalResearchResult> {
  const startTime = Date.now();
  const type = options.researchType ?? "all";

  const caseLawPromise =
    type === "case_law" || type === "all"
      ? searchCaseLaw(query, { jurisdiction: options.jurisdiction, dateRange: options.dateRange, maxResults: options.maxResults })
      : Promise.resolve([]);

  const statutesPromise =
    type === "statute" || type === "all"
      ? searchStatutes(query, { jurisdiction: options.jurisdiction, maxResults: options.maxResults })
      : Promise.resolve([]);

  const regulationsPromise =
    type === "regulation" || type === "all"
      ? searchRegulations(query, { jurisdiction: options.jurisdiction, maxResults: options.maxResults })
      : Promise.resolve([]);

  const [caseLaw, statutes, regulations] = await Promise.all([
    caseLawPromise,
    statutesPromise,
    regulationsPromise,
  ]);

  const topCases = caseLaw.slice(0, 3);
  const citationAnalyses = await Promise.all(
    topCases.map((c) => analyzeCitations(c.caseName, c.citation))
  );

  const precedents = await findPrecedents(query, {
    jurisdiction: options.jurisdiction,
    maxResults: options.maxResults,
    dateRange: options.dateRange,
  });

  let legalArguments: LegalArgument[] = [];
  if (options.includeArguments !== false) {
    legalArguments = await generateLegalArguments(query, {
      jurisdiction: options.jurisdiction,
      position: "both",
    });
  }

  const client = getAIClient();
  const summaryMessages: AIMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Summarize the following legal research on: "${query}"

Cases found: ${caseLaw.length}
Statutes found: ${statutes.length}
Regulations found: ${regulations.length}
Precedents found: ${precedents.length}
Legal arguments generated: ${legalArguments.length}

Provide:
- summary: 3-5 sentence executive summary
- keyFindings: array of 5-10 key findings
- researchNotes: important caveats and notes
- gapsIdentified: areas needing further research
- suggestedFollowUp: suggested next research steps

Return as JSON.`,
    },
  ];

  const summaryResponse = await client.complete(summaryMessages, {
    temperature: 0.3,
    maxTokens: 2048,
    jsonMode: true,
  });

  const summaryData = parseJSONResponse<{
    summary: string;
    keyFindings: string[];
    researchNotes: string;
    gapsIdentified: string[];
    suggestedFollowUp: string[];
  }>(summaryResponse.content);

  return {
    query,
    researchType: type,
    jurisdiction: options.jurisdiction,
    caseLaw,
    statutes,
    regulations,
    citationAnalyses,
    precedents,
    legalArguments,
    ...summaryData,
    processingTimeMs: Date.now() - startTime,
  };
}

export function formatResearchReport(result: LegalResearchResult): string {
  const lines: string[] = [];
  lines.push(`# Legal Research Report`);
  lines.push(`Query: "${result.query}"`);
  lines.push(`Jurisdiction: ${result.jurisdiction ?? "All"}`);
  lines.push(`Research Time: ${(result.processingTimeMs / 1000).toFixed(1)}s`);
  lines.push("");

  lines.push(`## Executive Summary`);
  lines.push(result.summary);
  lines.push("");

  if (result.keyFindings.length > 0) {
    lines.push(`## Key Findings`);
    for (const finding of result.keyFindings) {
      lines.push(`- ${finding}`);
    }
    lines.push("");
  }

  if (result.caseLaw.length > 0) {
    lines.push(`## Case Law (${result.caseLaw.length} cases)`);
    for (const c of result.caseLaw) {
      lines.push(`### ${c.caseName}`);
      lines.push(`**Citation:** ${c.citation}`);
      lines.push(`**Court:** ${c.court} | **Decided:** ${c.dateDecided}`);
      lines.push(`**Holding:** ${c.holding}`);
      lines.push(`**Relevance:** ${(c.relevanceScore * 100).toFixed(0)}%`);
      lines.push("");
    }
  }

  if (result.statutes.length > 0) {
    lines.push(`## Statutes (${result.statutes.length})`);
    for (const s of result.statutes) {
      lines.push(`### ${s.title}`);
      lines.push(`**Citation:** ${s.citation}`);
      lines.push(`**Effective:** ${s.effectiveDate}`);
      lines.push(s.summary);
      lines.push("");
    }
  }

  if (result.regulations.length > 0) {
    lines.push(`## Regulations (${result.regulations.length})`);
    for (const r of result.regulations) {
      lines.push(`### ${r.title}`);
      lines.push(`**Citation:** ${r.citation}`);
      lines.push(`**Agency:** ${r.agency}`);
      lines.push(r.summary);
      lines.push("");
    }
  }

  if (result.legalArguments.length > 0) {
    lines.push(`## Legal Arguments (${result.legalArguments.length})`);
    for (const a of result.legalArguments) {
      lines.push(`### [${a.position.toUpperCase()}] (${a.strength})`);
      lines.push(a.argument);
      if (a.supportingCases.length > 0) {
        lines.push(`**Supporting:** ${a.supportingCases.map((c) => c.citation).join("; ")}`);
      }
      lines.push("");
    }
  }

  if (result.gapsIdentified.length > 0) {
    lines.push(`## Research Gaps`);
    for (const gap of result.gapsIdentified) {
      lines.push(`- ${gap}`);
    }
    lines.push("");
  }

  if (result.suggestedFollowUp.length > 0) {
    lines.push(`## Suggested Follow-Up`);
    for (const item of result.suggestedFollowUp) {
      lines.push(`- ${item}`);
    }
  }

  return lines.join("\n");
}
