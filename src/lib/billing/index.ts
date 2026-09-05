// ─── Billing & Time Tracking Module ─────────────────────────────────────────
// Barrel exports for the complete billing and time tracking system

// ─── Time Entry Management ──────────────────────────────────────────────────
export {
  TimeEntryService,
  TimeEntrySchema,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
  TimeEntryFilterSchema,
  ActiveTimerSchema,
  BulkTimeEntrySchema,
  TimeEntryStatus,
  TimeEntryType,
  ActivityCode,
  TimerStatus,
} from "./time-entry-service";

export type {
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  TimeEntryFilter,
  ActiveTimer,
  BulkTimeEntryInput,
  TimeEntryReport,
  TimeEntryStats,
} from "./time-entry-service";

// ─── Invoice Management ─────────────────────────────────────────────────────
export {
  InvoiceService,
  InvoiceSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceFilterSchema,
  InvoiceTemplateSchema,
  InvoiceStatus,
  InvoiceType,
  PaymentTerms,
  RecurrenceFrequency,
} from "./invoice-service";

export type {
  Invoice,
  InvoiceLineItem,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilter,
  InvoiceTemplate,
  InvoiceStats,
  AgingReport,
} from "./invoice-service";

// ─── Payment Processing ─────────────────────────────────────────────────────
export {
  PaymentService,
  PaymentSchema,
  CreatePaymentSchema,
  PaymentPlanSchema,
  CreatePaymentPlanSchema,
  TrustAccountSchema,
  TrustTransactionSchema,
  PaymentReminderSchema,
  PaymentStatus,
  PaymentMethod,
  PaymentPlanStatus,
  TrustAccountType,
  TrustTransactionType,
} from "./payment-service";

export type {
  Payment,
  CreatePaymentInput,
  PaymentPlan,
  CreatePaymentPlanInput,
  TrustAccount,
  TrustTransaction,
  PaymentReminder,
  PaymentStats,
  LateFeeConfig,
} from "./payment-service";

// ─── Expense Tracking ───────────────────────────────────────────────────────
export {
  ExpenseService,
  ExpenseSchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseFilterSchema,
  ExpenseStatus,
  ExpenseCategory,
  ReceiptStatus,
} from "./expenses";

export type {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilter,
  ExpenseReport,
  ExpenseStats,
} from "./expenses";

// ─── Timekeeper / Rate Management ───────────────────────────────────────────
export {
  TimekeeperService,
  TimekeeperSchema,
  CreateTimekeeperSchema,
  UpdateTimekeeperSchema,
  CreateRateSchema,
  RateScheduleSchema,
  TimekeeperRateSchema,
  TimekeeperStatus,
  TimekeeperRole,
  RateType,
  RateChangeReason,
} from "./leitner-time";

export type {
  Timekeeper,
  TimekeeperRate,
  CreateTimekeeperInput,
  UpdateTimekeeperInput,
  CreateRateInput,
  RateSchedule,
  TimekeeperFilter,
  TimekeeperStats,
  RateIncreaseRequest,
} from "./leitner-time";

// ─── Budget Management ──────────────────────────────────────────────────────
export {
  BudgetService,
  BudgetSchema,
  CreateBudgetSchema,
  UpdateBudgetSchema,
  BudgetFilterSchema,
  WriteOffSchema,
  CreateWriteOffSchema,
  BudgetType,
  BudgetStatus,
  AlertType,
  WriteOffReason,
} from "./budget-service";

export type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetFilter,
  WriteOff,
  CreateWriteOffInput,
  BudgetAlert,
  BudgetTracking,
  ProfitabilityAnalysis,
  WriteOffReport,
} from "./budget-service";

// ─── Trust Account Management ───────────────────────────────────────────────
export {
  TrustAccountService,
  TrustAccountSchema as TrustAccountManagementSchema,
  TrustTransactionSchema as TrustTransactionManagementSchema,
  ReconciliationSchema,
  CreateTrustAccountSchema,
  TrustTransactionFilterSchema,
  TrustAccountStatus,
  TrustTransactionCategory,
  ReconciliationStatus,
} from "./trust-account";

export type {
  TrustAccount as TrustAccountManagement,
  TrustTransaction as TrustTransactionManagement,
  Reconciliation,
  CreateTrustAccountInput,
  TrustTransactionFilter,
  TrustAccountReport,
  IOLTAComplianceReport,
} from "./trust-account";

// ─── Common Types ───────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BillingConfig {
  currency: string;
  taxRate: number;
  defaultPaymentTerms: string;
  lateFeePercent: number;
  lateFeeMax: number;
  gracePeriodDays: number;
  autoSubmitTime: boolean;
  timeRoundingMinutes: number;
  requireNarrative: boolean;
  requireReceipt: boolean;
  trustAccountEnabled: boolean;
  ioltaComplianceEnabled: boolean;
  recurringInvoiceEnabled: boolean;
}

export const DEFAULT_BILLING_CONFIG: BillingConfig = {
  currency: "USD",
  taxRate: 0,
  defaultPaymentTerms: "net_30",
  lateFeePercent: 1.5,
  lateFeeMax: 500,
  gracePeriodDays: 10,
  autoSubmitTime: false,
  timeRoundingMinutes: 6,
  requireNarrative: true,
  requireReceipt: true,
  trustAccountEnabled: true,
  ioltaComplianceEnabled: true,
  recurringInvoiceEnabled: true,
};
