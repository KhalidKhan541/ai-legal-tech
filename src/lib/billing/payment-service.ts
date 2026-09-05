import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const PaymentStatus = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "partially_refunded",
  "voided",
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PaymentMethod = z.enum([
  "credit_card",
  "debit_card",
  "bank_transfer",
  "wire",
  "check",
  "cash",
  "ach",
  "trust_account",
  "retainer",
  "other",
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const PaymentPlanStatus = z.enum([
  "active",
  "completed",
  "defaulted",
  "suspended",
  "cancelled",
]);
export type PaymentPlanStatus = z.infer<typeof PaymentPlanStatus>;

export const TrustAccountType = z.enum([
  "iolta",
  "client_trust",
  "retainer",
  "settlement",
  "escrow",
]);
export type TrustAccountType = z.infer<typeof TrustAccountType>;

export const TrustTransactionType = z.enum([
  "deposit",
  "withdrawal",
  "transfer_in",
  "transfer_out",
  "interest",
  "fee",
  "refund",
  "reconciliation_adjustment",
]);
export type TrustTransactionType = z.infer<typeof TrustTransactionType>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  method: PaymentMethod,
  status: PaymentStatus,
  reference: z.string().optional(),
  transactionId: z.string().optional(),
  checkNumber: z.string().optional(),
  paymentDate: z.string().datetime(),
  processedAt: z.string().datetime().optional(),
  failedAt: z.string().datetime().optional(),
  failureReason: z.string().optional(),
  refundedAmount: z.number().min(0).default(0),
  refundDate: z.string().datetime().optional(),
  refundReason: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  trustAccountId: z.string().uuid().optional(),
  allocation: z
    .array(
      z.object({
        invoiceId: z.string().uuid(),
        amount: z.number().min(0),
      })
    )
    .default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const CreatePaymentSchema = PaymentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  processedAt: true,
  failedAt: true,
  failureReason: true,
  refundedAmount: true,
  refundDate: true,
  refundReason: true,
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const PaymentPlanSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  invoiceIds: z.array(z.string().uuid()).default([]),
  totalAmount: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  remainingAmount: z.number().min(0),
  numberOfInstallments: z.number().min(1),
  installmentAmount: z.number().min(0),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  startDate: z.string().datetime(),
  nextPaymentDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: PaymentPlanStatus,
  autoCharge: z.boolean().default(false),
  paymentMethodId: z.string().optional(),
  installments: z
    .array(
      z.object({
        number: z.number(),
        amount: z.number(),
        dueDate: z.string().datetime(),
        paidDate: z.string().datetime().optional(),
        paymentId: z.string().uuid().optional(),
        status: z.enum(["pending", "paid", "missed", "waived"]),
      })
    )
    .default([]),
  lateFeePercent: z.number().min(0).max(100).default(0),
  gracePeriodDays: z.number().min(0).default(0),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type PaymentPlan = z.infer<typeof PaymentPlanSchema>;

export const CreatePaymentPlanSchema = PaymentPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  paidAmount: true,
  remainingAmount: true,
  installments: true,
  status: true,
});

export type CreatePaymentPlanInput = z.infer<typeof CreatePaymentPlanSchema>;

export const TrustAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: TrustAccountType,
  accountNumber: z.string(),
  bankName: z.string().optional(),
  routingNumber: z.string().optional(),
  balance: z.number().default(0),
  availableBalance: z.number().default(0),
  reservedAmount: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  isActive: z.boolean().default(true),
  isIoltaCompliant: z.boolean().default(false),
  lastReconciledAt: z.string().datetime().optional(),
  lastReconciledBy: z.string().uuid().optional(),
  interestRate: z.number().min(0).default(0),
  interestAccrualDate: z.string().datetime().optional(),
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
  type: TrustTransactionType,
  amount: z.number(),
  balanceAfter: z.number(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  matterId: z.string().uuid().optional(),
  matterNumber: z.string().optional(),
  description: z.string().min(1).max(500),
  reference: z.string().optional(),
  paymentId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  isReconciled: z.boolean().default(false),
  reconciledAt: z.string().datetime().optional(),
  reconciledBy: z.string().uuid().optional(),
  bankTransactionId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type TrustTransaction = z.infer<typeof TrustTransactionSchema>;

export const PaymentReminderSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  clientId: z.string().uuid(),
  type: z.enum(["upcoming", "due", "overdue", "final"]),
  scheduledDate: z.string().datetime(),
  sentAt: z.string().datetime().optional(),
  status: z.enum(["scheduled", "sent", "failed", "cancelled"]),
  method: z.enum(["email", "sms", "portal"]),
  template: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PaymentReminder = z.infer<typeof PaymentReminderSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  successfulAmount: number;
  failedPayments: number;
  refundedAmount: number;
  byMethod: Record<PaymentMethod, { count: number; amount: number }>;
  byMonth: { month: string; count: number; amount: number }[];
  averagePaymentAmount: number;
  averageDaysToPay: number;
  collectionRate: number;
}

