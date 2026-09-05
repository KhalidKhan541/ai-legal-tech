export {
  MatterService,
  MatterStatus,
  MatterPriority,
  MatterType,
  Role,
  canTransitionStatus,
  getValidTransitions,
} from "./matter-service";

export type {
  Matter,
  MatterBudget,
  MatterAssignment,
  MatterNote,
  ConflictCheckResult,
  CreateMatterInput,
  UpdateMatterInput,
  MatterFilter,
  PaginatedResult,
  MatterStats,
  MatterTimelineEvent,
} from "./matter-service";

export {
  TimelineService,
  EventType,
  EventStatus,
  Priority,
} from "./matter-timeline";

export type {
  TimelineEvent,
  Milestone,
  ActivityLog,
  CreateEventInput,
  UpdateEventInput,
  TimelineFilter,
  TimelineView,
  TimelineStats,
  TimelineDay,
} from "./matter-timeline";
