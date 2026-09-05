import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const CalendarEventType = z.enum([
  "hearing",
  "deposition",
  "mediation",
  "arbitration",
  "trial",
  "conference",
  "meeting",
  "deadline",
  "filing",
  "statute_of_limitations",
  "client_meeting",
  "court_date",
  "discovery_deadline",
  "motion_deadline",
  "other",
]);
export type CalendarEventType = z.infer<typeof CalendarEventType>;

export const CalendarEventStatus = z.enum([
  "scheduled",
  "confirmed",
  "tentative",
  "cancelled",
  "completed",
  "rescheduled",
]);
export type CalendarEventStatus = z.infer<typeof CalendarEventStatus>;

export const RecurrenceFrequency = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
]);
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequency>;

export const SyncProvider = z.enum(["google", "outlook", "apple", "caldav"]);
export type SyncProvider = z.infer<typeof SyncProvider>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const CalendarEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: CalendarEventType,
  status: CalendarEventStatus,
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  courtName: z.string().optional(),
  judgeName: z.string().optional(),
  matterId: z.string().uuid().optional(),
  matterNumber: z.string().optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  attendees: z
    .array(
      z.object({
        userId: z.string().uuid(),
        name: z.string(),
        email: z.string().email().optional(),
        role: z.string(),
        rsvp: z
          .enum(["pending", "accepted", "declined", "tentative"])
          .default("pending"),
      })
    )
    .default([]),
  reminders: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.enum(["email", "push", "sms"]),
        minutesBefore: z.number().min(0),
      })
    )
    .default([]),
  recurrence: z
    .object({
      frequency: RecurrenceFrequency,
      interval: z.number().min(1).default(1),
      endDate: z.string().datetime().optional(),
      count: z.number().min(1).optional(),
      daysOfWeek: z
        .array(
          z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
        )
        .optional(),
    })
    .optional(),
  isBlocked: z.boolean().default(false),
  blockReason: z.string().optional(),
  externalId: z.string().optional(),
  syncProvider: SyncProvider.optional(),
  lastSyncedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const CreateCalendarEventSchema = CalendarEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  externalId: true,
  syncProvider: true,
  lastSyncedAt: true,
});

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;

export const UpdateCalendarEventSchema = CalendarEventSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventSchema>;

