import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  Client,
  ClientType,
  ClientStatus,
  ClientFilter,
  ClientStats,
  ClientCommunication,
  CreateClientInput,
  UpdateClientInput,
} from "@/types";

interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  communications: ClientCommunication[];
  filter: ClientFilter;
  stats: ClientStats | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;

  setClients: (clients: Client[]) => void;
  setCurrentClient: (client: Client | null) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, input: UpdateClientInput) => void;
  removeClient: (id: string) => void;
  setCommunications: (comms: ClientCommunication[]) => void;
  addCommunication: (comm: ClientCommunication) => void;
  setFilter: (filter: Partial<ClientFilter>) => void;
  resetFilter: () => void;
  setStats: (stats: ClientStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  getFilteredClients: () => Client[];
  getClientsByType: (type: ClientType) => Client[];
  getClientsByStatus: (status: ClientStatus) => Client[];
  getActiveClients: () => Client[];
  searchClients: (query: string) => Client[];
}

const initialFilter: ClientFilter = {};

export const useClientStore = create<ClientState>()(
  devtools(
    immer((set, get) => ({
      clients: [],
      currentClient: null,
      communications: [],
      filter: initialFilter,
      stats: null,
      isLoading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 0,

      setClients: (clients) =>
        set((state) => {
          state.clients = clients;
        }),

      setCurrentClient: (client) =>
        set((state) => {
          state.currentClient = client;
        }),

      addClient: (client) =>
        set((state) => {
          state.clients.unshift(client);
          state.total++;
        }),

      updateClient: (id, input) =>
        set((state) => {
          const idx = state.clients.findIndex((c) => c.id === id);
          if (idx !== -1) {
            Object.assign(state.clients[idx], input);
          }
          if (state.currentClient?.id === id) {
            Object.assign(state.currentClient, input);
          }
        }),

      removeClient: (id) =>
        set((state) => {
          state.clients = state.clients.filter((c) => c.id !== id);
          state.total--;
          if (state.currentClient?.id === id) {
            state.currentClient = null;
          }
        }),

      setCommunications: (comms) =>
        set((state) => {
          state.communications = comms;
        }),

      addCommunication: (comm) =>
        set((state) => {
          state.communications.unshift(comm);
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

      getFilteredClients: () => {
        const { clients, filter } = get();
        let filtered = [...clients];

        if (filter.type && filter.type.length > 0) {
          filtered = filtered.filter((c) => filter.type!.includes(c.type));
        }

        if (filter.status && filter.status.length > 0) {
          filtered = filtered.filter((c) => filter.status!.includes(c.status));
        }

        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter((c) =>
            filter.tags!.some((tag) => c.tags.includes(tag))
          );
        }

        if (filter.hasActiveMatters !== undefined) {
          filtered = filtered.filter((c) =>
            filter.hasActiveMatters
              ? c.matters.some((m) => m.status !== "closed" && m.status !== "archived")
              : c.matters.length === 0
          );
        }

        if (filter.search) {
          const q = filter.search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.email.toLowerCase().includes(q) ||
              (c.company?.toLowerCase().includes(q) ?? false)
          );
        }

        return filtered;
      },

      getClientsByType: (type) => get().clients.filter((c) => c.type === type),

      getClientsByStatus: (status) => get().clients.filter((c) => c.status === status),

      getActiveClients: () => get().clients.filter((c) => c.status === "active"),

      searchClients: (query) => {
        const q = query.toLowerCase();
        return get().clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company?.toLowerCase().includes(q) ?? false)
        );
      },
    })),
    { name: "ClientStore" }
  )
);
