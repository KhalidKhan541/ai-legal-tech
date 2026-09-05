export type DocumentType =
  | "contract"
  | "agreement"
  | "motion"
  | "brief"
  | "petition"
  | "discovery"
  | "evidence"
  | "correspondence"
  | "memo"
  | "court_order"
  | "transcript"
  | "other";

export type DocumentStatus = "draft" | "review" | "final" | "archived" | "superseded";

export type AccessLevel = "private" | "team" | "firm" | "client";

export interface Document {
  id: string;
  matterId: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  description?: string;
  tags: string[];
  currentVersion: number;
  versions: DocumentVersion[];
  latestVersion: DocumentVersion;
  size: number;
  mimeType: string;
  storageKey: string;
  checksum: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  name: string;
  size: number;
  mimeType: string;
  storageKey: string;
  checksum: string;
  changeNotes?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
  isCurrentVersion: boolean;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  versionId?: string;
  authorId: string;
  authorName: string;
  content: string;
  page?: number;
  position?: { x: number; y: number };
  resolvedAt?: Date;
  resolvedBy?: string;
  replies: DocumentCommentReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCommentReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  access: "view" | "comment" | "edit" | "admin";
  grantedBy: string;
  grantedAt: Date;
}

export interface DocumentSearchResult {
  document: Document;
  matchScore: number;
  highlights: DocumentHighlight[];
}

export interface DocumentHighlight {
  field: string;
  fragment: string;
  offsets: [number, number][];
}

export interface DocumentStats {
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  documentsByStatus: Record<DocumentStatus, number>;
  totalSize: number;
  recentUploads: number;
  totalVersions: number;
}

export interface DocumentFilter {
  type?: DocumentType[];
  status?: DocumentStatus[];
  accessLevel?: AccessLevel[];
  matterId?: string;
  uploadedBy?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
  minSize?: number;
  maxSize?: number;
}

export interface CreateDocumentInput {
  matterId: string;
  name: string;
  type: DocumentType;
  description?: string;
  accessLevel?: AccessLevel;
  tags?: string[];
  file: File;
}

export interface UpdateDocumentInput {
  name?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  accessLevel?: AccessLevel;
  description?: string;
  tags?: string[];
}

export interface UploadVersionInput {
  documentId: string;
  file: File;
  changeNotes?: string;
}

export interface BulkDocumentOperation {
  documentIds: string[];
  action: "move" | "tag" | "delete" | "archive";
  params?: Record<string, unknown>;
}
