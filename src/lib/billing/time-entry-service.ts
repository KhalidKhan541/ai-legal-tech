import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const TimeEntryStatus = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "billed",
  "voided",
]);
export type TimeEntryStatus = z.infer<typeof TimeEntryStatus>;

export const TimeEntryType = z.enum([
  "billable",
  "non_billable",
  "contingency",
  "pro_bono",
  "internal",
]);
export type TimeEntryType = z.infer<typeof TimeEntryType>;

export const ActivityCode = z.enum([
  "research",
  "drafting",
  "review",
  "meeting",
  "court_appearance",
  "deposition",
  "trial",
  "client_communication",
  "file_management",
  "travel",
  "administrative",
  "strategy",
  "negotiation",
  "settlement_conference",
  "mediation",
  "arbitration",
  "discovery",
  "motion_practice",
  "appeal",
  "other",
]);
export type ActivityCode = z.infer<typeof ActivityCode>;

export const TimerStatus = z.enum(["idle", "running", "paused", "stopped"]);
export type TimerStatus = z.infer<typeof TimerStatus>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const TimeEntrySchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  timekeeperId: z.string().uuid(),
  date: z.string().datetime(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().min(0),
  description: z.string().min(1).max(2000),
  activityCode: ActivityCode,
  type: TimeEntryType,
  status: TimeEntryStatus,
  hourlyRate: z.number().min(0),
  totalAmount: z.number().min(0),
  currency: z.string().default("USD"),
  isEdited: z.boolean().default(false),
  editedBy: z.string().uuid().optional(),
  editedAt: z.string().datetime().optional(),
  editReason: z.string().optional(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  rejectedBy: z.string().uuid().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  invoiceId: z.string().uuid().optional(),
  billingNarrative: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type TimeEntry = z.infer<typeof TimeEntrySchema>;

export const CreateTimeEntrySchema = TimeEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  isEdited: true,
  editedBy: true,
  editedAt: true,
  editReason: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  rejectionReason: true,
  invoiceId: true,
}).extend({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;

export const UpdateTimeEntrySchema = TimeEntrySchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateTimeEntryInput = z.infer<typeof UpdateTimeEntrySchema>;

export const TimeEntryFilterSchema = z.object({
  matterId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  timekeeperId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.array(TimeEntryStatus).optional(),
  type: z.array(TimeEntryType).optional(),
  activityCode: z.array(ActivityCode).optional(),
  invoiceId: z.string().uuid().optional(),
  isBillable: z.boolean().optional(),
  minDuration: z.number().min(0).optional(),
  maxDuration: z.number().min(0).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum([
      "date",
      "durationMinutes",
      "totalAmount",
      "createdAt",
      "updatedAt",
      "status",
    ])
    .default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type TimeEntryFilter = z.infer<typeof TimeEntryFilterSchema>;

export const ActiveTimerSchema = z.object({
  id: z.string().uuid(),
  timekeeperId: z.string().uuid(),
  matterId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  activityCode: ActivityCode,
  description: z.string(),
  startedAt: z.string().datetime(),
  pausedAt: z.string().datetime().optional(),
  totalPausedMs: z.number().default(0),
  status: TimerStatus,
  createdAt: z.string().datetime(),
});

export type ActiveTimer = z.infer<typeof ActiveTimerSchema>;

export const BulkTimeEntrySchema = z.object({
  entries: z.array(CreateTimeEntrySchema).min(1).max(50),
  submitForApproval: z.boolean().default(false),
});

export type BulkTimeEntryInput = z.infer<typeof BulkTimeEntrySchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TimeEntryReport {
  totalEntries: number;
  totalBillableHours: number;
  totalBillableAmount: number;
  totalNonBillableHours: number;
  totalNonBillableAmount: number;
  byMatter: { matterId: string; hours: number; amount: number }[];
  byTimekeeper: { timekeeperId: string; hours: number; amount: number }[];
  byActivity: { activityCode: ActivityCode; hours: number; amount: number }[];
  byStatus: Record<TimeEntryStatus, { count: number; hours: number }>;
  byMonth: { month: string; hours: number; amount: number }[];
  utilizationRate: number;
  averageHoursPerDay: number;
  averageHoursPerEntry: number;
}

export interface TimeEntryStats {
  totalEntries: number;
  totalHours: number;
  totalAmount: number;
  billableHours: number;
  billableAmount: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  billed: number;
  averageDailyHours: number;
  weeklyTrend: number;
  monthlyTrend: number;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let timeEntries: TimeEntry[] = [];
let activeTimers: ActiveTimer[] = [];
let entryCounter = 1;
let timerCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
}

function calculateAmount(durationMinutes: number, hourlyRate: number): number {
  const hours = durationMinutes / 60;
  return Math.round(hours * hourlyRate * 100) / 100;
}

function roundToNearestSixth(durationMinutes: number): number {
  return Math.round(durationMinutes / 6) * 6;
}

// ─── Time Entry Service ─────────────────────────────────────────────────────

export const TimeEntryService = {
  /**
   * Create a new time entry
   */
  create(input: CreateTimeEntryInput, userId: string): TimeEntry {
    const validated = CreateTimeEntrySchema.parse(input);

    let durationMinutes = validated.durationMinutes;
    if (validated.startTime && validated.endTime) {
      durationMinutes = calculateDuration(validated.startTime, validated.endTime);
    }
    durationMinutes = roundToNearestSixth(durationMinutes);

    const totalAmount = calculateAmount(durationMinutes, validated.hourlyRate);

    const entry: TimeEntry = {
      ...validated,
      id: generateId(),
      durationMinutes,
      totalAmount,
      status: "draft",
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
    };

    timeEntries.push(entry);
    return entry;
  },

  /**
   * Create multiple time entries in bulk
   */
  createBulk(
    input: BulkTimeEntryInput,
    userId: string
  ): { created: TimeEntry[]; errors: { index: number; error: string }[] } {
    const validated = BulkTimeEntrySchema.parse(input);
    const created: TimeEntry[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < validated.entries.length; i++) {
      try {
        const entry = TimeEntryService.create(validated.entries[i]!, userId);
        if (validated.submitForApproval) {
          entry.status = "pending_review";
        }
        created.push(entry);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { created, errors };
  },

  /**
   * Get time entry by ID
   */
  getById(id: string): TimeEntry | undefined {
    return timeEntries.find((e) => e.id === id);
  },

  /**
   * Update time entry
   */
  update(
    id: string,
    input: UpdateTimeEntryInput,
    userId: string,
    editReason?: string
  ): TimeEntry | undefined {
    const index = timeEntries.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const existing = timeEntries[index]!;
    const validated = UpdateTimeEntrySchema.parse(input);

    let durationMinutes = validated.durationMinutes ?? existing.durationMinutes;
    if (validated.startTime && validated.endTime) {
      durationMinutes = calculateDuration(validated.startTime, validated.endTime);
    }
    durationMinutes = roundToNearestSixth(durationMinutes);

    const hourlyRate = validated.hourlyRate ?? existing.hourlyRate;
    const totalAmount = calculateAmount(durationMinutes, hourlyRate);

    const updated: TimeEntry = {
      ...existing,
      ...validated,
      durationMinutes,
      totalAmount,
      isEdited: true,
      editedBy: userId,
      editedAt: now(),
      editReason: editReason ?? existing.editReason,
      updatedAt: now(),
      updatedBy: userId,
    };

    timeEntries[index] = updated;
    return updated;
  },

  /**
   * Delete time entry (void it if already approved/billed)
   */
  delete(id: string, userId: string): boolean {
    const index = timeEntries.findIndex((e) => e.id === id);
    if (index === -1) return false;

    const entry = timeEntries[index]!;
    if (entry.status === "billed") {
      throw new Error("Cannot delete a billed time entry. Void it instead.");
    }

    entry.status = "voided";
    entry.updatedAt = now();
    entry.updatedBy = userId;
    return true;
  },

  /**
   * Submit time entry for approval
   */
  submitForApproval(id: string, userId: string): TimeEntry {
    const entry = timeEntries.find((e) => e.id === id);
    if (!entry) throw new Error(`Time entry not found: ${id}`);

    if (entry.status !== "draft" && entry.status !== "rejected") {
      throw new Error(
        `Cannot submit entry with status "${entry.status}" for approval. Must be draft or rejected.`
      );
    }

    entry.status = "pending_review";
    entry.updatedAt = now();
    entry.updatedBy = userId;
    return entry;
  },

  /**
   * Approve time entry
   */
  approve(id: string, approvedBy: string, notes?: string): TimeEntry {
    const entry = timeEntries.find((e) => e.id === id);
    if (!entry) throw new Error(`Time entry not found: ${id}`);

    if (entry.status !== "pending_review") {
      throw new Error(
        `Cannot approve entry with status "${entry.status}". Must be pending review.`
      );
    }

    entry.status = "approved";
    entry.approvedBy = approvedBy;
    entry.approvedAt = now();
    entry.updatedAt = now();
    entry.updatedBy = approvedBy;

    if (notes) {
      entry.metadata = { ...entry.metadata, approvalNotes: notes };
    }

    return entry;
  },

  /**
   * Reject time entry
   */
  reject(
    id: string,
    rejectedBy: string,
    reason: string
  ): TimeEntry {
    const entry = timeEntries.find((e) => e.id === id);
    if (!entry) throw new Error(`Time entry not found: ${id}`);

    if (entry.status !== "pending_review") {
      throw new Error(
        `Cannot reject entry with status "${entry.status}". Must be pending review.`
      );
    }

    entry.status = "rejected";
    entry.rejectedBy = rejectedBy;
    entry.rejectedAt = now();
    entry.rejectionReason = reason;
    entry.updatedAt = now();
    entry.updatedBy = rejectedBy;
    return entry;
  },

  /**
   * Bulk approve time entries
   */
  bulkApprove(
    ids: string[],
    approvedBy: string
  ): { approved: string[]; errors: { entryId: string; error: string }[] } {
    const approved: string[] = [];
    const errors: { entryId: string; error: string }[] = [];

    for (const id of ids) {
      try {
        TimeEntryService.approve(id, approvedBy);
        approved.push(id);
      } catch (error) {
        errors.push({
          entryId: id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { approved, errors };
  },

  /**
   * Bulk reject time entries
   */
  bulkReject(
    ids: string[],
    rejectedBy: string,
    reason: string
  ): { rejected: string[]; errors: { entryId: string; error: string }[] } {
    const rejected: string[] = [];
    const errors: { entryId: string; error: string }[] = [];

    for (const id of ids) {
      try {
        TimeEntryService.reject(id, rejectedBy, reason);
        rejected.push(id);
      } catch (error) {
        errors.push({
          entryId: id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { rejected, errors };
  },

  /**
   * Mark time entries as billed
   */
  markAsBilled(
    ids: string[],
    invoiceId: string,
    userId: string
  ): { billed: string[]; errors: { entryId: string; error: string }[] } {
    const billed: string[] = [];
    const errors: { entryId: string; error: string }[] = [];

    for (const id of ids) {
      const entry = timeEntries.find((e) => e.id === id);
      if (!entry) {
        errors.push({ entryId: id, error: "Entry not found" });
        continue;
      }

      if (entry.status !== "approved") {
        errors.push({
          entryId: id,
          error: `Cannot bill entry with status "${entry.status}". Must be approved.`,
        });
        continue;
      }

      entry.status = "billed";
      entry.invoiceId = invoiceId;
      entry.updatedAt = now();
      entry.updatedBy = userId;
      billed.push(id);
    }

    return { billed, errors };
  },

  // ─── Timer Functions ─────────────────────────────────────────────────────

  /**
   * Start a new timer
   */
  startTimer(
    timekeeperId: string,
    matterId: string,
    activityCode: ActivityCode,
    description: string,
    taskId?: string
  ): ActiveTimer {
    const existingRunning = activeTimers.find(
      (t) =>
        t.timekeeperId === timekeeperId &&
        t.status === "running"
    );
    if (existingRunning) {
      throw new Error(
        "A timer is already running. Stop or pause it before starting a new one."
      );
    }

    const timer: ActiveTimer = {
      id: generateId(),
      timekeeperId,
      matterId,
      taskId,
      activityCode,
      description,
      startedAt: now(),
      totalPausedMs: 0,
      status: "running",
      createdAt: now(),
    };

    activeTimers.push(timer);
    return timer;
  },

  /**
   * Pause an active timer
   */
  pauseTimer(timerId: string): ActiveTimer {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error(`Timer not found: ${timerId}`);
    if (timer.status !== "running") {
      throw new Error(`Cannot pause timer with status "${timer.status}"`);
    }

    timer.status = "paused";
    timer.pausedAt = now();
    return timer;
  },

  /**
   * Resume a paused timer
   */
  resumeTimer(timerId: string): ActiveTimer {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error(`Timer not found: ${timerId}`);
    if (timer.status !== "paused") {
      throw new Error(`Cannot resume timer with status "${timer.status}"`);
    }

    if (timer.pausedAt) {
      const pauseDuration = Date.now() - new Date(timer.pausedAt).getTime();
      timer.totalPausedMs += pauseDuration;
    }

    timer.status = "running";
    timer.pausedAt = undefined;
    return timer;
  },

  /**
   * Stop a timer and create a time entry
   */
  stopTimer(
    timerId: string,
    userId: string,
    billingNarrative?: string
  ): { timer: ActiveTimer; entry: TimeEntry } {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error(`Timer not found: ${timerId}`);

    timer.status = "stopped";

    const endTime = now();
    let totalMs = new Date(endTime).getTime() - new Date(timer.startedAt).getTime();
    totalMs -= timer.totalPausedMs;
    const durationMinutes = Math.max(0, Math.floor(totalMs / 60000));

    const entry = TimeEntryService.create(
      {
        matterId: timer.matterId,
        taskId: timer.taskId,
        timekeeperId: timer.timekeeperId,
        date: timer.startedAt,
        startTime: timer.startedAt,
        endTime,
        durationMinutes,
        description: timer.description,
        activityCode: timer.activityCode,
        type: "billable",
        hourlyRate: 0,
        billingNarrative,
      },
      userId
    );

    return { timer, entry };
  },

  /**
   * Get active timers for a timekeeper
   */
  getActiveTimers(timekeeperId: string): ActiveTimer[] {
    return activeTimers.filter(
      (t) =>
        t.timekeeperId === timekeeperId &&
        (t.status === "running" || t.status === "paused")
    );
  },

  /**
   * Get elapsed time for a timer (in minutes)
   */
  getElapsedTime(timerId: string): number {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer) return 0;

    const endTime = timer.status === "running" ? Date.now() : new Date(timer.pausedAt ?? timer.startedAt).getTime();
    let totalMs = endTime - new Date(timer.startedAt).getTime();

    if (timer.status === "paused" && timer.pausedAt) {
      totalMs = new Date(timer.pausedAt).getTime() - new Date(timer.startedAt).getTime();
    }

    totalMs -= timer.totalPausedMs;
    return Math.max(0, Math.floor(totalMs / 60000));
  },

  // ─── Search & Filter ─────────────────────────────────────────────────────

  /**
   * Search and filter time entries
   */
  search(filter: TimeEntryFilter): PaginatedResult<TimeEntry> {
    const validated = TimeEntryFilterSchema.parse(filter);
    let filtered = [...timeEntries];

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
    if (validated.status?.length) {
      filtered = filtered.filter((e) =>
        validated.status!.includes(e.status)
      );
    }
    if (validated.type?.length) {
      filtered = filtered.filter((e) =>
        validated.type!.includes(e.type)
      );
    }
    if (validated.activityCode?.length) {
      filtered = filtered.filter((e) =>
        validated.activityCode!.includes(e.activityCode)
      );
    }
    if (validated.invoiceId) {
      filtered = filtered.filter((e) => e.invoiceId === validated.invoiceId);
    }
    if (validated.isBillable !== undefined) {
      filtered = filtered.filter((e) =>
        validated.isBillable ? e.type === "billable" : e.type !== "billable"
      );
    }
    if (validated.minDuration !== undefined) {
      filtered = filtered.filter(
        (e) => e.durationMinutes >= validated.minDuration!
      );
    }
    if (validated.maxDuration !== undefined) {
      filtered = filtered.filter(
        (e) => e.durationMinutes <= validated.maxDuration!
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
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(term) ||
          e.billingNarrative?.toLowerCase().includes(term)
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
        case "durationMinutes":
          aVal = a.durationMinutes;
          bVal = b.durationMinutes;
          break;
        case "totalAmount":
          aVal = a.totalAmount;
          bVal = b.totalAmount;
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
   * Get time entries by matter
   */
  getByMatter(matterId: string): TimeEntry[] {
    return timeEntries.filter((e) => e.matterId === matterId);
  },

  /**
   * Get time entries by timekeeper
   */
  getByTimekeeper(timekeeperId: string): TimeEntry[] {
    return timeEntries.filter((e) => e.timekeeperId === timekeeperId);
  },

  /**
   * Get unbilled time entries for a matter
   */
  getUnbilledByMatter(matterId: string): TimeEntry[] {
    return timeEntries.filter(
      (e) =>
        e.matterId === matterId &&
        e.status === "approved" &&
        !e.invoiceId
    );
  },

  /**
   * Get time entries pending approval
   */
  getPendingApproval(timekeeperId?: string): TimeEntry[] {
    let entries = timeEntries.filter((e) => e.status === "pending_review");
    if (timekeeperId) {
      entries = entries.filter((e) => e.timekeeperId === timekeeperId);
    }
    return entries;
  },

  // ─── Reports ─────────────────────────────────────────────────────────────

  /**
   * Generate time entry report
   */
  generateReport(
    filter: Omit<TimeEntryFilter, "page" | "limit" | "sortBy" | "sortOrder">
  ): TimeEntryReport {
    const allEntries = TimeEntryService.search({
      ...filter,
      page: 1,
      limit: Number.MAX_SAFE_INTEGER,
      sortBy: "date",
      sortOrder: "desc",
    }).items;

    const billableEntries = allEntries.filter((e) => e.type === "billable");
    const nonBillableEntries = allEntries.filter((e) => e.type !== "billable");

    const totalBillableHours =
      billableEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;
    const totalBillableAmount = billableEntries.reduce(
      (sum, e) => sum + e.totalAmount,
      0
    );
    const totalNonBillableHours =
      nonBillableEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;
    const totalNonBillableAmount = nonBillableEntries.reduce(
      (sum, e) => sum + e.totalAmount,
      0
    );

    const byMatterMap = new Map<string, { hours: number; amount: number }>();
    for (const entry of billableEntries) {
      const existing = byMatterMap.get(entry.matterId) ?? {
        hours: 0,
        amount: 0,
      };
      existing.hours += entry.durationMinutes / 60;
      existing.amount += entry.totalAmount;
      byMatterMap.set(entry.matterId, existing);
    }

    const byTimekeeperMap = new Map<string, { hours: number; amount: number }>();
    for (const entry of billableEntries) {
      const existing = byTimekeeperMap.get(entry.timekeeperId) ?? {
        hours: 0,
        amount: 0,
      };
      existing.hours += entry.durationMinutes / 60;
      existing.amount += entry.totalAmount;
      byTimekeeperMap.set(entry.timekeeperId, existing);
    }

    const byActivityMap = new Map<ActivityCode, { hours: number; amount: number }>();
    for (const entry of billableEntries) {
      const existing = byActivityMap.get(entry.activityCode) ?? {
        hours: 0,
        amount: 0,
      };
      existing.hours += entry.durationMinutes / 60;
      existing.amount += entry.totalAmount;
      byActivityMap.set(entry.activityCode, existing);
    }

    const byStatus: Record<TimeEntryStatus, { count: number; hours: number }> = {
      draft: { count: 0, hours: 0 },
      pending_review: { count: 0, hours: 0 },
      approved: { count: 0, hours: 0 },
      rejected: { count: 0, hours: 0 },
      billed: { count: 0, hours: 0 },
      voided: { count: 0, hours: 0 },
    };
    for (const entry of allEntries) {
      byStatus[entry.status].count++;
      byStatus[entry.status].hours += entry.durationMinutes / 60;
    }

    const byMonthMap = new Map<string, { hours: number; amount: number }>();
    for (const entry of billableEntries) {
      const month = entry.date.substring(0, 7);
      const existing = byMonthMap.get(month) ?? { hours: 0, amount: 0 };
      existing.hours += entry.durationMinutes / 60;
      existing.amount += entry.totalAmount;
      byMonthMap.set(month, existing);
    }

    const dateRange = allEntries.map((e) => new Date(e.date));
    const dayCount =
      dateRange.length > 0
        ? Math.max(
            1,
            Math.ceil(
              (Math.max(...dateRange.map((d) => d.getTime())) -
                Math.min(...dateRange.map((d) => d.getTime()))) /
                (1000 * 60 * 60 * 24)
            ) + 1
          )
        : 1;

    return {
      totalEntries: allEntries.length,
      totalBillableHours,
      totalBillableAmount,
      totalNonBillableHours,
      totalNonBillableAmount,
      byMatter: Array.from(byMatterMap.entries()).map(([matterId, data]) => ({
        matterId,
        ...data,
      })),
      byTimekeeper: Array.from(byTimekeeperMap.entries()).map(
        ([timekeeperId, data]) => ({ timekeeperId, ...data })
      ),
      byActivity: Array.from(byActivityMap.entries()).map(
        ([activityCode, data]) => ({ activityCode, ...data })
      ),
      byStatus,
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      utilizationRate:
        totalBillableHours > 0
          ? (totalBillableHours / (dayCount * 8)) * 100
          : 0,
      averageHoursPerDay: totalBillableHours / dayCount,
      averageHoursPerEntry:
        allEntries.length > 0
          ? allEntries.reduce((sum, e) => sum + e.durationMinutes, 0) /
            60 /
            allEntries.length
          : 0,
    };
  },

  /**
   * Get time entry statistics
   */
  getStats(timekeeperId?: string, dateFrom?: string, dateTo?: string): TimeEntryStats {
    let entries = [...timeEntries];

    if (timekeeperId) {
      entries = entries.filter((e) => e.timekeeperId === timekeeperId);
    }
    if (dateFrom) {
      entries = entries.filter((e) => new Date(e.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      entries = entries.filter((e) => new Date(e.date) <= new Date(dateTo));
    }

    const billableEntries = entries.filter((e) => e.type === "billable");
    const totalHours =
      entries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;
    const billableHours =
      billableEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeekEntries = entries.filter(
      (e) => new Date(e.date) >= weekAgo
    );
    const lastWeekEntries = entries.filter(
      (e) =>
        new Date(e.date) >=
          new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
        new Date(e.date) < weekAgo
    );
    const thisMonthEntries = entries.filter(
      (e) => new Date(e.date) >= monthAgo
    );
    const lastMonthEntries = entries.filter(
      (e) =>
        new Date(e.date) >=
          new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000) &&
        new Date(e.date) < monthAgo
    );

    const thisWeekHours =
      thisWeekEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;
    const lastWeekHours =
      lastWeekEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;
    const thisMonthHours =
      thisMonthEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;
    const lastMonthHours =
      lastMonthEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;

    return {
      totalEntries: entries.length,
      totalHours,
      totalAmount: entries.reduce((sum, e) => sum + e.totalAmount, 0),
      billableHours,
      billableAmount: billableEntries.reduce(
        (sum, e) => sum + e.totalAmount,
        0
      ),
      pendingApproval: entries.filter((e) => e.status === "pending_review")
        .length,
      approved: entries.filter((e) => e.status === "approved").length,
      rejected: entries.filter((e) => e.status === "rejected").length,
      billed: entries.filter((e) => e.status === "billed").length,
      averageDailyHours:
        entries.length > 0
          ? totalHours /
            Math.max(
              1,
              new Set(entries.map((e) => e.date.substring(0, 10))).size
            )
          : 0,
      weeklyTrend:
        lastWeekHours > 0
          ? ((thisWeekHours - lastWeekHours) / lastWeekHours) * 100
          : 0,
      monthlyTrend:
        lastMonthHours > 0
          ? ((thisMonthHours - lastMonthHours) / lastMonthHours) * 100
          : 0,
    };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    timeEntries = [];
    activeTimers = [];
    entryCounter = 1;
    timerCounter = 1;
  },
};
