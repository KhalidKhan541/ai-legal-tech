import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const TrustAccountStatus = z.enum([
  "active",
  "frozen",
  "closed",
  "pending_reconciliation",
]);
export type TrustAccountStatus = z.infer<typeof TrustAccountStatus>;

export const TrustTransactionCategory = z.enum([
  "client_deposit",
  "client_withdrawal",
  "fee_earned",
  "cost_payment",
  "refund",
  "transfer",
  "interest",
  "bank_fee",
  "adjustment",
  "reconciliation",
]);
export type TrustTransactionCategory = z.infer<typeof TrustTransactionCategory>;

export const ReconciliationStatus = z.enum([
  "pending",
  "in_progress",
  "completed",
  "discrepancy_found",
]);
export type ReconciliationStatus = z.infer<typeof ReconciliationStatus>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const TrustAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: z.enum(["iolta", "client_trust", "retainer", "settlement", "escrow"]),
  accountNumber: z.string().min(1),
  bankName: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  status: TrustAccountStatus,
  balance: z.number().default(0),
  availableBalance: z.number().default(0),
  reservedAmount: z.number().min(0).default(0),
  holdAmount: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  isIoltaCompliant: z.boolean().default(false),
  lastReconciledAt: z.string().datetime().optional(),
  lastReconciledBy: z.string().uuid().optional(),
  lastReconciledBalance: z.number().optional(),
  interestRate: z.number().min(0).default(0),
  interestAccrualDate: z.string().datetime().optional(),
  interestEarned: z.number().min(0).default(0),
  monthlyServiceFee: z.number().min(0).default(0),
  minimumBalance: z.number().min(0).default(0),
  authorizedSigners: z.array(z.string().uuid()).default([]),
  clientAllocations: z
    .array(
      z.object({
        clientId: z.string().uuid(),
        clientName: z.string(),
        matterId: z.string().uuid(),
        matterNumber: z.string(),
        allocatedAmount: z.number().min(0),
        reservedAmount: z.number().min(0).default(0),
        lastTransactionAt: z.string().datetime().optional(),
      })
    )
    .default([]),
  complianceFlags: z
    .object({
      requiresDualSignature: z.boolean().default(false),
      requiresApprovalOver: z.number().min(0).default(0),
      autoSweepEnabled: z.boolean().default(false),
      autoSweepThreshold: z.number().min(0).default(0),
    })
    .default({}),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type TrustAccount = z.infer<typeof TrustAccountSchema>;