export interface LateFeeConfig {
  enabled: boolean;
  percent: number;
  maxFee: number;
  gracePeriodDays: number;
  compoundingEnabled: boolean;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let payments: Payment[] = [];
let paymentPlans: PaymentPlan[] = [];
let trustAccounts: TrustAccount[] = [];
let trustTransactions: TrustTransaction[] = [];
let reminders: PaymentReminder[] = [];
let paymentCounter = 1;
let planCounter = 1;
let trustAccountCounter = 1;
let trustTransactionCounter = 1;
let reminderCounter = 1;

const DEFAULT_LATE_FEE_CONFIG: LateFeeConfig = {
  enabled: true,
  percent: 1.5,
  maxFee: 500,
  gracePeriodDays: 10,
  compoundingEnabled: false,
};

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function calculateDaysOverdue(dueDate: string): number {
  const nowDate = new Date();
  const due = new Date(dueDate);
  if (due >= nowDate) return 0;
  return Math.floor((nowDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Payment Service ────────────────────────────────────────────────────────

export const PaymentService = {
  /**
   * Record a new payment
   */
  create(input: CreatePaymentInput, userId: string): Payment {
    const validated = CreatePaymentSchema.parse(input);

    const payment: Payment = {
      ...validated,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    payments.push(payment);
    return payment;
  },

  /**
   * Process a payment (simulate payment processing)
   */
  async process(paymentId: string, userId: string): Promise<Payment> {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error(`Payment not found: ${paymentId}`);
    if (payment.status !== "pending") {
      throw new Error(`Cannot process payment with status "${payment.status}"`);
    }

    payment.status = "processing";
    payment.updatedAt = now();
    payment.updatedBy = userId;

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      payment.status = "completed";
      payment.processedAt = now();
      payment.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      payment.updatedAt = now();
    } catch (error) {
      payment.status = "failed";
      payment.failedAt = now();
      payment.failureReason =
        error instanceof Error ? error.message : "Processing failed";
      payment.updatedAt = now();
    }

    return payment;
  },

  /**
   * Get payment by ID
   */
  getById(id: string): Payment | undefined {
    return payments.find((p) => p.id === id);
  },

  /**
   * Refund a payment
   */
  refund(
    id: string,
    amount: number,
    reason: string,
    userId: string
  ): Payment {
    const payment = payments.find((p) => p.id === id);
    if (!payment) throw new Error(`Payment not found: ${id}`);
    if (payment.status !== "completed") {
      throw new Error(
        `Cannot refund payment with status "${payment.status}". Must be completed.`
      );
    }
    if (amount <= 0) throw new Error("Refund amount must be positive");
    if (amount > payment.amount - payment.refundedAmount) {
      throw new Error(
        `Refund amount exceeds available amount. Maximum refund: ${payment.amount - payment.refundedAmount}`
      );
    }

    payment.refundedAmount += amount;
    payment.refundDate = now();
    payment.refundReason = reason;

    if (payment.refundedAmount >= payment.amount) {
      payment.status = "refunded";
    } else {
      payment.status = "partially_refunded";
    }

    payment.updatedAt = now();
    payment.updatedBy = userId;
    return payment;
  },

  /**
   * Void a payment
   */
  void(id: string, userId: string, reason?: string): Payment {
    const payment = payments.find((p) => p.id === id);
    if (!payment) throw new Error(`Payment not found: ${id}`);
    if (payment.status === "refunded" || payment.status === "partially_refunded") {
      throw new Error("Cannot void a refunded payment");
    }

    payment.status = "voided";
    payment.metadata = { ...payment.metadata, voidReason: reason };
    payment.updatedAt = now();
    payment.updatedBy = userId;
    return payment;
  },

  /**
   * Record payment against invoice with allocation
   */
  recordAgainstInvoice(
    invoiceId: string,
    amount: number,
    method: PaymentMethod,
    clientId: string,
    clientName: string,
    userId: string,
    options?: {
      paymentDate?: string;
      reference?: string;
      notes?: string;
      trustAccountId?: string;
    }
  ): Payment {
    const payment = PaymentService.create(
      {
        invoiceId,
        clientId,
        clientName,
        amount,
        method,
        status: "completed",
        paymentDate: options?.paymentDate ?? now(),
        reference: options?.reference,
        notes: options?.notes,
        trustAccountId: options?.trustAccountId,
        allocation: [{ invoiceId, amount }],
        metadata: {},
      },
      userId
    );

    payment.processedAt = now();
    payment.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return payment;
  },

  // ─── Payment Plans ───────────────────────────────────────────────────────

  /**
   * Create a payment plan
   */
  createPaymentPlan(input: CreatePaymentPlanInput, userId: string): PaymentPlan {
    const validated = CreatePaymentPlanSchema.parse(input);
    const installmentAmount =
      validated.totalAmount / validated.numberOfInstallments;

    const installments: PaymentPlan["installments"] = [];
    let currentDate = new Date(validated.startDate);

    for (let i = 1; i <= validated.numberOfInstallments; i++) {
      installments.push({
        number: i,
        amount: installmentAmount,
        dueDate: currentDate.toISOString(),
        status: "pending",
      });

      switch (validated.frequency) {
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "biweekly":
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    const plan: PaymentPlan = {
      ...validated,
      id: generateId(),
      paidAmount: 0,
      remainingAmount: validated.totalAmount,
      installments,
      status: "active",
      nextPaymentDate: validated.startDate,
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    paymentPlans.push(plan);
    return plan;
  },

  /**
   * Record installment payment
   */
  recordInstallmentPayment(
    planId: string,
    installmentNumber: number,
    paymentId: string,
    userId: string
  ): PaymentPlan {
    const plan = paymentPlans.find((p) => p.id === planId);
    if (!plan) throw new Error(`Payment plan not found: ${planId}`);
    if (plan.status !== "active") {
      throw new Error(`Payment plan is not active. Status: ${plan.status}`);
    }

    const installment = plan.installments.find(
      (i) => i.number === installmentNumber
    );
    if (!installment) throw new Error(`Installment ${installmentNumber} not found`);
    if (installment.status === "paid") {
      throw new Error(`Installment ${installmentNumber} is already paid`);
    }

    installment.status = "paid";
    installment.paidDate = now();
    installment.paymentId = paymentId;

    plan.paidAmount += installment.amount;
    plan.remainingAmount = plan.totalAmount - plan.paidAmount;

    const nextPending = plan.installments.find((i) => i.status === "pending");
    if (nextPending) {
      plan.nextPaymentDate = nextPending.dueDate;
    }

    if (plan.paidAmount >= plan.totalAmount) {
      plan.status = "completed";
    }

    plan.updatedAt = now();
    plan.updatedBy = userId;
    return plan;
  },

  /**
   * Check for missed installments and apply late fees
   */
  checkMissedInstallments(
    lateFeeConfig: LateFeeConfig = DEFAULT_LATE_FEE_CONFIG
  ): { planId: string; installmentNumber: number; lateFee: number }[] {
    const results: { planId: string; installmentNumber: number; lateFee: number }[] = [];
    const nowDate = new Date();

    for (const plan of paymentPlans) {
      if (plan.status !== "active") continue;

      for (const installment of plan.installments) {
        if (installment.status !== "pending") continue;

        const dueDate = new Date(installment.dueDate);
        const daysOverdue = Math.max(
          0,
          Math.floor((nowDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        if (daysOverdue > plan.gracePeriodDays + lateFeeConfig.gracePeriodDays) {
          installment.status = "missed";

          if (lateFeeConfig.enabled) {
            let lateFee =
              installment.amount * (lateFeeConfig.percent / 100);
            lateFee = Math.min(lateFee, lateFeeConfig.maxFee);

            results.push({
              planId: plan.id,
              installmentNumber: installment.number,
              lateFee,
            });
          }
        }
      }
    }

    return results;
  },

  /**
   * Get payment plan by ID
   */
  getPaymentPlanById(id: string): PaymentPlan | undefined {
    return paymentPlans.find((p) => p.id === id);
  },

  /**
   * Suspend payment plan
   */
  suspendPaymentPlan(id: string, userId: string): PaymentPlan {
    const plan = paymentPlans.find((p) => p.id === id);
    if (!plan) throw new Error(`Payment plan not found: ${id}`);
    if (plan.status !== "active") {
      throw new Error(`Cannot suspend plan with status "${plan.status}"`);
    }

    plan.status = "suspended";
    plan.updatedAt = now();
    plan.updatedBy = userId;
    return plan;
  },

  /**
   * Cancel payment plan
   */
  cancelPaymentPlan(id: string, userId: string): PaymentPlan {
    const plan = paymentPlans.find((p) => p.id === id);
    if (!plan) throw new Error(`Payment plan not found: ${id}`);

    plan.status = "cancelled";
    plan.updatedAt = now();
    plan.updatedBy = userId;
    return plan;
  },

  // ─── Trust Accounts ──────────────────────────────────────────────────────

  /**
   * Create trust account
   */
  createTrustAccount(
    input: Omit<TrustAccount, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "balance" | "availableBalance" | "reservedAmount">,
    userId: string
  ): TrustAccount {
    const account: TrustAccount = {
      ...input,
      id: generateId(),
      balance: 0,
      availableBalance: 0,
      reservedAmount: 0,
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    trustAccounts.push(account);
    return account;
  },

  /**
   * Record trust deposit
   */
  trustDeposit(
    trustAccountId: string,
    amount: number,
    clientId: string,
    clientName: string,
    matterId: string,
    matterNumber: string,
    description: string,
    userId: string,
    options?: { reference?: string; paymentId?: string }
  ): TrustTransaction {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);
    if (!account.isActive) throw new Error("Trust account is not active");
    if (amount <= 0) throw new Error("Deposit amount must be positive");

    account.balance += amount;
    account.availableBalance += amount;
    account.updatedAt = now();
    account.updatedBy = userId;

    const transaction: TrustTransaction = {
      id: generateId(),
      trustAccountId,
      type: "deposit",
      amount,
      balanceAfter: account.balance,
      clientId,
      clientName,
      matterId,
      matterNumber,
      description,
      reference: options?.reference,
      paymentId: options?.paymentId,
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
   * Record trust withdrawal
   */
  trustWithdrawal(
    trustAccountId: string,
    amount: number,
    clientId: string,
    clientName: string,
    matterId: string,
    matterNumber: string,
    description: string,
    userId: string,
    options?: { invoiceId?: string; reference?: string }
  ): TrustTransaction {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);
    if (!account.isActive) throw new Error("Trust account is not active");
    if (amount <= 0) throw new Error("Withdrawal amount must be positive");
    if (amount > account.availableBalance) {
      throw new Error(
        `Insufficient funds. Available: ${account.availableBalance}, Requested: ${amount}`
      );
    }

    account.balance -= amount;
    account.availableBalance -= amount;
    account.updatedAt = now();
    account.updatedBy = userId;

    const transaction: TrustTransaction = {
      id: generateId(),
      trustAccountId,
      type: "withdrawal",
      amount: -amount,
      balanceAfter: account.balance,
      clientId,
      clientName,
      matterId,
      matterNumber,
      description,
      invoiceId: options?.invoiceId,
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
   * Transfer between trust accounts
   */
  trustTransfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
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
        `Insufficient funds in source account. Available: ${fromAccount.availableBalance}`
      );
    }

    fromAccount.balance -= amount;
    fromAccount.availableBalance -= amount;
    fromAccount.updatedAt = now();
    fromAccount.updatedBy = userId;

    toAccount.balance += amount;
    toAccount.availableBalance += amount;
    toAccount.updatedAt = now();
    toAccount.updatedBy = userId;

    const withdrawal: TrustTransaction = {
      id: generateId(),
      trustAccountId: fromAccountId,
      type: "transfer_out",
      amount: -amount,
      balanceAfter: fromAccount.balance,
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
      amount,
      balanceAfter: toAccount.balance,
      description,
      isReconciled: false,
      metadata: { sourceAccountId: fromAccountId },
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    trustTransactions.push(withdrawal, deposit);
    return { withdrawal, deposit };
  },

  /**
   * Get trust account by ID
   */
  getTrustAccountById(id: string): TrustAccount | undefined {
    return trustAccounts.find((a) => a.id === id);
  },

  /**
   * Get trust transactions
   */
  getTrustTransactions(
    trustAccountId: string,
    filter?: {
      type?: TrustTransactionType[];
      clientId?: string;
      matterId?: string;
      dateFrom?: string;
      dateTo?: string;
      isReconciled?: boolean;
      page?: number;
      limit?: number;
    }
  ): PaginatedResult<TrustTransaction> {
    let transactions = trustTransactions.filter(
      (t) => t.trustAccountId === trustAccountId
    );

    if (filter) {
      if (filter.type?.length) {
        transactions = transactions.filter((t) =>
          filter.type!.includes(t.type)
        );
      }
      if (filter.clientId) {
        transactions = transactions.filter(
          (t) => t.clientId === filter.clientId
        );
      }
      if (filter.matterId) {
        transactions = transactions.filter(
          (t) => t.matterId === filter.matterId
        );
      }
      if (filter.dateFrom) {
        transactions = transactions.filter(
          (t) => new Date(t.createdAt) >= new Date(filter.dateFrom!)
        );
      }
      if (filter.dateTo) {
        transactions = transactions.filter(
          (t) => new Date(t.createdAt) <= new Date(filter.dateTo!)
        );
      }
      if (filter.isReconciled !== undefined) {
        transactions = transactions.filter(
          (t) => t.isReconciled === filter.isReconciled
        );
      }
    }

    transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const total = transactions.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = transactions.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  },

  /**
   * Reconcile trust account
   */
  reconcileTrustAccount(
    trustAccountId: string,
    transactionIds: string[],
    userId: string
  ): { reconciled: string[]; balance: number } {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);

    const reconciled: string[] = [];
    for (const txnId of transactionIds) {
      const txn = trustTransactions.find(
        (t) => t.id === txnId && t.trustAccountId === trustAccountId
      );
      if (txn && !txn.isReconciled) {
        txn.isReconciled = true;
        txn.reconciledAt = now();
        txn.reconciledBy = userId;
        txn.updatedAt = now();
        reconciled.push(txnId);
      }
    }

    account.lastReconciledAt = now();
    account.lastReconciledBy = userId;
    account.updatedAt = now();
    account.updatedBy = userId;

    return { reconciled, balance: account.balance };
  },

  /**
   * Generate trust account report
   */
  getTrustAccountReport(trustAccountId: string): {
    account: TrustAccount;
    totalDeposits: number;
    totalWithdrawals: number;
    transactionCount: number;
    byClient: { clientId: string; clientName: string; balance: number }[];
    byMatter: { matterId: string; matterNumber: string; balance: number }[];
    unreconciledCount: number;
    unreconciledAmount: number;
  } {
    const account = trustAccounts.find((a) => a.id === trustAccountId);
    if (!account) throw new Error(`Trust account not found: ${trustAccountId}`);

    const transactions = trustTransactions.filter(
      (t) => t.trustAccountId === trustAccountId
    );

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let unreconciledCount = 0;
    let unreconciledAmount = 0;
    const clientMap = new Map<string, { clientName: string; balance: number }>();
    const matterMap = new Map<string, { matterNumber: string; balance: number }>();

    for (const txn of transactions) {
      if (txn.amount > 0) {
        totalDeposits += txn.amount;
      } else {
        totalWithdrawals += Math.abs(txn.amount);
      }

      if (!txn.isReconciled) {
        unreconciledCount++;
        unreconciledAmount += Math.abs(txn.amount);
      }

      if (txn.clientId) {
        const existing = clientMap.get(txn.clientId) ?? {
          clientName: txn.clientName ?? "",
          balance: 0,
        };
        existing.balance += txn.amount;
        clientMap.set(txn.clientId, existing);
      }

      if (txn.matterId) {
        const existing = matterMap.get(txn.matterId) ?? {
          matterNumber: txn.matterNumber ?? "",
          balance: 0,
        };
        existing.balance += txn.amount;
        matterMap.set(txn.matterId, existing);
      }
    }

    return {
      account,
      totalDeposits,
      totalWithdrawals,
      transactionCount: transactions.length,
      byClient: Array.from(clientMap.entries()).map(([clientId, data]) => ({
        clientId,
        ...data,
      })),
      byMatter: Array.from(matterMap.entries()).map(([matterId, data]) => ({
        matterId,
        ...data,
      })),
      unreconciledCount,
      unreconciledAmount,
    };
  },

  // ─── Payment Reminders ───────────────────────────────────────────────────

  /**
   * Create payment reminder
   */
  createReminder(
    invoiceId: string,
    clientId: string,
    type: PaymentReminder["type"],
    scheduledDate: string,
    method: PaymentReminder["method"],
    template?: string
  ): PaymentReminder {
    const reminder: PaymentReminder = {
      id: generateId(),
      invoiceId,
      clientId,
      type,
      scheduledDate,
      status: "scheduled",
      method,
      template,
      metadata: {},
      createdAt: now(),
      updatedAt: now(),
    };

    reminders.push(reminder);
    return reminder;
  },

  /**
   * Get pending reminders
   */
  getPendingReminders(): PaymentReminder[] {
    const nowDate = new Date();
    return reminders.filter(
      (r) =>
        r.status === "scheduled" &&
        new Date(r.scheduledDate) <= nowDate
    );
  },

  /**
   * Mark reminder as sent
   */
  markReminderSent(id: string): PaymentReminder {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) throw new Error(`Reminder not found: ${id}`);

    reminder.status = "sent";
    reminder.sentAt = now();
    reminder.updatedAt = now();
    return reminder;
  },

  /**
   * Auto-generate reminders for overdue invoices
   */
  generateOverdueReminders(): PaymentReminder[] {
    const nowDate = new Date();
    const created: PaymentReminder[] = [];

    const overdueInvoices = invoices.filter(
      (i) =>
        i.balanceDue > 0 &&
        new Date(i.dueDate) < nowDate &&
        i.status !== "paid" &&
        i.status !== "voided" &&
        i.status !== "written_off"
    );

    for (const invoice of overdueInvoices) {
      const daysOverdue = calculateDaysOverdue(invoice.dueDate);

      const existingReminders = reminders.filter(
        (r) => r.invoiceId === invoice.id && r.status !== "cancelled"
      );

      let reminderType: PaymentReminder["type"];
      if (daysOverdue > 60) {
        reminderType = "final";
      } else if (daysOverdue > 30) {
        reminderType = "overdue";
      } else if (daysOverdue > 0) {
        reminderType = "due";
      } else {
        reminderType = "upcoming";
      }

      const alreadyHasType = existingReminders.some(
        (r) => r.type === reminderType
      );
      if (!alreadyHasType) {
        const reminder = PaymentService.createReminder(
          invoice.id,
          invoice.clientId,
          reminderType,
          now(),
          "email"
        );
        created.push(reminder);
      }
    }

    return created;
  },

  // ─── Search & Stats ──────────────────────────────────────────────────────

  /**
   * Search payments
   */
  searchPayments(filter: {
    clientId?: string;
    invoiceId?: string;
    status?: PaymentStatus[];
    method?: PaymentMethod[];
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): PaginatedResult<Payment> {
    let filtered = [...payments];

    if (filter.clientId) {
      filtered = filtered.filter((p) => p.clientId === filter.clientId);
    }
    if (filter.invoiceId) {
      filtered = filtered.filter((p) => p.invoiceId === filter.invoiceId);
    }
    if (filter.status?.length) {
      filtered = filtered.filter((p) => filter.status!.includes(p.status));
    }
    if (filter.method?.length) {
      filtered = filtered.filter((p) => filter.method!.includes(p.method));
    }
    if (filter.dateFrom) {
      filtered = filtered.filter(
        (p) => new Date(p.paymentDate) >= new Date(filter.dateFrom!)
      );
    }
    if (filter.dateTo) {
      filtered = filtered.filter(
        (p) => new Date(p.paymentDate) <= new Date(filter.dateTo!)
      );
    }
    if (filter.minAmount !== undefined) {
      filtered = filtered.filter((p) => p.amount >= filter.minAmount!);
    }
    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter((p) => p.amount <= filter.maxAmount!);
    }
    if (filter.search) {
      const term = filter.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.clientName.toLowerCase().includes(term) ||
          p.reference?.toLowerCase().includes(term) ||
          p.transactionId?.toLowerCase().includes(term)
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() -
        new Date(a.paymentDate).getTime()
    );

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  },

  /**
   * Get payment statistics
   */
  getStats(dateFrom?: string, dateTo?: string): PaymentStats {
    let filtered = [...payments];

    if (dateFrom) {
      filtered = filtered.filter(
        (p) => new Date(p.paymentDate) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (p) => new Date(p.paymentDate) <= new Date(dateTo)
      );
    }

    const byMethod: Record<PaymentMethod, { count: number; amount: number }> = {
      credit_card: { count: 0, amount: 0 },
      debit_card: { count: 0, amount: 0 },
      bank_transfer: { count: 0, amount: 0 },
      wire: { count: 0, amount: 0 },
      check: { count: 0, amount: 0 },
      cash: { count: 0, amount: 0 },
      ach: { count: 0, amount: 0 },
      trust_account: { count: 0, amount: 0 },
      retainer: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 },
    };

    const byMonthMap = new Map<string, { count: number; amount: number }>();
    let successfulPayments = 0;
    let successfulAmount = 0;
    let failedPayments = 0;
    let refundedAmount = 0;

    for (const payment of filtered) {
      byMethod[payment.method].count++;
      byMethod[payment.method].amount += payment.amount;

      const month = payment.paymentDate.substring(0, 7);
      const existing = byMonthMap.get(month) ?? { count: 0, amount: 0 };
      existing.count++;
      existing.amount += payment.amount;
      byMonthMap.set(month, existing);

      if (payment.status === "completed") {
        successfulPayments++;
        successfulAmount += payment.amount;
      } else if (payment.status === "failed") {
        failedPayments++;
      }

      refundedAmount += payment.refundedAmount;
    }

    return {
      totalPayments: filtered.length,
      totalAmount: filtered.reduce((sum, p) => sum + p.amount, 0),
      successfulPayments,
      successfulAmount,
      failedPayments,
      refundedAmount,
      byMethod,
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      averagePaymentAmount:
        filtered.length > 0
          ? filtered.reduce((sum, p) => sum + p.amount, 0) / filtered.length
          : 0,
      averageDaysToPay: 0,
      collectionRate:
        filtered.length > 0
          ? (successfulPayments / filtered.length) * 100
          : 0,
    };
  },

  /**
   * Calculate late fee for an invoice
   */
  calculateLateFee(
    dueDate: string,
    amount: number,
    config: LateFeeConfig = DEFAULT_LATE_FEE_CONFIG
  ): number {
    if (!config.enabled) return 0;

    const daysOverdue = calculateDaysOverdue(dueDate);
    if (daysOverdue <= config.gracePeriodDays) return 0;

    const lateFee = amount * (config.percent / 100);
    return Math.min(lateFee, config.maxFee);
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    payments = [];
    paymentPlans = [];
    trustAccounts = [];
    trustTransactions = [];
    reminders = [];
    paymentCounter = 1;
    planCounter = 1;
    trustAccountCounter = 1;
    trustTransactionCounter = 1;
    reminderCounter = 1;
  },
};

// Reference to invoices for reminder generation
const invoices: { id: string; balanceDue: number; dueDate: string; clientId: string; clientName: string; status: string }[] = [];
