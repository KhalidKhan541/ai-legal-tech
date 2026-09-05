import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const OcrStatus = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);
export type OcrStatus = z.infer<typeof OcrStatus>;

export const OcrLanguage = z.enum([
  "eng",
  "spa",
  "fra",
  "deu",
  "ita",
  "por",
  "zho",
  "jpn",
  "kor",
  "ara",
  "hin",
  "rus",
]);
export type OcrLanguage = z.infer<typeof OcrLanguage>;

export const ProcessingMode = z.enum([
  "fast",
  "balanced",
  "accurate",
]);
export type ProcessingMode = z.infer<typeof ProcessingMode>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const OcrConfigSchema = z.object({
  languages: z.array(OcrLanguage).default(["eng"]),
  processingMode: ProcessingMode.default("balanced"),
  enhanceContrast: z.boolean().default(true),
  deskew: z.boolean().default(true),
  removeNoise: z.boolean().default(true),
  detectTables: z.boolean().default(true),
  detectHandwriting: z.boolean().default(false),
  detectBarcodes: z.boolean().default(false),
  outputFormat: z.enum(["text", "hocr", "pdf", "json"]).default("text"),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  maxPages: z.number().min(1).default(100),
});

export type OcrConfig = z.infer<typeof OcrConfigSchema>;

export const OcrResultSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  status: OcrStatus,
  config: OcrConfigSchema,
  pages: z.array(
    z.object({
      pageNumber: z.number().min(1),
      text: z.string(),
      confidence: z.number().min(0).max(1),
      width: z.number().optional(),
      height: z.number().optional(),
      blocks: z
        .array(
          z.object({
            text: z.string(),
            confidence: z.number().min(0).max(1),
            boundingBox: z
              .object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
              })
              .optional(),
            isHandwriting: z.boolean().default(false),
            language: OcrLanguage.optional(),
          })
        )
        .default([]),
    })
  ),
  fullText: z.string(),
  wordCount: z.number().min(0),
  averageConfidence: z.number().min(0).max(1),
  detectedLanguage: OcrLanguage.optional(),
  processingTimeMs: z.number().min(0),
  inputFileSize: z.number().min(0),
  inputMimeType: z.string(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type OcrResult = z.infer<typeof OcrResultSchema>;

export const OcrJobSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  status: OcrStatus,
  priority: z.number().min(0).max(10).default(5),
  attempts: z.number().min(0).default(0),
  maxAttempts: z.number().min(1).default(3),
  scheduledAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
  retryAfter: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type OcrJob = z.infer<typeof OcrJobSchema>;

export interface OcrProcessingStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTimeMs: number;
  totalDocumentsProcessed: number;
  totalWordsExtracted: number;
}

export interface TextExtractionResult {
  text: string;
  confidence: number;
  wordCount: number;
  pageCount: number;
  language: OcrLanguage;
  metadata: {
    hasTables: boolean;
    hasHandwriting: boolean;
    hasBarcodes: boolean;
    averageFontSize: number;
  };
}

