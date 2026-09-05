import { getAIClient, type AIMessage } from "./provider";

export type DocumentType =
  | "contract"
  | "nda"
  | "employment_agreement"
  | "service_agreement"
  | "license_agreement"
  | "lease"
  | "motion"
  | "brief"
  | "memo"
  | "letter"
  | "complaint"
  | "answer"
  | "discovery_request"
  | "settlement_agreement"
  | "amendment"
  | "addendum"
  | "resolution"
  | "bylaws"
  | "operating_agreement"
  | "partnership_agreement"
  | "other";

export type DocumentTone = "formal" | "aggressive" | "conciliatory" | "neutral" | "persuasive";
export type DocumentJurisdiction = "us_federal" | "us_state" | "uk" | "eu" | "canadian" | "australian" | "international";

export interface DocumentDraftRequest {
  type: DocumentType;
  title?: string;
  parties?: Array<{ name: string; role: string }>;
  keyTerms?: Record<string, string>;
  jurisdiction?: DocumentJurisdiction;
  tone?: DocumentTone;
  specialInstructions?: string;
  templateId?: string;
  references?: string[];
}

export interface DraftedDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  sections: Array<{
    title: string;
    content: string;
    sectionNumber?: string;
    isRequired: boolean;
    isCustom: boolean;
  }>;
  metadata: {
    wordCount: number;
    estimatedPages: number;
    readabilityScore: number;
    formalityScore: number;
    generatedAt: string;
    jurisdiction: string;
    tone: string;
  };
  suggestions: string[];
  missingClauses: string[];
  processingTimeMs: number;
}

export interface ClauseSuggestion {
  id: string;
  category: string;
  title: string;
  content: string;
  rationale: string;
  priority: "required" | "recommended" | "optional";
  alternatives?: string[];
  jurisdictionSpecific: boolean;
}

export interface DraftingTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  sections: Array<{
    title: string;
    isRequired: boolean;
    description: string;
    variables: string[];
  }>;
  jurisdiction: DocumentJurisdiction;
  lastUpdated: string;
}

const DRAFTING_SYSTEM_PROMPT = `You are an expert legal document drafter with extensive experience drafting contracts, motions, briefs, letters, and other legal documents across multiple jurisdictions. You produce publication-ready legal documents with proper formatting, precise legal language, appropriate boilerplate clauses, and compliance with jurisdictional requirements. Always include standard provisions and flag any unusual terms. Use proper legal conventions including defined terms, recitals, and operative provisions.`;

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

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function estimatePages(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 250));
}

