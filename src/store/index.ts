import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "attorney" | "paralegal" | "assistant"
  avatar?: string
  firm?: string
  barNumber?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  read: boolean
  createdAt: string
  link?: string
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  sidebarOpen: boolean
  notifications: Notification[]
  searchQuery: string
  setUser: (user: User | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    user: null,
    isAuthenticated: false,
    sidebarOpen: true,
    notifications: [],
    searchQuery: "",

    setUser: (user) =>
      set((state) => {
        state.user = user
        state.isAuthenticated = user !== null
      }),

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen
      }),

    setSidebarOpen: (open) =>
      set((state) => {
        state.sidebarOpen = open
      }),

    addNotification: (notification) =>
      set((state) => {
        state.notifications.unshift({
          ...notification,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        })
      }),

    markNotificationRead: (id) =>
      set((state) => {
        const n = state.notifications.find((n) => n.id === id)
        if (n) n.read = true
      }),

    markAllNotificationsRead: () =>
      set((state) => {
        state.notifications.forEach((n) => {
          n.read = true
        })
      }),

    clearNotifications: () =>
      set((state) => {
        state.notifications = []
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),
  }))
)

export interface Matter {
  id: string
  matterNumber: string
  title: string
  description: string
  status: "intake" | "investigation" | "discovery" | "trial" | "appeal" | "closed" | "archived"
  priority: "low" | "medium" | "high" | "urgent"
  type: "litigation" | "transaction" | "advisory" | "pro_bono" | "corporate" | "real_estate" | "family" | "criminal" | "immigration" | "ip" | "other"
  clientId: string
  clientName: string
  opposingParty?: string
  opposingCounsel?: string
  courtName?: string
  courtCaseNumber?: string
  judgeName?: string
  jurisdiction?: string
  practiceArea?: string
  openDate: string
  closeDate?: string
  statuteOfLimitations?: string
  isConfidential: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  type: "individual" | "corporate" | "government" | "nonprofit"
  address?: string
  notes?: string
  matters: string[]
  totalBilled: number
  outstandingBalance: number
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  name: string
  type: string
  category: string
  size: number
  mimeType: string
  matterId?: string
  clientId?: string
  uploadedBy: string
  uploadedAt: string
  tags: string[]
  version: number
  status: "draft" | "review" | "final" | "archived"
}

export interface Contract {
  id: string
  title: string
  type: string
  status: "draft" | "under_review" | "pending_signature" | "active" | "expired" | "terminated"
  clientId: string
  clientName: string
  effectiveDate: string
  expirationDate?: string
  value?: number
  clauses: ContractClause[]
  riskScore: number
  aiSummary?: string
  createdAt: string
  updatedAt: string
}

export interface ContractClause {
  id: string
  section: string
  title: string
  content: string
  riskLevel: "low" | "medium" | "high" | "critical"
  aiAnalysis?: string
  suggestedChanges?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  assigneeId?: string
  assigneeName?: string
  matterId?: string
  matterTitle?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  matterId?: string
  matterTitle?: string
  status: "draft" | "sent" | "paid" | "overdue" | "void"
  amount: number
  tax: number
  total: number
  issuedDate: string
  dueDate: string
  paidDate?: string
  lineItems: InvoiceLineItem[]
}

export interface InvoiceLineItem {
  id: string
  description: string
  hours?: number
  rate?: number
  amount: number
  date: string
}

export interface TimeEntry {
  id: string
  description: string
  matterId: string
  matterTitle: string
  date: string
  hours: number
  rate: number
  billed: boolean
  invoiceId?: string
  category: "meeting" | "research" | "drafting" | "court" | "travel" | "admin" | "other"
}

interface DashboardState {
  matters: Matter[]
  clients: Client[]
  documents: Document[]
  contracts: Contract[]
  tasks: Task[]
  invoices: Invoice[]
  timeEntries: TimeEntry[]
  setMatters: (matters: Matter[]) => void
  setClients: (clients: Client[]) => void
  setDocuments: (documents: Document[]) => void
  setContracts: (contracts: Contract[]) => void
  setTasks: (tasks: Task[]) => void
  setInvoices: (invoices: Invoice[]) => void
  setTimeEntries: (entries: TimeEntry[]) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  moveTask: (id: string, newStatus: Task["status"]) => void
}

export const useDashboardStore = create<DashboardState>()(
  immer((set) => ({
    matters: [],
    clients: [],
    documents: [],
    contracts: [],
    tasks: [],
    invoices: [],
    timeEntries: [],

    setMatters: (matters) =>
      set((state) => {
        state.matters = matters
      }),
    setClients: (clients) =>
      set((state) => {
        state.clients = clients
      }),
    setDocuments: (documents) =>
      set((state) => {
        state.documents = documents
      }),
    setContracts: (contracts) =>
      set((state) => {
        state.contracts = contracts
      }),
    setTasks: (tasks) =>
      set((state) => {
        state.tasks = tasks
      }),
    setInvoices: (invoices) =>
      set((state) => {
        state.invoices = invoices
      }),
    setTimeEntries: (entries) =>
      set((state) => {
        state.timeEntries = entries
      }),
    updateTask: (id, updates) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === id)
        if (task) {
          Object.assign(task, updates)
          task.updatedAt = new Date().toISOString()
        }
      }),
    moveTask: (id, newStatus) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === id)
        if (task) {
          task.status = newStatus
          task.updatedAt = new Date().toISOString()
        }
      }),
  }))
)
