import { getAIClient, type AIMessage } from "./provider";

export type CitationType = "case" | "statute" | "regulation" | "secondary" | "constitution" | "treaty";
export type TreatmentType = "affirmed" | "reversed" | "overruled" | "distinguished" | "followed" | "cited" | "modified" | "superseded" | "questioned" | "criticized";
export type AuthorityLevel = "binding" | "persuasive" | "obiter" | "dicta";

export interface Citation {
  id: string;
  type: CitationType;
  text: string;
  source: string;
  fullCitation: string;
  authorityLevel: AuthorityLevel;
  context: string;
  pageNumber?: number;
}

export interface CitationNetworkNode {
  id: string;
  caseName: string;
  citation: string;
  court: string;
  dateDecided: string;
  citationCount: number;
  influenceScore: number;
  layer: number;
}

export interface CitationNetworkEdge {
  source: string;
  target: string;
  treatment: TreatmentType;
  context: string;
  weight: number;
}

export interface CitationNetwork {
  nodes: CitationNetworkNode[];
  edges: CitationNetworkEdge[];
  clusters: Array<{
    id: string;
    topic: string;
    caseIds: string[];
  }>;
}

export interface TreatmentDetail {
  citingCase: string;
  citingCitation: string;
  treatment: TreatmentType;
  context: string;
  dateDecided: string;
  quotes?: string[];
  isKeyAuthority: boolean;
}

export interface CitationStrength {
  citationId: string;
  overallScore: number;
  recencyScore: number;
  authorityScore: number;
  relevanceScore: number;
  citationCountScore: number;
  treatmentScore: number;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    explanation: string;
  }>;
}

export interface RelatedCase {
  id: string;
  caseName: string;
  citation: string;
  relationship: "same_issue" | "same_parties" | "same_statute" | "same_precedent" | "factually_similar" | "legally_similar";
  strength: number;
  reasoning: string;
}

export interface CitationAnalysisResult {
  id: string;
  analyzedAt: string;
  targetCitation: string;
  targetCaseName: string;
  citations: Citation[];
  network: CitationNetwork;
  treatments: TreatmentDetail[];
  citationStrengths: CitationStrength[];
  relatedCases: RelatedCase[];
  summary: {
    totalCitations: number;
    bindingAuthority: number;
    persuasiveAuthority: number;
    strongCitations: number;
    weakCitations: number;
    averageStrength: number;
    keyHoldings: string[];
    conflictingAuthority: boolean;
    overruledCases: string[];
  };
  processingTimeMs: number;
}

const CITATION_SYSTEM_PROMPT = `You are an expert legal citation analyst with deep knowledge of case law networks, citation patterns, and legal authority hierarchies. You analyze how cases cite each other, identify treatment (affirmed, reversed, overruled, distinguished), score citation strength, and find related cases. Always use proper legal citation formats. Distinguish between binding and persuasive authority. Identify when cases have been overruled or superseded.`;

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

export async function extractCitations(
  documentText: string,
  documentType?: string
): Promise<Citation[]> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: CITATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract ALL legal citations from this ${documentType ?? "legal document"}. For each citation provide:
- type: case, statute, regulation, secondary, constitution, or treaty
- text: the inline citation text as it appears
- source: the full case name or statute title
- fullCitation: complete citation in standard format (e.g., "Smith v. Jones, 123 F.3d 456 (2d Cir. 2020)")
- authorityLevel: binding, persuasive, obiter, or dicta
- context: surrounding sentence or paragraph explaining how the citation is used
- pageNumber: page number if identifiable

Return as JSON array. Be exhaustive — capture every citation including parenthetical citations, short-form citations, supra/infra references, and pin cites.