function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  const syllables = words.reduce((count, word) => {
    const vowels = word.toLowerCase().match(/[aeiouy]+/g);
    return count + (vowels ? vowels.length : 1);
  }, 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (syllables / words.length);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateFormality(text: string): number {
  const formalIndicators = [
    /\bherein\b/g, /\bthereof\b/g, /\bwhereas\b/g, /\bnotwithstanding\b/g,
    /\bpursuant to\b/g, /\bshall\b/g, /\bhereunder\b/g, /\btherein\b/g,
    /\bwhereby\b/g, /\bincluding\b/g, /\bwith respect to\b/g, /\bin the event\b/g,
    /\bfor the purpose\b/g, /\bin accordance with\b/g,
  ];

  const words = text.split(/\s+/);
  let formalCount = 0;
  for (const pattern of formalIndicators) {
    const matches = text.match(pattern);
    if (matches) formalCount += matches.length;
  }

  return Math.min(100, Math.round((formalCount / words.length) * 500));
}

export async function draftContract(request: DocumentDraftRequest): Promise<DraftedDocument> {
  const client = getAIClient();
  const startTime = Date.now();

  const partyInfo = request.parties
    ?.map((p) => `${p.name} (${p.role})`)
    .join(", ") ?? "the parties";

  const keyTermsText = request.keyTerms
    ? Object.entries(request.keyTerms)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "None specified";

  const messages: AIMessage[] = [
    { role: "system", content: DRAFTING_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Draft a complete ${request.type.replace(/_/g, " ")} with the following requirements:

Title: ${request.title ?? "To be determined"}
Parties: ${partyInfo}
Jurisdiction: ${request.jurisdiction ?? "us_federal"}
Tone: ${request.tone ?? "formal"}

Key Terms:
${keyTermsText}

${request.specialInstructions ? `Special Instructions:\n${request.specialInstructions}` : ""}

${request.references?.length ? `References:\n${request.references.join("\n")}` : ""}

Provide the response as JSON with:
- title: document title
- sections: array of {title, content, sectionNumber, isRequired (bool), isCustom (bool)}
- suggestions: array of drafting suggestions for improvement
- missingClauses: array of recommended clauses that should be added

The document should be complete and ready for attorney review. Include all standard boilerplate provisions appropriate for this document type and jurisdiction.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 16384,
    jsonMode: true,
  });

  const raw = parseJSONResponse<{
    title: string;
    sections: Array<{
      title: string;
      content: string;
      sectionNumber?: string;
      isRequired: boolean;
      isCustom: boolean;
    }>;
    suggestions: string[];
    missingClauses: string[];
  }>(response.content);

  const fullContent = raw.sections
    .map((s) => {
      const num = s.sectionNumber ? `${s.sectionNumber} ` : "";
      return `${num}${s.title}\n\n${s.content}`;
    })
    .join("\n\n");

  const wordCount = countWords(fullContent);

  return {
    id: generateId(),
    type: request.type,
    title: raw.title,
    content: fullContent,
    sections: raw.sections,
    metadata: {
      wordCount,
      estimatedPages: estimatePages(wordCount),
      readabilityScore: calculateReadability(fullContent),
      formalityScore: calculateFormality(fullContent),
      generatedAt: new Date().toISOString(),
      jurisdiction: request.jurisdiction ?? "us_federal",
      tone: request.tone ?? "formal",
    },
    suggestions: raw.suggestions,
    missingClauses: raw.missingClauses,
    processingTimeMs: Date.now() - startTime,
  };
}

export async function draftMotion(
  motionType: string,
  caseInfo: {
    caseName: string;
    caseNumber: string;
    court: string;
    jurisdiction: string;
  },
  arguments: string[],
  relief: string,
  options: {
    tone?: DocumentTone;
    supportingAuthorities?: string[];
    specialInstructions?: string;
  } = {}
): Promise<DraftedDocument> {
  const client = getAIClient();
  const startTime = Date.now();

  const messages: AIMessage[] = [
    { role: "system", content: DRAFTING_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Draft a ${motionType} for the following case:

Case: ${caseInfo.caseName}
Case Number: ${caseInfo.caseNumber}
Court: ${caseInfo.court}
Jurisdiction: ${caseInfo.jurisdiction}

Arguments:
${arguments.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Relief Requested: ${relief}

${options.supportingAuthorities?.length ? `Supporting Authorities:\n${options.supportingAuthorities.join("\n")}` : ""}
${options.specialInstructions ? `Special Instructions:\n${options.specialInstructions}` : ""}

Tone: ${options.tone ?? "persuasive"}

Provide as JSON with:
- title: motion title
- sections: array of {title, content, sectionNumber, isRequired, isCustom}
- suggestions: array of suggestions
- missingClauses: array of missing elements

Include proper caption, introduction, statement of facts, legal argument, conclusion, and signature block.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 16384,
    jsonMode: true,
  });

  const raw = parseJSONResponse<{
    title: string;
    sections: Array<{
      title: string;
      content: string;
      sectionNumber?: string;
      isRequired: boolean;
      isCustom: boolean;
    }>;
    suggestions: string[];
    missingClauses: string[];
  }>(response.content);

  const fullContent = raw.sections
    .map((s) => `${s.sectionNumber ? s.sectionNumber + " " : ""}${s.title}\n\n${s.content}`)
    .join("\n\n");

  const wordCount = countWords(fullContent);

  return {
    id: generateId(),
    type: "motion",
    title: raw.title,
    content: fullContent,
    sections: raw.sections,
    metadata: {
      wordCount,
      estimatedPages: estimatePages(wordCount),
      readabilityScore: calculateReadability(fullContent),
      formalityScore: calculateFormality(fullContent),
      generatedAt: new Date().toISOString(),
      jurisdiction: caseInfo.jurisdiction,
      tone: options.tone ?? "persuasive",
    },
    suggestions: raw.suggestions,
    missingClauses: raw.missingClauses,
    processingTimeMs: Date.now() - startTime,
  };
}

export async function draftBrief(
  briefType: string,
  caseInfo: {
    caseName: string;
    caseNumber: string;
    court: string;
    jurisdiction: string;
  },
  issues: Array<{
    issue: string;
    standard: string;
    argument: string;
    authorities: string[];
  }>,
  options: {
    tone?: DocumentTone;
    wordLimit?: number;
    specialInstructions?: string;
  } = {}
): Promise<DraftedDocument> {
  const client = getAIClient();
  const startTime = Date.now();

  const issuesText = issues
    .map(
      (iss, i) =>
        `Issue ${i + 1}: ${iss.issue}\nStandard of Review: ${iss.standard}\nArgument: ${iss.argument}\nAuthorities: ${iss.authorities.join("; ")}`
    )
    .join("\n\n");

  const messages: AIMessage[] = [
    { role: "system", content: DRAFTING_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Draft a ${briefType} for the following case:

Case: ${caseInfo.caseName}
Case Number: ${caseInfo.caseNumber}
Court: ${caseInfo.court}
Jurisdiction: ${caseInfo.jurisdiction}
${options.wordLimit ? `Word Limit: ${options.wordLimit}` : ""}

Issues Presented:
${issuesText}

${options.specialInstructions ? `Special Instructions:\n${options.specialInstructions}` : ""}

Tone: ${options.tone ?? "persuasive"}

Provide as JSON with:
- title: brief title
- sections: array of {title, content, sectionNumber, isRequired, isCustom}
- suggestions: array of suggestions
- missingClauses: array of missing elements

Include table of authorities, questions presented, statement of the case, legal argument, and conclusion.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 16384,
    jsonMode: true,
  });

  const raw = parseJSONResponse<{
    title: string;
    sections: Array<{
      title: string;
      content: string;
      sectionNumber?: string;
      isRequired: boolean;
      isCustom: boolean;
    }>;
    suggestions: string[];
    missingClauses: string[];
  }>(response.content);

  const fullContent = raw.sections
    .map((s) => `${s.sectionNumber ? s.sectionNumber + " " : ""}${s.title}\n\n${s.content}`)
    .join("\n\n");

  const wordCount = countWords(fullContent);

  return {
    id: generateId(),
    type: "brief",
    title: raw.title,
    content: fullContent,
    sections: raw.sections,
    metadata: {
      wordCount,
      estimatedPages: estimatePages(wordCount),
      readabilityScore: calculateReadability(fullContent),
      formalityScore: calculateFormality(fullContent),
      generatedAt: new Date().toISOString(),
      jurisdiction: caseInfo.jurisdiction,
      tone: options.tone ?? "persuasive",
    },
    suggestions: raw.suggestions,
    missingClauses: raw.missingClauses,
    processingTimeMs: Date.now() - startTime,
  };
}

export async function draftLetter(
  letterType: string,
  sender: { name: string; title?: string; organization?: string },
  recipient: { name: string; title?: string; organization?: string; address?: string },
  purpose: string,
  keyPoints: string[],
  options: {
    tone?: DocumentTone;
    jurisdiction?: DocumentJurisdiction;
    specialInstructions?: string;
  } = {}
): Promise<DraftedDocument> {
  const client = getAIClient();
  const startTime = Date.now();

  const messages: AIMessage[] = [
    { role: "system", content: DRAFTING_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Draft a ${letterType} letter:

From: ${sender.name}${sender.title ? `, ${sender.title}` : ""}${sender.organization ? ` at ${sender.organization}` : ""}
To: ${recipient.name}${recipient.title ? `, ${recipient.title}` : ""}${recipient.organization ? ` at ${recipient.organization}` : ""}

Purpose: ${purpose}

Key Points:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Tone: ${options.tone ?? "formal"}
Jurisdiction: ${options.jurisdiction ?? "us_federal"}

${options.specialInstructions ? `Special Instructions:\n${options.specialInstructions}` : ""}

Provide as JSON with:
- title: letter title
- sections: array of {title, content, isRequired, isCustom}
- suggestions: array of suggestions
- missingClauses: array of recommended additions`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 8192,
    jsonMode: true,
  });

  const raw = parseJSONResponse<{
    title: string;
    sections: Array<{
      title: string;
      content: string;
      isRequired: boolean;
      isCustom: boolean;
    }>;
    suggestions: string[];
    missingClauses: string[];
  }>(response.content);

  const fullContent = raw.sections.map((s) => s.content).join("\n\n");
  const wordCount = countWords(fullContent);

  return {
    id: generateId(),
    type: "letter",
    title: raw.title,
    content: fullContent,
    sections: raw.sections,
    metadata: {
      wordCount,
      estimatedPages: estimatePages(wordCount),
      readabilityScore: calculateReadability(fullContent),
      formalityScore: calculateFormality(fullContent),
      generatedAt: new Date().toISOString(),
      jurisdiction: options.jurisdiction ?? "us_federal",
      tone: options.tone ?? "formal",
    },
    suggestions: raw.suggestions,
    missingClauses: raw.missingClauses,
    processingTimeMs: Date.now() - startTime,
  };
}

export async function suggestClauses(
  documentType: DocumentType,
  existingClauses: string[],
  options: {
    jurisdiction?: DocumentJurisdiction;
    riskAreas?: string[];
    specialRequirements?: string[];
  } = {}
): Promise<ClauseSuggestion[]> {
  const client = getAIClient();

  const messages: AIMessage[] = [
    { role: "system", content: DRAFTING_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Suggest clauses for a ${documentType.replace(/_/g, " ")} in ${options.jurisdiction ?? "US federal"} jurisdiction.

Existing clauses:
${existingClauses.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${options.riskAreas?.length ? `Risk Areas:\n${options.riskAreas.map((r) => `- ${r}`).join("\n")}` : ""}
${options.specialRequirements?.length ? `Special Requirements:\n${options.specialRequirements.map((r) => `- ${r}`).join("\n")}` : ""}

For each clause suggestion provide:
- category: clause category
- title: clause title
- content: full clause text
- rationale: why this clause is important
- priority: required, recommended, or optional
- alternatives: 1-2 alternative versions
- jurisdictionSpecific: whether this is specific to the jurisdiction

Return as JSON array. Focus on clauses that are missing from the existing set and address the identified risk areas.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 12288,
    jsonMode: true,
  });

  const raw = parseJSONResponse<Array<Omit<ClauseSuggestion, "id">>>(response.content);
  return raw.map((c) => ({ ...c, id: generateId() }));
}

export async function improveDocumentDraft(
  currentDraft: string,
  feedback: string,
  options: {
    documentType?: DocumentType;
    jurisdiction?: DocumentJurisdiction;
    tone?: DocumentTone;
  } = {}
): Promise<DraftedDocument> {
  const client = getAIClient();
  const startTime = Date.now();

  const messages: AIMessage[] = [
    { role: "system", content: DRAFTING_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Improve the following legal document based on the provided feedback.

Current Draft:
${currentDraft.substring(0, 15000)}

Feedback:
${feedback}

${options.tone ? `Desired Tone: ${options.tone}` : ""}
${options.jurisdiction ? `Jurisdiction: ${options.jurisdiction}` : ""}

Provide the improved document as JSON with:
- title: document title
- sections: array of {title, content, sectionNumber, isRequired, isCustom}
- suggestions: array of additional suggestions
- missingClauses: array of recommended additions

Address all feedback points while maintaining legal accuracy and proper formatting.`,
    },
  ];

  const response = await client.complete(messages, {
    temperature: 0.3,
    maxTokens: 16384,
    jsonMode: true,
  });

  const raw = parseJSONResponse<{
    title: string;
    sections: Array<{
      title: string;
      content: string;
      sectionNumber?: string;
      isRequired: boolean;
      isCustom: boolean;
    }>;
    suggestions: string[];
    missingClauses: string[];
  }>(response.content);

  const fullContent = raw.sections
    .map((s) => `${s.sectionNumber ? s.sectionNumber + " " : ""}${s.title}\n\n${s.content}`)
    .join("\n\n");

  const wordCount = countWords(fullContent);

  return {
    id: generateId(),
    type: options.documentType ?? "other",
    title: raw.title,
    content: fullContent,
    sections: raw.sections,
    metadata: {
      wordCount,
      estimatedPages: estimatePages(wordCount),
      readabilityScore: calculateReadability(fullContent),
      formalityScore: calculateFormality(fullContent),
      generatedAt: new Date().toISOString(),
      jurisdiction: options.jurisdiction ?? "us_federal",
      tone: options.tone ?? "formal",
    },
    suggestions: raw.suggestions,
    missingClauses: raw.missingClauses,
    processingTimeMs: Date.now() - startTime,
  };
}

export function formatDocumentReport(document: DraftedDocument): string {
  const lines: string[] = [];
  lines.push(`# ${document.title}`);
  lines.push(`Type: ${document.type.replace(/_/g, " ")}`);
  lines.push(`Generated: ${document.metadata.generatedAt}`);
  lines.push(`Jurisdiction: ${document.metadata.jurisdiction}`);
  lines.push(`Tone: ${document.metadata.tone}`);
  lines.push(`Words: ${document.metadata.wordCount} | Pages: ~${document.metadata.estimatedPages}`);
  lines.push(`Readability: ${document.metadata.readabilityScore}/100 | Formality: ${document.metadata.formalityScore}/100`);
  lines.push("");

  lines.push(`## Document Content`);
  lines.push(document.content);
  lines.push("");

  if (document.suggestions.length > 0) {
    lines.push(`## Drafting Suggestions`);
    for (const s of document.suggestions) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  if (document.missingClauses.length > 0) {
    lines.push(`## Recommended Additions`);
    for (const m of document.missingClauses) {
      lines.push(`- ${m}`);
    }
  }

  return lines.join("\n");
}
