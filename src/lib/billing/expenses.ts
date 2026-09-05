import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const ExpenseStatus = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "reimbursed",
  "billed",
  "voided",
]);
export type ExpenseStatus = z.infer<typeof ExpenseStatus>;

export const ExpenseCategory = z.enum([
  "travel",
  "filing_fees",
  "expert_fees",
  "court_costs",
  "service_of_process",
  "document_production",
  "copying",
  "postage",
  "meals",
  "lodging",
  "mileage",
  "parking",
  "tolls",
  "telephone",
  "research",
  "software",
  "supplies",
  "deposition_costs",
  "mediation_fees",
  "arbitration_fees",
  "witness_fees",
  "subpoena_fees",
  "translation",
  "other",
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategory>;

export const ReceiptStatus = z.enum([
  "pending",
  "uploaded",
  "verified",
  "rejected",
  "missing",
]);
export type ReceiptStatus = z.infer<typeof ReceiptStatus>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  timekeeperId: z.string().uuid(),
  date: z.string().datetime(),
  category: ExpenseCategory,
  description: z.string().min(1).max(2000),
  amount: z.number().min(0),
  currency: z.string().default("USD"),
  exchangeRate: z.number().min(0).default(1),
  amountInBaseCurrency: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  isBillable: z.boolean().default(true),
  billableAmount: z.number().min(0).default(0),
  status: ExpenseStatus,
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  rejectedBy: z.string().uuid().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  invoiceId: z.string().uuid().optional(),
  receiptStatus: ReceiptStatus,
  receiptUrl: z.string().url().optional(),
  receiptMetadata: z
    .object({
      fileName: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      ocrText: z.string().optional(),
      ocrConfidence: z.number().optional(),
      vendorName: z.string().optional(),
      vendorAddress: z.string().optional(),
      receiptDate: z.string().datetime().optional(),
      taxAmount: z.number().optional(),
    })
    .optional(),
  vendor: z
    .object({
      name: z.string(),
      address: z.string().optional(),
      taxId: z.string().optional(),
    })
    .optional(),
  allocation: z
    .object({
      type: z.enum(["single", "split"]).default("single"),
      splits: z
        .array(
          z.object({
            matterId: z.string().uuid(),
            percentage: z.number().min(0).max(100),
            amount: z.number().min(0),
          })
        )
        .default([]),
    })
    .default({ type: "single", splits: [] }),
  mileage: z
    .object({
      startLocation: z.string(),
      endLocation: z.string(),
      distanceMiles: z.number().min(0),
      ratePerMile: z.number().min(0),
      purpose: z.string(),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const CreateExpenseSchema = ExpenseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  rejectionReason: true,
  invoiceId: true,
  amountInBaseCurrency: true,
  totalAmount: true,
  billableAmount: true,
}).extend({
  amountInBaseCurrency: z.number().optional(),
  totalAmount: z.number().optional(),
  billableAmount: z.number().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export const UpdateExpenseSchema = ExpenseSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

export const ExpenseFilterSchema = z.object({
  matterId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  timekeeperId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  category: z.array(ExpenseCategory).optional(),
  status: z.array(ExpenseStatus).optional(),
  invoiceId: z.string().uuid().optional(),
  isBillable: z.boolean().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  receiptStatus: z.array(ReceiptStatus).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum([
      "date",
      "amount",
      "category",
      "status",
      "createdAt",
      "updatedAt",
    ])
    .default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type ExpenseFilter = z.infer<typeof ExpenseFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseReport {
  totalExpenses: number;
  totalAmount: number;
  totalBillable: number;
  totalNonBillable: number;
  totalReimbursed: number;
  totalPending: number;
  byCategory: { category: ExpenseCategory; count: number; amount: number }[];
  byMatter: { matterId: string; count: number; amount: number }[];
  byTimekeeper: { timekeeperId: string; count: number; amount: number }[];
  byMonth: { month: string; count: number; amount: number }[];
  byStatus: Record<ExpenseStatus, { count: number; amount: number }>;
  averageExpenseAmount: number;
  missingReceipts: number;
  unbilledExpenses: number;
}

export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  reimbursed: number;
  billed: number;
  missingReceipts: number;
  averageAmount: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
  monthlyTrend: number;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let expenses: Expense[] = [];
let expenseCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function calculateMileageReimbursement(
  distanceMiles: number,
  ratePerMile: number
): number {
  return Math.round(distanceMiles * ratePerMile * 100) / 100;
}

const MILEAGE_RATE_2024 = 0.67;

// ─── Expense Service ────────────────────────────────────────────────────────

export const ExpenseService = {
  /**
   * Create a new expense
   */
  input(createExpenseInput: any, userId: string): Expense {
    const input = CreateExpenseSchema.parse(createExpenseInput);

    const amountInBaseCurrency =
      input.amountInBaseCurrency ?? input.amount * input.exchangeRate;
    const totalAmount =
      input.totalAmount ?? amountInBaseCurrency + input.taxAmount;
    const billableAmount = input.isBillable
      ? input.billableAmount ?? totalAmount
      : 0;

    const expense: Expense = {
      ...input,
      id: generateId(),
      amountInBaseCurrency,
      totalAmount,
      billableAmount,
      status: "draft",
      receiptStatus: "pending",
      allocation:
        input.allocation.type === "split" && input.allocation.splits.length > 0
          ? input.allocation
          : { type: "single", splits: [] },
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    expenses.push(expense);
    return expense;
  },

  /**
   * Create mileage expense
   */
  createMileage(
    matterId: string,
    timekeeperId: string,
    date: string,
    startLocation: string,
    endLocation: string,
    distanceMiles: number,
    purpose: string,
    userId: string,
    options?: {
      ratePerMile?: number;
      isBillable?: boolean;
      notes?: string;
    }
  ): Expense {
    const ratePerMile = options?.ratePerMile ?? MILEAGE_RATE_2024;
    const amount = calculateMileageReimbursement(distanceMiles, ratePerMile);

    return ExpenseService.create(
      {
        matterId,
        timekeeperId,
        date,
        category: "mileage",
        description: `${startLocation} to ${endLocation}: ${purpose}`,
        amount,
        isBillable: options?.isBillable ?? true,
        mileage: {
          startLocation,
          endLocation,
          distanceMiles,
          ratePerMile,
          purpose,
        },
        notes: options?.notes,
      },
      userId
    );
  },

  /**
   * Get expense by ID
   */
  getById(id: string): Expense | undefined {
    return expenses.find((e) => e.id === id);
  },

  /**
   * Update expense
   */
  update(
    id: string,
    input: UpdateExpenseInput,
    userId: string
  ): Expense | undefined {
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const expense = expenses[index]!;
    if (expense.status === "billed" || expense.status === "reimbursed") {
      throw new Error(
        `Cannot update expense with status "${expense.status}"`
      );
    }

    const validated = UpdateExpenseSchema.parse(input);
    Object.assign(expense, validated, { updatedAt: now(), updatedBy: userId });

    if (validated.amount !== undefined || validated.taxAmount !== undefined) {
      expense.amountInBaseCurrency = expense.amount * expense.exchangeRate;
      expense.totalAmount = expense.amountInBaseCurrency + expense.taxAmount;
      if (expense.isBillable) {
        expense.billableAmount = expense.billableAmount || expense.totalAmount;
      }
    }

    return expense;
  },

  /**
   * Delete expense
   */
  delete(id: string, userId: string): boolean {
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return false;

    const expense = expenses[index]!;
    if (expense.status === "billed") {
      throw new Error("Cannot delete a billed expense. Void it instead.");
    }

    expense.status = "voided";
    expense.updatedAt = now();
    expense.updatedBy = userId;
    return true;
  },

  /**
   * Submit expense for approval
   */
  submitForApproval(id: string, userId: string): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw new Error(`Expense not found: ${id}`);
    if (expense.status !== "draft" && expense.status !== "rejected") {
      throw new Error(
        `Cannot submit expense with status "${expense.status}". Must be draft or rejected.`
      );
    }

    expense.status = "pending_review";
    expense.updatedAt = now();
    expense.updatedBy = userId;
    return expense;
  },

  /**
   * Approve expense
   */
  approve(id: string, approvedBy: string, notes?: string): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw new Error(`Expense not found: ${id}`);
    if (expense.status !== "pending_review") {
      throw new Error(
        `Cannot approve expense with status "${expense.status}".`
      );
    }

    expense.status = "approved";
    expense.approvedBy = approvedBy;
    expense.approvedAt = now();
    expense.updatedAt = now();
    expense.updatedBy = approvedBy;

    if (notes) {
      expense.metadata = { ...expense.metadata, approvalNotes: notes };
    }

    return expense;
  },

  /**
   * Reject expense
   */
  reject(
    id: string,
    rejectedBy: string,
    reason: string
  ): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw new Error(`Expense not found: ${id}`);
    if (expense.status !== "pending_review") {
      throw new Error(
        `Cannot reject expense with status "${expense.status}".`
      );
    }

    expense.status = "rejected";
    expense.rejectedBy = rejectedBy;
    expense.rejectedAt = now();
    expense.rejectionReason = reason;
    expense.updatedAt = now();
    expense.updatedBy = rejectedBy;
    return expense;
  },

  /**
   * Bulk approve expenses
   */
  bulkApprove(
    ids: string[],
    approvedBy: string
  ): { approved: string[]; errors: { expenseId: string; error: string }[] } {
    const approved: string[] = [];
    const errors: { expenseId: string; error: string }[] = [];

    for (const id of ids) {
      try {
        ExpenseService.approve(id, approvedBy);
        approved.push(id);
      } catch (error) {
        errors.push({
          expenseId: id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { approved, errors };
  },

  /**
   * Mark expenses as reimbursed
   */
  markAsReimbursed(
    ids: string[],
    userId: string
  ): { reimbursed: string[]; errors: { expenseId: string; error: string }[] } {
    const reimbursed: string[] = [];
    const errors: { expenseId: string; error: string }[] = [];

    for (const id of ids) {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) {
        errors.push({ expenseId: id, error: "Expense not found" });
        continue;
      }
      if (expense.status !== "approved") {
        errors.push({
          expenseId: id,
          error: `Cannot reimburse expense with status "${expense.status}". Must be approved.`,
        });
        continue;
      }

      expense.status = "reimbursed";
      expense.updatedAt = now();
      expense.updatedBy = userId;
      reimbursed.push(id);
    }

    return { reimbursed, errors };
  },

  /**
   * Mark expenses as billed
   */
  markAsBilled(
    ids: string[],
    invoiceId: string,
    userId: string
  ): { billed: string[]; errors: { expenseId: string; error: string }[] } {
    const billed: string[] = [];
    const errors: { expenseId: string; error: string }[] = [];

    for (const id of ids) {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) {
        errors.push({ expenseId: id, error: "Expense not found" });
        continue;
      }
      if (expense.status !== "approved") {
        errors.push({
          expenseId: id,
          error: `Cannot bill expense with status "${expense.status}". Must be approved.`,
        });
        continue;
      }

      expense.status = "billed";
      expense.invoiceId = invoiceId;
      expense.updatedAt = now();
      expense.updatedBy = userId;
      billed.push(id);
    }

    return { billed, errors };
  },

  // ─── Receipt Management ──────────────────────────────────────────────────

  /**
   * Upload receipt for expense
   */
  uploadReceipt(
    id: string,
    receiptData: {
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
    userId: string
  ): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw new Error(`Expense not found: ${id}`);

    expense.receiptUrl = receiptData.url;
    expense.receiptStatus = "uploaded";
    expense.receiptMetadata = {
      fileName: receiptData.fileName,
      fileSize: receiptData.fileSize,
      mimeType: receiptData.mimeType,
    };
    expense.updatedAt = now();
    expense.updatedBy = userId;
    return expense;
  },

  /**
   * Verify receipt (OCR scan results)
   */
  verifyReceipt(
    id: string,
    ocrData: {
      ocrText: string;
      ocrConfidence: number;
      vendorName?: string;
      vendorAddress?: string;
      receiptDate?: string;
      taxAmount?: number;
    },
    userId: string
  ): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw new Error(`Expense not found: ${id}`);

    expense.receiptStatus = "verified";
    expense.receiptMetadata = {
      ...expense.receiptMetadata,
      ...ocrData,
    };

    if (ocrData.vendorName && !expense.vendor) {
      expense.vendor = { name: ocrData.vendorName, address: ocrData.vendorAddress };
    }

    expense.updatedAt = now();
    expense.updatedBy = userId;
    return expense;
  },

  /**
   * Get expenses missing receipts
   */
  getMissingReceipts(): Expense[] {
    return expenses.filter(
      (e) =>
        e.receiptStatus === "pending" || e.receiptStatus === "missing"
    );
  },

  /**
   * Mark receipt as missing
   */
  markReceiptMissing(id: string, userId: string): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw new Error(`Expense not found: ${id}`);

    expense.receiptStatus = "missing";
    expense.updatedAt = now();
    expense.updatedBy = userId;
    return expense;
  },

  // ─── Allocation ──────────────────────────────────────────────────────────

  /**
   * Allocate expense to multiple matters
   */
  allocateExpense(
    id: string,
    allocations: { matterId: string; percentage: number }[],
    userId: string
  ): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw new Error(`Expense not found: ${id}`);

    const totalPercentage = allocations.reduce(
      (sum, a) => sum + a.percentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(
        `Total allocation percentage must equal 100. Got: ${totalPercentage}`
      );
    }

    const splits = allocations.map((a) => ({
      matterId: a.matterId,
      percentage: a.percentage,
      amount: expense.totalAmount * (a.percentage / 100),
    }));

    expense.allocation = { type: "split", splits };
    expense.updatedAt = now();
    expense.updatedBy = userId;
    return expense;
  },

  // ─── Search & Filter ─────────────────────────────────────────────────────

  /**
   * Search and filter expenses
   */
  search(filter: ExpenseFilter): PaginatedResult<Expense> {
    const validated = ExpenseFilterSchema.parse(filter);
    let filtered = [...expenses];

    if (validated.matterId) {
      filtered = filtered.filter((e) => e.matterId === validated.matterId);
    }
    if (validated.taskId) {
      filtered = filtered.filter((e) => e.taskId === validated.taskId);
    }
    if (validated.timekeeperId) {
      filtered = filtered.filter(
        (e) => e.timekeeperId === validated.timekeeperId
      );
    }
    if (validated.dateFrom) {
      filtered = filtered.filter(
        (e) => new Date(e.date) >= new Date(validated.dateFrom!)
      );
    }
    if (validated.dateTo) {
      filtered = filtered.filter(
        (e) => new Date(e.date) <= new Date(validated.dateTo!)
      );
    }
    if (validated.category?.length) {
      filtered = filtered.filter((e) =>
        validated.category!.includes(e.category)
      );
    }
    if (validated.status?.length) {
      filtered = filtered.filter((e) =>
        validated.status!.includes(e.status)
      );
    }
    if (validated.invoiceId) {
      filtered = filtered.filter((e) => e.invoiceId === validated.invoiceId);
    }
    if (validated.isBillable !== undefined) {
      filtered = filtered.filter(
        (e) => e.isBillable === validated.isBillable
      );
    }
    if (validated.minAmount !== undefined) {
      filtered = filtered.filter(
        (e) => e.totalAmount >= validated.minAmount!
      );
    }
    if (validated.maxAmount !== undefined) {
      filtered = filtered.filter(
        (e) => e.totalAmount <= validated.maxAmount!
      );
    }
    if (validated.receiptStatus?.length) {
      filtered = filtered.filter((e) =>
        validated.receiptStatus!.includes(e.receiptStatus)
      );
    }
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(term) ||
          e.vendor?.name.toLowerCase().includes(term) ||
          e.notes?.toLowerCase().includes(term)
      );
    }
    if (validated.tags?.length) {
      filtered = filtered.filter((e) =>
        validated.tags!.some((tag) => e.tags.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (validated.sortBy) {
        case "date":
          aVal = a.date;
          bVal = b.date;
          break;
        case "amount":
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case "category":
          aVal = a.category;
          bVal = b.category;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = (a as Record<string, unknown>)[validated.sortBy] as string;
          bVal = (b as Record<string, unknown>)[validated.sortBy] as string;
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
   * Get expenses by matter
   */
  getByMatter(matterId: string): Expense[] {
    return expenses.filter((e) => e.matterId === matterId);
  },

  /**
   * Get unbilled expenses for a matter
   */
  getUnbilledByMatter(matterId: string): Expense[] {
    return expenses.filter(
      (e) =>
        e.matterId === matterId &&
        e.status === "approved" &&
        e.isBillable &&
        !e.invoiceId
    );
  },

  /**
   * Get expenses pending approval
   */
  getPendingApproval(timekeeperId?: string): Expense[] {
    let filtered = expenses.filter((e) => e.status === "pending_review");
    if (timekeeperId) {
      filtered = filtered.filter((e) => e.timekeeperId === timekeeperId);
    }
    return filtered;
  },

  // ─── Reports ─────────────────────────────────────────────────────────────

  /**
   * Generate expense report
   */
  generateReport(
    filter: Omit<ExpenseFilter, "page" | "limit" | "sortBy" | "sortOrder">
  ): ExpenseReport {
    const allExpenses = ExpenseService.search({
      ...filter,
      page: 1,
      limit: Number.MAX_SAFE_INTEGER,
      sortBy: "date",
      sortOrder: "desc",
    }).items;

    const billableExpenses = allExpenses.filter((e) => e.isBillable);
    const nonBillableExpenses = allExpenses.filter((e) => !e.isBillable);
    const reimbursedExpenses = allExpenses.filter(
      (e) => e.status === "reimbursed"
    );
    const pendingExpenses = allExpenses.filter(
      (e) => e.status === "draft" || e.status === "pending_review"
    );
    const missingReceiptExpenses = allExpenses.filter(
      (e) =>
        e.receiptStatus === "pending" || e.receiptStatus === "missing"
    );
    const unbilledExpenses = allExpenses.filter(
      (e) => e.status === "approved" && e.isBillable && !e.invoiceId
    );

    const byCategoryMap = new Map<
      ExpenseCategory,
      { count: number; amount: number }
    >();
    const byMatterMap = new Map<string, { count: number; amount: number }>();
    const byTimekeeperMap = new Map<
      string,
      { count: number; amount: number }
    >();
    const byMonthMap = new Map<string, { count: number; amount: number }>();
    const byStatus: Record<ExpenseStatus, { count: number; amount: number }> = {
      draft: { count: 0, amount: 0 },
      pending_review: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
      reimbursed: { count: 0, amount: 0 },
      billed: { count: 0, amount: 0 },
      voided: { count: 0, amount: 0 },
    };

    for (const expense of allExpenses) {
      const catExisting = byCategoryMap.get(expense.category) ?? {
        count: 0,
        amount: 0,
      };
      catExisting.count++;
      catExisting.amount += expense.totalAmount;
      byCategoryMap.set(expense.category, catExisting);

      const matterExisting = byMatterMap.get(expense.matterId) ?? {
        count: 0,
        amount: 0,
      };
      matterExisting.count++;
      matterExisting.amount += expense.totalAmount;
      byMatterMap.set(expense.matterId, matterExisting);

      const tkExisting = byTimekeeperMap.get(expense.timekeeperId) ?? {
        count: 0,
        amount: 0,
      };
      tkExisting.count++;
      tkExisting.amount += expense.totalAmount;
      byTimekeeperMap.set(expense.timekeeperId, tkExisting);

      const month = expense.date.substring(0, 7);
      const monthExisting = byMonthMap.get(month) ?? { count: 0, amount: 0 };
      monthExisting.count++;
      monthExisting.amount += expense.totalAmount;
      byMonthMap.set(month, monthExisting);

      byStatus[expense.status].count++;
      byStatus[expense.status].amount += expense.totalAmount;
    }

    return {
      totalExpenses: allExpenses.length,
      totalAmount: allExpenses.reduce((sum, e) => sum + e.totalAmount, 0),
      totalBillable: billableExpenses.reduce(
        (sum, e) => sum + e.totalAmount,
        0
      ),
      totalNonBillable: nonBillableExpenses.reduce(
        (sum, e) => sum + e.totalAmount,
        0
      ),
      totalReimbursed: reimbursedExpenses.reduce(
        (sum, e) => sum + e.totalAmount,
        0
      ),
      totalPending: pendingExpenses.reduce(
        (sum, e) => sum + e.totalAmount,
        0
      ),
      byCategory: Array.from(byCategoryMap.entries()).map(
        ([category, data]) => ({ category, ...data })
      ),
      byMatter: Array.from(byMatterMap.entries()).map(([matterId, data]) => ({
        matterId,
        ...data,
      })),
      byTimekeeper: Array.from(byTimekeeperMap.entries()).map(
        ([timekeeperId, data]) => ({ timekeeperId, ...data })
      ),
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      byStatus,
      averageExpenseAmount:
        allExpenses.length > 0
          ? allExpenses.reduce((sum, e) => sum + e.totalAmount, 0) /
            allExpenses.length
          : 0,
      missingReceipts: missingReceiptExpenses.length,
      unbilledExpenses: unbilledExpenses.reduce(
        (sum, e) => sum + e.totalAmount,
        0
      ),
    };
  },

  /**
   * Get expense statistics
   */
  getStats(
    timekeeperId?: string,
    dateFrom?: string,
    dateTo?: string
  ): ExpenseStats {
    let filtered = [...expenses];

    if (timekeeperId) {
      filtered = filtered.filter((e) => e.timekeeperId === timekeeperId);
    }
    if (dateFrom) {
      filtered = filtered.filter(
        (e) => new Date(e.date) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (e) => new Date(e.date) <= new Date(dateTo)
      );
    }

    const nowDate = new Date();
    const monthStart = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      1
    );
    const lastMonthStart = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      0
    );

    const thisMonthExpenses = filtered.filter(
      (e) => new Date(e.date) >= monthStart
    );
    const lastMonthExpenses = filtered.filter(
      (e) =>
        new Date(e.date) >= lastMonthStart &&
        new Date(e.date) <= lastMonthEnd
    );

    const thisMonthAmount = thisMonthExpenses.reduce(
      (sum, e) => sum + e.totalAmount,
      0
    );
    const lastMonthAmount = lastMonthExpenses.reduce(
      (sum, e) => sum + e.totalAmount,
      0
    );

    return {
      totalExpenses: filtered.length,
      totalAmount: filtered.reduce((sum, e) => sum + e.totalAmount, 0),
      pendingApproval: filtered.filter(
        (e) => e.status === "pending_review"
      ).length,
      approved: filtered.filter((e) => e.status === "approved").length,
      rejected: filtered.filter((e) => e.status === "rejected").length,
      reimbursed: filtered.filter((e) => e.status === "reimbursed").length,
      billed: filtered.filter((e) => e.status === "billed").length,
      missingReceipts: filtered.filter(
        (e) =>
          e.receiptStatus === "pending" || e.receiptStatus === "missing"
      ).length,
      averageAmount:
        filtered.length > 0
          ? filtered.reduce((sum, e) => sum + e.totalAmount, 0) /
            filtered.length
          : 0,
      thisMonthAmount,
      lastMonthAmount,
      monthlyTrend:
        lastMonthAmount > 0
          ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
          : 0,
    };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    expenses = [];
    expenseCounter = 1;
  },
};
