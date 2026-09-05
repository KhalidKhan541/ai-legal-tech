import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  Matter,
  MatterStatus,
  MatterPriority,
  MatterType,
  MatterFilter,
  MatterSort,
  MatterStats,
  MatterNote,
  TimelineEvent,
  CreateMatterInput,
  UpdateMatterInput,
} from "@/types";

interface MatterState {
  matters: Matter[];
  currentMatter: Matter | null;
  notes: MatterNote[];
  timeline: TimelineEvent[];
  filter: MatterFilter;
  sort: MatterSort;
  stats: MatterStats | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;

  setMatters: (matters: Matter[]) => void;
  setCurrentMatter: (matter: Matter | null) => void;
  addMatter: (matter: Matter) => void;
  updateMatter: (id: string, input: UpdateMatterInput) => void;
  removeMatter: (id: string) => void;
  setNotes: (notes: MatterNote[]) => void;
  addNote: (note: MatterNote) => void;
  updateNote: (noteId: string, updates: Partial<MatterNote>) => void;
  removeNote: (noteId: string) => void;
  setTimeline: (events: TimelineEvent[]) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  setFilter: (filter: Partial<MatterFilter>) => void;
  resetFilter: () => void;
  setSort: (sort: MatterSort) => void;
  setStats: (stats: MatterStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  getFilteredMatters: () => Matter[];
  getMattersByStatus: (status: MatterStatus) => Matter[];
  getMattersByPriority: (priority: MatterPriority) => Matter[];
  getMattersByType: (type: MatterType) => Matter[];
}

const initialFilter: MatterFilter = {};

const initialSort: MatterSort = {
  field: "updatedAt",
  order: "desc",
};

export const useMatterStore = create<MatterState>()(
  devtools(
    immer((set, get) => ({
      matters: [],
      currentMatter: null,
      notes: [],
      timeline: [],
      filter: initialFilter,
      sort: initialSort,
      stats: null,
      isLoading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 0,

      setMatters: (matters) =>
        set((state) => {
          state.matters = matters;
        }),

      setCurrentMatter: (matter) =>
        set((state) => {
          state.currentMatter = matter;
        }),

      addMatter: (matter) =>
        set((state) => {
          state.matters.unshift(matter);
          state.total++;
        }),

      updateMatter: (id, input) =>
        set((state) => {
          const idx = state.matters.findIndex((m) => m.id === id);
          if (idx !== -1) {
            Object.assign(state.matters[idx], input);
          }
          if (state.currentMatter?.id === id) {
            Object.assign(state.currentMatter, input);
          }
        }),

      removeMatter: (id) =>
        set((state) => {
          state.matters = state.matters.filter((m) => m.id !== id);
          state.total--;
          if (state.currentMatter?.id === id) {
            state.currentMatter = null;
          }
        }),

      setNotes: (notes) =>
        set((state) => {
          state.notes = notes;
        }),

      addNote: (note) =>
        set((state) => {
          state.notes.unshift(note);
        }),

      updateNote: (noteId, updates) =>
        set((state) => {
          const idx = state.notes.findIndex((n) => n.id === noteId);
          if (idx !== -1) {
            Object.assign(state.notes[idx], updates);
          }
        }),

      removeNote: (noteId) =>
        set((state) => {
          state.notes = state.notes.filter((n) => n.id !== noteId);
        }),

      setTimeline: (events) =>
        set((state) => {
          state.timeline = events;
        }),

      addTimelineEvent: (event) =>
        set((state) => {
          state.timeline.unshift(event);
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

      setSort: (sort) =>
        set((state) => {
          state.sort = sort;
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

      getFilteredMatters: () => {
        const { matters, filter } = get();
        let filtered = [...matters];

        if (filter.status && filter.status.length > 0) {
          filtered = filtered.filter((m) => filter.status!.includes(m.status));
        }

        if (filter.priority && filter.priority.length > 0) {
          filtered = filtered.filter((m) => filter.priority!.includes(m.priority));
        }

        if (filter.type && filter.type.length > 0) {
          filtered = filtered.filter((m) => filter.type!.includes(m.type));
        }

        if (filter.clientId) {
          filtered = filtered.filter((m) => m.clientId === filter.clientId);
        }

        if (filter.assignedTo) {
          filtered = filtered.filter((m) =>
            m.assignments.some((a) => a.userId === filter.assignedTo && a.isActive)
          );
        }

        if (filter.practiceArea) {
          filtered = filtered.filter((m) => m.practiceArea === filter.practiceArea);
        }

        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter((m) =>
            filter.tags!.some((tag) => m.tags.includes(tag))
          );
        }

        if (filter.search) {
          const q = filter.search.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.title.toLowerCase().includes(q) ||
              m.matterNumber.toLowerCase().includes(q) ||
              m.clientName.toLowerCase().includes(q) ||
              m.description.toLowerCase().includes(q)
          );
        }

        return filtered;
      },

      getMattersByStatus: (status) => {
        return get().matters.filter((m) => m.status === status);
      },

      getMattersByPriority: (priority) => {
        return get().matters.filter((m) => m.priority === priority);
      },

      getMattersByType: (type) => {
        return get().matters.filter((m) => m.type === type);
      },
    })),
    { name: "MatterStore" }
  )
);
