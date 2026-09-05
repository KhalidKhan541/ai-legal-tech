import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  Invoice,
  InvoiceStatus,
  TimeEntry,
  TimeEntryStatus,
  Payment,
  Expense,
  BillingStats,
  BillingFilter,
  TimeEntryFilter,
} from "@/types";

interface BillingState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  timeEntries: TimeEntry[];
  payments: Payment[];
  expenses: Expense[];
  invoiceFilter: BillingFilter;
  timeEntryFilter: TimeEntryFilter;
  stats: BillingStats | null;
  isLoading: boolean;
  error: string | null;
  invoicePage: number;
  invoiceLimit: number;
  invoiceTotal: number;
  timeEntryPage: number;
  timeEntryLimit: number;
  timeEntryTotal: number;

  setInvoices: (invoices: Invoice[]) => void;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  removeTimeEntry: (id: string) => void;
  approveTimeEntry: (id: string) => void;
  rejectTimeEntry: (id: string) => void;
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  setInvoiceFilter: (filter: Partial<BillingFilter>) => void;
  resetInvoiceFilter: () => void;
  setTimeEntryFilter: (filter: Partial<TimeEntryFilter>) => void;
  resetTimeEntryFilter: () => void;
  setStats: (stats: BillingStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInvoicePage: (page: number) => void;
  setInvoiceTotal: (total: number) => void;
  setTimeEntryPage: (page: number) => void;
  setTimeEntryTotal: (total: number) => void;
  getFilteredInvoices: () => Invoice[];
  getFilteredTimeEntries: () => TimeEntry[];
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getTimeEntriesByStatus: (status: TimeEntryStatus) => TimeEntry[];
  getTotalOutstanding: () => number;
  getUnbilledTime: () => number;
}

const initialInvoiceFilter: BillingFilter = {};
const initialTimeEntryFilter: TimeEntryFilter = {};

