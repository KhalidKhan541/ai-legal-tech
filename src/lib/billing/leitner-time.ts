import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const TimekeeperStatus = z.enum([
  "active",
  "inactive",
  "suspended",
  "emeritus",
]);
export type TimekeeperStatus = z.infer<typeof TimekeeperStatus>;

export const TimekeeperRole = z.enum([
  "partner",
  "associate",
  "of_counsel",
  "paralegal",
  "legal_assistant",
  "contract_attorney",
  "summer_associate",
  "intern",
]);
export type TimekeeperRole = z.infer<typeof TimekeeperRole>;

export const RateType = z.enum([
  "hourly",
  "fixed",
  "contingency",
  "retainer",
  "pro_bono",
  "statutory",
]);
export type RateType = z.infer<typeof RateType>;

export const RateChangeReason = z.enum([
  "annual_adjustment",
  "promotion",
  "market_adjustment",
  "client_specific",
  "matter_specific",
  "discount",
  "other",
]);
export type RateChangeReason = z.infer<typeof RateChangeReason>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const TimekeeperRateSchema = z.object({
  id: z.string().uuid(),
  timekeeperId: z.string().uuid(),
  type: RateType,
  amount: z.number().min(0),
  currency: z.string().default("USD"),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  matterId: z.string().uuid().optional(),
  matterNumber: z.string().optional(),
  practiceArea: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  approvalNotes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type TimekeeperRate = z.infer<typeof TimekeeperRateSchema>;

export const TimekeeperSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  employeeId: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  role: TimekeeperRole,
  status: TimekeeperStatus,
  title: z.string().optional(),
  department: z.string().optional(),
  practiceAreas: z.array(z.string()).default([]),
  barAdmissions: z
    .array(
      z.object({
        state: z.string(),
        barNumber: z.string(),
        admittedDate: z.string().datetime(),
        status: z.enum(["active", "inactive", "pending"]),
      })
    )
    .default([]),
  rates: z.array(TimekeeperRateSchema).default([]),
  defaultRateId: z.string().uuid().optional(),
  billingPreferences: z
    .object({
      autoSubmitTime: z.boolean().default(false),
      timeRoundingMinutes: z.number().min(1).max(60).default(6),
      defaultNarrativeTemplate: z.string().optional(),
      maxDailyHours: z.number().min(0).default(24),
      requireNarrativeForHoursOver: z.number().min(0).default(4),
      allowBackdating: z.boolean().default(true),
      maxBackdateDays: z.number().min(0).default(30),
    })
    .default({}),
  utilization: z
    .object({
      targetHours: z.number().min(0).default(1800),
      currentYearHours: z.number().min(0).default(0),
      currentYearBillableHours: z.number().min(0).default(0),
      currentYearRevenue: z.number().min(0).default(0),
      lastYearHours: z.number().min(0).default(0),
      lastYearBillableHours: z.number().min(0).default(0),
      lastYearRevenue: z.number().min(0).default(0),
    })
    .default({}),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Timekeeper = z.infer<typeof TimekeeperSchema>;

export const CreateTimekeeperSchema = TimekeeperSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  rates: true,
  utilization: true,
});

export type CreateTimekeeperInput = z.infer<typeof CreateTimekeeperSchema>;

export const UpdateTimekeeperSchema = TimekeeperSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateTimekeeperInput = z.infer<typeof UpdateTimekeeperSchema>;

export const CreateRateSchema = TimekeeperRateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  approvedBy: true,
  approvedAt: true,
  approvalNotes: true,
  isActive: true,
});

export type CreateRateInput = z.infer<typeof CreateRateSchema>;

export const RateScheduleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  isDefault: z.boolean().default(false),
  rates: z
    .array(
      z.object({
        role: TimekeeperRole,
        practiceArea: z.string().optional(),
        rateType: RateType,
        amount: z.number().min(0),
        minHours: z.number().optional(),
        maxHours: z.number().optional(),
      })
    )
    .default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type RateSchedule = z.infer<typeof RateScheduleSchema>;

