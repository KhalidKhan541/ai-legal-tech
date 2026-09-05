import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const BudgetType = z.enum([
  "fixed",
  "hourly",
  "contingency",
  "capped",
  "retainer",
]);
export type BudgetType = z.infer<typeof BudgetType>;

export const BudgetStatus = z.enum([
  "draft",
  "active",
  "on_hold",
  "completed",
  "exceeded",
  "cancelled",
]);
export type BudgetStatus = z.infer<typeof BudgetStatus>;

export const AlertType = z.enum([
  "threshold_50",
  "threshold_75",
  "threshold_90",
  "threshold_100",
  "exceeded",
  "daily_burn_rate",
  "weekly_burn_rate",
]);
export type AlertType = z.infer<typeof AlertType>;

export const WriteOffReason = z.enum([
  "client_dispute",
  "courtesy_adjustment",
  "scope_change",
  "budget_cap",
  "early_payment",
  "other",
]);
export type WriteOffReason = z.infer<typeof WriteOffReason>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  matterNumber: z.string(),
  matterTitle: z.string(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  type: BudgetType,
  status: BudgetStatus,
  currency: z.string().default("USD"),
  totalBudget: z.number().min(0),
  spentAmount: z.number().min(0).default(0),
  remainingAmount: z.number().min(0),
  spentHours: z.number().min(0).default(0),
  estimatedHours: z.number().min(0).default(0),
  hourlyRate: z.number().min(0).default(0),
  alertThresholds: z
    .object({
      percent50: z.boolean().default(true),
      percent75: z.boolean().default(true),
      percent90: z.boolean().default(true),
      percent100: z.boolean().default(true),
    })
    .default({}),
  alerts: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: AlertType,
        message: z.string(),
        threshold: z.number(),
        triggeredAt: z.string().datetime(),
        acknowledged: z.boolean().default(false),
        acknowledgedBy: z.string().uuid().optional(),
        acknowledgedAt: z.string().datetime().optional(),
      })
    )
    .default([]),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const CreateBudgetSchema = BudgetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  spentAmount: true,
  remainingAmount: true,
  spentHours: true,
  alerts: true,
  approvedBy: true,
  approvedAt: true,
});

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;

export const UpdateBudgetSchema = BudgetSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>;

