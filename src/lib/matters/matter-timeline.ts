import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const EventType = z.enum([
  "filing",
  "hearing",
  "deposition",
  "mediation",
  "arbitration",
  "trial_date",
  "deadline",
  "motion",
  "discovery",
  "settlement_conference",
  "status_change",
  "assignment",
  "note",
  "document_added",
  "task_completed",
  "billing",
  "client_communication",
  "court_order",
  "appeal_filed",
  "other",
]);
export type EventType = z.infer<typeof EventType>;

export const EventStatus = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "postponed",
  "rescheduled",
]);
export type EventStatus = z.infer<typeof EventStatus>;

export const Priority = z.enum(["low", "medium", "high", "critical"]);
export type Priority = z.infer<typeof Priority>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const TimelineEventSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  type: EventType,
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().default(false),
  status: EventStatus,
  priority: Priority,
  location: z.string().optional(),
  courtName: z.string().optional(),
  judgeName: z.string().optional(),
  attendees: z
    .array(
      z.object({
        userId: z.string().uuid(),
        name: z.string(),
        role: z.string(),
        rsvp: z.enum(["pending", "accepted", "declined", "tentative"]).default("pending"),
      })
    )
    .default([]),
  relatedDocuments: z.array(z.string().uuid()).default([]),
  relatedTasks: z.array(z.string().uuid()).default([]),
  recurrence: z
    .object({
      frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]),
      interval: z.number().min(1).default(1),
      endDate: z.string().datetime().optional(),
      count: z.number().min(1).optional(),
    })
    .optional(),
  reminders: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.enum(["email", "push", "sms"]),
        minutesBefore: z.number().min(0),
        sent: z.boolean().default(false),
        sentAt: z.string().datetime().optional(),
      })
    )
    .default([]),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const CreateEventSchema = TimelineEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = TimelineEventSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const MilestoneSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  targetDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  isCompleted: z.boolean().default(false),
  progress: z.number().min(0).max(100).default(0),
  dependencies: z.array(z.string().uuid()).default([]),
  eventId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  entityId: z.string().uuid(),
  entityType: z.enum([
    "event",
    "milestone",
    "status_change",
    "assignment",
    "note",
    "document",
    "task",
  ]),
  action: z.enum([
    "created",
    "updated",
    "deleted",
    "completed",
    "cancelled",
    "assigned",
    "unassigned",
    "status_changed",
    "filed",
  ]),
  description: z.string(),
  userId: z.string().uuid(),
  userName: z.string(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).default({}),
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;

