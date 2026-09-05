import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const DocumentType = z.enum([
  "contract",
  "agreement",
  "brief",
  "motion",
  "complaint",
  "answer",
  "discovery",
  "deposition",
  "correspondence",
  "court_order",
  "judgment",
  "evidence",
  "memo",
  "pleading",
  "exhibit",
  "affidavit",
  "declaration",
  "subpoena",
  "power_of_attorney",
  "other",
]);
export type DocumentType = z.infer<typeof DocumentType>;

export const DocumentStatus = z.enum([
  "draft",
  "review",
  "approved",
  "filed",
  "archived",
  "deleted",
]);
export type DocumentStatus = z.infer<typeof DocumentStatus>;

export const AccessLevel = z.enum([
  "public",
  "internal",
  "confidential",
  "privileged",
  "sealed",
]);
export type AccessLevel = z.infer<typeof AccessLevel>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  version: z.number().min(1),
  fileName: z.string(),
  fileSize: z.number().min(0),
  mimeType: z.string(),
  storageKey: z.string(),
  checksum: z.string(),
  uploadedBy: z.string().uuid(),
  uploadedAt: z.string().datetime(),
  changes: z.string().optional(),
  isCurrent: z.boolean().default(true),
});

export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

export const DocumentFolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
  matterId: z.string().uuid().optional(),
  path: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DocumentFolder = z.infer<typeof DocumentFolderSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  documentNumber: z.string(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: DocumentType,
  status: DocumentStatus,
  accessLevel: AccessLevel,
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.unknown()).default({}),
  currentVersion: z.number().default(1),
  versions: z.array(DocumentVersionSchema).default([]),
  metadata: z
    .object({
      author: z.string().optional(),
      subject: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      createdDate: z.string().datetime().optional(),
      modifiedDate: z.string().datetime().optional(),
      pageCount: z.number().optional(),
      wordCount: z.number().optional(),
    })
    .default({}),
  ocrStatus: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  ocrText: z.string().optional(),
  previewUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  isTemplate: z.boolean().default(false),
  templateId: z.string().uuid().optional(),
  linkedDocuments: z.array(z.string().uuid()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const CreateDocumentSchema = DocumentSchema.omit({
  id: true,
  documentNumber: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  versions: true,
  currentVersion: true,
  ocrStatus: true,
  ocrText: true,
  previewUrl: true,
  thumbnailUrl: true,
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;

export const UpdateDocumentSchema = DocumentSchema.partial().omit({
  id: true,
  documentNumber: true,
  createdAt: true,
  createdBy: true,
  versions: true,
});

export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;

export const DocumentFilterSchema = z.object({
  type: z.array(DocumentType).optional(),
  status: z.array(DocumentStatus).optional(),
  accessLevel: z.array(AccessLevel).optional(),
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  mimeType: z.string().optional(),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  uploadedFrom: z.string().datetime().optional(),
  uploadedTo: z.string().datetime().optional(),
  uploadedBy: z.string().uuid().optional(),
  isTemplate: z.boolean().optional(),
  sortBy: z
    .enum([
      "title",
      "type",
      "status",
      "createdAt",
      "updatedAt",
      "fileSize",
    ])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type DocumentFilter = z.infer<typeof DocumentFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DocumentStats {
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  documentsByStatus: Record<DocumentStatus, number>;
  totalSize: number;
  documentsWithOcr: number;
  pendingOcr: number;
  templatesCount: number;
}

export interface SearchResult {
  document: Document;
  score: number;
  highlights: {
    field: string;
    snippet: string;
    startOffset: number;
    endOffset: number;
  }[];
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  action: "uploaded" | "updated" | "downloaded" | "viewed" | "deleted" | "shared";
  userId: string;
  userName: string;
  timestamp: string;
  details: Record<string, unknown>;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let documents: Document[] = [];
let folders: DocumentFolder[] = [];
let documentActivity: DocumentActivity[] = [];
let docCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function generateDocumentNumber(): string {
  const year = new Date().getFullYear();
  const num = String(docCounter++).padStart(6, "0");
  return `DOC-${year}-${num}`;
}

function now(): string {
  return new Date().toISOString();
}

function calculateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256:${Math.abs(hash).toString(16).padStart(16, "0")}`;
}

// ─── Document Service ───────────────────────────────────────────────────────

export const DocumentService = {
  /**
   * Create a new document
   */
  create(input: CreateDocumentInput, userId: string): Document {
    const validated = CreateDocumentSchema.parse(input);

    const document: Document = {
      ...validated,
      id: generateId(),
      documentNumber: generateDocumentNumber(),
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
      versions: [],
      currentVersion: 0,
    };

    documents.push(document);
    return document;
  },

  /**
   * Upload a document with initial version
   */
  upload(
    input: CreateDocumentInput,
    fileContent: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    userId: string
  ): Document {
    const document = DocumentService.create(input, userId);

    const version: DocumentVersion = {
      id: generateId(),
      documentId: document.id,
      version: 1,
      fileName,
      fileSize,
      mimeType,
      storageKey: `documents/${document.id}/v1/${fileName}`,
      checksum: calculateChecksum(fileContent),
      uploadedBy: userId,
      uploadedAt: now(),
      isCurrent: true,
    };

    document.versions.push(version);
    document.currentVersion = 1;
    document.updatedAt = now();
    document.updatedBy = userId;

    DocumentService.logActivity(document.id, "uploaded", userId, "System", {
      fileName,
      fileSize,
      mimeType,
    });

    return document;
  },

  /**
   * Upload new version of existing document
   */
  uploadNewVersion(
    documentId: string,
    fileContent: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    userId: string,
    changes?: string
  ): DocumentVersion {
    const document = documents.find((d) => d.id === documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Mark all existing versions as not current
    for (const version of document.versions) {
      version.isCurrent = false;
    }

    const newVersion: DocumentVersion = {
      id: generateId(),
      documentId,
      version: document.currentVersion + 1,
      fileName,
      fileSize,
      mimeType,
      storageKey: `documents/${documentId}/v${document.currentVersion + 1}/${fileName}`,
      checksum: calculateChecksum(fileContent),
      uploadedBy: userId,
      uploadedAt: now(),
      changes,
      isCurrent: true,
    };

    document.versions.push(newVersion);
    document.currentVersion = newVersion.version;
    document.updatedAt = now();
    document.updatedBy = userId;

    DocumentService.logActivity(documentId, "updated", userId, "System", {
      version: newVersion.version,
      fileName,
      changes,
    });

    return newVersion;
  },

  /**
   * Get document by ID
   */
  getById(id: string): Document | undefined {
    return documents.find((d) => d.id === id);
  },

  /**
   * Get document by document number
   */
  getByDocumentNumber(documentNumber: string): Document | undefined {
    return documents.find((d) => d.documentNumber === documentNumber);
  },

  /**
   * Update document metadata
   */
  update(
    id: string,
    input: UpdateDocumentInput,
    userId: string
  ): Document | undefined {
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) return undefined;

    const validated = UpdateDocumentSchema.parse(input);
    documents[index] = {
      ...documents[index],
      ...validated,
      updatedAt: now(),
      updatedBy: userId,
    };

    DocumentService.logActivity(id, "updated", userId, "System", {
      changes: Object.keys(validated),
    });

    return documents[index];
  },

  /**
   * Delete document
   */
  delete(id: string, userId: string): boolean {
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) return false;

    const document = documents[index];

    DocumentService.logActivity(id, "deleted", userId, "System", {
      title: document.title,
      versions: document.versions.length,
    });

    documents.splice(index, 1);
    return true;
  },

  /**
   * Get current version of document
   */
  getCurrentVersion(documentId: string): DocumentVersion | undefined {
    const document = documents.find((d) => d.id === documentId);
    return document?.versions.find((v) => v.isCurrent);
  },

  /**
   * Get all versions of document
   */
  getVersions(documentId: string): DocumentVersion[] {
    const document = documents.find((d) => d.id === documentId);
    return (
      document?.versions.sort((a, b) => b.version - a.version) ?? []
    );
  },

  /**
   * Get specific version
   */
  getVersion(documentId: string, version: number): DocumentVersion | undefined {
    const document = documents.find((d) => d.id === documentId);
    return document?.versions.find((v) => v.version === version);
  },

  /**
   * Revert to previous version
   */
  revertToVersion(
    documentId: string,
    targetVersion: number,
    userId: string
  ): Document | undefined {
    const document = documents.find((d) => d.id === documentId);
    if (!document) return undefined;

    const versionToRevert = document.versions.find(
      (v) => v.version === targetVersion
    );
    if (!versionToRevert) return undefined;

    // Mark all as not current
    for (const version of document.versions) {
      version.isCurrent = false;
    }

    versionToRevert.isCurrent = true;
    document.currentVersion = targetVersion;
    document.updatedAt = now();
    document.updatedBy = userId;

    DocumentService.logActivity(documentId, "updated", userId, "System", {
      action: "reverted",
      targetVersion,
    });

    return document;
  },

  /**
   * Create folder
   */
  createFolder(
    input: Omit<DocumentFolder, "id" | "createdAt" | "updatedAt" | "path">
  ): DocumentFolder {
    let path = input.name;
    if (input.parentId) {
      const parent = folders.find((f) => f.id === input.parentId);
      if (parent) {
        path = `${parent.path}/${input.name}`;
      }
    }

    const folder: DocumentFolder = {
      ...input,
      id: generateId(),
      path,
      createdAt: now(),
      updatedAt: now(),
    };

    folders.push(folder);
    return folder;
  },

  /**
   * Update folder
   */
  updateFolder(
    id: string,
    updates: Partial<Omit<DocumentFolder, "id" | "createdAt" | "updatedAt">>
  ): DocumentFolder | undefined {
    const index = folders.findIndex((f) => f.id === id);
    if (index === -1) return undefined;

    folders[index] = {
      ...folders[index],
      ...updates,
      updatedAt: now(),
    };

    return folders[index];
  },

  /**
   * Delete folder
   */
  deleteFolder(id: string): boolean {
    const index = folders.findIndex((f) => f.id === id);
    if (index === -1) return false;

    // Move child documents to uncategorized
    const childDocs = documents.filter((d) => d.folderId === id);
    for (const doc of childDocs) {
      doc.folderId = undefined;
      doc.updatedAt = now();
    }

    // Move child folders to root
    const childFolders = folders.filter((f) => f.parentId === id);
    for (const child of childFolders) {
      child.parentId = undefined;
      child.path = child.name;
      child.updatedAt = now();
    }

    folders.splice(index, 1);
    return true;
  },

  /**
   * Get folder by ID
   */
  getFolderById(id: string): DocumentFolder | undefined {
    return folders.find((f) => f.id === id);
  },

  /**
   * Get folder contents (documents + subfolders)
   */
  getFolderContents(
    folderId: string | null
  ): { documents: Document[]; folders: DocumentFolder[] } {
    const folderDocs = documents.filter(
      (d) => d.folderId === folderId
    );
    const childFolders = folders.filter(
      (f) => f.parentId === folderId
    );

    return { documents: folderDocs, folders: childFolders };
  },

  /**
   * Get folder tree
   */
  getFolderTree(): DocumentFolder[] {
    return folders.sort((a, b) => a.path.localeCompare(b.path));
  },

  /**
   * Move document to folder
   */
  moveToFolder(
    documentId: string,
    folderId: string | null,
    userId: string
  ): Document | undefined {
    const document = documents.find((d) => d.id === documentId);
    if (!document) return undefined;

    if (folderId) {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return undefined;
    }

    document.folderId = folderId ?? undefined;
    document.updatedAt = now();
    document.updatedBy = userId;

    return document;
  },

  /**
   * Add tag to document
   */
  addTag(documentId: string, tag: string, userId: string): Document | undefined {
    const document = documents.find((d) => d.id === documentId);
    if (!document) return undefined;

    if (!document.tags.includes(tag)) {
      document.tags.push(tag);
      document.updatedAt = now();
      document.updatedBy = userId;
    }

    return document;
  },

  /**
   * Remove tag from document
   */
  removeTag(
    documentId: string,
    tag: string,
    userId: string
  ): Document | undefined {
    const document = documents.find((d) => d.id === documentId);
    if (!document) return undefined;

    document.tags = document.tags.filter((t) => t !== tag);
    document.updatedAt = now();
    document.updatedBy = userId;
    return document;
  },

  /**
   * Full-text search
   */
  searchText(query: string, filters?: Partial<DocumentFilter>): SearchResult[] {
    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const doc of documents) {
      if (doc.status === "deleted") continue;

      let score = 0;
      const highlights: SearchResult["highlights"] = [];

      // Title match (highest weight)
      if (doc.title.toLowerCase().includes(searchTerm)) {
        score += 10;
        const index = doc.title.toLowerCase().indexOf(searchTerm);
        highlights.push({
          field: "title",
          snippet: doc.title,
          startOffset: index,
          endOffset: index + searchTerm.length,
        });
      }

      // Description match
      if (doc.description?.toLowerCase().includes(searchTerm)) {
        score += 5;
        const index = doc.description.toLowerCase().indexOf(searchTerm);
        highlights.push({
          field: "description",
          snippet: doc.description.substring(0, 200),
          startOffset: index,
          endOffset: index + searchTerm.length,
        });
      }

      // Document number match
      if (doc.documentNumber.toLowerCase().includes(searchTerm)) {
        score += 8;
        highlights.push({
          field: "documentNumber",
          snippet: doc.documentNumber,
          startOffset: 0,
          endOffset: doc.documentNumber.length,
        });
      }

      // Tags match
      for (const tag of doc.tags) {
        if (tag.toLowerCase().includes(searchTerm)) {
          score += 3;
          highlights.push({
            field: "tags",
            snippet: tag,
            startOffset: 0,
            endOffset: tag.length,
          });
        }
      }

      // OCR text match
      if (doc.ocrText?.toLowerCase().includes(searchTerm)) {
        score += 7;
        const ocrIndex = doc.ocrText.toLowerCase().indexOf(searchTerm);
        const start = Math.max(0, ocrIndex - 50);
        const end = Math.min(doc.ocrText.length, ocrIndex + searchTerm.length + 50);
        highlights.push({
          field: "ocrText",
          snippet: doc.ocrText.substring(start, end),
          startOffset: ocrIndex - start,
          endOffset: ocrIndex - start + searchTerm.length,
        });
      }

      // Metadata match
      if (doc.metadata.author?.toLowerCase().includes(searchTerm)) {
        score += 2;
      }
      if (doc.metadata.subject?.toLowerCase().includes(searchTerm)) {
        score += 4;
      }
      for (const keyword of doc.metadata.keywords) {
        if (keyword.toLowerCase().includes(searchTerm)) {
          score += 2;
        }
      }

      if (score > 0) {
        // Apply filters
        if (filters) {
          if (filters.type?.length && !filters.type.includes(doc.type)) continue;
          if (filters.status?.length && !filters.status.includes(doc.status)) continue;
          if (filters.matterId && doc.matterId !== filters.matterId) continue;
          if (filters.clientId && doc.clientId !== filters.clientId) continue;
          if (filters.tags?.length && !filters.tags.some((t) => doc.tags.includes(t))) continue;
        }

        results.push({ document: doc, score, highlights });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  },

  /**
   * Search and filter documents
   */
  search(filter: DocumentFilter): PaginatedResult<Document> {
    const validated = DocumentFilterSchema.parse(filter);
    let filtered = [...documents];

    // Type filter
    if (validated.type?.length) {
      filtered = filtered.filter((d) => validated.type!.includes(d.type));
    }

    // Status filter
    if (validated.status?.length) {
      filtered = filtered.filter((d) => validated.status!.includes(d.status));
    }

    // Access level filter
    if (validated.accessLevel?.length) {
      filtered = filtered.filter((d) =>
        validated.accessLevel!.includes(d.accessLevel)
      );
    }

    // Matter filter
    if (validated.matterId) {
      filtered = filtered.filter((d) => d.matterId === validated.matterId);
    }

    // Client filter
    if (validated.clientId) {
      filtered = filtered.filter((d) => d.clientId === validated.clientId);
    }

    // Folder filter
    if (validated.folderId) {
      filtered = filtered.filter((d) => d.folderId === validated.folderId);
    }

    // Tags filter
    if (validated.tags?.length) {
      filtered = filtered.filter((d) =>
        validated.tags!.some((tag) => d.tags.includes(tag))
      );
    }

    // Text search
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term) ||
          d.documentNumber.toLowerCase().includes(term) ||
          d.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    // MIME type filter
    if (validated.mimeType) {
      filtered = filtered.filter((d) => {
        const currentVersion = d.versions.find((v) => v.isCurrent);
        return currentVersion?.mimeType.includes(validated.mimeType!);
      });
    }

    // Size filters
    if (validated.minSize !== undefined || validated.maxSize !== undefined) {
      filtered = filtered.filter((d) => {
        const currentVersion = d.versions.find((v) => v.isCurrent);
        if (!currentVersion) return false;
        if (validated.minSize !== undefined && currentVersion.fileSize < validated.minSize) return false;
        if (validated.maxSize !== undefined && currentVersion.fileSize > validated.maxSize) return false;
        return true;
      });
    }

    // Date range filters
    if (validated.uploadedFrom) {
      filtered = filtered.filter(
        (d) => new Date(d.createdAt) >= new Date(validated.uploadedFrom!)
      );
    }
    if (validated.uploadedTo) {
      filtered = filtered.filter(
        (d) => new Date(d.createdAt) <= new Date(validated.uploadedTo!)
      );
    }

    // Uploaded by filter
    if (validated.uploadedBy) {
      filtered = filtered.filter(
        (d) => d.createdBy === validated.uploadedBy
      );
    }

    // Template filter
    if (validated.isTemplate !== undefined) {
      filtered = filtered.filter((d) => d.isTemplate === validated.isTemplate);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (validated.sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "fileSize": {
          const aSize = a.versions.find((v) => v.isCurrent)?.fileSize ?? 0;
          const bSize = b.versions.find((v) => v.isCurrent)?.fileSize ?? 0;
          comparison = aSize - bSize;
          break;
        }
      }
      return validated.sortOrder === "asc" ? comparison : -comparison;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / validated.limit);
    const start = (validated.page - 1) * validated.limit;
    const items = filtered.slice(start, start + validated.limit);

    return { items, total, page: validated.page, limit: validated.limit, totalPages };
  },

  /**
   * Get documents by matter
   */
  getByMatter(matterId: string): Document[] {
    return documents
      .filter((d) => d.matterId === matterId && d.status !== "deleted")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  /**
   * Get documents by client
   */
  getByClient(clientId: string): Document[] {
    return documents
      .filter((d) => d.clientId === clientId && d.status !== "deleted")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  /**
   * Get document statistics
   */
  getStats(): DocumentStats {
    const documentsByType = {} as Record<DocumentType, number>;
    const documentsByStatus = {} as Record<DocumentStatus, number>;

    for (const type of Object.values(DocumentType.enum)) {
      documentsByType[type] = 0;
    }
    for (const status of Object.values(DocumentStatus.enum)) {
      documentsByStatus[status] = 0;
    }

    let totalSize = 0;
    let documentsWithOcr = 0;
    let pendingOcr = 0;
    let templatesCount = 0;

    for (const doc of documents) {
      documentsByType[doc.type]++;
      documentsByStatus[doc.status]++;

      const currentVersion = doc.versions.find((v) => v.isCurrent);
      if (currentVersion) {
        totalSize += currentVersion.fileSize;
      }

      if (doc.ocrStatus === "completed") documentsWithOcr++;
      if (doc.ocrStatus === "pending" || doc.ocrStatus === "processing") pendingOcr++;
      if (doc.isTemplate) templatesCount++;
    }

    return {
      totalDocuments: documents.length,
      documentsByType,
      documentsByStatus,
      totalSize,
      documentsWithOcr,
      pendingOcr,
      templatesCount,
    };
  },

  /**
   * Log document activity
   */
  logActivity(
    documentId: string,
    action: DocumentActivity["action"],
    userId: string,
    userName: string,
    details?: Record<string, unknown>
  ): void {
    documentActivity.push({
      id: generateId(),
      documentId,
      action,
      userId,
      userName,
      timestamp: now(),
      details: details ?? {},
    });
  },

  /**
   * Get document activity
   */
  getActivity(
    documentId: string,
    page: number = 1,
    limit: number = 50
  ): PaginatedResult<DocumentActivity> {
    const filtered = documentActivity
      .filter((a) => a.documentId === documentId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  },

  /**
   * Link documents
   */
  linkDocuments(
    documentId: string,
    linkedDocumentId: string,
    userId: string
  ): Document | undefined {
    const document = documents.find((d) => d.id === documentId);
    if (!document) return undefined;

    const linkedDoc = documents.find((d) => d.id === linkedDocumentId);
    if (!linkedDoc) return undefined;

    if (!document.linkedDocuments.includes(linkedDocumentId)) {
      document.linkedDocuments.push(linkedDocumentId);
      document.updatedAt = now();
      document.updatedBy = userId;
    }

    if (!linkedDoc.linkedDocuments.includes(documentId)) {
      linkedDoc.linkedDocuments.push(documentId);
      linkedDoc.updatedAt = now();
      linkedDoc.updatedBy = userId;
    }

    return document;
  },

  /**
   * Unlink documents
   */
  unlinkDocuments(
    documentId: string,
    linkedDocumentId: string,
    userId: string
  ): Document | undefined {
    const document = documents.find((d) => d.id === documentId);
    if (!document) return undefined;

    document.linkedDocuments = document.linkedDocuments.filter(
      (id) => id !== linkedDocumentId
    );
    document.updatedAt = now();
    document.updatedBy = userId;

    const linkedDoc = documents.find((d) => d.id === linkedDocumentId);
    if (linkedDoc) {
      linkedDoc.linkedDocuments = linkedDoc.linkedDocuments.filter(
        (id) => id !== documentId
      );
      linkedDoc.updatedAt = now();
      linkedDoc.updatedBy = userId;
    }

    return document;
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    documents = [];
    folders = [];
    documentActivity = [];
    docCounter = 1;
  },
};
