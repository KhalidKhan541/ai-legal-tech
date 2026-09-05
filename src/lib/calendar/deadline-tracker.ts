import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const DeadlineType = z.enum([
  "statute_of_limitations",
  "filing_deadline",
  "discovery_deadline",
  "response_deadline",
  "motion_deadline",
  "appeal_deadline",
  "deposition_deadline",
  "mediation_deadline",
  "settlement_deadline",
  "contractual_deadline",
  "court_ordered",
  "regulatory",
  "other",
]);
export type DeadlineType = z.infer<typeof DeadlineType>;

export const DeadlineStatus = z.enum([
  "active",
  "completed",
  "extended",
  "missed",
  "cancelled",
  "on_hold",
]);
export type DeadlineStatus = z.infer<typeof DeadlineStatus>;

export const AlertLevel = z.enum(["info", "warning", "urgent", "critical"]);
export type AlertLevel = z.infer<typeof AlertLevel>;

export const EscalationLevel = z.enum([
  "none",
  "attorney",
  "partner",
  "managing_partner",
  "external",
]);
export type EscalationLevel = z.infer<typeof EscalationLevel>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const DeadlineAlertSchema = z.object({
  id: z.string().uuid(),
  deadlineId: z.string().uuid(),
  alertLevel: AlertLevel,
  message: z.string(),
  minutesBeforeDeadline: z.number(),
  sent: z.boolean().default(false),
  sentAt: z.string().datetime().optional(),
  acknowledged: z.boolean().default(false),
  acknowledgedAt: z.string().datetime().optional(),
  acknowledgedBy: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});

export type DeadlineAlert = z.infer<typeof DeadlineAlertSchema>;

export const DeadlineExtensionSchema = z.object({
  id: z.string().uuid(),
  deadlineId: z.string().uuid(),
  originalDate: z.string().datetime(),
  newDate: z.string().datetime(),
  reason: z.string().min(1),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  status: z.enum(["pending", "approved", "denied"]),
  documents: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        type: z.string(),
      })
    )
    .default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DeadlineExtension = z.infer<typeof DeadlineExtensionSchema>;