export const CalendarFilterSchema = z.object({
  types: z.array(CalendarEventType).optional(),
  statuses: z.array(CalendarEventStatus).optional(),
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  attendeeUserId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  includeBlocked: z.boolean().default(true),
  courtName: z.string().optional(),
  judgeName: z.string().optional(),
  sortBy: z
    .enum(["startDateTime", "endDateTime", "title", "type", "createdAt"])
    .default("startDateTime"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

export type CalendarFilter = z.infer<typeof CalendarFilterSchema>;

export const CalendarSyncConfigSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: SyncProvider,
  isEnabled: z.boolean().default(true),
  syncDirection: z.enum(["push", "pull", "bidirectional"]).default("bidirectional"),
  lastSyncAt: z.string().datetime().optional(),
  syncToken: z.string().optional(),
  calendarId: z.string().optional(),
  calendarName: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CalendarSyncConfig = z.infer<typeof CalendarSyncConfigSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  thisWeekEvents: number;
  thisMonthEvents: number;
  eventsByType: Record<CalendarEventType, number>;
  eventsByStatus: Record<CalendarEventStatus, number>;
  courtDatesThisMonth: number;
  deadlinesThisWeek: number;
}

export interface DayView {
  date: string;
  events: CalendarEvent[];
  isToday: boolean;
  isWeekend: boolean;
}

export interface WeekView {
  startDate: string;
  endDate: string;
  days: DayView[];
  totalEvents: number;
}

export interface MonthView {
  year: number;
  month: number;
  weeks: WeekView[];
  totalEvents: number;
}

export interface CalendarConflict {
  event1: CalendarEvent;
  event2: CalendarEvent;
  overlapMinutes: number;
  conflictType: "time" | "location" | "attendee";
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let events: CalendarEvent[] = [];
let syncConfigs: CalendarSyncConfig[] = [];

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// ─── Calendar Service ───────────────────────────────────────────────────────

export const CalendarService = {
  /**
   * Create a new calendar event
   */
  create(input: CreateCalendarEventInput, userId: string): CalendarEvent {
    const validated = CreateCalendarEventSchema.parse(input);

    // Validate end time is after start time
    if (new Date(validated.endDateTime) <= new Date(validated.startDateTime)) {
      throw new Error("End time must be after start time");
    }

    const event: CalendarEvent = {
      ...validated,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
    };

    events.push(event);
    return event;
  },

  /**
   * Get event by ID
   */
  getById(id: string): CalendarEvent | undefined {
    return events.find((e) => e.id === id);
  },

  /**
   * Update event
   */
  update(
    id: string,
    input: UpdateCalendarEventInput,
    userId: string
  ): CalendarEvent | undefined {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const validated = UpdateCalendarEventSchema.parse(input);
    events[index] = {
      ...events[index],
      ...validated,
      updatedAt: now(),
    };

    return events[index];
  },

  /**
   * Delete event
   */
  delete(id: string, userId: string): boolean {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return false;

    events.splice(index, 1);
    return true;
  },

  /**
   * Cancel event
   */
  cancel(id: string, userId: string, reason?: string): CalendarEvent | undefined {
    const event = events.find((e) => e.id === id);
    if (!event) return undefined;

    event.status = "cancelled";
    event.metadata = {
      ...event.metadata,
      cancellationReason: reason,
      cancelledBy: userId,
      cancelledAt: now(),
    };
    event.updatedAt = now();
    return event;
  },

  /**
   * Reschedule event
   */
  reschedule(
    id: string,
    newStartDateTime: string,
    newEndDateTime: string,
    userId: string,
    reason?: string
  ): CalendarEvent | undefined {
    const event = events.find((e) => e.id === id);
    if (!event) return undefined;

    if (new Date(newEndDateTime) <= new Date(newStartDateTime)) {
      throw new Error("End time must be after start time");
    }

    const previousStart = event.startDateTime;
    const previousEnd = event.endDateTime;

    event.startDateTime = newStartDateTime;
    event.endDateTime = newEndDateTime;
    event.status = "rescheduled";
    event.metadata = {
      ...event.metadata,
      previousStart,
      previousEnd,
      rescheduleReason: reason,
      rescheduledBy: userId,
      rescheduledAt: now(),
    };
    event.updatedAt = now();
    return event;
  },

  /**
   * Confirm event
   */
  confirm(id: string, userId: string): CalendarEvent | undefined {
    const event = events.find((e) => e.id === id);
    if (!event) return undefined;

    event.status = "confirmed";
    event.updatedAt = now();
    return event;
  },

  /**
   * Block time slot
   */
  blockTime(
    startDateTime: string,
    endDateTime: string,
    reason: string,
    userId: string
  ): CalendarEvent {
    const event: CalendarEvent = {
      id: generateId(),
      title: "Blocked",
      type: "other",
      status: "confirmed",
      startDateTime,
      endDateTime,
      allDay: false,
      isBlocked: true,
      blockReason: reason,
      attendees: [],
      reminders: [],
      metadata: {},
      createdBy: userId,
      createdAt: now(),
      updatedAt: now(),
    };

    events.push(event);
    return event;
  },

  /**
   * Add attendee
   */
  addAttendee(
    eventId: string,
    attendee: CalendarEvent["attendees"][0]
  ): CalendarEvent | undefined {
    const event = events.find((e) => e.id === eventId);
    if (!event) return undefined;

    // Check if attendee already exists
    const existing = event.attendees.find((a) => a.userId === attendee.userId);
    if (existing) {
      throw new Error("Attendee already added to this event");
    }

    event.attendees.push(attendee);
    event.updatedAt = now();
    return event;
  },

  /**
   * Remove attendee
   */
  removeAttendee(eventId: string, userId: string): CalendarEvent | undefined {
    const event = events.find((e) => e.id === eventId);
    if (!event) return undefined;

    event.attendees = event.attendees.filter((a) => a.userId !== userId);
    event.updatedAt = now();
    return event;
  },

  /**
   * Update RSVP
   */
  updateRsvp(
    eventId: string,
    userId: string,
    rsvp: "accepted" | "declined" | "tentative"
  ): CalendarEvent | undefined {
    const event = events.find((e) => e.id === eventId);
    if (!event) return undefined;

    const attendee = event.attendees.find((a) => a.userId === userId);
    if (!attendee) return undefined;

    attendee.rsvp = rsvp;
    event.updatedAt = now();
    return event;
  },

  /**
   * Get events for a date range
   */
  getEventsByDateRange(
    startDate: string,
    endDate: string,
    includeBlocked: boolean = true
  ): CalendarEvent[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return events
      .filter((e) => {
        const eventStart = new Date(e.startDateTime);
        const eventEnd = new Date(e.endDateTime);

        // Check for overlap
        const overlaps = eventStart < end && eventEnd > start;

        if (!includeBlocked && e.isBlocked) return false;

        return overlaps;
      })
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  },

  /**
   * Get events for a specific day
   */
  getDayView(date: string): DayView {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayEvents = CalendarService.getEventsByDateRange(
      targetDate.toISOString(),
      nextDay.toISOString()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = targetDate.getTime() === today.getTime();
    const dayOfWeek = targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      date: targetDate.toISOString().split("T")[0],
      events: dayEvents,
      isToday,
      isWeekend,
    };
  },

  /**
   * Get week view
   */
  getWeekView(date: string): WeekView {
    const targetDate = new Date(date);
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);

    const days: DayView[] = [];
    const current = new Date(weekStart);

    while (current <= weekEnd) {
      days.push(CalendarService.getDayView(current.toISOString()));
      current.setDate(current.getDate() + 1);
    }

    const weekEvents = CalendarService.getEventsByDateRange(
      weekStart.toISOString(),
      weekEnd.toISOString()
    );

    return {
      startDate: weekStart.toISOString().split("T")[0],
      endDate: weekEnd.toISOString().split("T")[0],
      days,
      totalEvents: weekEvents.length,
    };
  },

  /**
   * Get month view
   */
  getMonthView(year: number, month: number): MonthView {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const weeks: WeekView[] = [];
    const current = getWeekStart(firstDay);

    while (current <= lastDay || current.getMonth() === month - 1) {
      weeks.push(CalendarService.getWeekView(current.toISOString()));
      current.setDate(current.getDate() + 7);

      // Stop if we've gone past the month
      if (current > lastDay && current.getMonth() !== month - 1) break;
    }

    const monthEvents = CalendarService.getEventsByDateRange(
      firstDay.toISOString(),
      lastDay.toISOString()
    );

    return {
      year,
      month,
      weeks,
      totalEvents: monthEvents.length,
    };
  },

  /**
   * Get upcoming events
   */
  getUpcoming(userId?: string, daysAhead: number = 30): CalendarEvent[] {
    const nowDate = new Date();
    const futureDate = new Date(
      nowDate.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );

    return events
      .filter((e) => {
        const eventStart = new Date(e.startDateTime);
        return (
          eventStart >= nowDate &&
          eventStart <= futureDate &&
          e.status !== "cancelled" &&
          (!userId ||
            e.attendees.some((a) => a.userId === userId) ||
            e.createdBy === userId)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  },

  /**
   * Get court dates
   */
  getCourtDates(matterId?: string): CalendarEvent[] {
    return events
      .filter(
        (e) =>
          (e.type === "hearing" ||
            e.type === "trial" ||
            e.type === "court_date") &&
          e.status !== "cancelled" &&
          (!matterId || e.matterId === matterId)
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  },

  /**
   * Get hearing dates
   */
  getHearingDates(matterId?: string): CalendarEvent[] {
    return events
      .filter(
        (e) =>
          e.type === "hearing" &&
          e.status !== "cancelled" &&
          (!matterId || e.matterId === matterId)
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  },

  /**
   * Get deposition schedule
   */
  getDepositions(matterId?: string): CalendarEvent[] {
    return events
      .filter(
        (e) =>
          e.type === "deposition" &&
          e.status !== "cancelled" &&
          (!matterId || e.matterId === matterId)
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  },

  /**
   * Get deadlines
   */
  getDeadlines(matterId?: string): CalendarEvent[] {
    return events
      .filter(
        (e) =>
          (e.type === "deadline" ||
            e.type === "filing" ||
            e.type === "discovery_deadline" ||
            e.type === "motion_deadline" ||
            e.type === "statute_of_limitations") &&
          e.status !== "cancelled" &&
          (!matterId || e.matterId === matterId)
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  },

  /**
   * Check for scheduling conflicts
   */
  checkConflicts(
    startDateTime: string,
    endDateTime: string,
    excludeEventId?: string
  ): CalendarConflict[] {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const conflicts: CalendarConflict[] = [];

    for (const event of events) {
      if (excludeEventId && event.id === excludeEventId) continue;
      if (event.status === "cancelled" || event.isBlocked) continue;

      const eventStart = new Date(event.startDateTime);
      const eventEnd = new Date(event.endDateTime);

      // Check time overlap
      if (eventStart < end && eventEnd > start) {
        const overlapStart = Math.max(start.getTime(), eventStart.getTime());
        const overlapEnd = Math.min(end.getTime(), eventEnd.getTime());
        const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);

        conflicts.push({
          event1: events.find((e) => e.id === excludeEventId) ?? event,
          event2: event,
          overlapMinutes,
          conflictType: "time",
        });
      }
    }

    return conflicts;
  },

  /**
   * Search and filter events
   */
  search(filter: CalendarFilter): PaginatedResult<CalendarEvent> {
    const validated = CalendarFilterSchema.parse(filter);
    let filtered = [...events];

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

    // Matter filter
    if (validated.matterId) {
      filtered = filtered.filter((e) => e.matterId === validated.matterId);
    }

    // Client filter
    if (validated.clientId) {
      filtered = filtered.filter((e) => e.clientId === validated.clientId);
    }

    // Attendee filter
    if (validated.attendeeUserId) {
      filtered = filtered.filter(
        (e) =>
          e.attendees.some((a) => a.userId === validated.attendeeUserId) ||
          e.createdBy === validated.attendeeUserId
      );
    }

    // Date range
    if (validated.dateFrom) {
      filtered = filtered.filter(
        (e) => new Date(e.endDateTime) >= new Date(validated.dateFrom!)
      );
    }
    if (validated.dateTo) {
      filtered = filtered.filter(
        (e) => new Date(e.startDateTime) <= new Date(validated.dateTo!)
      );
    }

    // Text search
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.location?.toLowerCase().includes(term) ||
          e.courtName?.toLowerCase().includes(term) ||
          e.clientName?.toLowerCase().includes(term)
      );
    }

    // Blocked filter
    if (!validated.includeBlocked) {
      filtered = filtered.filter((e) => !e.isBlocked);
    }

    // Court name filter
    if (validated.courtName) {
      filtered = filtered.filter(
        (e) =>
          e.courtName?.toLowerCase() === validated.courtName!.toLowerCase()
      );
    }

    // Judge name filter
    if (validated.judgeName) {
      filtered = filtered.filter(
        (e) =>
          e.judgeName?.toLowerCase() === validated.judgeName!.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (validated.sortBy) {
        case "startDateTime":
          comparison =
            new Date(a.startDateTime).getTime() -
            new Date(b.startDateTime).getTime();
          break;
        case "endDateTime":
          comparison =
            new Date(a.endDateTime).getTime() -
            new Date(b.endDateTime).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
   * Get calendar statistics
   */
  getStats(): CalendarStats {
    const nowDate = new Date();
    const weekStart = getWeekStart(nowDate);
    const weekEnd = getWeekEnd(nowDate);
    const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const monthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);

    const eventsByType = {} as Record<CalendarEventType, number>;
    const eventsByStatus = {} as Record<CalendarEventStatus, number>;

    for (const type of Object.values(CalendarEventType.enum)) {
      eventsByType[type] = 0;
    }
    for (const status of Object.values(CalendarEventStatus.enum)) {
      eventsByStatus[status] = 0;
    }

    let upcomingEvents = 0;
    let thisWeekEvents = 0;
    let thisMonthEvents = 0;
    let courtDatesThisMonth = 0;
    let deadlinesThisWeek = 0;

    for (const event of events) {
      eventsByType[event.type]++;
      eventsByStatus[event.status]++;

      const eventStart = new Date(event.startDateTime);

      if (eventStart >= nowDate) {
        upcomingEvents++;
      }

      if (eventStart >= weekStart && eventStart <= weekEnd) {
        thisWeekEvents++;
      }

      if (eventStart >= monthStart && eventStart <= monthEnd) {
        thisMonthEvents++;

        if (
          event.type === "hearing" ||
          event.type === "trial" ||
          event.type === "court_date"
        ) {
          courtDatesThisMonth++;
        }
      }

      if (
        eventStart >= weekStart &&
        eventStart <= weekEnd &&
        (event.type === "deadline" ||
          event.type === "filing" ||
          event.type === "discovery_deadline" ||
          event.type === "motion_deadline")
      ) {
        deadlinesThisWeek++;
      }
    }

    return {
      totalEvents: events.length,
      upcomingEvents,
      thisWeekEvents,
      thisMonthEvents,
      eventsByType,
      eventsByStatus,
      courtDatesThisMonth,
      deadlinesThisWeek,
    };
  },

  /**
   * Set up sync configuration
   */
  setupSync(
    userId: string,
    provider: SyncProvider,
    calendarId?: string,
    calendarName?: string
  ): CalendarSyncConfig {
    const config: CalendarSyncConfig = {
      id: generateId(),
      userId,
      provider,
      isEnabled: true,
      syncDirection: "bidirectional",
      calendarId,
      calendarName,
      createdAt: now(),
      updatedAt: now(),
    };

    syncConfigs.push(config);
    return config;
  },

  /**
   * Update sync configuration
   */
  updateSyncConfig(
    id: string,
    updates: Partial<Omit<CalendarSyncConfig, "id" | "createdAt" | "updatedAt">>
  ): CalendarSyncConfig | undefined {
    const index = syncConfigs.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    syncConfigs[index] = {
      ...syncConfigs[index],
      ...updates,
      updatedAt: now(),
    };

    return syncConfigs[index];
  },

  /**
   * Get sync configurations for user
   */
  getSyncConfigs(userId: string): CalendarSyncConfig[] {
    return syncConfigs.filter((c) => c.userId === userId);
  },

  /**
   * Delete sync configuration
   */
  deleteSyncConfig(id: string): boolean {
    const index = syncConfigs.findIndex((c) => c.id === id);
    if (index === -1) return false;

    syncConfigs.splice(index, 1);
    return true;
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    events = [];
    syncConfigs = [];
  },
};