Document:
${documentText.substring(0, 20000)}`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.1,
    maxTokens: 12288,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<Citation, "id">>>(response.content);
  return raw.map((c) => ({ ...c, id: generateId() }));
}

export async function buildCitationNetwork(
  caseName: string,
  citation: string,
  depth: number = 2
): Promise<CitationNetwork> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: CITATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Build a citation network for "${caseName}" (${citation}) with depth ${depth}.

For the network, provide:
- nodes: array of cases with {caseName, citation, court, dateDecided, citationCount, influenceScore (0-1), layer (0=target, 1=direct citations, 2=citations of citations)}
- edges: array of connections with {source (citation), target (citation), treatment (affirmed/reversed/overruled/distinguished/followed/cited/modified), context, weight (0-1)}
- clusters: array of topic clusters with {id, topic, caseIds}

Include:
- The target case at layer 0
- Cases that directly cite the target at layer 1
- Cases cited by layer 1 cases at layer 2
- All treatment relationships between cases

Return as JSON.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 16384,
    jsonMode: true,
  });

  return parseJSONResponse<CitationNetwork>(response.content);
}

export async function analyzeTreatment(
  caseName: string,
  citation: string
): Promise<TreatmentDetail[]> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: CITATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze how "${caseName}" (${citation}) has been treated by subsequent courts.

For each treatment instance provide:
- citingCase: name of the citing case
- citingCitation: citation of the citing case
- treatment: affirmed, reversed, overruled, distinguished, followed, cited, modified, superseded, questioned, or criticized
- context: how the court treated the case
- dateDecided: when the citing case was decided
- quotes: direct quotes from the citing case about the target
- isKeyAuthority: whether this treatment is a key authority

Be thorough — identify all significant treatments including:
- Courts that followed the case
- Courts that distinguished it
- Courts that criticized or questioned it
- Any overruling or superseding decisions

Return as JSON array.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 12288,
    jsonMode: true,
  });

  return parseJSONResponse<TreatmentDetail[]>(response.content);
}

export async function scoreCitationStrength(
  citation: Citation,
  context: string,
  jurisdiction?: string
): Promise<CitationStrength> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: CITATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Score the strength of this legal citation:

Citation: ${citation.fullCitation}
Type: ${citation.type}
Authority Level: ${citation.authorityLevel}
Context: ${citation.context}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ""}

Provide:
- overallScore: 0-100 overall strength score
- recencyScore: 0-100 (how recent is the authority)
- authorityScore: 0-100 (level of authority: binding > persuasive > obiter)
- relevanceScore: 0-100 (how relevant to the issue)
- citationCountScore: 0-100 (how often cited by others)
- treatmentScore: 0-100 (how it has been treated by other courts)
- factors: array of {factor, impact (positive/negative/neutral), explanation}

Consider:
- Is the case still good law?
- Is it binding in the relevant jurisdiction?
- Has it been distinguished, criticized, or overruled?
- How recent is it?
- How influential is it?

Return as JSON.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 4096,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Omit<CitationStrength, "citationId">>(response.content);
  return { ...raw, citationId: citation.id };
}

export async function findRelatedCases(
  caseName: string,
  citation: string,
  maxResults: number = 10
): Promise<RelatedCase[]> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: CITATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Find cases related to "${caseName}" (${citation}).

For each related case provide:
- caseName: full case name
- citation: proper citation
- relationship: same_issue, same_parties, same_statute, same_precedent, factually_similar, or legally_similar
- strength: 0-1 relationship strength score
- reasoning: why this case is related

Return up to ${maxResults} most related cases as JSON array.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<RelatedCase, "id">>>(response.content);
  return raw.map((r) => ({ ...r, id: generateId() }));
}

export async function analyzeCitations(
  documentText: string,
  options: {
    caseName?: string;
    citation?: string;
    jurisdiction?: string;
    documentType?: string;
    buildNetwork?: boolean;
    analyzeTreatments?: boolean;
    scoreStrength?: boolean;
    findRelated?: boolean;
  } = {}
): Promise<CitationAnalysisResult> {
  const startTime = Date.now();

  const citations = await extractCitations(documentText, options.documentType);

  const caseCitations = citations.filter((c) => c.type === "case");
  const primaryCase = caseCitations[0];

  const targetCaseName = options.caseName ?? primaryCase?.source ?? "Unknown Case";
  const targetCitation = options.citation ?? primaryCase?.fullCitation ?? "Unknown Citation";

  const [networkPromise, treatmentsPromise, relatedPromise] = await Promise.all([
    options.buildNetwork !== false
      ? buildCitationNetwork(targetCaseName, targetCitation)
      : Promise.resolve({ nodes: [], edges: [], clusters: [] }),
    options.analyzeTreatments !== false
      ? analyzeTreatment(targetCaseName, targetCitation)
      : Promise.resolve([]),
    options.findRelated !== false
      ? findRelatedCases(targetCaseName, targetCitation)
      : Promise.resolve([]),
  ]);

  let citationStrengths: CitationStrength[] = [];
  if (options.scoreStrength !== false) {
    citationStrengths = await Promise.all(
      caseCitations.slice(0, 20).map((c) =>
        scoreCitationStrength(c, c.context, options.jurisdiction)
      )
    );
  }

  const bindingAuthority = citations.filter((c) => c.authorityLevel === "binding").length;
  const persuasiveAuthority = citations.filter((c) => c.authorityLevel === "persuasive").length;
  const strongCitations = citationStrengths.filter((s) => s.overallScore >= 70).length;
  const weakCitations = citationStrengths.filter((s) => s.overallScore < 40).length;
  const averageStrength =
    citationStrengths.length > 0
      ? citationStrengths.reduce((sum, s) => sum + s.overallScore, 0) / citationStrengths.length
      : 0;

  const overruledCases = treatmentsPromise
    .filter((t) => t.treatment === "overruled" || t.treatment === "superseded")
    .map((t) => t.citingCase);

  const conflictingAuthority = treatmentsPromise.some(
    (t) =>
      t.treatment === "reversed" ||
      t.treatment === "overruled" ||
      t.treatment === "questioned"
  );

  const client = getAIClient();
  const summaryResponse = await client.complete(
    [
      { role: "system", content: CITATION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Based on the citation analysis of "${targetCaseName}", provide:
- keyHoldings: array of the most important legal holdings
- A brief summary of the citation landscape

Citations found: ${citations.length}
Treatments found: ${treatmentsPromise.length}
Average strength: ${averageStrength.toFixed(1)}
Overruled: ${overruledCases.length > 0 ? overruledCases.join(", ") : "None"}

Return as JSON with fields: keyHoldings (string array).`,
      },
    ],
    { temperature: 0.3, maxTokens: 2048, jsonMode: true }
  );

  const summaryData = parseJSONResponse<{ keyHoldings: string[] }>(summaryResponse.content);

  return {
    id: generateId(),
    analyzedAt: new Date().toISOString(),
    targetCitation,
    targetCaseName,
    citations,
    network: networkPromise,
    treatments: treatmentsPromise,
    citationStrengths,
    relatedCases: relatedPromise,
    summary: {
      totalCitations: citations.length,
      bindingAuthority,
      persuasiveAuthority,
      strongCitations,
      weakCitations,
      averageStrength,
      keyHoldings: summaryData.keyHoldings,
      conflictingAuthority,
      overruledCases,
    },
    processingTimeMs: Date.now() - startTime,
  };
}