export const TimelineFilterSchema = z.object({
  matterId: z.string().uuid().optional(),
  types: z.array(EventType).optional(),
  statuses: z.array(EventStatus).optional(),
  priorities: z.array(Priority).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  hasAttendees: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  sortBy: z.enum(["date", "priority", "status", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

export type TimelineFilter = z.infer<typeof TimelineFilterSchema>;

export interface TimelineView {
  events: TimelineEvent[];
  milestones: Milestone[];
  activityLog: ActivityLog[];
  stats: TimelineStats;
}

export interface TimelineStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByStatus: Record<EventStatus, number>;
  overdueMilestones: number;
  completedMilestones: number;
  totalMilestones: number;
}

export interface TimelineDay {
  date: string;
  events: TimelineEvent[];
  milestones: Milestone[];
  isToday: boolean;
  isPast: boolean;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let events: TimelineEvent[] = [];
let milestones: Milestone[] = [];
let activityLog: ActivityLog[] = [];

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function createActivityLog(
  matterId: string,
  entityId: string,
  entityType: ActivityLog["entityType"],
  action: ActivityLog["action"],
  description: string,
  userId: string,
  userName: string,
  previousValue?: unknown,
  newValue?: unknown,
  metadata?: Record<string, unknown>
): ActivityLog {
  const log: ActivityLog = {
    id: generateId(),
    matterId,
    entityId,
    entityType,
    action,
    description,
    userId,
    userName,
    previousValue,
    newValue,
    timestamp: now(),
    metadata: metadata ?? {},
  };
  activityLog.push(log);
  return log;
}

function getNextOccurrence(
  date: Date,
  recurrence: z.infer<typeof TimelineEventSchema>["recurrence"]
): Date | null {
  if (!recurrence) return null;

  const next = new Date(date);

  switch (recurrence.frequency) {
    case "daily":
      next.setDate(next.getDate() + recurrence.interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7 * recurrence.interval);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14 * recurrence.interval);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + recurrence.interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + recurrence.interval);
      break;
  }

  if (recurrence.endDate && next > new Date(recurrence.endDate)) {
    return null;
  }

  return next;
}

// ─── Timeline Service ───────────────────────────────────────────────────────

export const TimelineService = {
  /**
   * Create a new timeline event
   */
  createEvent(input: CreateEventInput, userId: string): TimelineEvent {
    const validated = CreateEventSchema.parse(input);

    const event: TimelineEvent = {
      ...validated,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };

    events.push(event);

    createActivityLog(
      event.matterId,
      event.id,
      "event",
      "created",
      `Event "${event.title}" scheduled for ${new Date(event.date).toLocaleDateString()}`,
      userId,
      "System",
      undefined,
      event
    );

    return event;
  },

  /**
   * Get event by ID
   */
  getEventById(id: string): TimelineEvent | undefined {
    return events.find((e) => e.id === id);
  },

  /**
   * Update event
   */
  updateEvent(
    id: string,
    input: UpdateEventInput,
    userId: string
  ): TimelineEvent | undefined {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const validated = UpdateEventSchema.parse(input);
    const previous = { ...events[index] };

    events[index] = {
      ...events[index],
      ...validated,
      updatedAt: now(),
    };

    createActivityLog(
      events[index].matterId,
      id,
      "event",
      "updated",
      `Event "${events[index].title}" updated`,
      userId,
      "System",
      previous,
      events[index]
    );

    return events[index];
  },

  /**
   * Delete event
   */
  deleteEvent(id: string, userId: string): boolean {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return false;

    const event = events[index];

    createActivityLog(
      event.matterId,
      id,
      "event",
      "deleted",
      `Event "${event.title}" deleted`,
      userId,
      "System",
      event
    );

    events.splice(index, 1);
    return true;
  },

  /**
   * Cancel event
   */
  cancelEvent(
    id: string,
    userId: string,
    reason?: string
  ): TimelineEvent | undefined {
    const event = events.find((e) => e.id === id);
    if (!event) return undefined;

    const previousStatus = event.status;
    event.status = "cancelled";
    event.updatedAt = now();
    event.metadata = {
      ...event.metadata,
      cancellationReason: reason,
      cancelledBy: userId,
      cancelledAt: now(),
    };

    createActivityLog(
      event.matterId,
      id,
      "event",
      "cancelled",
      `Event "${event.title}" cancelled${reason ? `: ${reason}` : ""}`,
      userId,
      "System",
      { status: previousStatus },
      { status: "cancelled" }
    );

    return event;
  },

  /**
   * Reschedule event
   */
  rescheduleEvent(
    id: string,
    newDate: string,
    userId: string,
    reason?: string
  ): TimelineEvent | undefined {
    const event = events.find((e) => e.id === id);
    if (!event) return undefined;

    const previousDate = event.date;
    event.date = newDate;
    event.status = "rescheduled";
    event.updatedAt = now();
    event.metadata = {
      ...event.metadata,
      previousDate,
      rescheduleReason: reason,
      rescheduledBy: userId,
      rescheduledAt: now(),
    };

    createActivityLog(
      event.matterId,
      id,
      "event",
      "updated",
      `Event "${event.title}" rescheduled from ${new Date(previousDate).toLocaleDateString()} to ${new Date(newDate).toLocaleDateString()}`,
      userId,
      "System",
      { date: previousDate, status: event.status },
      { date: newDate, status: "rescheduled" }
    );

    return event;
  },

  /**
   * Complete event
   */
  completeEvent(id: string, userId: string): TimelineEvent | undefined {
    const event = events.find((e) => e.id === id);
    if (!event) return undefined;

    const previousStatus = event.status;
    event.status = "completed";
    event.updatedAt = now();

    createActivityLog(
      event.matterId,
      id,
      "event",
      "completed",
      `Event "${event.title}" completed`,
      userId,
      "System",
      { status: previousStatus },
      { status: "completed" }
    );

    return event;
  },

  /**
   * Get events for a matter
   */
  getEventsByMatter(matterId: string): TimelineEvent[] {
    return events
      .filter((e) => e.matterId === matterId)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  },

  /**
   * Get upcoming events
   */
  getUpcomingEvents(
    matterId?: string,
    daysAhead: number = 30
  ): TimelineEvent[] {
    const nowDate = new Date();
    const futureDate = new Date(
      nowDate.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );

    return events
      .filter((e) => {
        const eventDate = new Date(e.date);
        return (
          eventDate >= nowDate &&
          eventDate <= futureDate &&
          e.status !== "cancelled" &&
          e.status !== "completed" &&
          (matterId ? e.matterId === matterId : true)
        );
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  },

  /**
   * Get past events
   */
  getPastEvents(matterId?: string, daysBack: number = 90): TimelineEvent[] {
    const nowDate = new Date();
    const pastDate = new Date(
      nowDate.getTime() - daysBack * 24 * 60 * 60 * 1000
    );

    return events
      .filter((e) => {
        const eventDate = new Date(e.date);
        return (
          eventDate >= pastDate &&
          eventDate < nowDate &&
          (matterId ? e.matterId === matterId : true)
        );
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  },

  /**
   * Search and filter events
   */
  searchEvents(filter: TimelineFilter): {
    items: TimelineEvent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const validated = TimelineFilterSchema.parse(filter);
    let filtered = [...events];

    // Matter filter
    if (validated.matterId) {
      filtered = filtered.filter((e) => e.matterId === validated.matterId);
    }

    // Type filter
    if (validated.types?.length) {
      filtered = filtered.filter((e) => validated.types!.includes(e.type));
    }

    // Status filter
    if (validated.statuses?.length) {
      filtered = filtered.filter((e) =>
        validated.statuses!.includes(e.status)
      );
    }

    // Priority filter
    if (validated.priorities?.length) {
      filtered = filtered.filter((e) =>
        validated.priorities!.includes(e.priority)
      );
    }

    // Date range
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

    // Text search
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.location?.toLowerCase().includes(term)
      );
    }

    // Has attendees filter
    if (validated.hasAttendees !== undefined) {
      filtered = filtered.filter((e) =>
        validated.hasAttendees ? e.attendees.length > 0 : e.attendees.length === 0
      );
    }

    // Completed filter
    if (validated.isCompleted !== undefined) {
      filtered = filtered.filter((e) =>
        validated.isCompleted ? e.status === "completed" : e.status !== "completed"
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (validated.sortBy) {
        case "date":
          comparison =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "priority": {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison =
            priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime();
          break;
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
   * Create milestone
   */
  createMilestone(
    input: Omit<Milestone, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Milestone {
    const milestone: Milestone = {
      ...input,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };

    milestones.push(milestone);

    createActivityLog(
      milestone.matterId,
      milestone.id,
      "milestone",
      "created",
      `Milestone "${milestone.title}" created (target: ${new Date(milestone.targetDate).toLocaleDateString()})`,
      userId,
      "System",
      undefined,
      milestone
    );

    return milestone;
  },

  /**
   * Update milestone
   */
  updateMilestone(
    id: string,
    updates: Partial<Omit<Milestone, "id" | "createdAt" | "updatedAt">>,
    userId: string
  ): Milestone | undefined {
    const index = milestones.findIndex((m) => m.id === id);
    if (index === -1) return undefined;

    const previous = { ...milestones[index] };
    milestones[index] = {
      ...milestones[index],
      ...updates,
      updatedAt: now(),
    };

    createActivityLog(
      milestones[index].matterId,
      id,
      "milestone",
      "updated",
      `Milestone "${milestones[index].title}" updated`,
      userId,
      "System",
      previous,
      milestones[index]
    );

    return milestones[index];
  },

  /**
   * Complete milestone
   */
  completeMilestone(id: string, userId: string): Milestone | undefined {
    const milestone = milestones.find((m) => m.id === id);
    if (!milestone) return undefined;

    const previous = { ...milestone };
    milestone.isCompleted = true;
    milestone.completedDate = now();
    milestone.progress = 100;
    milestone.updatedAt = now();

    createActivityLog(
      milestone.matterId,
      id,
      "milestone",
      "completed",
      `Milestone "${milestone.title}" completed`,
      userId,
      "System",
      previous,
      milestone
    );

    return milestone;
  },

  /**
   * Delete milestone
   */
  deleteMilestone(id: string, userId: string): boolean {
    const index = milestones.findIndex((m) => m.id === id);
    if (index === -1) return false;

    const milestone = milestones[index];
    createActivityLog(
      milestone.matterId,
      id,
      "milestone",
      "deleted",
      `Milestone "${milestone.title}" deleted`,
      userId,
      "System",
      milestone
    );

    milestones.splice(index, 1);
    return true;
  },

  /**
   * Get milestones for a matter
   */
  getMilestonesByMatter(matterId: string): Milestone[] {
    return milestones
      .filter((m) => m.matterId === matterId)
      .sort(
        (a, b) =>
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      );
  },

  /**
   * Get overdue milestones
   */
  getOverdueMilestones(matterId?: string): Milestone[] {
    const nowDate = new Date();
    return milestones.filter(
      (m) =>
        !m.isCompleted &&
        new Date(m.targetDate) < nowDate &&
        (matterId ? m.matterId === matterId : true)
    );
  },

  /**
   * Get activity log for a matter
   */
  getActivityLog(
    matterId: string,
    page: number = 1,
    limit: number = 50
  ): {
    items: ActivityLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const filtered = activityLog
      .filter((log) => log.matterId === matterId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  },

  /**
   * Get chronological view (grouped by day)
   */
  getChronologicalView(
    matterId: string,
    startDate: string,
    endDate: string
  ): TimelineDay[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matterEvents = events
      .filter(
        (e) =>
          e.matterId === matterId &&
          new Date(e.date) >= start &&
          new Date(e.date) <= end
      )
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    const matterMilestones = milestones.filter(
      (m) =>
        m.matterId === matterId &&
        new Date(m.targetDate) >= start &&
        new Date(m.targetDate) <= end
    );

    const days: TimelineDay[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayStr = current.toISOString().split("T")[0];
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEvents = matterEvents.filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= dayStart && eventDate <= dayEnd;
      });

      const dayMilestones = matterMilestones.filter((m) => {
        const milestoneDate = new Date(m.targetDate);
        return milestoneDate >= dayStart && milestoneDate <= dayEnd;
      });

      days.push({
        date: dayStr,
        events: dayEvents,
        milestones: dayMilestones,
        isToday: dayStart.getTime() === today.getTime(),
        isPast: dayStart < today,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  },

  /**
   * Get timeline statistics
   */
  getStats(matterId?: string): TimelineStats {
    const nowDate = new Date();

    const filteredEvents = matterId
      ? events.filter((e) => e.matterId === matterId)
      : events;

    const filteredMilestones = matterId
      ? milestones.filter((m) => m.matterId === matterId)
      : milestones;

    const eventsByType = {} as Record<EventType, number>;
    const eventsByStatus = {} as Record<EventStatus, number>;

    for (const type of Object.values(EventType.enum)) {
      eventsByType[type] = 0;
    }
    for (const status of Object.values(EventStatus.enum)) {
      eventsByStatus[status] = 0;
    }

    let upcomingEvents = 0;
    let pastEvents = 0;

    for (const event of filteredEvents) {
      eventsByType[event.type]++;
      eventsByStatus[event.status]++;

      if (new Date(event.date) >= nowDate) {
        upcomingEvents++;
      } else {
        pastEvents++;
      }
    }

    const overdueMilestones = filteredMilestones.filter(
      (m) => !m.isCompleted && new Date(m.targetDate) < nowDate
    ).length;

    const completedMilestones = filteredMilestones.filter(
      (m) => m.isCompleted
    ).length;

    return {
      totalEvents: filteredEvents.length,
      upcomingEvents,
      pastEvents,
      eventsByType,
      eventsByStatus,
      overdueMilestones,
      completedMilestones,
      totalMilestones: filteredMilestones.length,
    };
  },

  /**
   * Get full timeline view
   */
  getTimelineView(matterId: string): TimelineView {
    return {
      events: TimelineService.getEventsByMatter(matterId),
      milestones: TimelineService.getMilestonesByMatter(matterId),
      activityLog: TimelineService.getActivityLog(matterId).items,
      stats: TimelineService.getStats(matterId),
    };
  },

  /**
   * Generate recurring event instances
   */
  generateRecurrences(
    eventId: string,
    count: number = 10
  ): TimelineEvent[] {
    const baseEvent = events.find((e) => e.id === eventId);
    if (!baseEvent || !baseEvent.recurrence) return [];

    const instances: TimelineEvent[] = [];
    let currentDate = new Date(baseEvent.date);

    for (let i = 0; i < count; i++) {
      const nextDate = getNextOccurrence(currentDate, baseEvent.recurrence);
      if (!nextDate) break;

      const instance: TimelineEvent = {
        ...baseEvent,
        id: generateId(),
        date: nextDate.toISOString(),
        endDate: baseEvent.endDate
          ? new Date(
              new Date(baseEvent.endDate).getTime() +
                (nextDate.getTime() - new Date(baseEvent.date).getTime())
            ).toISOString()
          : undefined,
        status: "scheduled",
        metadata: {
          ...baseEvent.metadata,
          recurrenceParentId: eventId,
          recurrenceInstance: i + 1,
        },
        createdAt: now(),
        updatedAt: now(),
      };

      instances.push(instance);
      currentDate = nextDate;
    }

    return instances;
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    events = [];
    milestones = [];
    activityLog = [];
  },
};
