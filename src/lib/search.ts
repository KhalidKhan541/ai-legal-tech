export interface SearchDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  score?: number;
  highlights?: SearchHighlight[];
}

export interface SearchHighlight {
  field: string;
  fragment: string;
  offsets?: [number, number][];
}

export interface SearchQuery {
  q: string;
  type?: string[];
  filters?: Record<string, string | number | boolean | string[]>;
  sort?: { field: string; order: "asc" | "desc" }[];
  page?: number;
  limit?: number;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  page: number;
  limit: number;
  query: string;
  took: number;
}

export interface SearchIndexConfig {
  fields: string[];
  weights?: Record<string, number>;
  stopWords?: string[];
  stemmer?: boolean;
}

// ─── Text Processing ─────────────────────────────────────────────────────────

const DEFAULT_STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need",
  "it", "its", "this", "that", "these", "those", "i", "you", "he",
  "she", "we", "they", "me", "him", "her", "us", "them", "my", "your",
  "his", "our", "their", "what", "which", "who", "whom", "where",
  "when", "why", "how", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "about", "above",
  "after", "again", "also", "am", "as", "because", "before", "between",
  "during", "if", "into", "then", "there", "through", "under", "until",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function removeStopWords(tokens: string[], stopWords: Set<string>): string[] {
  return tokens.filter((t) => !stopWords.has(t));
}

function simpleStem(word: string): string {
  let stemmed = word;

  if (word.endsWith("ies") && word.length > 4) {
    stemmed = word.slice(0, -3) + "y";
  } else if (word.endsWith("ing") && word.length > 5) {
    stemmed = word.slice(0, -3);
  } else if (word.endsWith("ness") && word.length > 5) {
    stemmed = word.slice(0, -4);
  } else if (word.endsWith("ment") && word.length > 5) {
    stemmed = word.slice(0, -4);
  } else if (word.endsWith("tion") && word.length > 5) {
    stemmed = word.slice(0, -4);
  } else if (word.endsWith("ly") && word.length > 4) {
    stemmed = word.slice(0, -2);
  } else if (word.endsWith("ed") && word.length > 4) {
    stemmed = word.slice(0, -2);
  } else if (word.endsWith("er") && word.length > 4) {
    stemmed = word.slice(0, -2);
  } else if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    stemmed = word.slice(0, -1);
  }

  return stemmed;
}

// ─── Inverted Index ──────────────────────────────────────────────────────────

interface IndexEntry {
  documentId: string;
  positions: number[];
  termFrequency: number;
}

class InvertedIndex {
  private index = new Map<string, Map<string, IndexEntry>>();
  private documents = new Map<string, SearchDocument>();
  private docLengths = new Map<string, number>();
  private avgDocLength = 0;
  private totalDocs = 0;

  addDocument(doc: SearchDocument, config: SearchIndexConfig): void {
    this.documents.set(doc.id, doc);
    this.totalDocs++;

    for (const field of config.fields) {
      const value = this.getDocumentField(doc, field);
      if (!value) continue;

      let tokens = tokenize(value);

      if (config.stopWords !== false) {
        tokens = removeStopWords(tokens, DEFAULT_STOP_WORDS);
      }

      if (config.stemmer !== false) {
        tokens = tokens.map((t) => simpleStem(t));
      }

      this.docLengths.set(doc.id, (this.docLengths.get(doc.id) ?? 0) + tokens.length);

      const fieldIndex = this.index.get(field) ?? new Map<string, IndexEntry>();
      this.index.set(field, fieldIndex);

      tokens.forEach((token, position) => {
        let entry = fieldIndex.get(token);
        if (!entry) {
          entry = { documentId: doc.id, positions: [], termFrequency: 0 };
          fieldIndex.set(token, entry);
        }
        if (entry.documentId === doc.id) {
          entry.positions.push(position);
          entry.termFrequency++;
        }
      });
    }

    this.recalculateAvgDocLength();
  }

  removeDocument(docId: string): void {
    this.documents.delete(docId);
    this.docLengths.delete(docId);
    this.totalDocs--;

    for (const [, fieldIndex] of this.index) {
      for (const [term, entry] of fieldIndex) {
        if (entry.documentId === docId) {
          fieldIndex.delete(term);
        }
      }
    }

    this.recalculateAvgDocLength();
  }