export const TimekeeperFilterSchema = z.object({
  role: z.array(TimekeeperRole).optional(),
  status: z.array(TimekeeperStatus).optional(),
  department: z.string().optional(),
  practiceArea: z.string().optional(),
  search: z.string().optional(),
  hasActiveRates: z.boolean().optional(),
  minRate: z.number().min(0).optional(),
  maxRate: z.number().min(0).optional(),
  sortBy: z
    .enum([
      "lastName",
      "role",
      "status",
      "currentRate",
      "utilization",
      "createdAt",
    ])
    .default("lastName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type TimekeeperFilter = z.infer<typeof TimekeeperFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TimekeeperStats {
  total: number;
  active: number;
  byRole: Record<TimekeeperRole, number>;
  byStatus: Record<TimekeeperStatus, number>;
  averageRate: number;
  highestRate: { timekeeperId: string; name: string; rate: number };
  lowestRate: { timekeeperId: string; name: string; rate: number };
  averageUtilization: number;
  totalRevenue: number;
}

export interface RateIncreaseRequest {
  id: string;
  timekeeperId: string;
  currentRateId: string;
  newRateAmount: number;
  reason: RateChangeReason;
  justification: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | undefined;
  reviewedAt: string | undefined;
  reviewNotes: string | undefined;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let timekeepers: Timekeeper[] = [];
let rateSchedules: RateSchedule[] = [];
let rateIncreaseRequests: RateIncreaseRequest[] = [];
let timekeeperCounter = 1;
let scheduleCounter = 1;
let requestCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function getDefaultRate(
  timekeeper: Timekeeper,
  clientId?: string,
  matterId?: string,
  practiceArea?: string
): TimekeeperRate | undefined {
  const activeRates = timekeeper.rates.filter(
    (r) => r.isActive && new Date(r.effectiveDate) <= new Date()
  );

  const filteredRates = activeRates.filter((r) => {
    if (r.expiryDate && new Date(r.expiryDate) < new Date()) return false;
    if (clientId && r.clientId && r.clientId !== clientId) return false;
    if (matterId && r.matterId && r.matterId !== matterId) return false;
    if (practiceArea && r.practiceArea && r.practiceArea !== practiceArea) {
      return false;
    }
    return true;
  });

  if (filteredRates.length === 0) return undefined;

  const sorted = filteredRates.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.matterId === matterId) scoreA += 10;
    if (b.matterId === matterId) scoreB += 10;
    if (a.clientId === clientId) scoreA += 5;
    if (b.clientId === clientId) scoreB += 5;
    if (a.practiceArea === practiceArea) scoreA += 3;
    if (b.practiceArea === practiceArea) scoreB += 3;
    return scoreB - scoreA;
  });

  return sorted[0];
}

// ─── Timekeeper Service ─────────────────────────────────────────────────────