export const TrustTransactionSchema = z.object({
  id: z.string().uuid(),
  trustAccountId: z.string().uuid(),
  type: z.enum([
    "deposit",
    "withdrawal",
    "transfer_in",
    "transfer_out",
    "interest",
    "fee",
    "refund",
    "reconciliation_adjustment",
  ]),
  category: TrustTransactionCategory,
  amount: z.number(),
  balanceAfter: z.number(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  matterId: z.string().uuid().optional(),
  matterNumber: z.string().optional(),
  invoiceId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  reference: z.string().optional(),
  checkNumber: z.string().optional(),
  bankTransactionId: z.string().optional(),
  isReconciled: z.boolean().default(false),
  reconciledAt: z.string().datetime().optional(),
  reconciledBy: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  requiresApproval: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type TrustTransaction = z.infer<typeof TrustTransactionSchema>;

export const ReconciliationSchema = z.object({
  id: z.string().uuid(),
  trustAccountId: z.string().uuid(),
  period: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  bookBalance: z.number(),
  bankBalance: z.number(),
  reconciledBalance: z.number(),
  difference: z.number(),
  status: ReconciliationStatus,
  transactionIds: z.array(z.string().uuid()).default([]),
  reconciledTransactionIds: z.array(z.string().uuid()).default([]),
  unreconciledCount: z.number().default(0),
  discrepancyNotes: z.string().optional(),
  completedBy: z.string().uuid().optional(),
  completedAt: z.string().datetime().optional(),
  reviewedBy: z.string().uuid().optional(),
  reviewedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type Reconciliation = z.infer<typeof ReconciliationSchema>;

export const CreateTrustAccountSchema = TrustAccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  balance: true,
  availableBalance: true,
  reservedAmount: true,
  holdAmount: true,
  interestEarned: true,
  lastReconciledAt: true,
  lastReconciledBy: true,
  lastReconciledBalance: true,
  clientAllocations: true,
});

export type CreateTrustAccountInput = z.infer<typeof CreateTrustAccountSchema>;

export const TrustTransactionFilterSchema = z.object({
  trustAccountId: z.string().uuid().optional(),
  type: z.array(z.enum([
    "deposit", "withdrawal", "transfer_in", "transfer_out",
    "interest", "fee", "refund", "reconciliation_adjustment",
  ])).optional(),
  category: z.array(TrustTransactionCategory).optional(),
  clientId: z.string().uuid().optional(),
  matterId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  isReconciled: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type TrustTransactionFilter = z.infer<typeof TrustTransactionFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrustAccountReport {
  account: TrustAccount;
  totalDeposits: number;
  totalWithdrawals: number;
  totalInterest: number;
  totalFees: number;
  netFlow: number;
  transactionCount: number;
  byCategory: { category: TrustTransactionCategory; count: number; amount: number }[];
  byClient: { clientId: string; clientName: string; balance: number }[];
  byMatter: { matterId: string; matterNumber: string; balance: number }[];
  unreconciledCount: number;
  unreconciledAmount: number;
  dailyBalances: { date: string; balance: number }[];
}

export interface IOLTAComplianceReport {
  accountId: string;
  accountName: string;
  isCompliant: boolean;
  issues: string[];
  lastReconciliationDate: string | undefined;
  daysSinceReconciliation: number;
  hasNegativeBalance: boolean;
  hasUnearnedFunds: boolean;
  requiresDualSignature: boolean;
  unauthorizedWithdrawals: number;
  missingApprovals: number;
  interestAllocationRequired: boolean;
  lastAuditDate: string | undefined;
  nextAuditDue: string | undefined;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let trustAccounts: TrustAccount[] = [];
let trustTransactions: TrustTransaction[] = [];
let reconciliations: Reconciliation[] = [];
let trustAccountCounter = 1;
let trustTransactionCounter = 1;
let reconciliationCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Trust Account Service ──────────────────────────────────────────────────

export const TrustAccountService = {
  /**
   * Create a trust account
   */
  create(input: CreateTrustAccountInput, userId: string): TrustAccount {
    const validated = CreateTrustAccountSchema.parse(input);

    const account: TrustAccount = {
      ...validated,
      id: generateId(),
      status: "active",
      balance: 0,
      availableBalance: 0,
      reservedAmount: 0,
      holdAmount: 0,
      interestEarned: 0,
      clientAllocations: [],
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    trustAccounts.push(account);
    return account;
  },

  /**
   * Get trust account by ID
   */
  getById(id: string): TrustAccount | undefined {
    return trustAccounts.find((a) => a.id === id);
  },

  /**
   * Get all trust accounts
   */
  getAll(): TrustAccount[] {
    return [...trustAccounts];
  },

  /**
   * Update trust account
   */
  update(
    id: string,
    updates: Partial<Omit<TrustAccount, "id" | "createdAt" | "createdBy">>,
    userId: string
  ): TrustAccount | undefined {
    const index = trustAccounts.findIndex((a) => a.id === id);
    if (index === -1) return undefined;

    const updated: TrustAccount = {
      ...trustAccounts[index]!,
      ...updates,
      updatedAt: now(),
      updatedBy: userId,
    };

    trustAccounts[index] = updated;
    return updated;
  },

  /**
   * Freeze trust account
   */
  freeze(id: string, userId: string, reason?: string): TrustAccount {
    const account = trustAccounts.find((a) => a.id === id);
    if (!account) throw new Error(`Trust account not found: ${id}`);
    if (account.status === "closed") {
      throw new Error("Cannot freeze a closed trust account");
    }

    account.status = "frozen";
    account.updatedAt = now();
    account.updatedBy = userId;
    account.metadata = { ...account.metadata, freezeReason: reason, frozenAt: now() };
    return account;
  },

  /**
   * Close trust account
   */
  close(id: string, userId: string, reason: string): TrustAccount {
    const account = trustAccounts.find((a) => a.id === id);
    if (!account) throw new Error(`Trust account not found: ${id}`);
    if (account.balance !== 0) {
      throw new Error(
        `Cannot close trust account with non-zero balance: $${account.balance.toFixed(2)}`
      );
    }

    account.status = "closed";
    account.updatedAt = now();
    account.updatedBy = userId;
    account.metadata = {
      ...account.metadata,
      closeReason: reason,
      closedAt: now(),
    };
    return account;
  },

  // ─── Transactions ────────────────────────────────────────────────────────

  /**
   * Record deposit
   */
  deposit(
    trustAccountId: string,
    amount: number,
    clientId: string,
    clientName: string,
    matterId: string,
    matterNumber: string,
    description: string,
    userId: string,
    options?: {
      reference?: string;
      paymentId?: string;
      category?: TrustTransactionCategory;
    }
  ): TrustTransaction {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);
    if (account.status !== "active") {
      throw new Error(`Cannot deposit to account with status "${account.status}"`);
    }
    if (amount <= 0) throw new Error("Deposit amount must be positive");

    account.balance += amount;
    account.availableBalance += amount;
    account.updatedAt = now();
    account.updatedBy = userId;

    const existingAllocation = account.clientAllocations.find(
      (a) => a.clientId === clientId && a.matterId === matterId
    );
    if (existingAllocation) {
      existingAllocation.allocatedAmount += amount;
      existingAllocation.lastTransactionAt = now();
    } else {
      account.clientAllocations.push({
        clientId,
        clientName,
        matterId,
        matterNumber,
        allocatedAmount: amount,
        reservedAmount: 0,
        lastTransactionAt: now(),
      });
    }

    const transaction: TrustTransaction = {
      id: generateId(),
      trustAccountId,
      type: "deposit",
      category: options?.category ?? "client_deposit",
      amount,
      balanceAfter: account.balance,
      clientId,
      clientName,
      matterId,
      matterNumber,
      paymentId: options?.paymentId,
      description,
      reference: options?.reference,
      isReconciled: false,
      metadata: {},
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    trustTransactions.push(transaction);
    return transaction;
  },

  /**
   * Record withdrawal
   */
  withdrawal(
    trustAccountId: string,
    amount: number,
    clientId: string,
    clientName: string,
    matterId: string,
    matterNumber: string,
    description: string,
    userId: string,
    options?: {
      invoiceId?: string;
      reference?: string;
      checkNumber?: string;
      category?: TrustTransactionCategory;
    }
  ): TrustTransaction {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);
    if (account.status !== "active") {
      throw new Error(`Cannot withdraw from account with status "${account.status}"`);
    }
    if (amount <= 0) throw new Error("Withdrawal amount must be positive");

    const allocation = account.clientAllocations.find(
      (a) => a.clientId === clientId && a.matterId === matterId
    );
    const availableForClient = allocation
      ? allocation.allocatedAmount - allocation.reservedAmount
      : 0;

    if (amount > availableForClient) {
      throw new Error(
        `Insufficient funds for client. Available: $${availableForClient.toFixed(2)}, Requested: $${amount.toFixed(2)}`
      );
    }

    if (amount > account.availableBalance) {
      throw new Error(
        `Insufficient account funds. Available: $${account.availableBalance.toFixed(2)}`
      );
    }

    if (
      account.complianceFlags.requiresApprovalOver > 0 &&
      amount > account.complianceFlags.requiresApprovalOver
    ) {
      throw new Error(
        `Withdrawal exceeds approval threshold of $${account.complianceFlags.requiresApprovalOver.toFixed(2)}. Requires approval.`
      );
    }

    account.balance -= amount;
    account.availableBalance -= amount;
    account.updatedAt = now();
    account.updatedBy = userId;

    if (allocation) {
      allocation.allocatedAmount -= amount;
      allocation.lastTransactionAt = now();
    }

    const transaction: TrustTransaction = {
      id: generateId(),
      trustAccountId,
      type: "withdrawal",
      category: options?.category ?? "client_withdrawal",
      amount: -amount,
      balanceAfter: account.balance,
      clientId,
      clientName,
      matterId,
      matterNumber,
      invoiceId: options?.invoiceId,
      description,
      reference: options?.reference,
      checkNumber: options?.checkNumber,
      isReconciled: false,
      metadata: {},
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    trustTransactions.push(transaction);
    return transaction;
  },

  /**
   * Record fee earned (transfer from trust to operating)
   */
  recordFeeEarned(
    trustAccountId: string,
    amount: number,
    clientId: string,
    clientName: string,
    matterId: string,
    matterNumber: string,
    invoiceId: string,
    description: string,
    userId: string
  ): TrustTransaction {
    return TrustAccountService.withdrawal(
      trustAccountId,
      amount,
      clientId,
      clientName,
      matterId,
      matterNumber,
      description,
      userId,
      { invoiceId, category: "fee_earned" }
    );
  },

  /**
   * Record interest earned
   */
  recordInterest(
    trustAccountId: string,
    amount: number,
    userId: string
  ): TrustTransaction {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);
    if (amount <= 0) throw new Error("Interest amount must be positive");

    account.balance += amount;
    account.interestEarned += amount;
    account.updatedAt = now();
    account.updatedBy = userId;

    const transaction: TrustTransaction = {
      id: generateId(),
      trustAccountId,
      type: "interest",
      category: "interest",
      amount,
      balanceAfter: account.balance,
      description: "Interest earned on trust account",
      isReconciled: false,
      metadata: {},
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    trustTransactions.push(transaction);
    return transaction;
  },

  /**
   * Transfer between trust accounts
   */
  transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    clientId: string,
    clientName: string,
    matterId: string,
    matterNumber: string,
    description: string,
    userId: string
  ): { withdrawal: TrustTransaction; deposit: TrustTransaction } {
    const fromAccount = trustAccounts.find((a) => a.id === fromAccountId);
    const toAccount = trustAccounts.find((a) => a.id === toAccountId);

    if (!fromAccount) throw new Error(`Source trust account not found: ${fromAccountId}`);
    if (!toAccount) throw new Error(`Destination trust account not found: ${toAccountId}`);
    if (amount <= 0) throw new Error("Transfer amount must be positive");
    if (amount > fromAccount.availableBalance) {
      throw new Error(
        `Insufficient funds. Available: $${fromAccount.availableBalance.toFixed(2)}`
      );
    }

    const withdrawal: TrustTransaction = {
      id: generateId(),
      trustAccountId: fromAccountId,
      type: "transfer_out",
      category: "transfer",
      amount: -amount,
      balanceAfter: fromAccount.balance - amount,
      clientId,
      clientName,
      matterId,
      matterNumber,
      description,
      isReconciled: false,
      metadata: { targetAccountId: toAccountId },
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    const deposit: TrustTransaction = {
      id: generateId(),
      trustAccountId: toAccountId,
      type: "transfer_in",
      category: "transfer",
      amount,
      balanceAfter: toAccount.balance + amount,
      clientId,
      clientName,
      matterId,
      matterNumber,
      description,
      isReconciled: false,
      metadata: { sourceAccountId: fromAccountId },
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    fromAccount.balance -= amount;
    fromAccount.availableBalance -= amount;
    fromAccount.updatedAt = now();
    fromAccount.updatedBy = userId;

    toAccount.balance += amount;
    toAccount.availableBalance += amount;
    toAccount.updatedAt = now();
    toAccount.updatedBy = userId;

    trustTransactions.push(withdrawal, deposit);
    return { withdrawal, deposit };
  },

  /**
   * Get transactions for trust account
   */
  getTransactions(
    filter: TrustTransactionFilter
  ): PaginatedResult<TrustTransaction> {
    const validated = TrustTransactionFilterSchema.parse(filter);
    let filtered = [...trustTransactions];

    if (validated.trustAccountId) {
      filtered = filtered.filter(
        (t) => t.trustAccountId === validated.trustAccountId
      );
    }
    if (validated.type?.length) {
      filtered = filtered.filter((t) => validated.type!.includes(t.type));
    }
    if (validated.category?.length) {
      filtered = filtered.filter((t) =>
        validated.category!.includes(t.category)
      );
    }
    if (validated.clientId) {
      filtered = filtered.filter((t) => t.clientId === validated.clientId);
    }
    if (validated.matterId) {
      filtered = filtered.filter((t) => t.matterId === validated.matterId);
    }
    if (validated.dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) >= new Date(validated.dateFrom!)
      );
    }
    if (validated.dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) <= new Date(validated.dateTo!)
      );
    }
    if (validated.minAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) >= validated.minAmount!);
    }
    if (validated.maxAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) <= validated.maxAmount!);
    }
    if (validated.isReconciled !== undefined) {
      filtered = filtered.filter(
        (t) => t.isReconciled === validated.isReconciled
      );
    }
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          t.reference?.toLowerCase().includes(term) ||
          t.clientName?.toLowerCase().includes(term)
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = filtered.length;
    const totalPages = Math.ceil(total / validated.limit);
    const start = (validated.page - 1) * validated.limit;
    const items = filtered.slice(start, start + validated.limit);

    return { items, total, page: validated.page, limit: validated.limit, totalPages };
  },

  // ─── Reconciliation ──────────────────────────────────────────────────────

  /**
   * Start reconciliation
   */
  startReconciliation(
    trustAccountId: string,
    period: string,
    bankBalance: number,
    userId: string
  ): Reconciliation {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);

    const unreconciledTransactions = trustTransactions.filter(
      (t) => t.trustAccountId === trustAccountId && !t.isReconciled
    );

    const reconciliation: Reconciliation = {
      id: generateId(),
      trustAccountId,
      period,
      startDate: now(),
      endDate: now(),
      bookBalance: account.balance,
      bankBalance,
      reconciledBalance: account.balance,
      difference: bankBalance - account.balance,
      status: "in_progress",
      transactionIds: unreconciledTransactions.map((t) => t.id),
      reconciledTransactionIds: [],
      unreconciledCount: unreconciledTransactions.length,
      metadata: {},
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    account.status = "pending_reconciliation";
    account.updatedAt = now();
    account.updatedBy = userId;

    reconciliations.push(reconciliation);
    return reconciliation;
  },

  /**
   * Mark transaction as reconciled
   */
  reconcileTransaction(
    reconciliationId: string,
    transactionId: string,
    userId: string
  ): Reconciliation {
    const reconciliation = reconciliations.find(
      (r) => r.id === reconciliationId
    );
    if (!reconciliation) throw new Error(`Reconciliation not found: ${reconciliationId}`);
    if (reconciliation.status !== "in_progress") {
      throw new Error("Reconciliation is not in progress");
    }

    const transaction = trustTransactions.find(
      (t) => t.id === transactionId
    );
    if (!transaction) throw new Error(`Transaction not found: ${transactionId}`);
    if (transaction.trustAccountId !== reconciliation.trustAccountId) {
      throw new Error("Transaction does not belong to this trust account");
    }

    transaction.isReconciled = true;
    transaction.reconciledAt = now();
    transaction.reconciledBy = userId;
    transaction.updatedAt = now();

    reconciliation.reconciledTransactionIds.push(transactionId);
    reconciliation.unreconciledCount--;
    reconciliation.updatedAt = now();

    return reconciliation;
  },

  /**
   * Complete reconciliation
   */
  completeReconciliation(
    reconciliationId: string,
    bankBalance: number,
    userId: string,
    notes?: string
  ): Reconciliation {
    const reconciliation = reconciliations.find(
      (r) => r.id === reconciliationId
    );
    if (!reconciliation) throw new Error(`Reconciliation not found: ${reconciliationId}`);
    if (reconciliation.status !== "in_progress") {
      throw new Error("Reconciliation is not in progress");
    }

    const account = trustAccounts.find(
      (a) => a.id === reconciliation.trustAccountId
    );
    if (!account) throw new Error("Trust account not found");

    reconciliation.bankBalance = bankBalance;
    reconciliation.reconciledBalance = account.balance;
    reconciliation.difference = bankBalance - account.balance;
    reconciliation.endDate = now();

    if (Math.abs(reconciliation.difference) > 0.01) {
      reconciliation.status = "discrepancy_found";
      reconciliation.discrepancyNotes = notes;
    } else {
      reconciliation.status = "completed";
      reconciliation.completedBy = userId;
      reconciliation.completedAt = now();

      account.lastReconciledAt = now();
      account.lastReconciledBy = userId;
      account.lastReconciledBalance = account.balance;
      account.status = "active";
      account.updatedAt = now();
      account.updatedBy = userId;
    }

    reconciliation.updatedAt = now();
    return reconciliation;
  },

  /**
   * Get reconciliation history
   */
  getReconciliationHistory(trustAccountId: string): Reconciliation[] {
    return reconciliations
      .filter((r) => r.trustAccountId === trustAccountId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  // ─── Client Allocations ──────────────────────────────────────────────────

  /**
   * Get client allocation for trust account
   */
  getClientAllocation(
    trustAccountId: string,
    clientId: string,
    matterId: string
  ): TrustAccount["clientAllocations"][0] | undefined {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) return undefined;

    return account.clientAllocations.find(
      (a) => a.clientId === clientId && a.matterId === matterId
    );
  },

  /**
   * Reserve funds for a client matter
   */
  reserveFunds(
    trustAccountId: string,
    clientId: string,
    matterId: string,
    amount: number,
    userId: string
  ): TrustAccount {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);

    const allocation = account.clientAllocations.find(
      (a) => a.clientId === clientId && a.matterId === matterId
    );
    if (!allocation) {
      throw new Error("No allocation found for this client/matter");
    }

    const available = allocation.allocatedAmount - allocation.reservedAmount;
    if (amount > available) {
      throw new Error(
        `Insufficient available funds. Available: $${available.toFixed(2)}`
      );
    }

    allocation.reservedAmount += amount;
    account.reservedAmount += amount;
    account.availableBalance = account.balance - account.reservedAmount;
    account.updatedAt = now();
    account.updatedBy = userId;

    return account;
  },

  // ─── IOLTA Compliance ────────────────────────────────────────────────────

  /**
   * Generate IOLTA compliance report
   */
  getIOLTAComplianceReport(trustAccountId: string): IOLTAComplianceReport {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);

    const issues: string[] = [];
    const nowDate = new Date();

    if (!account.isIoltaCompliant) {
      issues.push("Account is not marked as IOLTA compliant");
    }

    let daysSinceReconciliation = Infinity;
    if (account.lastReconciledAt) {
      const lastRecon = new Date(account.lastReconciledAt);
      daysSinceReconciliation = Math.floor(
        (nowDate.getTime() - lastRecon.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceReconciliation > 30) {
        issues.push(
          `Last reconciliation was ${daysSinceReconciliation} days ago (should be monthly)`
        );
      }
    } else {
      issues.push("No reconciliation on record");
    }

    if (account.balance < 0) {
      issues.push("Account has a negative balance");
    }

    const hasUnearnedFunds = account.clientAllocations.some(
      (a) => a.allocatedAmount > 0
    );
    if (!hasUnearnedFunds && account.balance > 0) {
      issues.push("Account has funds but no client allocations");
    }

    const unauthorizedWithdrawals = trustTransactions.filter(
      (t) =>
        t.trustAccountId === trustAccountId &&
        t.type === "withdrawal" &&
        !t.approvedBy &&
        account.complianceFlags.requiresApprovalOver > 0 &&
        Math.abs(t.amount) > account.complianceFlags.requiresApprovalOver
    ).length;

    if (unauthorizedWithdrawals > 0) {
      issues.push(
        `${unauthorizedWithdrawals} withdrawals exceeded approval threshold without approval`
      );
    }

    const missingApprovals = trustTransactions.filter(
      (t) =>
        t.trustAccountId === trustAccountId &&
        t.requiresApproval &&
        !t.approvedBy
    ).length;

    if (missingApprovals > 0) {
      issues.push(`${missingApprovals} transactions pending approval`);
    }

    return {
      accountId: account.id,
      accountName: account.name,
      isCompliant: issues.length === 0,
      issues,
      lastReconciliationDate: account.lastReconciledAt,
      daysSinceReconciliation:
        daysSinceReconciliation === Infinity ? -1 : daysSinceReconciliation,
      hasNegativeBalance: account.balance < 0,
      hasUnearnedFunds,
      requiresDualSignature: account.complianceFlags.requiresDualSignature,
      unauthorizedWithdrawals,
      missingApprovals,
      interestAllocationRequired: account.type === "iolta",
      lastAuditDate: account.metadata.lastAuditDate as string | undefined,
      nextAuditDue: account.metadata.nextAuditDue as string | undefined,
    };
  },

  // ─── Reports ─────────────────────────────────────────────────────────────

  /**
   * Generate trust account report
   */
  getReport(trustAccountId: string): TrustAccountReport {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);

    const transactions = trustTransactions.filter(
      (t) => t.trustAccountId === trustAccountId
    );

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalInterest = 0;
    let totalFees = 0;
    let unreconciledCount = 0;
    let unreconciledAmount = 0;

    const byCategoryMap = new Map<
      TrustTransactionCategory,
      { count: number; amount: number }
    >();
    const byClientMap = new Map<
      string,
      { clientName: string; balance: number }
    >();
    const byMatterMap = new Map<
      string,
      { matterNumber: string; balance: number }
    >();
    const dailyBalanceMap = new Map<string, number>();

    for (const txn of transactions) {
      if (txn.amount > 0) {
        totalDeposits += txn.amount;
      } else {
        totalWithdrawals += Math.abs(txn.amount);
      }

      if (txn.type === "interest") {
        totalInterest += txn.amount;
      }
      if (txn.type === "fee") {
        totalFees += Math.abs(txn.amount);
      }

      if (!txn.isReconciled) {
        unreconciledCount++;
        unreconciledAmount += Math.abs(txn.amount);
      }

      const catExisting = byCategoryMap.get(txn.category) ?? {
        count: 0,
        amount: 0,
      };
      catExisting.count++;
      catExisting.amount += txn.amount;
      byCategoryMap.set(txn.category, catExisting);

      if (txn.clientId) {
        const clientExisting = byClientMap.get(txn.clientId) ?? {
          clientName: txn.clientName ?? "",
          balance: 0,
        };
        clientExisting.balance += txn.amount;
        byClientMap.set(txn.clientId, clientExisting);
      }

      if (txn.matterId) {
        const matterExisting = byMatterMap.get(txn.matterId) ?? {
          matterNumber: txn.matterNumber ?? "",
          balance: 0,
        };
        matterExisting.balance += txn.amount;
        byMatterMap.set(txn.matterId, matterExisting);
      }

      const dateKey = txn.createdAt.substring(0, 10);
      dailyBalanceMap.set(dateKey, txn.balanceAfter);
    }

    return {
      account,
      totalDeposits,
      totalWithdrawals,
      totalInterest,
      totalFees,
      netFlow: totalDeposits - totalWithdrawals,
      transactionCount: transactions.length,
      byCategory: Array.from(byCategoryMap.entries()).map(
        ([category, data]) => ({ category, ...data })
      ),
      byClient: Array.from(byClientMap.entries()).map(([clientId, data]) => ({
        clientId,
        ...data,
      })),
      byMatter: Array.from(byMatterMap.entries()).map(([matterId, data]) => ({
        matterId,
        ...data,
      })),
      unreconciledCount,
      unreconciledAmount,
      dailyBalances: Array.from(dailyBalanceMap.entries())
        .map(([date, balance]) => ({ date, balance }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },

  /**
   * Get all unacknowledged alerts across trust accounts
   */
  getComplianceAlerts(): {
    accountId: string;
    accountName: string;
    issues: string[];
  }[] {
    const alerts: {
      accountId: string;
      accountName: string;
      issues: string[];
    }[] = [];

    for (const account of trustAccounts) {
      if (account.status === "closed") continue;

      const report = TrustAccountService.getIOLTAComplianceReport(account.id);
      if (!report.isCompliant) {
        alerts.push({
          accountId: account.id,
          accountName: account.name,
          issues: report.issues,
        });
      }
    }

    return alerts;
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    trustAccounts = [];
    trustTransactions = [];
    reconciliations = [];
    trustAccountCounter = 1;
    trustTransactionCounter = 1;
    reconciliationCounter = 1;
  },
};