  search(
    query: string,
    config: SearchIndexConfig,
    options?: { type?: string[]; filters?: Record<string, unknown>; limit?: number }
  ): SearchDocument[] {
    let queryTokens = tokenize(query);
    if (config.stemmer !== false) {
      queryTokens = queryTokens.map((t) => simpleStem(t));
    }

    const scores = new Map<string, number>();

    for (const field of config.fields) {
      const fieldIndex = this.index.get(field);
      if (!fieldIndex) continue;

      const weight = config.weights?.[field] ?? 1;

      for (const token of queryTokens) {
        const entry = fieldIndex.get(token);
        if (!entry) continue;

        const tf = entry.termFrequency;
        const df = this.index.get(field)?.size ?? 1;
        const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
        const docLength = this.docLengths.get(entry.documentId) ?? 1;
        const avgDl = this.avgDocLength || 1;

        // BM25-inspired scoring
        const k1 = 1.2;
        const b = 0.75;
        const normalizedTf =
          (tf * (k1 + 1)) /
          (tf + k1 * (1 - b + b * (docLength / avgDl)));

        const score = normalizedTf * idf * weight;
        const current = scores.get(entry.documentId) ?? 0;
        scores.set(entry.documentId, current + score);
      }
    }

    let results = Array.from(scores.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score);

    if (options?.type && options.type.length > 0) {
      results = results.filter((r) => {
        const doc = this.documents.get(r.id);
        return doc && options.type!.includes(doc.type);
      });
    }

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results
      .map((r) => {
        const doc = this.documents.get(r.id);
        if (!doc) return null;
        return { ...doc, score: r.score };
      })
      .filter((d): d is SearchDocument => d !== null);
  }

  getDocumentCount(): number {
    return this.totalDocs;
  }

  private getDocumentField(doc: SearchDocument, field: string): string | undefined {
    if (field === "title") return doc.title;
    if (field === "content") return doc.content;
    if (field === "type") return doc.type;
    if (doc.metadata && field in doc.metadata) {
      return String(doc.metadata[field]);
    }
    return undefined;
  }

  private recalculateAvgDocLength(): void {
    let total = 0;
    for (const length of this.docLengths.values()) {
      total += length;
    }
    this.avgDocLength = this.totalDocs > 0 ? total / this.totalDocs : 0;
  }
}

// ─── Search Engine ───────────────────────────────────────────────────────────

export class SearchEngine {
  private index: InvertedIndex;
  private config: SearchIndexConfig;

  constructor(config?: Partial<SearchIndexConfig>) {
    this.config = {
      fields: config?.fields ?? ["title", "content"],
      weights: config?.weights ?? { title: 2, content: 1 },
      stopWords: config?.stopWords !== false,
      stemmer: config?.stemmer !== false,
    };
    this.index = new InvertedIndex();
  }

  addDocument(doc: SearchDocument): void {
    this.index.addDocument(doc, this.config);
  }

  addDocuments(docs: SearchDocument[]): void {
    for (const doc of docs) {
      this.index.addDocument(doc, this.config);
    }
  }

  removeDocument(docId: string): void {
    this.index.removeDocument(docId);
  }

  search(query: string, options?: Partial<SearchQuery>): SearchResult {
    const startTime = Date.now();
    const limit = options?.limit ?? 20;
    const page = options?.page ?? 1;

    const results = this.index.search(query, this.config, {
      type: options?.type,
      filters: options?.filters,
      limit: limit * page,
    });

    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      documents: paginatedResults,
      total: results.length,
      page,
      limit,
      query,
      took: Date.now() - startTime,
    };
  }

  getDocumentCount(): number {
    return this.index.getDocumentCount();
  }

  highlight(text: string, query: string): string {
    const terms = tokenize(query);
    let highlighted = text;

    for (const term of terms) {
      const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
      highlighted = highlighted.replace(
        regex,
        (match) => `<mark>${match}</mark>`
      );
    }

    return highlighted;
  }

  suggest(query: string, maxSuggestions = 5): string[] {
    const tokens = tokenize(query);
    const lastToken = tokens[tokens.length - 1];
    if (!lastToken) return [];

    const suggestions: string[] = [];

    for (const [, fieldIndex] of this.index["index"]) {
      for (const term of fieldIndex.keys()) {
        if (term.startsWith(lastToken) && !suggestions.includes(term)) {
          const suggestion = [...tokens.slice(0, -1), term].join(" ");
          suggestions.push(suggestion);
          if (suggestions.length >= maxSuggestions) break;
        }
      }
      if (suggestions.length >= maxSuggestions) break;
    }

    return suggestions;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let searchEngine: SearchEngine | null = null;

export function getSearchEngine(config?: Partial<SearchIndexConfig>): SearchEngine {
  if (!searchEngine) {
    searchEngine = new SearchEngine(config);
  }
  return searchEngine;
}