export function formatCitationReport(result: CitationAnalysisResult): string {
  const lines: string[] = [];
  lines.push(`# Citation Analysis Report`);
  lines.push(`Target: ${result.targetCaseName}`);
  lines.push(`Citation: ${result.targetCitation}`);
  lines.push(`Analysis Time: ${(result.processingTimeMs / 1000).toFixed(1)}s`);
  lines.push("");

  lines.push(`## Summary`);
  lines.push(`- Total Citations: ${result.summary.totalCitations}`);
  lines.push(`- Binding Authority: ${result.summary.bindingAuthority}`);
  lines.push(`- Persuasive Authority: ${result.summary.persuasiveAuthority}`);
  lines.push(`- Strong Citations: ${result.summary.strongCitations}`);
  lines.push(`- Weak Citations: ${result.summary.weakCitations}`);
  lines.push(`- Average Strength: ${result.summary.averageStrength.toFixed(1)}/100`);
  lines.push(`- Conflicting Authority: ${result.summary.conflictingAuthority ? "Yes" : "No"}`);
  if (result.summary.overruledCases.length > 0) {
    lines.push(`- Overruled Cases: ${result.summary.overruledCases.join(", ")}`);
  }
  lines.push("");

  if (result.summary.keyHoldings.length > 0) {
    lines.push(`## Key Holdings`);
    for (const h of result.summary.keyHoldings) {
      lines.push(`- ${h}`);
    }
    lines.push("");
  }

  if (result.treatments.length > 0) {
    lines.push(`## Treatments (${result.treatments.length})`);
    for (const t of result.treatments) {
      lines.push(`### ${t.citingCase} [${t.treatment.toUpperCase()}]`);
      lines.push(`**Citation:** ${t.citingCitation}`);
      lines.push(`**Context:** ${t.context}`);
      if (t.quotes?.length) {
        lines.push(`**Quotes:** ${t.quotes.map((q) => `"${q}"`).join("; ")}`);
      }
      lines.push("");
    }
  }

  if (result.citationStrengths.length > 0) {
    lines.push(`## Citation Strengths`);
    for (const s of result.citationStrengths) {
      lines.push(`- Score ${s.overallScore}/100 (Recency: ${s.recencyScore}, Authority: ${s.authorityScore}, Relevance: ${s.relevanceScore})`);
    }
    lines.push("");
  }

  if (result.relatedCases.length > 0) {
    lines.push(`## Related Cases`);
    for (const r of result.relatedCases) {
      lines.push(`- ${r.caseName} (${r.citation}) — ${r.relationship} (strength: ${(r.strength * 100).toFixed(0)}%)`);
    }
  }

  return lines.join("\n");
}
