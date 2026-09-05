import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  firmId?: string;
  firmName?: string;
  avatar?: string;
}

interface Notification {
  id: string;
  type: "deadline" | "task" | "invoice" | "document" | "comment" | "system" | "mention";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  notifications: Notification[];
  unreadCount: number;
  sidebarOpen: boolean;
  searchQuery: string;
  searchOpen: boolean;
  commandPaletteOpen: boolean;
  isOnline: boolean;
  lastSyncAt: string | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setOnline: (online: boolean) => void;
  setLastSyncAt: (at: string) => void;
  logout: () => void;
}

const initialState = {
  user: null,
  token: null,
  notifications: [] as Notification[],
  unreadCount: 0,
  sidebarOpen: true,
  searchQuery: "",
  searchOpen: false,
  commandPaletteOpen: false,
  isOnline: true,
  lastSyncAt: null as string | null,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setUser: (user) =>
          set((state) => {
            state.user = user;
          }),

        setToken: (token) =>
          set((state) => {
            state.token = token;
          }),

        addNotification: (notification) =>
          set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              read: false,
              createdAt: new Date().toISOString(),
            };
            state.notifications.unshift(newNotification);
            state.unreadCount++;
          }),

        markNotificationRead: (id) =>
          set((state) => {
            const notif = state.notifications.find((n) => n.id === id);
            if (notif && !notif.read) {
              notif.read = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          }),

        markAllNotificationsRead: () =>
          set((state) => {
            for (const notif of state.notifications) {
              notif.read = true;
            }
            state.unreadCount = 0;
          }),

        clearNotifications: () =>
          set((state) => {
            state.notifications = [];
            state.unreadCount = 0;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        setSidebarOpen: (open) =>
          set((state) => {
            state.sidebarOpen = open;
          }),

        setSearchQuery: (query) =>
          set((state) => {
            state.searchQuery = query;
          }),

        setSearchOpen: (open) =>
          set((state) => {
            state.searchOpen = open;
          }),

        setCommandPaletteOpen: (open) =>
          set((state) => {
            state.commandPaletteOpen = open;
          }),

        setOnline: (online) =>
          set((state) => {
            state.isOnline = online;
          }),

        setLastSyncAt: (at) =>
          set((state) => {
            state.lastSyncAt = at;
          }),

        logout: () =>
          set((state) => {
            state.user = null;
            state.token = null;
            state.notifications = [];
            state.unreadCount = 0;
            state.lastSyncAt = null;
          }),
      })),
      {
        name: "app-store",
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    { name: "AppStore" }
  )
);