export const useBillingStore = create<BillingState>()(
  devtools(
    immer((set, get) => ({
      invoices: [],
      currentInvoice: null,
      timeEntries: [],
      payments: [],
      expenses: [],
      invoiceFilter: initialInvoiceFilter,
      timeEntryFilter: initialTimeEntryFilter,
      stats: null,
      isLoading: false,
      error: null,
      invoicePage: 1,
      invoiceLimit: 20,
      invoiceTotal: 0,
      timeEntryPage: 1,
      timeEntryLimit: 50,
      timeEntryTotal: 0,

      setInvoices: (invoices) =>
        set((state) => {
          state.invoices = invoices;
        }),

      setCurrentInvoice: (invoice) =>
        set((state) => {
          state.currentInvoice = invoice;
        }),

      addInvoice: (invoice) =>
        set((state) => {
          state.invoices.unshift(invoice);
          state.invoiceTotal++;
        }),

      updateInvoice: (id, updates) =>
        set((state) => {
          const idx = state.invoices.findIndex((i) => i.id === id);
          if (idx !== -1) {
            Object.assign(state.invoices[idx], updates);
          }
          if (state.currentInvoice?.id === id) {
            Object.assign(state.currentInvoice, updates);
          }
        }),

      removeInvoice: (id) =>
        set((state) => {
          state.invoices = state.invoices.filter((i) => i.id !== id);
          state.invoiceTotal--;
          if (state.currentInvoice?.id === id) {
            state.currentInvoice = null;
          }
        }),

      setTimeEntries: (entries) =>
        set((state) => {
          state.timeEntries = entries;
        }),

      addTimeEntry: (entry) =>
        set((state) => {
          state.timeEntries.unshift(entry);
          state.timeEntryTotal++;
        }),

      updateTimeEntry: (id, updates) =>
        set((state) => {
          const idx = state.timeEntries.findIndex((e) => e.id === id);
          if (idx !== -1) {
            Object.assign(state.timeEntries[idx], updates);
          }
        }),

      removeTimeEntry: (id) =>
        set((state) => {
          state.timeEntries = state.timeEntries.filter((e) => e.id !== id);
          state.timeEntryTotal--;
        }),

      approveTimeEntry: (id) =>
        set((state) => {
          const entry = state.timeEntries.find((e) => e.id === id);
          if (entry) {
            entry.status = "approved";
          }
        }),

      rejectTimeEntry: (id) =>
        set((state) => {
          const entry = state.timeEntries.find((e) => e.id === id);
          if (entry) {
            entry.status = "rejected";
          }
        }),

      setPayments: (payments) =>
        set((state) => {
          state.payments = payments;
        }),

      addPayment: (payment) =>
        set((state) => {
          state.payments.unshift(payment);
          // Update related invoice
          const invoice = state.invoices.find((i) => i.id === payment.invoiceId);
          if (invoice) {
            invoice.amountPaid += payment.amount;
            invoice.balanceDue = invoice.total - invoice.amountPaid;
            if (invoice.balanceDue <= 0) {
              invoice.status = "paid";
              invoice.paidDate = new Date(payment.processedAt);
            }
          }
        }),

      setExpenses: (expenses) =>
        set((state) => {
          state.expenses = expenses;
        }),

      addExpense: (expense) =>
        set((state) => {
          state.expenses.unshift(expense);
        }),

      updateExpense: (id, updates) =>
        set((state) => {
          const idx = state.expenses.findIndex((e) => e.id === id);
          if (idx !== -1) {
            Object.assign(state.expenses[idx], updates);
          }
        }),

      setInvoiceFilter: (filter) =>
        set((state) => {
          state.invoiceFilter = { ...state.invoiceFilter, ...filter };
          state.invoicePage = 1;
        }),

      resetInvoiceFilter: () =>
        set((state) => {
          state.invoiceFilter = initialInvoiceFilter;
          state.invoicePage = 1;
        }),

      setTimeEntryFilter: (filter) =>
        set((state) => {
          state.timeEntryFilter = { ...state.timeEntryFilter, ...filter };
          state.timeEntryPage = 1;
        }),

      resetTimeEntryFilter: () =>
        set((state) => {
          state.timeEntryFilter = initialTimeEntryFilter;
          state.timeEntryPage = 1;
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

      setInvoicePage: (page) =>
        set((state) => {
          state.invoicePage = page;
        }),

      setInvoiceTotal: (total) =>
        set((state) => {
          state.invoiceTotal = total;
        }),

      setTimeEntryPage: (page) =>
        set((state) => {
          state.timeEntryPage = page;
        }),

      setTimeEntryTotal: (total) =>
        set((state) => {
          state.timeEntryTotal = total;
        }),

      getFilteredInvoices: () => {
        const { invoices, invoiceFilter } = get();
        let filtered = [...invoices];

        if (invoiceFilter.status && invoiceFilter.status.length > 0) {
          filtered = filtered.filter((i) => invoiceFilter.status!.includes(i.status));
        }

        if (invoiceFilter.clientId) {
          filtered = filtered.filter((i) => i.clientId === invoiceFilter.clientId);
        }

        if (invoiceFilter.matterId) {
          filtered = filtered.filter((i) => i.matterId === invoiceFilter.matterId);
        }

        if (invoiceFilter.dateRange) {
          filtered = filtered.filter((i) => {
            const date = new Date(i.issueDate);
            return date >= invoiceFilter.dateRange!.start && date <= invoiceFilter.dateRange!.end;
          });
        }

        if (invoiceFilter.amountRange) {
          filtered = filtered.filter(
            (i) =>
              i.total >= invoiceFilter.amountRange!.min && i.total <= invoiceFilter.amountRange!.max
          );
        }

        if (invoiceFilter.search) {
          const q = invoiceFilter.search.toLowerCase();
          filtered = filtered.filter(
            (i) =>
              i.invoiceNumber.toLowerCase().includes(q) ||
              i.clientName.toLowerCase().includes(q) ||
              i.matterTitle.toLowerCase().includes(q)
          );
        }

        return filtered;
      },

      getFilteredTimeEntries: () => {
        const { timeEntries, timeEntryFilter } = get();
        let filtered = [...timeEntries];

        if (timeEntryFilter.matterId) {
          filtered = filtered.filter((e) => e.matterId === timeEntryFilter.matterId);
        }

        if (timeEntryFilter.clientId) {
          filtered = filtered.filter((e) => e.clientId === timeEntryFilter.clientId);
        }

        if (timeEntryFilter.userId) {
          filtered = filtered.filter((e) => e.userId === timeEntryFilter.userId);
        }

        if (timeEntryFilter.status && timeEntryFilter.status.length > 0) {
          filtered = filtered.filter((e) => timeEntryFilter.status!.includes(e.status));
        }

        if (timeEntryFilter.isBillable !== undefined) {
          filtered = filtered.filter((e) => e.isBillable === timeEntryFilter.isBillable);
        }

        if (timeEntryFilter.dateRange) {
          filtered = filtered.filter((e) => {
            const date = new Date(e.date);
            return date >= timeEntryFilter.dateRange!.start && date <= timeEntryFilter.dateRange!.end;
          });
        }

        return filtered;
      },

      getInvoicesByStatus: (status) => get().invoices.filter((i) => i.status === status),

      getTimeEntriesByStatus: (status) =>
        get().timeEntries.filter((e) => e.status === status),

      getTotalOutstanding: () =>
        get().invoices
          .filter((i) => i.status !== "paid" && i.status !== "void")
          .reduce((sum, i) => sum + i.balanceDue, 0),

      getUnbilledTime: () =>
        get()
          .timeEntries.filter((e) => e.isBillable && !e.isInvoiced)
          .reduce((sum, e) => sum + e.amount, 0),
    })),
    { name: "BillingStore" }
  )
);
