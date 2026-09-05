import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type Theme = "light" | "dark" | "system";
export type ViewMode = "list" | "grid" | "table" | "kanban";
export type SortOrder = "asc" | "desc";

interface UIState {
  theme: Theme;
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  modalStack: string[];
  activeModal: string | null;
  toasts: Toast[];
  breadcrumbs: Breadcrumb[];
  selectedItems: Record<string, string[]>;
  isFullscreen: boolean;
  isPrinting: boolean;
  tableSort: Record<string, { field: string; order: SortOrder }>;
  recentSearches: string[];
  commandPaletteOpen: boolean;

  setTheme: (theme: Theme) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId?: string) => void;
  addToast: (toast: Omit<Toast, "id" | "createdAt">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
  addBreadcrumb: (crumb: Breadcrumb) => void;
  setSelectedItems: (key: string, ids: string[]) => void;
  clearSelectedItems: (key: string) => void;
  clearAllSelectedItems: () => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setPrinting: (isPrinting: boolean) => void;
  setTableSort: (tableId: string, field: string, order: SortOrder) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

interface Breadcrumb {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set) => ({
        theme: "system" as Theme,
        viewMode: "list" as ViewMode,
        sidebarCollapsed: false,
        sidebarWidth: 260,
        modalStack: [] as string[],
        activeModal: null as string | null,
        toasts: [] as Toast[],
        breadcrumbs: [] as Breadcrumb[],
        selectedItems: {} as Record<string, string[]>,
        isFullscreen: false,
        isPrinting: false,
        tableSort: {} as Record<string, { field: string; order: SortOrder }>,
        recentSearches: [] as string[],
        commandPaletteOpen: false,

        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
            if (typeof document !== "undefined") {
              const root = document.documentElement;
              root.classList.remove("light", "dark");

              if (theme === "system") {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                root.classList.add(prefersDark ? "dark" : "light");
              } else {
                root.classList.add(theme);
              }
            }
          }),

        setViewMode: (mode) =>
          set((state) => {
            state.viewMode = mode;
          }),

        toggleSidebarCollapsed: () =>
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          }),

        setSidebarCollapsed: (collapsed) =>
          set((state) => {
            state.sidebarCollapsed = collapsed;
          }),

        setSidebarWidth: (width) =>
          set((state) => {
            state.sidebarWidth = width;
          }),

        openModal: (modalId) =>
          set((state) => {
            if (!state.modalStack.includes(modalId)) {
              state.modalStack.push(modalId);
            }
            state.activeModal = modalId;
          }),

        closeModal: (modalId) =>
          set((state) => {
            if (modalId) {
              state.modalStack = state.modalStack.filter((id) => id !== modalId);
              state.activeModal = state.modalStack[state.modalStack.length - 1] ?? null;
            } else {
              state.modalStack = [];
              state.activeModal = null;
            }
          }),

        addToast: (toast) =>
          set((state) => {
            const newToast: Toast = {
              ...toast,
              id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              createdAt: Date.now(),
            };
            state.toasts.push(newToast);

            if (toast.duration !== 0) {
              setTimeout(() => {
                set((s) => {
                  s.toasts = s.toasts.filter((t) => t.id !== newToast.id);
                });
              }, toast.duration ?? 5000);
            }
          }),

        removeToast: (id) =>
          set((state) => {
            state.toasts = state.toasts.filter((t) => t.id !== id);
          }),

        clearToasts: () =>
          set((state) => {
            state.toasts = [];
          }),

        setBreadcrumbs: (crumbs) =>
          set((state) => {
            state.breadcrumbs = crumbs;
          }),

        addBreadcrumb: (crumb) =>
          set((state) => {
            state.breadcrumbs.push(crumb);
          }),

        setSelectedItems: (key, ids) =>
          set((state) => {
            state.selectedItems[key] = ids;
          }),

        clearSelectedItems: (key) =>
          set((state) => {
            delete state.selectedItems[key];
          }),

        clearAllSelectedItems: () =>
          set((state) => {
            state.selectedItems = {};
          }),

        setFullscreen: (isFullscreen) =>
          set((state) => {
            state.isFullscreen = isFullscreen;
          }),

        setPrinting: (isPrinting) =>
          set((state) => {
            state.isPrinting = isPrinting;
          }),

        setTableSort: (tableId, field, order) =>
          set((state) => {
            state.tableSort[tableId] = { field, order };
          }),

        addRecentSearch: (search) =>
          set((state) => {
            const filtered = state.recentSearches.filter((s) => s !== search);
            state.recentSearches = [search, ...filtered].slice(0, 10);
          }),

        clearRecentSearches: () =>
          set((state) => {
            state.recentSearches = [];
          }),

        setCommandPaletteOpen: (open) =>
          set((state) => {
            state.commandPaletteOpen = open;
          }),
      })),
      {
        name: "ui-store",
        partialize: (state) => ({
          theme: state.theme,
          viewMode: state.viewMode,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarWidth: state.sidebarWidth,
          recentSearches: state.recentSearches,
        }),
      }
    ),
    { name: "UIStore" }
  )
);