export interface SearchableDocument {
  documentId: string;
  title: string;
  fullText: string;
  keywords: string[];
  entities: {
    names: string[];
    dates: string[];
    amounts: string[];
    addresses: string[];
    caseNumbers: string[];
  };
  summary: string;
  indexedAt: string;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let ocrResults: OcrResult[] = [];
let ocrJobs: OcrJob[] = [];
let searchableDocuments: SearchableDocument[] = [];

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Text Processing Helpers ────────────────────────────────────────────────

function extractEntities(text: string): SearchableDocument["entities"] {
  const entities: SearchableDocument["entities"] = {
    names: [],
    dates: [],
    amounts: [],
    addresses: [],
    caseNumbers: [],
  };

  // Extract case numbers (e.g., MAT-2024-00001, Case No. 12345)
  const caseNumberRegex =
    /(?:MAT|CASE|NO\.?|CV|CR|XX)\s*[-#]?\s*\d{4,6}[-#]?\d{0,6}/gi;
  const caseNumberMatches = text.match(caseNumberRegex);
  if (caseNumberMatches) {
    entities.caseNumbers = [...new Set(caseNumberMatches)];
  }

  // Extract dates
  const dateRegex =
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi;
  const dateMatches = text.match(dateRegex);
  if (dateMatches) {
    entities.dates = [...new Set(dateMatches)];
  }

  // Extract monetary amounts
  const amountRegex =
    /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD|EUR|GBP)\b/gi;
  const amountMatches = text.match(amountRegex);
  if (amountMatches) {
    entities.amounts = [...new Set(amountMatches)];
  }

  // Extract potential names (Capitalized words followed by titles)
  const nameRegex =
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\s*(?:,?\s*(?:Esq|Jr|Sr|II|III|IV))?\b/g;
  const nameMatches = text.match(nameRegex);
  if (nameMatches) {
    // Filter out common false positives
    const falsePositives = [
      "The Court",
      "State Court",
      "District Court",
      "Supreme Court",
      "Court Order",
      "Case Summary",
    ];
    entities.names = [
      ...new Set(
        nameMatches.filter((name) => !falsePositives.includes(name))
      ),
    ];
  }

  // Extract addresses (simplified)
  const addressRegex =
    /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\b(?:\s*,?\s*(?:Suite|Ste|Apt|Unit)\s*\d+)?/gi;
  const addressMatches = text.match(addressRegex);
  if (addressMatches) {
    entities.addresses = [...new Set(addressMatches)];
  }

  return entities;
}

function extractKeywords(text: string, maxKeywords: number = 20): string[] {
  // Simple TF-based keyword extraction
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "is",
    "was",
    "are",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "shall",
    "can",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "their",
    "they",
    "them",
    "he",
    "she",
    "him",
    "her",
    "his",
    "we",
    "us",
    "our",
    "you",
    "your",
    "i",
    "me",
    "my",
    "not",
    "no",
    "nor",
    "as",
    "if",
    "then",
    "than",
    "too",
    "very",
    "just",
    "about",
    "above",
    "after",
    "again",
    "all",
    "also",
    "any",
    "because",
    "before",
    "below",
    "between",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "only",
    "own",
    "same",
    "so",
    "still",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "what",
    "how",
    "here",
    "there",
    "why",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
  }

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

function generateSummary(text: string, maxLength: number = 300): string {
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  if (sentences.length === 0) return "";
  if (sentences.length === 1) return sentences[0].substring(0, maxLength);

  // Simple extractive summarization - take first few sentences
  let summary = "";
  for (const sentence of sentences) {
    if (summary.length + sentence.length + 1 > maxLength) break;
    summary += (summary ? " " : "") + sentence;
  }

  return summary || sentences[0].substring(0, maxLength);
}

// ─── OCR Service ────────────────────────────────────────────────────────────

export const OcrService = {
  /**
   * Submit document for OCR processing
   */
  submitJob(
    documentId: string,
    config: Partial<OcrConfig> = {},
    priority: number = 5
  ): OcrJob {
    const validatedConfig = OcrConfigSchema.parse(config);

    const job: OcrJob = {
      id: generateId(),
      documentId,
      status: "pending",
      priority,
      attempts: 0,
      maxAttempts: 3,
      scheduledAt: now(),
      createdAt: now(),
      updatedAt: now(),
    };

    ocrJobs.push(job);
    return job;
  },

  /**
   * Process OCR job (simulated)
   * In production, this would call an actual OCR service like Textract, Vision API, etc.
   */
  processJob(jobId: string): OcrResult {
    const job = ocrJobs.find((j) => j.id === jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== "pending" && job.status !== "failed") {
      throw new Error(`Job ${jobId} is not in a processable state: ${job.status}`);
    }

    // Update job status
    job.status = "processing";
    job.startedAt = now();
    job.attempts++;
    job.updatedAt = now();

    const config = OcrConfigSchema.parse({});
    const startTime = Date.now();

    // Simulate OCR processing
    const simulatedPages = [
      {
        pageNumber: 1,
        text: "IN THE SUPERIOR COURT OF THE STATE OF CALIFORNIA\nIN AND FOR THE COUNTY OF LOS ANGELES\n\nCase No. 2024-CV-12345\n\nJANE DOE,\n\tPlaintiff,\nv.\nACME CORPORATION,\n\tDefendant.\n\nEXHIBIT A\n\nThis document contains confidential attorney-client privileged information.\n\nDate: January 15, 2024\nPrepared by: John Smith, Esq.",
        confidence: 0.92,
        width: 850,
        height: 1100,
        blocks: [
          {
            text: "IN THE SUPERIOR COURT OF THE STATE OF CALIFORNIA",
            confidence: 0.95,
            boundingBox: { x: 50, y: 50, width: 750, height: 30 },
            isHandwriting: false,
            language: "eng" as OcrLanguage,
          },
          {
            text: "Case No. 2024-CV-12345",
            confidence: 0.98,
            boundingBox: { x: 300, y: 100, width: 250, height: 25 },
            isHandwriting: false,
            language: "eng" as OcrLanguage,
          },
        ],
      },
    ];

    const pages = simulatedPages.map((page) => ({
      ...page,
      confidence: Math.min(1, page.confidence + (Math.random() * 0.05 - 0.025)),
    }));

    const fullText = pages.map((p) => p.text).join("\n\n");
    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const averageConfidence =
      pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length;

    const result: OcrResult = {
      id: generateId(),
      documentId: job.documentId,
      status: "completed",
      config,
      pages,
      fullText,
      wordCount,
      averageConfidence,
      detectedLanguage: "eng",
      processingTimeMs: Date.now() - startTime,
      inputFileSize: 1024 * 100,
      inputMimeType: "application/pdf",
      startedAt: job.startedAt,
      completedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    };

    ocrResults.push(result);

    // Update job
    job.status = "completed";
    job.completedAt = now();
    job.updatedAt = now();

    // Create searchable document
    const entities = extractEntities(fullText);
    const keywords = extractKeywords(fullText);

    const searchableDoc: SearchableDocument = {
      documentId: job.documentId,
      title: `Document ${job.documentId}`,
      fullText,
      keywords,
      entities,
      summary: generateSummary(fullText),
      indexedAt: now(),
    };

    searchableDocuments.push(searchableDoc);

    return result;
  },

  /**
   * Get OCR result by ID
   */
  getResultById(id: string): OcrResult | undefined {
    return ocrResults.find((r) => r.id === id);
  },

  /**
   * Get OCR result for document
   */
  getResultByDocumentId(documentId: string): OcrResult | undefined {
    return ocrResults.find((r) => r.documentId === documentId);
  },

  /**
   * Get all OCR results for a document
   */
  getResultsByDocumentId(documentId: string): OcrResult[] {
    return ocrResults
      .filter((r) => r.documentId === documentId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  /**
   * Cancel OCR job
   */
  cancelJob(jobId: string): boolean {
    const job = ocrJobs.find((j) => j.id === jobId);
    if (!job) return false;

    if (job.status === "completed" || job.status === "cancelled") {
      return false;
    }

    job.status = "cancelled";
    job.updatedAt = now();
    return true;
  },

  /**
   * Retry failed OCR job
   */
  retryJob(jobId: string): OcrJob | undefined {
    const job = ocrJobs.find((j) => j.id === jobId);
    if (!job) return undefined;

    if (job.status !== "failed") {
      throw new Error("Only failed jobs can be retried");
    }

    if (job.attempts >= job.maxAttempts) {
      throw new Error("Maximum retry attempts reached");
    }

    job.status = "pending";
    job.scheduledAt = now();
    job.retryAfter = undefined;
    job.error = undefined;
    job.updatedAt = now();

    return job;
  },

  /**
   * Get OCR job by ID
   */
  getJobById(id: string): OcrJob | undefined {
    return ocrJobs.find((j) => j.id === id);
  },

  /**
   * Get pending OCR jobs
   */
  getPendingJobs(): OcrJob[] {
    return ocrJobs
      .filter((j) => j.status === "pending")
      .sort((a, b) => {
        // Sort by priority first, then by scheduled time
        if (a.priority !== b.priority) return b.priority - a.priority;
        return (
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime()
        );
      });
  },

  /**
   * Get OCR processing statistics
   */
  getStats(): OcrProcessingStats {
    let totalProcessingTime = 0;
    let completedCount = 0;
    let totalWordsExtracted = 0;

    for (const result of ocrResults) {
      if (result.status === "completed") {
        totalProcessingTime += result.processingTimeMs;
        completedCount++;
        totalWordsExtracted += result.wordCount;
      }
    }

    return {
      totalJobs: ocrJobs.length,
      pendingJobs: ocrJobs.filter((j) => j.status === "pending").length,
      processingJobs: ocrJobs.filter((j) => j.status === "processing").length,
      completedJobs: ocrJobs.filter((j) => j.status === "completed").length,
      failedJobs: ocrJobs.filter((j) => j.status === "failed").length,
      averageProcessingTimeMs:
        completedCount > 0 ? totalProcessingTime / completedCount : 0,
      totalDocumentsProcessed: completedCount,
      totalWordsExtracted,
    };
  },

  /**
   * Extract text from content (for direct text processing)
   */
  extractText(
    content: string,
    mimeType: string,
    config: Partial<OcrConfig> = {}
  ): TextExtractionResult {
    const validatedConfig = OcrConfigSchema.parse(config);

    // For text-based content, just process directly
    if (mimeType === "text/plain" || mimeType === "text/html") {
      const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
      return {
        text: content,
        confidence: 1.0,
        wordCount,
        pageCount: 1,
        language: validatedConfig.languages[0] ?? "eng",
        metadata: {
          hasTables: content.includes("|") || content.includes("\t"),
          hasHandwriting: false,
          hasBarcodes: false,
          averageFontSize: 12,
        },
      };
    }

    // For other mime types, simulate OCR
    const entities = extractEntities(content);
    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

    return {
      text: content,
      confidence: 0.85 + Math.random() * 0.1,
      wordCount,
      pageCount: 1,
      language: validatedConfig.languages[0] ?? "eng",
      metadata: {
        hasTables: entities.amounts.length > 0,
        hasHandwriting: validatedConfig.detectHandwriting,
        hasBarcodes: false,
        averageFontSize: 12,
      },
    };
  },

  /**
   * Search indexed documents
   */
  searchIndexedDocuments(query: string): SearchableDocument[] {
    const searchTerm = query.toLowerCase();
    return searchableDocuments.filter(
      (doc) =>
        doc.fullText.toLowerCase().includes(searchTerm) ||
        doc.keywords.some((kw) => kw.toLowerCase().includes(searchTerm)) ||
        doc.entities.names.some((name) =>
          name.toLowerCase().includes(searchTerm)
        ) ||
        doc.entities.caseNumbers.some((cn) =>
          cn.toLowerCase().includes(searchTerm)
        )
    );
  },

  /**
   * Get searchable document for a document
   */
  getSearchableDocument(documentId: string): SearchableDocument | undefined {
    return searchableDocuments.find((d) => d.documentId === documentId);
  },

  /**
   * Generate searchable text for document indexing
   */
  generateSearchableText(documentId: string): string | null {
    const result = ocrResults.find(
      (r) => r.documentId === documentId && r.status === "completed"
    );

    if (!result) return null;

    // Combine all text with metadata
    const parts: string[] = [
      result.fullText,
      `Document ID: ${documentId}`,
      `Word count: ${result.wordCount}`,
      `Confidence: ${(result.averageConfidence * 100).toFixed(1)}%`,
    ];

    // Add entity information
    const entities = extractEntities(result.fullText);
    if (entities.caseNumbers.length > 0) {
      parts.push(`Case numbers: ${entities.caseNumbers.join(", ")}`);
    }
    if (entities.dates.length > 0) {
      parts.push(`Dates mentioned: ${entities.dates.join(", ")}`);
    }
    if (entities.amounts.length > 0) {
      parts.push(`Amounts mentioned: ${entities.amounts.join(", ")}`);
    }

    return parts.join("\n");
  },

  /**
   * Batch process multiple documents
   */
  batchProcess(
    documentIds: string[],
    config: Partial<OcrConfig> = {}
  ): OcrJob[] {
    return documentIds.map((docId) => OcrService.submitJob(docId, config));
  },

  /**
   * Get OCR result with highlighted text
   */
  getHighlightedText(
    resultId: string,
    searchTerms: string[]
  ): { page: number; highlightedText: string; confidence: number }[] {
    const result = ocrResults.find((r) => r.id === resultId);
    if (!result) return [];

    return result.pages.map((page) => {
      let highlightedText = page.text;

      for (const term of searchTerms) {
        const regex = new RegExp(`(${term})`, "gi");
        highlightedText = highlightedText.replace(regex, "**$1**");
      }

      return {
        page: page.pageNumber,
        highlightedText,
        confidence: page.confidence,
      };
    });
  },

  /**
   * Delete OCR result
   */
  deleteResult(id: string): boolean {
    const index = ocrResults.findIndex((r) => r.id === id);
    if (index === -1) return false;

    const result = ocrResults[index];
    ocrResults.splice(index, 1);

    // Remove searchable document
    searchableDocuments = searchableDocuments.filter(
      (d) => d.documentId !== result.documentId
    );

    return true;
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    ocrResults = [];
    ocrJobs = [];
    searchableDocuments = [];
  },
};
