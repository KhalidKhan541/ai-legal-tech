import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const InvoiceStatus = z.enum([
  "draft",
  "pending_review",
  "approved",
  "sent",
  "viewed",
  "partial_payment",
  "paid",
  "overdue",
  "voided",
  "written_off",
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const InvoiceType = z.enum([
  "standard",
  "recurring",
  "proforma",
  "credit_memo",
  "refund",
  "trust_replenishment",
]);
export type InvoiceType = z.infer<typeof InvoiceType>;

export const PaymentTerms = z.enum([
  "due_on_receipt",
  "net_15",
  "net_30",
  "net_45",
  "net_60",
  "net_90",
  "custom",
]);
export type PaymentTerms = z.infer<typeof PaymentTerms>;

export const RecurrenceFrequency = z.enum([
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "annually",
]);
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequency>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const InvoiceLineItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  timeEntryId: z.string().uuid().optional(),
  expenseId: z.string().uuid().optional(),
  activityCode: z.string().optional(),
  quantity: z.number().min(0).default(1),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  sortOrder: z.number().default(0),
});

export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  matterId: z.string().uuid(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  clientAddress: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string().default("US"),
    })
    .optional(),
  type: InvoiceType,
  status: InvoiceStatus,
  paymentTerms: PaymentTerms,
  customPaymentDays: z.number().optional(),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  sentAt: z.string().datetime().optional(),
  viewedAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  voidedAt: z.string().datetime().optional(),
  lineItems: z.array(InvoiceLineItemSchema).default([]),
  subtotal: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  taxAmount: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  balanceDue: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  footer: z.string().optional(),
  templateId: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  recurringConfig: z
    .object({
      frequency: RecurrenceFrequency,
      nextDate: z.string().datetime(),
      endDate: z.string().datetime().optional(),
      maxOccurrences: z.number().optional(),
      currentOccurrence: z.number().default(0),
      parentInvoiceId: z.string().uuid().optional(),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  sentAt: true,
  viewedAt: true,
  paidAt: true,
  voidedAt: true,
  approvedBy: true,
  approvedAt: true,
  subtotal: true,
  taxAmount: true,
  discountAmount: true,
  totalAmount: true,
  amountPaid: true,
  balanceDue: true,
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

export const UpdateInvoiceSchema = InvoiceSchema.partial().omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

export const InvoiceFilterSchema = z.object({
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  status: z.array(InvoiceStatus).optional(),
  type: z.array(InvoiceType).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  isOverdue: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum([
      "invoiceNumber",
      "issueDate",
      "dueDate",
      "totalAmount",
      "balanceDue",
      "status",
      "createdAt",
    ])
    .default("issueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type InvoiceFilter = z.infer<typeof InvoiceFilterSchema>;

export const InvoiceTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  showTimeEntries: z.boolean().default(true),
  showExpenses: z.boolean().default(true),
  showTotals: z.boolean().default(true),
  showTax: z.boolean().default(true),
  showDiscount: z.boolean().default(true),
  customFields: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        position: z.enum(["header", "footer", "line_item"]).default("footer"),
      })
    )
    .default([]),
  isDefault: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type InvoiceTemplate = z.infer<typeof InvoiceTemplateSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  averageInvoiceAmount: number;
  averageDaysToPay: number;
  collectedRate: number;
  overdueRate: number;
  byStatus: Record<InvoiceStatus, { count: number; amount: number }>;
  byMonth: { month: string; count: number; amount: number }[];
  topClients: { clientId: string; clientName: string; amount: number }[];
}

export interface AgingReport {
  current: { count: number; amount: number };
  days1To30: { count: number; amount: number };
  days31To60: { count: number; amount: number };
  days61To90: { count: number; amount: number };
  over90Days: { count: number; amount: number };
  total: { count: number; amount: number };
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let invoices: Invoice[] = [];
let templates: InvoiceTemplate[] = [];
let invoiceCounter = 1;
let templateCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const num = String(invoiceCounter++).padStart(5, "0");
  return `INV-${year}-${num}`;
}

function calculateDueDate(
  issueDate: string,
  terms: PaymentTerms,
  customDays?: number
): string {
  const date = new Date(issueDate);
  let days = 0;
  switch (terms) {
    case "due_on_receipt":
      days = 0;
      break;
    case "net_15":
      days = 15;
      break;
    case "net_30":
      days = 30;
      break;
    case "net_45":
      days = 45;
      break;
    case "net_60":
      days = 60;
      break;
    case "net_90":
      days = 90;
      break;
    case "custom":
      days = customDays ?? 30;
      break;
  }
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function recalculateInvoiceTotals(invoice: Invoice): void {
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  for (const item of invoice.lineItems) {
    item.amount = item.quantity * item.unitPrice;
    item.taxAmount = item.amount * (item.taxRate / 100);
    item.discountAmount = item.amount * (item.discountPercent / 100);
    item.totalAmount = item.amount - item.discountAmount + item.taxAmount;
    subtotal += item.amount;
    totalTax += item.taxAmount;
    totalDiscount += item.discountAmount;
  }

  invoice.subtotal = subtotal;
  invoice.taxAmount = totalTax;
  invoice.discountAmount = totalDiscount;
  invoice.totalAmount = subtotal - totalDiscount + totalTax;
  invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
}

// ─── Invoice Service ────────────────────────────────────────────────────────

export const InvoiceService = {
  /**
   * Create a new invoice
   */
  input(createInvoiceInput: any, userId: string): Invoice {
    const input = CreateInvoiceSchema.parse(createInvoiceInput);
    const issueDate = input.issueDate ?? now();
    const dueDate =
      input.dueDate ??
      calculateDueDate(
        issueDate,
        input.paymentTerms,
        input.customPaymentDays
      );

    const invoice: Invoice = {
      ...input,
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      issueDate,
      dueDate,
      status: "draft",
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      balanceDue: 0,
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    recalculateInvoiceTotals(invoice);
    invoices.push(invoice);
    return invoice;
  },

  /**
   * Generate invoice from unbilled time entries and expenses
   */
  generateFromBillables(
    matterId: string,
    clientId: string,
    clientName: string,
    timeEntries: { id: string; description: string; hours: number; rate: number; activityCode?: string }[],
    expenses: { id: string; description: string; amount: number }[],
    userId: string,
    options?: {
      paymentTerms?: PaymentTerms;
      discountPercent?: number;
      taxRate?: number;
      notes?: string;
      terms?: string;
    }
  ): Invoice {
    const lineItems: InvoiceLineItem[] = [];
    let sortOrder = 0;

    for (const entry of timeEntries) {
      const amount = entry.hours * entry.rate;
      lineItems.push({
        id: generateId(),
        description: entry.description,
        timeEntryId: entry.id,
        activityCode: entry.activityCode,
        quantity: entry.hours,
        unitPrice: entry.rate,
        amount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: amount,
        discountPercent: 0,
        discountAmount: 0,
        sortOrder: sortOrder++,
      });
    }

    for (const expense of expenses) {
      lineItems.push({
        id: generateId(),
        description: expense.description,
        expenseId: expense.id,
        quantity: 1,
        unitPrice: expense.amount,
        amount: expense.amount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: expense.amount,
        discountPercent: 0,
        discountAmount: 0,
        sortOrder: sortOrder++,
      });
    }

    const paymentTerms = options?.paymentTerms ?? "net_30";
    const issueDate = now();
    const dueDate = calculateDueDate(issueDate, paymentTerms);

    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      matterId,
      clientId,
      clientName,
      type: "standard",
      status: "draft",
      paymentTerms,
      issueDate,
      dueDate,
      lineItems,
      subtotal: 0,
      taxRate: options?.taxRate ?? 0,
      taxAmount: 0,
      discountPercent: options?.discountPercent ?? 0,
      discountAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      balanceDue: 0,
      notes: options?.notes,
      terms: options?.terms,
      tags: [],
      metadata: {},
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    recalculateInvoiceTotals(invoice);
    invoices.push(invoice);
    return invoice;
  },

  /**
   * Get invoice by ID
   */
  getById(id: string): Invoice | undefined {
    return invoices.find((i) => i.id === id);
  },

  /**
   * Get invoice by number
   */
  getByNumber(invoiceNumber: string): Invoice | undefined {
    return invoices.find((i) => i.invoiceNumber === invoiceNumber);
  },

  /**
   * Update invoice
   */
  update(
    id: string,
    input: UpdateInvoiceInput,
    userId: string
  ): Invoice | undefined {
    const index = invoices.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    const invoice = invoices[index]!;
    if (invoice.status !== "draft") {
      throw new Error(
        `Cannot update invoice with status "${invoice.status}". Only draft invoices can be edited.`
      );
    }

    const validated = UpdateInvoiceSchema.parse(input);
    Object.assign(invoice, validated, { updatedAt: now(), updatedBy: userId });

    if (validated.lineItems) {
      recalculateInvoiceTotals(invoice);
    }

    return invoice;
  },

  /**
   * Add line item to invoice
   */
  addLineItem(
    invoiceId: string,
    item: Omit<InvoiceLineItem, "id" | "sortOrder">,
    userId: string
  ): InvoiceLineItem {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
    if (invoice.status !== "draft") {
      throw new Error("Cannot add items to non-draft invoice");
    }

    const sortOrder = invoice.lineItems.length;
    const lineItem: InvoiceLineItem = {
      ...item,
      id: generateId(),
      sortOrder,
    };

    invoice.lineItems.push(lineItem);
    recalculateInvoiceTotals(invoice);
    invoice.updatedAt = now();
    invoice.updatedBy = userId;
    return lineItem;
  },

  /**
   * Remove line item from invoice
   */
  removeLineItem(
    invoiceId: string,
    itemId: string,
    userId: string
  ): boolean {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return false;
    if (invoice.status !== "draft") {
      throw new Error("Cannot remove items from non-draft invoice");
    }

    const index = invoice.lineItems.findIndex((i) => i.id === itemId);
    if (index === -1) return false;

    invoice.lineItems.splice(index, 1);
    recalculateInvoiceTotals(invoice);
    invoice.updatedAt = now();
    invoice.updatedBy = userId;
    return true;
  },

  /**
   * Submit invoice for approval
   */
  submitForApproval(id: string, userId: string): Invoice {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    if (invoice.status !== "draft") {
      throw new Error(
        `Cannot submit invoice with status "${invoice.status}" for approval.`
      );
    }
    if (invoice.lineItems.length === 0) {
      throw new Error("Cannot submit an invoice with no line items");
    }

    invoice.status = "pending_review";
    invoice.updatedAt = now();
    invoice.updatedBy = userId;
    return invoice;
  },

  /**
   * Approve invoice
   */
  approve(id: string, approvedBy: string, notes?: string): Invoice {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    if (invoice.status !== "pending_review") {
      throw new Error(
        `Cannot approve invoice with status "${invoice.status}".`
      );
    }

    invoice.status = "approved";
    invoice.approvedBy = approvedBy;
    invoice.approvedAt = now();
    invoice.updatedAt = now();
    invoice.updatedBy = approvedBy;

    if (notes) {
      invoice.metadata = { ...invoice.metadata, approvalNotes: notes };
    }

    return invoice;
  },

  /**
   * Send invoice to client
   */
  send(
    id: string,
    userId: string,
    sendMethod: "email" | "portal" | "mail" = "email"
  ): Invoice {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    if (invoice.status !== "approved") {
      throw new Error(
        `Cannot send invoice with status "${invoice.status}". Must be approved first.`
      );
    }

    invoice.status = "sent";
    invoice.sentAt = now();
    invoice.updatedAt = now();
    invoice.updatedBy = userId;
    invoice.metadata = {
      ...invoice.metadata,
      sendMethod,
      sentAt: now(),
    };

    return invoice;
  },

  /**
   * Mark invoice as viewed
   */
  markAsViewed(id: string): Invoice {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);

    if (!invoice.viewedAt) {
      invoice.viewedAt = now();
      invoice.updatedAt = now();
    }

    return invoice;
  },

  /**
   * Record partial payment on invoice
   */
  recordPayment(
    id: string,
    amount: number,
    paymentDate: string,
    userId: string,
    paymentMethod?: string,
    reference?: string
  ): Invoice {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    if (amount <= 0) throw new Error("Payment amount must be positive");
    if (invoice.balanceDue <= 0) throw new Error("Invoice is already fully paid");

    const actualAmount = Math.min(amount, invoice.balanceDue);
    invoice.amountPaid += actualAmount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;

    if (invoice.balanceDue <= 0) {
      invoice.status = "paid";
      invoice.paidAt = paymentDate;
    } else {
      invoice.status = "partial_payment";
    }

    invoice.updatedAt = now();
    invoice.updatedBy = userId;
    invoice.metadata = {
      ...invoice.metadata,
      lastPayment: {
        amount: actualAmount,
        date: paymentDate,
        method: paymentMethod,
        reference,
      },
    };

    return invoice;
  },

  /**
   * Void invoice
   */
  void(id: string, userId: string, reason?: string): Invoice {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    if (invoice.status === "paid") {
      throw new Error("Cannot void a paid invoice. Issue a credit memo instead.");
    }

    invoice.status = "voided";
    invoice.voidedAt = now();
    invoice.updatedAt = now();
    invoice.updatedBy = userId;
    invoice.metadata = {
      ...invoice.metadata,
      voidReason: reason,
    };

    return invoice;
  },

  /**
   * Write off invoice
   */
  writeOff(id: string, userId: string, reason: string): Invoice {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    if (invoice.status === "paid" || invoice.status === "voided") {
      throw new Error(
        `Cannot write off invoice with status "${invoice.status}".`
      );
    }

    invoice.status = "written_off";
    invoice.balanceDue = 0;
    invoice.updatedAt = now();
    invoice.updatedBy = userId;
    invoice.metadata = {
      ...invoice.metadata,
      writeOffReason: reason,
      writeOffDate: now(),
    };

    return invoice;
  },

  // ─── Recurring Invoices ──────────────────────────────────────────────────

  /**
   * Create recurring invoice template
   */
  createRecurring(
    input: CreateInvoiceInput & {
      frequency: RecurrenceFrequency;
      endDate?: string;
      maxOccurrences?: number;
    },
    userId: string
  ): Invoice {
    const baseInput = CreateInvoiceSchema.parse(input);
    const issueDate = baseInput.issueDate ?? now();
    const dueDate =
      baseInput.dueDate ??
      calculateDueDate(issueDate, baseInput.paymentTerms, baseInput.customPaymentDays);

    const invoice: Invoice = {
      ...baseInput,
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      type: "recurring",
      status: "draft",
      issueDate,
      dueDate,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      balanceDue: 0,
      recurringConfig: {
        frequency: input.frequency,
        nextDate: issueDate,
        endDate: input.endDate,
        maxOccurrences: input.maxOccurrences,
        currentOccurrence: 0,
      },
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    recalculateInvoiceTotals(invoice);
    invoices.push(invoice);
    return invoice;
  },

  /**
   * Process recurring invoices (generate next occurrence)
   */
  processRecurring(userId: string): Invoice[] {
    const generated: Invoice[] = [];
    const nowDate = new Date();

    for (const invoice of invoices) {
      if (
        invoice.type !== "recurring" ||
        !invoice.recurringConfig ||
        invoice.status === "voided"
      ) {
        continue;
      }

      const nextDate = new Date(invoice.recurringConfig.nextDate);
      if (nextDate > nowDate) continue;

      if (
        invoice.recurringConfig.endDate &&
        new Date(invoice.recurringConfig.endDate) < nowDate
      ) {
        continue;
      }

      if (
        invoice.recurringConfig.maxOccurrences &&
        invoice.recurringConfig.currentOccurrence >=
          invoice.recurringConfig.maxOccurrences
      ) {
        continue;
      }

      const newInvoice = InvoiceService.create(
        {
          ...InvoiceSchema.parse({
            ...invoice,
            id: undefined,
            invoiceNumber: undefined,
            status: "draft",
            type: "standard",
            createdAt: undefined,
            updatedAt: undefined,
            createdBy: undefined,
            updatedBy: undefined,
          }),
          recurringConfig: undefined,
        },
        userId
      );

      newInvoice.metadata = {
        ...newInvoice.metadata,
        parentRecurringId: invoice.id,
        occurrenceNumber: invoice.recurringConfig.currentOccurrence + 1,
      };

      invoice.recurringConfig.currentOccurrence++;
      invoice.recurringConfig.nextDate = calculateNextOccurrence(
        invoice.recurringConfig.nextDate,
        invoice.recurringConfig.frequency
      );
      invoice.updatedAt = now();

      generated.push(newInvoice);
    }

    return generated;
  },

  // ─── Search & Filter ─────────────────────────────────────────────────────

  /**
   * Search and filter invoices
   */
  search(filter: InvoiceFilter): PaginatedResult<Invoice> {
    const validated = InvoiceFilterSchema.parse(filter);
    let filtered = [...invoices];

    if (validated.matterId) {
      filtered = filtered.filter((i) => i.matterId === validated.matterId);
    }
    if (validated.clientId) {
      filtered = filtered.filter((i) => i.clientId === validated.clientId);
    }
    if (validated.status?.length) {
      filtered = filtered.filter((i) =>
        validated.status!.includes(i.status)
      );
    }
    if (validated.type?.length) {
      filtered = filtered.filter((i) =>
        validated.type!.includes(i.type)
      );
    }
    if (validated.dateFrom) {
      filtered = filtered.filter(
        (i) => new Date(i.issueDate) >= new Date(validated.dateFrom!)
      );
    }
    if (validated.dateTo) {
      filtered = filtered.filter(
        (i) => new Date(i.issueDate) <= new Date(validated.dateTo!)
      );
    }
    if (validated.dueDateFrom) {
      filtered = filtered.filter(
        (i) => new Date(i.dueDate) >= new Date(validated.dueDateFrom!)
      );
    }
    if (validated.dueDateTo) {
      filtered = filtered.filter(
        (i) => new Date(i.dueDate) <= new Date(validated.dueDateTo!)
      );
    }
    if (validated.minAmount !== undefined) {
      filtered = filtered.filter(
        (i) => i.totalAmount >= validated.minAmount!
      );
    }
    if (validated.maxAmount !== undefined) {
      filtered = filtered.filter(
        (i) => i.totalAmount <= validated.maxAmount!
      );
    }
    if (validated.isOverdue) {
      const nowDate = new Date();
      filtered = filtered.filter(
        (i) =>
          i.balanceDue > 0 &&
          new Date(i.dueDate) < nowDate &&
          i.status !== "paid" &&
          i.status !== "voided" &&
          i.status !== "written_off"
      );
    }
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(term) ||
          i.clientName.toLowerCase().includes(term) ||
          i.notes?.toLowerCase().includes(term)
      );
    }
    if (validated.tags?.length) {
      filtered = filtered.filter((i) =>
        validated.tags!.some((tag) => i.tags.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (validated.sortBy) {
        case "invoiceNumber":
          aVal = a.invoiceNumber;
          bVal = b.invoiceNumber;
          break;
        case "issueDate":
          aVal = a.issueDate;
          bVal = b.issueDate;
          break;
        case "dueDate":
          aVal = a.dueDate;
          bVal = b.dueDate;
          break;
        case "totalAmount":
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case "balanceDue":
          aVal = a.balanceDue;
          bVal = b.balanceDue;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a[validated.sortBy] ?? "";
          bVal = b[validated.sortBy] ?? "";
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return validated.sortOrder === "asc" ? comparison : -comparison;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / validated.limit);
    const start = (validated.page - 1) * validated.limit;
    const items = filtered.slice(start, start + validated.limit);

    return { items, total, page: validated.page, limit: validated.limit, totalPages };
  },

  /**
   * Get overdue invoices
   */
  getOverdue(): Invoice[] {
    const nowDate = new Date();
    return invoices.filter(
      (i) =>
        i.balanceDue > 0 &&
        new Date(i.dueDate) < nowDate &&
        i.status !== "paid" &&
        i.status !== "voided" &&
        i.status !== "written_off"
    );
  },

  /**
   * Get invoices by matter
   */
  getByMatter(matterId: string): Invoice[] {
    return invoices.filter((i) => i.matterId === matterId);
  },

  // ─── Reports ─────────────────────────────────────────────────────────────

  /**
   * Get invoice statistics
   */
  getStats(
    dateFrom?: string,
    dateTo?: string
  ): InvoiceStats {
    let filtered = [...invoices];

    if (dateFrom) {
      filtered = filtered.filter(
        (i) => new Date(i.issueDate) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (i) => new Date(i.issueDate) <= new Date(dateTo)
      );
    }

    const nowDate = new Date();
    const byStatus: Record<InvoiceStatus, { count: number; amount: number }> = {
      draft: { count: 0, amount: 0 },
      pending_review: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      sent: { count: 0, amount: 0 },
      viewed: { count: 0, amount: 0 },
      partial_payment: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      voided: { count: 0, amount: 0 },
      written_off: { count: 0, amount: 0 },
    };

    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let totalDaysToPay = 0;

    for (const invoice of filtered) {
      byStatus[invoice.status].count++;
      byStatus[invoice.status].amount += invoice.totalAmount;

      if (invoice.status === "paid") {
        totalPaid += invoice.totalAmount;
        paidCount++;
        if (invoice.paidAt && invoice.sentAt) {
          totalDaysToPay +=
            (new Date(invoice.paidAt).getTime() -
              new Date(invoice.sentAt).getTime()) /
            (1000 * 60 * 60 * 24);
        }
      } else if (invoice.balanceDue > 0) {
        totalOutstanding += invoice.balanceDue;
        if (
          new Date(invoice.dueDate) < nowDate &&
          invoice.status !== "voided" &&
          invoice.status !== "written_off"
        ) {
          totalOverdue += invoice.balanceDue;
        }
      }
    }

    const byMonthMap = new Map<string, { count: number; amount: number }>();
    for (const invoice of filtered) {
      const month = invoice.issueDate.substring(0, 7);
      const existing = byMonthMap.get(month) ?? { count: 0, amount: 0 };
      existing.count++;
      existing.amount += invoice.totalAmount;
      byMonthMap.set(month, existing);
    }

    const clientMap = new Map<
      string,
      { clientName: string; amount: number }
    >();
    for (const invoice of filtered) {
      const existing = clientMap.get(invoice.clientId) ?? {
        clientName: invoice.clientName,
        amount: 0,
      };
      existing.amount += invoice.totalAmount;
      clientMap.set(invoice.clientId, existing);
    }

    return {
      totalInvoices: filtered.length,
      totalAmount: filtered.reduce((sum, i) => sum + i.totalAmount, 0),
      totalPaid,
      totalOutstanding,
      totalOverdue,
      averageInvoiceAmount:
        filtered.length > 0
          ? filtered.reduce((sum, i) => sum + i.totalAmount, 0) / filtered.length
          : 0,
      averageDaysToPay: paidCount > 0 ? totalDaysToPay / paidCount : 0,
      collectedRate:
        filtered.length > 0 ? (totalPaid / filtered.reduce((sum, i) => sum + i.totalAmount, 0)) * 100 : 0,
      overdueRate:
        totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0,
      byStatus,
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      topClients: Array.from(clientMap.entries())
        .map(([clientId, data]) => ({ clientId, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
    };
  },

  /**
   * Generate aging report
   */
  getAgingReport(): AgingReport {
    const nowDate = new Date();
    const unpaid = invoices.filter(
      (i) =>
        i.balanceDue > 0 &&
        i.status !== "paid" &&
        i.status !== "voided" &&
        i.status !== "written_off"
    );

    const buckets = {
      current: { count: 0, amount: 0 },
      days1To30: { count: 0, amount: 0 },
      days31To60: { count: 0, amount: 0 },
      days61To90: { count: 0, amount: 0 },
      over90Days: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 },
    };

    for (const invoice of unpaid) {
      const daysOverdue = Math.max(
        0,
        Math.floor(
          (nowDate.getTime() - new Date(invoice.dueDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      if (daysOverdue <= 0) {
        buckets.current.count++;
        buckets.current.amount += invoice.balanceDue;
      } else if (daysOverdue <= 30) {
        buckets.days1To30.count++;
        buckets.days1To30.amount += invoice.balanceDue;
      } else if (daysOverdue <= 60) {
        buckets.days31To60.count++;
        buckets.days31To60.amount += invoice.balanceDue;
      } else if (daysOverdue <= 90) {
        buckets.days61To90.count++;
        buckets.days61To90.amount += invoice.balanceDue;
      } else {
        buckets.over90Days.count++;
        buckets.over90Days.amount += invoice.balanceDue;
      }

      buckets.total.count++;
      buckets.total.amount += invoice.balanceDue;
    }

    return buckets;
  },

  // ─── Templates ───────────────────────────────────────────────────────────

  /**
   * Create invoice template
   */
  createTemplate(
    template: Omit<InvoiceTemplate, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): InvoiceTemplate {
    const newTemplate: InvoiceTemplate = {
      ...template,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    if (newTemplate.isDefault) {
      for (const t of templates) {
        t.isDefault = false;
      }
    }

    templates.push(newTemplate);
    return newTemplate;
  },

  /**
   * Get all templates
   */
  getTemplates(): InvoiceTemplate[] {
    return [...templates];
  },

  /**
   * Get default template
   */
  getDefaultTemplate(): InvoiceTemplate | undefined {
    return templates.find((t) => t.isDefault);
  },

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return false;
    templates.splice(index, 1);
    return true;
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    invoices = [];
    templates = [];
    invoiceCounter = 1;
    templateCounter = 1;
  },
};

// ─── Helper Functions ───────────────────────────────────────────────────────

function calculateNextOccurrence(
  currentDate: string,
  frequency: RecurrenceFrequency
): string {
  const date = new Date(currentDate);
  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "annually":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString();
}
