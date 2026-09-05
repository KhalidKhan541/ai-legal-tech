import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentVersion,
  DocumentComment,
  DocumentFilter,
  DocumentStats,
} from "@/types";

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  comments: DocumentComment[];
  filter: DocumentFilter;
  stats: DocumentStats | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  uploadProgress: Record<string, number>;

  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (doc: Document | null) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  addVersion: (docId: string, version: DocumentVersion) => void;
  setComments: (comments: DocumentComment[]) => void;
  addComment: (comment: DocumentComment) => void;
  updateComment: (commentId: string, updates: Partial<DocumentComment>) => void;
  removeComment: (commentId: string) => void;
  setFilter: (filter: Partial<DocumentFilter>) => void;
  resetFilter: () => void;
  setStats: (stats: DocumentStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  setUploadProgress: (docId: string, progress: number) => void;
  removeUploadProgress: (docId: string) => void;
  getFilteredDocuments: () => Document[];
  getDocumentsByType: (type: DocumentType) => Document[];
  getDocumentsByStatus: (status: DocumentStatus) => Document[];
  getDocumentsByMatter: (matterId: string) => Document[];
}

const initialFilter: DocumentFilter = {};

export const useDocumentStore = create<DocumentState>()(
  devtools(
    immer((set, get) => ({
      documents: [],
      currentDocument: null,
      comments: [],
      filter: initialFilter,
      stats: null,
      isLoading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 0,
      uploadProgress: {},

      setDocuments: (documents) =>
        set((state) => {
          state.documents = documents;
        }),

      setCurrentDocument: (doc) =>
        set((state) => {
          state.currentDocument = doc;
        }),

      addDocument: (doc) =>
        set((state) => {
          state.documents.unshift(doc);
          state.total++;
        }),

      updateDocument: (id, updates) =>
        set((state) => {
          const idx = state.documents.findIndex((d) => d.id === id);
          if (idx !== -1) {
            Object.assign(state.documents[idx], updates);
          }
          if (state.currentDocument?.id === id) {
            Object.assign(state.currentDocument, updates);
          }
        }),

      removeDocument: (id) =>
        set((state) => {
          state.documents = state.documents.filter((d) => d.id !== id);
          state.total--;
          if (state.currentDocument?.id === id) {
            state.currentDocument = null;
          }
        }),

      addVersion: (docId, version) =>
        set((state) => {
          const doc = state.documents.find((d) => d.id === docId);
          if (doc) {
            doc.versions.push(version);
            doc.currentVersion = version.version;
            doc.latestVersion = version;
          }
          if (state.currentDocument?.id === docId) {
            state.currentDocument.versions.push(version);
            state.currentDocument.currentVersion = version.version;
            state.currentDocument.latestVersion = version;
          }
        }),

      setComments: (comments) =>
        set((state) => {
          state.comments = comments;
        }),

      addComment: (comment) =>
        set((state) => {
          state.comments.unshift(comment);
        }),

      updateComment: (commentId, updates) =>
        set((state) => {
          const idx = state.comments.findIndex((c) => c.id === commentId);
          if (idx !== -1) {
            Object.assign(state.comments[idx], updates);
          }
        }),

      removeComment: (commentId) =>
        set((state) => {
          state.comments = state.comments.filter((c) => c.id !== commentId);
        }),

      setFilter: (filter) =>
        set((state) => {
          state.filter = { ...state.filter, ...filter };
          state.page = 1;
        }),

      resetFilter: () =>
        set((state) => {
          state.filter = initialFilter;
          state.page = 1;
        }),

      setStats: (stats) =>
        set((state) => {
          state.stats = stats;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      setPage: (page) =>
        set((state) => {
          state.page = page;
        }),

      setTotal: (total) =>
        set((state) => {
          state.total = total;
        }),

      setUploadProgress: (docId, progress) =>
        set((state) => {
          state.uploadProgress[docId] = progress;
        }),

      removeUploadProgress: (docId) =>
        set((state) => {
          delete state.uploadProgress[docId];
        }),

      getFilteredDocuments: () => {
        const { documents, filter } = get();
        let filtered = [...documents];

        if (filter.type && filter.type.length > 0) {
          filtered = filtered.filter((d) => filter.type!.includes(d.type));
        }

        if (filter.status && filter.status.length > 0) {
          filtered = filtered.filter((d) => filter.status!.includes(d.status));
        }

        if (filter.accessLevel && filter.accessLevel.length > 0) {
          filtered = filtered.filter((d) => filter.accessLevel!.includes(d.accessLevel));
        }

        if (filter.matterId) {
          filtered = filtered.filter((d) => d.matterId === filter.matterId);
        }

        if (filter.uploadedBy) {
          filtered = filtered.filter((d) => d.uploadedBy === filter.uploadedBy);
        }

        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter((d) =>
            filter.tags!.some((tag) => d.tags.includes(tag))
          );
        }

        if (filter.search) {
          const q = filter.search.toLowerCase();
          filtered = filtered.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              (d.description?.toLowerCase().includes(q) ?? false)
          );
        }

        return filtered;
      },

      getDocumentsByType: (type) => get().documents.filter((d) => d.type === type),

      getDocumentsByStatus: (status) => get().documents.filter((d) => d.status === status),

      getDocumentsByMatter: (matterId) =>
        get().documents.filter((d) => d.matterId === matterId),
    })),
    { name: "DocumentStore" }
  )
);