export const TimekeeperService = {
  /**
   * Create a new timekeeper
   */
  create(input: CreateTimekeeperInput, userId: string): Timekeeper {
    const validated = CreateTimekeeperSchema.parse(input);

    const timekeeper: Timekeeper = {
      ...validated,
      id: generateId(),
      rates: [],
      utilization: {
        targetHours: 1800,
        currentYearHours: 0,
        currentYearBillableHours: 0,
        currentYearRevenue: 0,
        lastYearHours: 0,
        lastYearBillableHours: 0,
        lastYearRevenue: 0,
      },
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    timekeepers.push(timekeeper);
    return timekeeper;
  },

  /**
   * Get timekeeper by ID
   */
  getById(id: string): Timekeeper | undefined {
    return timekeepers.find((tk) => tk.id === id);
  },

  /**
   * Get timekeeper by user ID
   */
  getByUserId(userId: string): Timekeeper | undefined {
    return timekeepers.find((tk) => tk.userId === userId);
  },

  /**
   * Update timekeeper
   */
  update(
    id: string,
    input: UpdateTimekeeperInput,
    userId: string
  ): Timekeeper | undefined {
    const index = timekeepers.findIndex((tk) => tk.id === id);
    if (index === -1) return undefined;

    const validated = UpdateTimekeeperSchema.parse(input);
    const updated: Timekeeper = {
      ...timekeepers[index]!,
      ...validated,
      updatedAt: now(),
      updatedBy: userId,
    };

    timekeepers[index] = updated;
    return updated;
  },

  /**
   * Deactivate timekeeper
   */
  deactivate(id: string, userId: string): Timekeeper {
    const timekeeper = timekeepers.find((tk) => tk.id === id);
    if (!timekeeper) throw new Error(`Timekeeper not found: ${id}`);

    timekeeper.status = "inactive";
    timekeeper.updatedAt = now();
    timekeeper.updatedBy = userId;

    for (const rate of timekeeper.rates) {
      if (rate.isActive) {
        rate.isActive = false;
        rate.expiryDate = now();
      }
    }

    return timekeeper;
  },

  // ─── Rate Management ─────────────────────────────────────────────────────

  /**
   * Add rate to timekeeper
   */
  addRate(
    timekeeperId: string,
    input: CreateRateInput,
    userId: string
  ): TimekeeperRate {
    const timekeeper = timekeepers.find((tk) => tk.id === timekeeperId);
    if (!timekeeper) throw new Error(`Timekeeper not found: ${timekeeperId}`);

    const validated = CreateRateSchema.parse(input);

    const overlappingRate = timekeeper.rates.find(
      (r) =>
        r.isActive &&
        r.clientId === validated.clientId &&
        r.matterId === validated.matterId &&
        r.practiceArea === validated.practiceArea &&
        new Date(r.effectiveDate) <= new Date(validated.effectiveDate) &&
        (!r.expiryDate || new Date(r.expiryDate) > new Date(validated.effectiveDate))
    );

    if (overlappingRate) {
      overlappingRate.isActive = false;
      overlappingRate.expiryDate = validated.effectiveDate;
    }

    const rate: TimekeeperRate = {
      ...validated,
      id: generateId(),
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    timekeeper.rates.push(rate);

    if (!timekeeper.defaultRateId || validated.clientId) {
      timekeeper.defaultRateId = rate.id;
    }

    timekeeper.updatedAt = now();
    timekeeper.updatedBy = userId;
    return rate;
  },

  /**
   * Update rate
   */
  updateRate(
    timekeeperId: string,
    rateId: string,
    updates: Partial<Omit<TimekeeperRate, "id" | "createdAt" | "updatedAt" | "createdBy">>,
    userId: string
  ): TimekeeperRate | undefined {
    const timekeeper = timekeepers.find((tk) => tk.id === timekeeperId);
    if (!timekeeper) return undefined;

    const rateIndex = timekeeper.rates.findIndex((r) => r.id === rateId);
    if (rateIndex === -1) return undefined;

    timekeeper.rates[rateIndex] = {
      ...timekeeper.rates[rateIndex]!,
      ...updates,
      updatedAt: now(),
    };

    timekeeper.updatedAt = now();
    timekeeper.updatedBy = userId;
    return timekeeper.rates[rateIndex];
  },

  /**
   * Deactivate rate
   */
  deactivateRate(
    timekeeperId: string,
    rateId: string,
    userId: string
  ): boolean {
    const timekeeper = timekeepers.find((tk) => tk.id === timekeeperId);
    if (!timekeeper) return false;

    const rate = timekeeper.rates.find((r) => r.id === rateId);
    if (!rate) return false;

    rate.isActive = false;
    rate.expiryDate = now();
    rate.updatedAt = now();

    timekeeper.updatedAt = now();
    timekeeper.updatedBy = userId;
    return true;
  },

  /**
   * Get effective rate for timekeeper
   */
  getEffectiveRate(
    timekeeperId: string,
    clientId?: string,
    matterId?: string,
    practiceArea?: string
  ): number {
    const timekeeper = timekeepers.find((tk) => tk.id === timekeeperId);
    if (!timekeeper) return 0;

    const rate = getDefaultRate(timekeeper, clientId, matterId, practiceArea);
    return rate?.amount ?? 0;
  },

  /**
   * Request rate increase
   */
  requestRateIncrease(
    timekeeperId: string,
    currentRateId: string,
    newRateAmount: number,
    reason: RateChangeReason,
    justification: string,
    requestedBy: string
  ): RateIncreaseRequest {
    const timekeeper = timekeepers.find((tk) => tk.id === timekeeperId);
    if (!timekeeper) throw new Error(`Timekeeper not found: ${timekeeperId}`);

    const currentRate = timekeeper.rates.find((r) => r.id === currentRateId);
    if (!currentRate) throw new Error(`Rate not found: ${currentRateId}`);

    const request: RateIncreaseRequest = {
      id: generateId(),
      timekeeperId,
      currentRateId,
      newRateAmount,
      reason,
      justification,
      requestedBy,
      requestedAt: now(),
      status: "pending",
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewNotes: undefined,
    };

    rateIncreaseRequests.push(request);
    return request;
  },

  /**
   * Approve rate increase
   */
  approveRateIncrease(
    requestId: string,
    approvedBy: string,
    notes?: string
  ): { request: RateIncreaseRequest; newRate: TimekeeperRate } {
    const request = rateIncreaseRequests.find((r) => r.id === requestId);
    if (!request) throw new Error(`Rate increase request not found: ${requestId}`);
    if (request.status !== "pending") {
      throw new Error(`Request is already ${request.status}`);
    }

    const timekeeper = timekeepers.find((tk) => tk.id === request.timekeeperId);
    if (!timekeeper) throw new Error("Timekeeper not found");

    const currentRate = timekeeper.rates.find(
      (r) => r.id === request.currentRateId
    );

    request.status = "approved";
    request.reviewedBy = approvedBy;
    request.reviewedAt = now();
    request.reviewNotes = notes;

    const newRate = TimekeeperService.addRate(
      request.timekeeperId,
      {
        type: currentRate?.type ?? "hourly",
        amount: request.newRateAmount,
        effectiveDate: now(),
        clientId: currentRate?.clientId,
        matterId: currentRate?.matterId,
        practiceArea: currentRate?.practiceArea,
        description: `Rate increase approved: $${request.newRateAmount}/hr`,
      },
      approvedBy
    );

    return { request, newRate };
  },

  /**
   * Reject rate increase
   */
  rejectRateIncrease(
    requestId: string,
    rejectedBy: string,
    reason: string
  ): RateIncreaseRequest {
    const request = rateIncreaseRequests.find((r) => r.id === requestId);
    if (!request) throw new Error(`Rate increase request not found: ${requestId}`);
    if (request.status !== "pending") {
      throw new Error(`Request is already ${request.status}`);
    }

    request.status = "rejected";
    request.reviewedBy = rejectedBy;
    request.reviewedAt = now();
    request.reviewNotes = reason;

    return request;
  },

  /**
   * Get pending rate increase requests
   */
  getPendingRateRequests(): RateIncreaseRequest[] {
    return rateIncreaseRequests.filter((r) => r.status === "pending");
  },

  // ─── Rate Schedules ──────────────────────────────────────────────────────

  /**
   * Create rate schedule
   */
  createSchedule(
    schedule: Omit<RateSchedule, "id" | "createdAt" | "updatedAt" | "createdBy">,
    userId: string
  ): RateSchedule {
    const newSchedule: RateSchedule = {
      ...schedule,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    if (newSchedule.isDefault) {
      for (const s of rateSchedules) {
        s.isDefault = false;
      }
    }

    rateSchedules.push(newSchedule);
    return newSchedule;
  },

  /**
   * Get rate schedule by ID
   */
  getScheduleById(id: string): RateSchedule | undefined {
    return rateSchedules.find((s) => s.id === id);
  },

  /**
   * Get all rate schedules
   */
  getSchedules(): RateSchedule[] {
    return [...rateSchedules];
  },

  /**
   * Apply rate schedule to timekeeper
   */
  applySchedule(
    scheduleId: string,
    timekeeperId: string,
    userId: string
  ): TimekeeperRate[] {
    const schedule = rateSchedules.find((s) => s.id === scheduleId);
    if (!schedule) throw new Error(`Rate schedule not found: ${scheduleId}`);

    const timekeeper = timekeepers.find((tk) => tk.id === timekeeperId);
    if (!timekeeper) throw new Error(`Timekeeper not found: ${timekeeperId}`);

    const newRates: TimekeeperRate[] = [];

    for (const rateEntry of schedule.rates) {
      if (rateEntry.role !== timekeeper.role) continue;

      const rate = TimekeeperService.addRate(
        timekeeperId,
        {
          type: rateEntry.rateType,
          amount: rateEntry.amount,
          effectiveDate: schedule.effectiveDate,
          expiryDate: schedule.expiryDate,
          practiceArea: rateEntry.practiceArea,
          description: `Applied from schedule: ${schedule.name}`,
        },
        userId
      );

      newRates.push(rate);
    }

    return newRates;
  },

  // ─── Bulk Operations ─────────────────────────────────────────────────────

  /**
   * Bulk rate increase (all active timekeepers)
   */
  bulkRateIncrease(
    increasePercent: number,
    effectiveDate: string,
    userId: string,
    options?: {
      roles?: TimekeeperRole[];
      practiceAreas?: string[];
      minRate?: number;
      maxRate?: number;
    }
  ): { updated: string[]; errors: { timekeeperId: string; error: string }[] } {
    const updated: string[] = [];
    const errors: { timekeeperId: string; error: string }[] = [];

    for (const tk of timekeepers) {
      if (tk.status !== "active") continue;

      if (options?.roles?.length && !options.roles.includes(tk.role)) continue;

      try {
        const activeRates = tk.rates.filter(
          (r) =>
            r.isActive &&
            (!r.expiryDate || new Date(r.expiryDate) > new Date())
        );

        for (const rate of activeRates) {
          if (options?.practiceAreas?.length && rate.practiceArea) {
            if (!options.practiceAreas.includes(rate.practiceArea)) continue;
          }
          if (options?.minRate && rate.amount < options.minRate) continue;
          if (options?.maxRate && rate.amount > options.maxRate) continue;

          const newAmount = Math.round(rate.amount * (1 + increasePercent / 100));

          rate.isActive = false;
          rate.expiryDate = effectiveDate;

          TimekeeperService.addRate(
            tk.id,
            {
              type: rate.type,
              amount: newAmount,
              effectiveDate,
              clientId: rate.clientId,
              matterId: rate.matterId,
              practiceArea: rate.practiceArea,
              description: `Bulk rate increase: ${increasePercent}%`,
            },
            userId
          );
        }

        updated.push(tk.id);
      } catch (error) {
        errors.push({
          timekeeperId: tk.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { updated, errors };
  },

  // ─── Search & Filter ─────────────────────────────────────────────────────

  /**
   * Search timekeepers
   */
  search(filter: TimekeeperFilter): PaginatedResult<Timekeeper> {
    const validated = TimekeeperFilterSchema.parse(filter);
    let filtered = [...timekeepers];

    if (validated.role?.length) {
      filtered = filtered.filter((tk) =>
        validated.role!.includes(tk.role)
      );
    }
    if (validated.status?.length) {
      filtered = filtered.filter((tk) =>
        validated.status!.includes(tk.status)
      );
    }
    if (validated.department) {
      filtered = filtered.filter(
        (tk) =>
          tk.department?.toLowerCase() ===
          validated.department!.toLowerCase()
      );
    }
    if (validated.practiceArea) {
      filtered = filtered.filter((tk) =>
        tk.practiceAreas.some(
          (pa) => pa.toLowerCase() === validated.practiceArea!.toLowerCase()
        )
      );
    }
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (tk) =>
          tk.firstName.toLowerCase().includes(term) ||
          tk.lastName.toLowerCase().includes(term) ||
          tk.displayName.toLowerCase().includes(term) ||
          tk.email.toLowerCase().includes(term)
      );
    }
    if (validated.hasActiveRates !== undefined) {
      filtered = filtered.filter((tk) => {
        const hasActive = tk.rates.some(
          (r) =>
            r.isActive &&
            (!r.expiryDate || new Date(r.expiryDate) > new Date())
        );
        return validated.hasActiveRates ? hasActive : !hasActive;
      });
    }

    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (validated.sortBy) {
        case "lastName":
          aVal = a.lastName;
          bVal = b.lastName;
          break;
        case "role":
          aVal = a.role;
          bVal = b.role;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "currentRate":
          aVal = TimekeeperService.getEffectiveRate(a.id);
          bVal = TimekeeperService.getEffectiveRate(b.id);
          break;
        case "utilization":
          aVal =
            a.utilization.targetHours > 0
              ? (a.utilization.currentYearBillableHours /
                  a.utilization.targetHours) *
                100
              : 0;
          bVal =
            b.utilization.targetHours > 0
              ? (b.utilization.currentYearBillableHours /
                  b.utilization.targetHours) *
                100
              : 0;
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
   * Get timekeeper statistics
   */
  getStats(): TimekeeperStats {
    const byRole: Record<TimekeeperRole, number> = {
      partner: 0,
      associate: 0,
      of_counsel: 0,
      paralegal: 0,
      legal_assistant: 0,
      contract_attorney: 0,
      summer_associate: 0,
      intern: 0,
    };

    const byStatus: Record<TimekeeperStatus, number> = {
      active: 0,
      inactive: 0,
      suspended: 0,
      emeritus: 0,
    };

    let totalRate = 0;
    let rateCount = 0;
    let highestRate = 0;
    let highestRateTk = "";
    let lowestRate = Infinity;
    let lowestRateTk = "";
    let totalUtilization = 0;
    let utilizationCount = 0;
    let totalRevenue = 0;

    for (const tk of timekeepers) {
      byRole[tk.role]++;
      byStatus[tk.status]++;

      const activeRates = tk.rates.filter(
        (r) =>
          r.isActive &&
          (!r.expiryDate || new Date(r.expiryDate) > new Date())
      );

      for (const rate of activeRates) {
        totalRate += rate.amount;
        rateCount++;
        if (rate.amount > highestRate) {
          highestRate = rate.amount;
          highestRateTk = tk.id;
        }
        if (rate.amount < lowestRate) {
          lowestRate = rate.amount;
          lowestRateTk = tk.id;
        }
      }

      if (tk.utilization.targetHours > 0) {
        totalUtilization +=
          (tk.utilization.currentYearBillableHours /
            tk.utilization.targetHours) *
          100;
        utilizationCount++;
      }

      totalRevenue += tk.utilization.currentYearRevenue;
    }

    return {
      total: timekeepers.length,
      active: byStatus.active,
      byRole,
      byStatus,
      averageRate: rateCount > 0 ? totalRate / rateCount : 0,
      highestRate: {
        timekeeperId: highestRateTk,
        name:
          timekeepers.find((tk) => tk.id === highestRateTk)?.displayName ?? "",
        rate: highestRate,
      },
      lowestRate: {
        timekeeperId: lowestRateTk,
        name:
          timekeepers.find((tk) => tk.id === lowestRateTk)?.displayName ?? "",
        rate: lowestRate === Infinity ? 0 : lowestRate,
      },
      averageUtilization:
        utilizationCount > 0 ? totalUtilization / utilizationCount : 0,
      totalRevenue,
    };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    timekeepers = [];
    rateSchedules = [];
    rateIncreaseRequests = [];
    timekeeperCounter = 1;
    scheduleCounter = 1;
    requestCounter = 1;
  },
};