export const DeadlineSchema = z.object({
  id: z.string().uuid(),
  deadlineNumber: z.string(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: DeadlineType,
  status: DeadlineStatus,
  matterId: z.string().uuid(),
  matterNumber: z.string(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  date: z.string().datetime(),
  originalDate: z.string().datetime(),
  time: z.string().optional(),
  timezone: z.string().default("America/New_York"),
  isAllDay: z.boolean().default(true),
  courtName: z.string().optional(),
  judgeName: z.string().optional(),
  jurisdiction: z.string().optional(),
  filingRequirements: z
    .object({
      format: z.string().optional(),
      copies: z.number().min(1).optional(),
      filingMethod: z.enum(["electronic", "physical", "both"]).optional(),
      serviceRequired: z.boolean().default(false),
      serviceDeadline: z.string().datetime().optional(),
    })
    .optional(),
  assignedTo: z.string().uuid().optional(),
  assignedToName: z.string().optional(),
  responsibleAttorney: z.string().uuid().optional(),
  responsibleAttorneyName: z.string().optional(),
  alerts: z.array(DeadlineAlertSchema).default([]),
  extensions: z.array(DeadlineExtensionSchema).default([]),
  escalationLevel: EscalationLevel.default("none"),
  escalationHistory: z
    .array(
      z.object({
        level: EscalationLevel,
        escalatedAt: z.string().datetime(),
        escalatedBy: z.string().uuid(),
        reason: z.string(),
      })
    )
    .default([]),
  dependencies: z
    .array(
      z.object({
        deadlineId: z.string().uuid(),
        type: z.enum(["blocks", "blocked_by"]),
      })
    )
    .default([]),
  documents: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        type: z.string(),
        status: z.enum(["draft", "review", "final", "filed"]),
      })
    )
    .default([]),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrence: z
    .object({
      frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
      interval: z.number().min(1).default(1),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).default({}),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Deadline = z.infer<typeof DeadlineSchema>;

export const CreateDeadlineSchema = DeadlineSchema.omit({
  id: true,
  deadlineNumber: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  alerts: true,
  extensions: true,
  escalationHistory: true,
});

export type CreateDeadlineInput = z.infer<typeof CreateDeadlineSchema>;

export const UpdateDeadlineSchema = DeadlineSchema.partial().omit({
  id: true,
  deadlineNumber: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateDeadlineInput = z.infer<typeof UpdateDeadlineSchema>;

export const DeadlineFilterSchema = z.object({
  types: z.array(DeadlineType).optional(),
  statuses: z.array(DeadlineStatus).optional(),
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  responsibleAttorney: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  jurisdiction: z.string().optional(),
  courtName: z.string().optional(),
  overdue: z.boolean().optional(),
  urgent: z.boolean().optional(),
  sortBy: z
    .enum([
      "date",
      "title",
      "type",
      "status",
      "createdAt",
      "escalationLevel",
    ])
    .default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type DeadlineFilter = z.infer<typeof DeadlineFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeadlineStats {
  totalDeadlines: number;
  activeDeadlines: number;
  overdueDeadlines: number;
  completedDeadlines: number;
  deadlinesByType: Record<DeadlineType, number>;
  deadlinesByStatus: Record<DeadlineStatus, number>;
  deadlinesByEscalation: Record<EscalationLevel, number>;
  upcomingThisWeek: number;
  upcomingThisMonth: number;
  averageDaysToComplete: number;
}

export interface DeadlineTimelineItem {
  deadline: Deadline;
  daysUntilDue: number;
  urgency: AlertLevel;
  isOverdue: boolean;
  completionPercentage: number;
}

export interface EscalationConfig {
  level: EscalationLevel;
  daysBeforeDeadline: number;
  notifyUsers: string[];
  autoEscalate: boolean;
}

export interface DeadlineAlertConfig {
  levels: {
    level: AlertLevel;
    minutesBefore: number[];
  }[];
  defaultConfig: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let deadlines: Deadline[] = [];
let deadlineCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function generateDeadlineNumber(): string {
  const year = new Date().getFullYear();
  const num = String(deadlineCounter++).padStart(5, "0");
  return `DLN-${year}-${num}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Default Escalation Configuration ───────────────────────────────────────

const DEFAULT_ESCALATION_CONFIG: EscalationConfig[] = [
  {
    level: "attorney",
    daysBeforeDeadline: 14,
    notifyUsers: [],
    autoEscalate: true,
  },
  {
    level: "partner",
    daysBeforeDeadline: 7,
    notifyUsers: [],
    autoEscalate: true,
  },
  {
    level: "managing_partner",
    daysBeforeDeadline: 3,
    notifyUsers: [],
    autoEscalate: true,
  },
  {
    level: "external",
    daysBeforeDeadline: 1,
    notifyUsers: [],
    autoEscalate: false,
  },
];

const DEFAULT_ALERT_CONFIG: DeadlineAlertConfig = {
  levels: [
    { level: "info", minutesBefore: [10080, 4320, 1440] }, // 7 days, 3 days, 1 day
    { level: "warning", minutesBefore: [4320, 1440, 480] }, // 3 days, 1 day, 8 hours
    { level: "urgent", minutesBefore: [1440, 480, 60] }, // 1 day, 8 hours, 1 hour
    { level: "critical", minutesBefore: [480, 60, 15] }, // 8 hours, 1 hour, 15 minutes
  ],
  defaultConfig: {
    email: true,
    push: true,
    sms: false,
  },
};

// ─── Helper Functions ───────────────────────────────────────────────────────

function calculateDaysUntil(date: string): number {
  const target = new Date(date);
  const nowDate = new Date();
  const diffMs = target.getTime() - nowDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function calculateUrgency(daysUntil: number): AlertLevel {
  if (daysUntil < 0) return "critical";
  if (daysUntil <= 1) return "urgent";
  if (daysUntil <= 3) return "warning";
  if (daysUntil <= 7) return "info";
  return "info";
}

function calculateEscalationLevel(daysUntil: number): EscalationLevel {
  if (daysUntil <= 1) return "external";
  if (daysUntil <= 3) return "managing_partner";
  if (daysUntil <= 7) return "partner";
  if (daysUntil <= 14) return "attorney";
  return "none";
}

function isOverdue(deadline: Deadline): boolean {
  if (deadline.status === "completed" || deadline.status === "cancelled") {
    return false;
  }
  return new Date(deadline.date) < new Date();
}

// ─── Deadline Tracker Service ───────────────────────────────────────────────

export const DeadlineTracker = {
  /**
   * Create a new deadline
   */
  input: CreateDeadlineInput;
  userId: string;
  create(input: CreateDeadlineInput, userId: string): Deadline {
    const validated = CreateDeadlineSchema.parse(input);

    const deadline: Deadline = {
      ...validated,
      id: generateId(),
      deadlineNumber: generateDeadlineNumber(),
      originalDate: validated.date,
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      alerts: [],
      extensions: [],
      escalationHistory: [],
    };

    // Create default alerts
    for (const alertLevel of DEFAULT_ALERT_CONFIG.levels) {
      for (const minutesBefore of alertLevel.minutesBefore) {
        const alert: DeadlineAlert = {
          id: generateId(),
          deadlineId: deadline.id,
          alertLevel: alertLevel.level,
          message: `Deadline "${deadline.title}" is due in ${Math.round(minutesBefore / 1440)} day(s)`,
          minutesBeforeDeadline: minutesBefore,
          sent: false,
          createdAt: now(),
        };
        deadline.alerts.push(alert);
      }
    }

    deadlines.push(deadline);
    return deadline;
  },

  /**
   * Get deadline by ID
   */
  getById(id: string): Deadline | undefined {
    return deadlines.find((d) => d.id === id);
  },

  /**
   * Get deadline by number
   */
  getByDeadlineNumber(deadlineNumber: string): Deadline | undefined {
    return deadlines.find((d) => d.deadlineNumber === deadlineNumber);
  },

  /**
   * Update deadline
   */
  update(
    id: string,
    input: UpdateDeadlineInput,
    userId: string
  ): Deadline | undefined {
    const index = deadlines.findIndex((d) => d.id === id);
    if (index === -1) return undefined;

    const validated = UpdateDeadlineSchema.parse(input);
    deadlines[index] = {
      ...deadlines[index],
      ...validated,
      updatedAt: now(),
    };

    return deadlines[index];
  },

  /**
   * Delete deadline
   */
  delete(id: string, userId: string): boolean {
    const index = deadlines.findIndex((d) => d.id === id);
    if (index === -1) return false;

    deadlines.splice(index, 1);
    return true;
  },

  /**
   * Complete deadline
   */
  complete(id: string, userId: string): Deadline | undefined {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) return undefined;

    deadline.status = "completed";
    deadline.updatedAt = now();
    return deadline;
  },

  /**
   * Cancel deadline
   */
  cancel(id: string, userId: string, reason?: string): Deadline | undefined {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) return undefined;

    deadline.status = "cancelled";
    deadline.metadata = {
      ...deadline.metadata,
      cancellationReason: reason,
      cancelledBy: userId,
      cancelledAt: now(),
    };
    deadline.updatedAt = now();
    return deadline;
  },

  /**
   * Extend deadline
   */
  extend(
    id: string,
    newDate: string,
    reason: string,
    userId: string
  ): DeadlineExtension {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) {
      throw new Error(`Deadline not found: ${id}`);
    }

    if (deadline.status === "completed" || deadline.status === "cancelled") {
      throw new Error("Cannot extend completed or cancelled deadline");
    }

    if (new Date(newDate) <= new Date(deadline.date)) {
      throw new Error("New date must be after current deadline date");
    }

    const extension: DeadlineExtension = {
      id: generateId(),
      deadlineId: id,
      originalDate: deadline.date,
      newDate,
      reason,
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    };

    deadline.extensions.push(extension);
    deadline.updatedAt = now();
    return extension;
  },

  /**
   * Approve extension
   */
  approveExtension(
    deadlineId: string,
    extensionId: string,
    approvedBy: string
  ): DeadlineExtension | undefined {
    const deadline = deadlines.find((d) => d.id === deadlineId);
    if (!deadline) return undefined;

    const extension = deadline.extensions.find((e) => e.id === extensionId);
    if (!extension) return undefined;

    extension.status = "approved";
    extension.approvedBy = approvedBy;
    extension.approvedAt = now();
    extension.updatedAt = now();

    // Update deadline date
    deadline.date = extension.newDate;
    deadline.updatedAt = now();

    return extension;
  },

  /**
   * Deny extension
   */
  denyExtension(
    deadlineId: string,
    extensionId: string,
    deniedBy: string
  ): DeadlineExtension | undefined {
    const deadline = deadlines.find((d) => d.id === deadlineId);
    if (!deadline) return undefined;

    const extension = deadline.extensions.find((e) => e.id === extensionId);
    if (!extension) return undefined;

    extension.status = "denied";
    extension.approvedBy = deniedBy;
    extension.approvedAt = now();
    extension.updatedAt = now();

    return extension;
  },

  /**
   * Put deadline on hold
   */
  putOnHold(id: string, userId: string, reason: string): Deadline | undefined {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) return undefined;

    deadline.status = "on_hold";
    deadline.metadata = {
      ...deadline.metadata,
      holdReason: reason,
      holdStartedBy: userId,
      holdStartedAt: now(),
    };
    deadline.updatedAt = now();
    return deadline;
  },

  /**
   * Resume deadline from hold
   */
  resume(id: string, userId: string): Deadline | undefined {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) return undefined;

    if (deadline.status !== "on_hold") {
      throw new Error("Deadline is not on hold");
    }

    deadline.status = "active";
    deadline.metadata = {
      ...deadline.metadata,
      holdResumedBy: userId,
      holdResumedAt: now(),
    };
    deadline.updatedAt = now();
    return deadline;
  },

  /**
   * Escalate deadline
   */
  escalate(
    id: string,
    level: EscalationLevel,
    userId: string,
    reason: string
  ): Deadline | undefined {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) return undefined;

    const escalationOrder: EscalationLevel[] = [
      "none",
      "attorney",
      "partner",
      "managing_partner",
      "external",
    ];

    const currentLevelIndex = escalationOrder.indexOf(deadline.escalationLevel);
    const newLevelIndex = escalationOrder.indexOf(level);

    if (newLevelIndex <= currentLevelIndex) {
      throw new Error("Cannot escalate to a lower or equal level");
    }

    deadline.escalationLevel = level;
    deadline.escalationHistory.push({
      level,
      escalatedAt: now(),
      escalatedBy: userId,
      reason,
    });
    deadline.updatedAt = now();
    return deadline;
  },

  /**
   * Check and auto-escalate deadlines
   */
  checkEscalations(): Deadline[] {
    const escalatedDeadlines: Deadline[] = [];

    for (const deadline of deadlines) {
      if (
        deadline.status !== "active" &&
        deadline.status !== "on_hold"
      ) {
        continue;
      }

      const daysUntil = calculateDaysUntil(deadline.date);
      const suggestedLevel = calculateEscalationLevel(daysUntil);

      if (
        suggestedLevel !== "none" &&
        suggestedLevel !== deadline.escalationLevel
      ) {
        const config = DEFAULT_ESCALATION_CONFIG.find(
          (c) => c.level === suggestedLevel
        );

        if (config?.autoEscalate) {
          deadline.escalationLevel = suggestedLevel;
          deadline.escalationHistory.push({
            level: suggestedLevel,
            escalatedAt: now(),
            escalatedBy: "system",
            reason: `Auto-escalated: ${daysUntil} days until deadline`,
          });
          deadline.updatedAt = now();
          escalatedDeadlines.push(deadline);
        }
      }
    }

    return escalatedDeadlines;
  },

  /**
   * Check and send alerts
   */
  checkAlerts(): DeadlineAlert[] {
    const alertsToSend: DeadlineAlert[] = [];

    for (const deadline of deadlines) {
      if (deadline.status !== "active") continue;

      const daysUntil = calculateDaysUntil(deadline.date);
      const minutesUntil = daysUntil * 24 * 60;

      for (const alert of deadline.alerts) {
        if (!alert.sent && minutesUntil <= alert.minutesBeforeDeadline) {
          alert.sent = true;
          alert.sentAt = now();
          alertsToSend.push(alert);
        }
      }
    }

    return alertsToSend;
  },

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(
    deadlineId: string,
    alertId: string,
    userId: string
  ): DeadlineAlert | undefined {
    const deadline = deadlines.find((d) => d.id === deadlineId);
    if (!deadline) return undefined;

    const alert = deadline.alerts.find((a) => a.id === alertId);
    if (!alert) return undefined;

    alert.acknowledged = true;
    alert.acknowledgedAt = now();
    alert.acknowledgedBy = userId;
    deadline.updatedAt = now();
    return alert;
  },

  /**
   * Get overdue deadlines
   */
  getOverdue(): Deadline[] {
    return deadlines
      .filter((d) => isOverdue(d))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  },

  /**
   * Get deadlines approaching (within days)
   */
  getUpcoming(daysAhead: number = 30): Deadline[] {
    const nowDate = new Date();
    const futureDate = new Date(
      nowDate.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );

    return deadlines
      .filter((d) => {
        const deadlineDate = new Date(d.date);
        return (
          deadlineDate >= nowDate &&
          deadlineDate <= futureDate &&
          d.status === "active"
        );
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  },

  /**
   * Get deadlines by matter
   */
  getByMatter(matterId: string): Deadline[] {
    return deadlines
      .filter((d) => d.matterId === matterId)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  },

  /**
   * Get deadlines by type
   */
  getByType(type: DeadlineType): Deadline[] {
    return deadlines
      .filter((d) => d.type === type && d.status === "active")
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  },

  /**
   * Get statute of limitations deadlines
   */
  getStatuteOfLimitations(): Deadline[] {
    return DeadlineTracker.getByType("statute_of_limitations");
  },

  /**
   * Get filing deadlines
   */
  getFilingDeadlines(): Deadline[] {
    return DeadlineTracker.getByType("filing_deadline");
  },

  /**
   * Get discovery deadlines
   */
  getDiscoveryDeadlines(): Deadline[] {
    return DeadlineTracker.getByType("discovery_deadline");
  },

  /**
   * Get court-ordered deadlines
   */
  getCourtOrderedDeadlines(): Deadline[] {
    return DeadlineTracker.getByType("court_ordered");
  },

  /**
   * Get deadline timeline
   */
  getTimeline(matterId?: string): DeadlineTimelineItem[] {
    let filteredDeadlines = matterId
      ? deadlines.filter((d) => d.matterId === matterId)
      : deadlines;

    return filteredDeadlines
      .filter((d) => d.status === "active" || d.status === "on_hold")
      .map((deadline) => {
        const daysUntil = calculateDaysUntil(deadline.date);
        const urgency = calculateUrgency(daysUntil);
        const overdue = daysUntil < 0;

        // Calculate completion percentage based on documents
        const totalDocs = deadline.documents.length;
        const filedDocs = deadline.documents.filter(
          (doc) => doc.status === "filed"
        ).length;
        const completionPercentage =
          totalDocs > 0 ? (filedDocs / totalDocs) * 100 : 0;

        return {
          deadline,
          daysUntilDue: daysUntil,
          urgency,
          isOverdue: overdue,
          completionPercentage,
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  },

  /**
   * Search and filter deadlines
   */
  search(filter: DeadlineFilter): PaginatedResult<Deadline> {
    const validated = DeadlineFilterSchema.parse(filter);
    let filtered = [...deadlines];

    // Type filter
    if (validated.types?.length) {
      filtered = filtered.filter((d) => validated.types!.includes(d.type));
    }

    // Status filter
    if (validated.statuses?.length) {
      filtered = filtered.filter((d) =>
        validated.statuses!.includes(d.status)
      );
    }

    // Matter filter
    if (validated.matterId) {
      filtered = filtered.filter((d) => d.matterId === validated.matterId);
    }

    // Client filter
    if (validated.clientId) {
      filtered = filtered.filter((d) => d.clientId === validated.clientId);
    }

    // Assigned user filter
    if (validated.assignedTo) {
      filtered = filtered.filter((d) => d.assignedTo === validated.assignedTo);
    }

    // Responsible attorney filter
    if (validated.responsibleAttorney) {
      filtered = filtered.filter(
        (d) => d.responsibleAttorney === validated.responsibleAttorney
      );
    }

    // Date range
    if (validated.dateFrom) {
      filtered = filtered.filter(
        (d) => new Date(d.date) >= new Date(validated.dateFrom!)
      );
    }
    if (validated.dateTo) {
      filtered = filtered.filter(
        (d) => new Date(d.date) <= new Date(validated.dateTo!)
      );
    }

    // Text search
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term) ||
          d.deadlineNumber.toLowerCase().includes(term) ||
          d.matterNumber.toLowerCase().includes(term) ||
          d.clientName?.toLowerCase().includes(term)
      );
    }

    // Jurisdiction filter
    if (validated.jurisdiction) {
      filtered = filtered.filter(
        (d) =>
          d.jurisdiction?.toLowerCase() ===
          validated.jurisdiction!.toLowerCase()
      );
    }

    // Court name filter
    if (validated.courtName) {
      filtered = filtered.filter(
        (d) =>
          d.courtName?.toLowerCase() === validated.courtName!.toLowerCase()
      );
    }

    // Overdue filter
    if (validated.overdue) {
      filtered = filtered.filter((d) => isOverdue(d));
    }

    // Urgent filter (due within 3 days)
    if (validated.urgent) {
      filtered = filtered.filter((d) => {
        const daysUntil = calculateDaysUntil(d.date);
        return daysUntil >= 0 && daysUntil <= 3;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (validated.sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "escalationLevel": {
          const escalationOrder = [
            "none",
            "attorney",
            "partner",
            "managing_partner",
            "external",
          ];
          comparison =
            escalationOrder.indexOf(a.escalationLevel) -
            escalationOrder.indexOf(b.escalationLevel);
          break;
        }
      }
      return validated.sortOrder === "asc" ? comparison : -comparison;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / validated.limit);
    const start = (validated.page - 1) * validated.limit;
    const items = filtered.slice(start, start + validated.limit);

    return { items, total, page: validated.page, limit: validated.limit, totalPages };
  },

  /**
   * Get deadline statistics
   */
  getStats(matterId?: string): DeadlineStats {
    const filteredDeadlines = matterId
      ? deadlines.filter((d) => d.matterId === matterId)
      : deadlines;

    const deadlinesByType = {} as Record<DeadlineType, number>;
    const deadlinesByStatus = {} as Record<DeadlineStatus, number>;
    const deadlinesByEscalation = {} as Record<EscalationLevel, number>;

    for (const type of Object.values(DeadlineType.enum)) {
      deadlinesByType[type] = 0;
    }
    for (const status of Object.values(DeadlineStatus.enum)) {
      deadlinesByStatus[status] = 0;
    }
    for (const level of Object.values(EscalationLevel.enum)) {
      deadlinesByEscalation[level] = 0;
    }

    let overdueDeadlines = 0;
    let upcomingThisWeek = 0;
    let upcomingThisMonth = 0;
    let totalCompletionDays = 0;
    let completedCount = 0;

    const nowDate = new Date();
    const weekEnd = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthEnd = new Date(nowDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const deadline of filteredDeadlines) {
      deadlinesByType[deadline.type]++;
      deadlinesByStatus[deadline.status]++;
      deadlinesByEscalation[deadline.escalationLevel]++;

      if (isOverdue(deadline)) {
        overdueDeadlines++;
      }

      const deadlineDate = new Date(deadline.date);
      if (deadlineDate >= nowDate && deadlineDate <= weekEnd) {
        upcomingThisWeek++;
      }
      if (deadlineDate >= nowDate && deadlineDate <= monthEnd) {
        upcomingThisMonth++;
      }

      if (deadline.status === "completed") {
        completedCount++;
        totalCompletionDays +=
          (new Date(deadline.updatedAt).getTime() -
            new Date(deadline.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
      }
    }

    return {
      totalDeadlines: filteredDeadlines.length,
      activeDeadlines: filteredDeadlines.filter(
        (d) => d.status === "active"
      ).length,
      overdueDeadlines,
      completedDeadlines: completedCount,
      deadlinesByType,
      deadlinesByStatus,
      deadlinesByEscalation,
      upcomingThisWeek,
      upcomingThisMonth,
      averageDaysToComplete:
        completedCount > 0 ? totalCompletionDays / completedCount : 0,
    };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    deadlines = [];
    deadlineCounter = 1;
  },
};