export const BudgetFilterSchema = z.object({
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  status: z.array(BudgetStatus).optional(),
  type: z.array(BudgetType).optional(),
  isExceeded: z.boolean().optional(),
  hasAlerts: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum([
      "totalBudget",
      "spentAmount",
      "remainingAmount",
      "percentUsed",
      "createdAt",
      "updatedAt",
    ])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type BudgetFilter = z.infer<typeof BudgetFilterSchema>;

export const WriteOffSchema = z.object({
  id: z.string().uuid(),
  budgetId: z.string().uuid(),
  matterId: z.string().uuid(),
  amount: z.number().min(0),
  reason: WriteOffReason,
  description: z.string().min(1).max(2000),
  approvedBy: z.string().uuid(),
  approvedAt: z.string().datetime(),
  invoiceId: z.string().uuid().optional(),
  entryIds: z.array(z.string().uuid()).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type WriteOff = z.infer<typeof WriteOffSchema>;

export const CreateWriteOffSchema = WriteOffSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  approvedAt: true,
});

export type CreateWriteOffInput = z.infer<typeof CreateWriteOffSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: AlertType;
  message: string;
  threshold: number;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface BudgetTracking {
  budgetId: string;
  matterId: string;
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  spentHours: number;
  estimatedHours: number;
  hourlyRate: number;
  dailyBurnRate: number;
  weeklyBurnRate: number;
  monthlyBurnRate: number;
  projectedTotal: number;
  daysRemaining: number;
  status: "on_track" | "warning" | "critical" | "exceeded";
  trend: "improving" | "stable" | "worsening";
}

export interface ProfitabilityAnalysis {
  matterId: string;
  matterNumber: string;
  matterTitle: string;
  clientName: string;
  totalRevenue: number;
  totalCosts: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  realizationRate: number;
  collectionRate: number;
  effectiveHourlyRate: number;
  costPerHour: number;
  budgetVariance: number;
  budgetVariancePercent: number;
  writeOffs: number;
  adjustments: number;
  netRevenue: number;
  roi: number;
}

export interface WriteOffReport {
  totalWriteOffs: number;
  totalAmount: number;
  byReason: { reason: WriteOffReason; count: number; amount: number }[];
  byMatter: { matterId: string; matterNumber: string; amount: number }[];
  byMonth: { month: string; count: number; amount: number }[];
  byApprover: { approverId: string; count: number; amount: number }[];
  averageWriteOff: number;
  writeOffRate: number;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let budgets: Budget[] = [];
let writeOffs: WriteOff[] = [];
let budgetAlerts: BudgetAlert[] = [];
let budgetCounter = 1;
let writeOffCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function calculateBurnRate(
  spentAmount: number,
  startDate: string
): { daily: number; weekly: number; monthly: number } {
  const start = new Date(startDate);
  const current = new Date();
  const daysElapsed = Math.max(
    1,
    Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  const daily = spentAmount / daysElapsed;
  const weekly = daily * 7;
  const monthly = daily * 30;

  return { daily, weekly, monthly };
}

function checkBudgetAlerts(
  budget: Budget,
  spentPercent: number
): BudgetAlert[] {
  const newAlerts: BudgetAlert[] = [];

  if (
    budget.alertThresholds.percent50 &&
    spentPercent >= 50 &&
    !budget.alerts.some((a) => a.type === "threshold_50")
  ) {
    const alert: BudgetAlert = {
      id: generateId(),
      budgetId: budget.id,
      type: "threshold_50",
      message: `Budget is ${spentPercent.toFixed(1)}% used ($${budget.spentAmount.toFixed(2)} of $${budget.totalBudget.toFixed(2)})`,
      threshold: 50,
      triggeredAt: now(),
      acknowledged: false,
    };
    newAlerts.push(alert);
    budget.alerts.push(alert);
    budgetAlerts.push(alert);
  }

  if (
    budget.alertThresholds.percent75 &&
    spentPercent >= 75 &&
    !budget.alerts.some((a) => a.type === "threshold_75")
  ) {
    const alert: BudgetAlert = {
      id: generateId(),
      budgetId: budget.id,
      type: "threshold_75",
      message: `Budget is ${spentPercent.toFixed(1)}% used ($${budget.spentAmount.toFixed(2)} of $${budget.totalBudget.toFixed(2)})`,
      threshold: 75,
      triggeredAt: now(),
      acknowledged: false,
    };
    newAlerts.push(alert);
    budget.alerts.push(alert);
    budgetAlerts.push(alert);
  }

  if (
    budget.alertThresholds.percent90 &&
    spentPercent >= 90 &&
    !budget.alerts.some((a) => a.type === "threshold_90")
  ) {
    const alert: BudgetAlert = {
      id: generateId(),
      budgetId: budget.id,
      type: "threshold_90",
      message: `Budget is ${spentPercent.toFixed(1)}% used ($${budget.spentAmount.toFixed(2)} of $${budget.totalBudget.toFixed(2)})`,
      threshold: 90,
      triggeredAt: now(),
      acknowledged: false,
    };
    newAlerts.push(alert);
    budget.alerts.push(alert);
    budgetAlerts.push(alert);
  }

  if (
    budget.alertThresholds.percent100 &&
    spentPercent >= 100 &&
    !budget.alerts.some((a) => a.type === "threshold_100")
  ) {
    const alert: BudgetAlert = {
      id: generateId(),
      budgetId: budget.id,
      type: "threshold_100",
      message: `Budget has been exceeded! Spent: $${budget.spentAmount.toFixed(2)} / Budget: $${budget.totalBudget.toFixed(2)}`,
      threshold: 100,
      triggeredAt: now(),
      acknowledged: false,
    };
    newAlerts.push(alert);
    budget.alerts.push(alert);
    budgetAlerts.push(alert);
    budget.status = "exceeded";
  }

  return newAlerts;
}

// ─── Budget Service ─────────────────────────────────────────────────────────

export const BudgetService = {
  /**
   * Create a new budget
   */
  input(createBudgetInput: any, userId: string): Budget {
    const input = CreateBudgetSchema.parse(createBudgetInput);

    const budget: Budget = {
      ...input,
      id: generateId(),
      spentAmount: 0,
      remainingAmount: input.totalBudget,
      spentHours: 0,
      alerts: [],
      status: "active",
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    budgets.push(budget);
    return budget;
  },

  /**
   * Get budget by ID
   */
  getById(id: string): Budget | undefined {
    return budgets.find((b) => b.id === id);
  },

  /**
   * Get budget by matter ID
   */
  getByMatter(matterId: string): Budget | undefined {
    return budgets.find((b) => b.matterId === matterId);
  },

  /**
   * Update budget
   */
  update(
    id: string,
    input: UpdateBudgetInput,
    userId: string
  ): Budget | undefined {
    const index = budgets.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const validated = UpdateBudgetSchema.parse(input);
    const updated: Budget = {
      ...budgets[index]!,
      ...validated,
      updatedAt: now(),
      updatedBy: userId,
    };

    if (validated.totalBudget !== undefined) {
      updated.remainingAmount = updated.totalBudget - updated.spentAmount;
    }

    budgets[index] = updated;
    return updated;
  },

  /**
   * Record time spent against budget
   */
  recordTime(
    budgetId: string,
    hours: number,
    amount: number,
    userId: string
  ): { budget: Budget; alerts: BudgetAlert[] } {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) throw new Error(`Budget not found: ${budgetId}`);
    if (budget.status !== "active") {
      throw new Error(`Cannot record time against budget with status "${budget.status}"`);
    }

    budget.spentAmount += amount;
    budget.spentHours += hours;
    budget.remainingAmount = Math.max(0, budget.totalBudget - budget.spentAmount);
    budget.updatedAt = now();
    budget.updatedBy = userId;

    const spentPercent =
      budget.totalBudget > 0
        ? (budget.spentAmount / budget.totalBudget) * 100
        : 0;

    const newAlerts = checkBudgetAlerts(budget, spentPercent);

    return { budget, alerts: newAlerts };
  },

  /**
   * Record expense against budget
   */
  recordExpense(
    budgetId: string,
    amount: number,
    userId: string
  ): { budget: Budget; alerts: BudgetAlert[] } {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) throw new Error(`Budget not found: ${budgetId}`);
    if (budget.status !== "active") {
      throw new Error(`Cannot record expense against budget with status "${budget.status}"`);
    }

    budget.spentAmount += amount;
    budget.remainingAmount = Math.max(0, budget.totalBudget - budget.spentAmount);
    budget.updatedAt = now();
    budget.updatedBy = userId;

    const spentPercent =
      budget.totalBudget > 0
        ? (budget.spentAmount / budget.totalBudget) * 100
        : 0;

    const newAlerts = checkBudgetAlerts(budget, spentPercent);

    return { budget, alerts: newAlerts };
  },

  /**
   * Get budget tracking information
   */
  getTracking(budgetId: string): BudgetTracking | undefined {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) return undefined;

    const spentPercent =
      budget.totalBudget > 0
        ? (budget.spentAmount / budget.totalBudget) * 100
        : 0;

    const burnRate = budget.startDate
      ? calculateBurnRate(budget.spentAmount, budget.startDate)
      : { daily: 0, weekly: 0, monthly: 0 };

    let daysRemaining = 0;
    if (budget.endDate) {
      const end = new Date(budget.endDate);
      const current = new Date();
      daysRemaining = Math.max(
        0,
        Math.floor((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    const projectedTotal =
      burnRate.daily > 0
        ? budget.spentAmount + burnRate.daily * daysRemaining
        : budget.spentAmount;

    let status: BudgetTracking["status"];
    if (spentPercent >= 100) {
      status = "exceeded";
    } else if (spentPercent >= 90) {
      status = "critical";
    } else if (spentPercent >= 75) {
      status = "warning";
    } else {
      status = "on_track";
    }

    let trend: BudgetTracking["trend"] = "stable";
    if (budget.startDate) {
      const expectedPercent =
        budget.startDate && budget.endDate
          ? ((Date.now() - new Date(budget.startDate).getTime()) /
              (new Date(budget.endDate).getTime() -
                new Date(budget.startDate).getTime())) *
            100
          : 50;
      if (spentPercent > expectedPercent * 1.1) {
        trend = "worsening";
      } else if (spentPercent < expectedPercent * 0.9) {
        trend = "improving";
      }
    }

    return {
      budgetId: budget.id,
      matterId: budget.matterId,
      totalBudget: budget.totalBudget,
      spentAmount: budget.spentAmount,
      remainingAmount: budget.remainingAmount,
      percentUsed: spentPercent,
      spentHours: budget.spentHours,
      estimatedHours: budget.estimatedHours,
      hourlyRate: budget.hourlyRate,
      dailyBurnRate: burnRate.daily,
      weeklyBurnRate: burnRate.weekly,
      monthlyBurnRate: burnRate.monthly,
      projectedTotal,
      daysRemaining,
      status,
      trend,
    };
  },

  /**
   * Approve budget
   */
  approve(id: string, approvedBy: string, notes?: string): Budget {
    const budget = budgets.find((b) => b.id === id);
    if (!budget) throw new Error(`Budget not found: ${id}`);
    if (budget.status !== "draft") {
      throw new Error(`Cannot approve budget with status "${budget.status}"`);
    }

    budget.status = "active";
    budget.approvedBy = approvedBy;
    budget.approvedAt = now();
    budget.updatedAt = now();
    budget.updatedBy = approvedBy;

    if (notes) {
      budget.notes = notes;
    }

    return budget;
  },

  /**
   * Put budget on hold
   */
  hold(id: string, userId: string, reason?: string): Budget {
    const budget = budgets.find((b) => b.id === id);
    if (!budget) throw new Error(`Budget not found: ${id}`);
    if (budget.status !== "active") {
      throw new Error(`Cannot hold budget with status "${budget.status}"`);
    }

    budget.status = "on_hold";
    budget.updatedAt = now();
    budget.updatedBy = userId;

    if (reason) {
      budget.metadata = { ...budget.metadata, holdReason: reason };
    }

    return budget;
  },

  /**
   * Complete budget
   */
  complete(id: string, userId: string): Budget {
    const budget = budgets.find((b) => b.id === id);
    if (!budget) throw new Error(`Budget not found: ${id}`);

    budget.status = "completed";
    budget.updatedAt = now();
    budget.updatedBy = userId;
    return budget;
  },

  // ─── Write-Offs ──────────────────────────────────────────────────────────

  /**
   * Create write-off
   */
  createWriteOff(
    input: CreateWriteOffInput,
    userId: string
  ): WriteOff {
    const validated = CreateWriteOffSchema.parse(input);

    const writeOff: WriteOff = {
      ...validated,
      id: generateId(),
      approvedAt: now(),
      createdAt: now(),
      createdBy: userId,
    };

    const budget = budgets.find((b) => b.id === validated.budgetId);
    if (budget) {
      budget.spentAmount = Math.max(0, budget.spentAmount - validated.amount);
      budget.remainingAmount = budget.totalBudget - budget.spentAmount;
      budget.updatedAt = now();
      budget.updatedBy = userId;
    }

    writeOffs.push(writeOff);
    return writeOff;
  },

  /**
   * Get write-offs for a matter
   */
  getWriteOffsByMatter(matterId: string): WriteOff[] {
    return writeOffs.filter((w) => w.matterId === matterId);
  },

  /**
   * Get write-off report
   */
  getWriteOffReport(
    dateFrom?: string,
    dateTo?: string
  ): WriteOffReport {
    let filtered = [...writeOffs];

    if (dateFrom) {
      filtered = filtered.filter(
        (w) => new Date(w.createdAt) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (w) => new Date(w.createdAt) <= new Date(dateTo)
      );
    }

    const byReasonMap = new Map<
      WriteOffReason,
      { count: number; amount: number }
    >();
    const byMatterMap = new Map<
      string,
      { matterNumber: string; amount: number }
    >();
    const byMonthMap = new Map<string, { count: number; amount: number }>();
    const byApproverMap = new Map<string, { count: number; amount: number }>();

    for (const wo of filtered) {
      const reasonExisting = byReasonMap.get(wo.reason) ?? {
        count: 0,
        amount: 0,
      };
      reasonExisting.count++;
      reasonExisting.amount += wo.amount;
      byReasonMap.set(wo.reason, reasonExisting);

      const budget = budgets.find((b) => b.id === wo.budgetId);
      if (budget) {
        const matterExisting = byMatterMap.get(wo.matterId) ?? {
          matterNumber: budget.matterNumber,
          amount: 0,
        };
        matterExisting.amount += wo.amount;
        byMatterMap.set(wo.matterId, matterExisting);
      }

      const month = wo.createdAt.substring(0, 7);
      const monthExisting = byMonthMap.get(month) ?? { count: 0, amount: 0 };
      monthExisting.count++;
      monthExisting.amount += wo.amount;
      byMonthMap.set(month, monthExisting);

      const approverExisting = byApproverMap.get(wo.approvedBy) ?? {
        count: 0,
        amount: 0,
      };
      approverExisting.count++;
      approverExisting.amount += wo.amount;
      byApproverMap.set(wo.approvedBy, approverExisting);
    }

    return {
      totalWriteOffs: filtered.length,
      totalAmount: filtered.reduce((sum, w) => sum + w.amount, 0),
      byReason: Array.from(byReasonMap.entries()).map(([reason, data]) => ({
        reason,
        ...data,
      })),
      byMatter: Array.from(byMatterMap.entries()).map(([matterId, data]) => ({
        matterId,
        ...data,
      })),
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      byApprover: Array.from(byApproverMap.entries()).map(
        ([approverId, data]) => ({ approverId, ...data })
      ),
      averageWriteOff:
        filtered.length > 0
          ? filtered.reduce((sum, w) => sum + w.amount, 0) / filtered.length
          : 0,
      writeOffRate: 0,
    };
  },

  // ─── Profitability Analysis ──────────────────────────────────────────────

  /**
   * Analyze profitability for a matter
   */
  analyzeProfitability(
    matterId: string,
    revenue: number,
    costs: number,
    expenses: number
  ): ProfitabilityAnalysis | undefined {
    const budget = budgets.find((b) => b.matterId === matterId);
    if (!budget) return undefined;

    const profit = revenue - costs - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const realizationRate =
      budget.totalBudget > 0
        ? (revenue / budget.totalBudget) * 100
        : 0;
    const effectiveHourlyRate =
      budget.spentHours > 0 ? revenue / budget.spentHours : 0;
    const costPerHour =
      budget.spentHours > 0 ? costs / budget.spentHours : 0;
    const budgetVariance = budget.totalBudget - budget.spentAmount;
    const budgetVariancePercent =
      budget.totalBudget > 0
        ? (budgetVariance / budget.totalBudget) * 100
        : 0;

    const matterWriteOffs = writeOffs.filter(
      (w) => w.matterId === matterId
    );
    const writeOffAmount = matterWriteOffs.reduce(
      (sum, w) => sum + w.amount,
      0
    );

    const netRevenue = revenue - writeOffAmount;
    const collectionRate = revenue > 0 ? (netRevenue / revenue) * 100 : 0;
    const roi = costs > 0 ? ((revenue - costs) / costs) * 100 : 0;

    return {
      matterId,
      matterNumber: budget.matterNumber,
      matterTitle: budget.matterTitle,
      clientName: budget.clientName,
      totalRevenue: revenue,
      totalCosts: costs,
      totalExpenses: expenses,
      profit,
      profitMargin,
      realizationRate,
      collectionRate,
      effectiveHourlyRate,
      costPerHour,
      budgetVariance,
      budgetVariancePercent,
      writeOffs: writeOffAmount,
      adjustments: 0,
      netRevenue,
      roi,
    };
  },

  // ─── Alerts ──────────────────────────────────────────────────────────────

  /**
   * Acknowledge budget alert
   */
  acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): BudgetAlert | undefined {
    const alert = budgetAlerts.find((a) => a.id === alertId);
    if (!alert) return undefined;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = now();
    return alert;
  },

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): BudgetAlert[] {
    return budgetAlerts.filter((a) => !a.acknowledged);
  },

  /**
   * Get alerts for a budget
   */
  getAlertsByBudget(budgetId: string): BudgetAlert[] {
    return budgetAlerts.filter((a) => a.budgetId === budgetId);
  },

  // ─── Search & Filter ─────────────────────────────────────────────────────

  /**
   * Search and filter budgets
   */
  search(filter: BudgetFilter): PaginatedResult<Budget> {
    const validated = BudgetFilterSchema.parse(filter);
    let filtered = [...budgets];

    if (validated.matterId) {
      filtered = filtered.filter((b) => b.matterId === validated.matterId);
    }
    if (validated.clientId) {
      filtered = filtered.filter((b) => b.clientId === validated.clientId);
    }
    if (validated.status?.length) {
      filtered = filtered.filter((b) =>
        validated.status!.includes(b.status)
      );
    }
    if (validated.type?.length) {
      filtered = filtered.filter((b) =>
        validated.type!.includes(b.type)
      );
    }
    if (validated.isExceeded !== undefined) {
      filtered = filtered.filter((b) =>
        validated.isExceeded ? b.spentAmount > b.totalBudget : b.spentAmount <= b.totalBudget
      );
    }
    if (validated.hasAlerts !== undefined) {
      filtered = filtered.filter((b) =>
        validated.hasAlerts ? b.alerts.length > 0 : b.alerts.length === 0
      );
    }
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.matterNumber.toLowerCase().includes(term) ||
          b.matterTitle.toLowerCase().includes(term) ||
          b.clientName.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (validated.sortBy) {
        case "totalBudget":
          aVal = a.totalBudget;
          bVal = b.totalBudget;
          break;
        case "spentAmount":
          aVal = a.spentAmount;
          bVal = b.spentAmount;
          break;
        case "remainingAmount":
          aVal = a.remainingAmount;
          bVal = b.remainingAmount;
          break;
        case "percentUsed":
          aVal = a.totalBudget > 0 ? (a.spentAmount / a.totalBudget) * 100 : 0;
          bVal = b.totalBudget > 0 ? (b.spentAmount / b.totalBudget) * 100 : 0;
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
   * Get all active budgets
   */
  getActive(): Budget[] {
    return budgets.filter((b) => b.status === "active");
  },

  /**
   * Get budgets needing attention (>= 75% used)
   */
  getNeedingAttention(): Budget[] {
    return budgets.filter((b) => {
      if (b.status !== "active") return false;
      const percentUsed =
        b.totalBudget > 0 ? (b.spentAmount / b.totalBudget) * 100 : 0;
      return percentUsed >= 75;
    });
  },

  /**
   * Get overall budget statistics
   */
  getStats(): {
    totalBudgets: number;
    activeBudgets: number;
    totalBudgetAmount: number;
    totalSpentAmount: number;
    overallUtilization: number;
    exceededBudgets: number;
    budgetsNeedingAttention: number;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    totalWriteOffs: number;
    totalWriteOffAmount: number;
  } {
    const activeBudgets = budgets.filter((b) => b.status === "active");
    const totalBudgetAmount = budgets.reduce(
      (sum, b) => sum + b.totalBudget,
      0
    );
    const totalSpentAmount = budgets.reduce(
      (sum, b) => sum + b.spentAmount,
      0
    );
    const exceededBudgets = budgets.filter(
      (b) => b.spentAmount > b.totalBudget
    ).length;
    const budgetsNeedingAttention = activeBudgets.filter((b) => {
      const percentUsed =
        b.totalBudget > 0 ? (b.spentAmount / b.totalBudget) * 100 : 0;
      return percentUsed >= 75;
    }).length;

    return {
      totalBudgets: budgets.length,
      activeBudgets: activeBudgets.length,
      totalBudgetAmount,
      totalSpentAmount,
      overallUtilization:
        totalBudgetAmount > 0
          ? (totalSpentAmount / totalBudgetAmount) * 100
          : 0,
      exceededBudgets,
      budgetsNeedingAttention,
      totalAlerts: budgetAlerts.length,
      unacknowledgedAlerts: budgetAlerts.filter((a) => !a.acknowledged).length,
      totalWriteOffs: writeOffs.length,
      totalWriteOffAmount: writeOffs.reduce((sum, w) => sum + w.amount, 0),
    };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    budgets = [];
    writeOffs = [];
    budgetAlerts = [];
    budgetCounter = 1;
    writeOffCounter = 1;
  },
};
