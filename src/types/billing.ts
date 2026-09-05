export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void" | "partial";

export type PaymentMethod = "credit_card" | "bank_transfer" | "check" | "cash" | "other";

export type TimeEntryStatus = "pending" | "approved" | "rejected" | "billed";

export type BillingRateType = "hourly" | "flat" | "contingency" | "retainer";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  matterId: string;
  matterTitle: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  notes?: string;
  paymentInstructions?: string;
  paymentMethod?: PaymentMethod;
  stripeInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  type: "time" | "expense" | "flat_fee" | "other";
  date: Date;
  quantity: number;
  rate: number;
  amount: number;
  timeEntryId?: string;
  taxRate?: number;
  tax?: number;
}

export interface TimeEntry {
  id: string;
  matterId: string;
  matterTitle: string;
  clientId: string;
  clientName: string;
  userId: string;
  userName: string;
  description: string;
  date: Date;
  hours: number;
  rate: number;
  amount: number;
  status: TimeEntryStatus;
  isBillable: boolean;
  isInvoiced: boolean;
  invoiceId?: string;
  activityCode?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  stripePaymentId?: string;
  processedAt: Date;
  notes?: string;
  createdAt: Date;
}

export interface BillingRate {
  id: string;
  userId: string;
  userName: string;
  type: BillingRateType;
  amount: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  matterId?: string;
  clientId?: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  matterId: string;
  matterTitle: string;
  clientId: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  category: ExpenseCategory;
  receiptUrl?: string;
  isBillable: boolean;
  isInvoiced: boolean;
  invoiceId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export type ExpenseCategory =
  | "filing_fee"
  | "court_cost"
  | "travel"
  | "meals"
  | "copying"
  | "postage"
  | "expert_witness"
  | "deposition"
  | "research"
  | "technology"
  | "other";

export interface BillingStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoicesByStatus: Record<InvoiceStatus, number>;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueYTD: number;
  averageInvoiceAmount: number;
  averageDaysToPay: number;
  unbilledTime: number;
  unbilledExpenses: number;
}

export interface BillingFilter {
  status?: InvoiceStatus[];
  clientId?: string;
  matterId?: string;
  dateRange?: { start: Date; end: Date };
  amountRange?: { min: number; max: number };
  search?: string;
}

export interface TimeEntryFilter {
  matterId?: string;
  clientId?: string;
  userId?: string;
  status?: TimeEntryStatus[];
  isBillable?: boolean;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface CreateInvoiceInput {
  clientId: string;
  matterId: string;
  lineItems: Array<{
    description: string;
    type: "time" | "expense" | "flat_fee" | "other";
    date: Date;
    quantity: number;
    rate: number;
    timeEntryId?: string;
  }>;
  notes?: string;
  paymentInstructions?: string;
  taxRate?: number;
  discount?: number;
}

export interface CreateTimeEntryInput {
  matterId: string;
  description: string;
  date: Date;
  hours: number;
  rate?: number;
  isBillable?: boolean;
  activityCode?: string;
  tags?: string[];
}

export interface UpdateTimeEntryInput {
  description?: string;
  date?: Date;
  hours?: number;
  rate?: number;
  isBillable?: boolean;
  status?: TimeEntryStatus;
  activityCode?: string;
  tags?: string[];
}
