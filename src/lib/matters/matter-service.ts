import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const MatterStatus = z.enum([
  "intake",
  "investigation",
  "discovery",
  "trial",
  "appeal",
  "closed",
  "archived",
]);
export type MatterStatus = z.infer<typeof MatterStatus>;

export const MatterPriority = z.enum(["low", "medium", "high", "urgent"]);
export type MatterPriority = z.infer<typeof MatterPriority>;

export const MatterType = z.enum([
  "litigation",
  "transaction",
  "advisory",
  "pro_bono",
  "corporate",
  "real_estate",
  "family",
  "criminal",
  "immigration",
  "ip",
  "other",
]);
export type MatterType = z.infer<typeof MatterType>;

export const Role = z.enum([
  "lead_attorney",
  "associate",
  "paralegal",
  "legal_assistant",
  "contract_attorney",
]);
export type Role = z.infer<typeof Role>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const MatterBudgetSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  estimatedHours: z.number().min(0),
  hourlyRate: z.number().min(0),
  totalBudget: z.number().min(0),
  spentHours: z.number().min(0).default(0),
  spentAmount: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MatterBudget = z.infer<typeof MatterBudgetSchema>;

export const MatterAssignmentSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  userId: z.string().uuid(),
  role: Role,
  assignedAt: z.string().datetime(),
  assignedBy: z.string().uuid(),
  removedAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  responsibilities: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MatterAssignment = z.infer<typeof MatterAssignmentSchema>;

export const MatterNoteSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.enum([
    "general",
    "strategy",
    "research",
    "client_communication",
    "court",
    "settlement",
    "billing",
    "risk",
  ]),
  isConfidential: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  attachments: z
    .array(
      z.object({
        id: z.string().uuid(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })
    )
    .default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MatterNote = z.infer<typeof MatterNoteSchema>;

export const ConflictCheckResultSchema = z.object({
  id: z.string().uuid(),
  matterId: z.string().uuid(),
  clientName: z.string(),
  opposingParty: z.string(),
  conflictFound: z.boolean(),
  conflictDetails: z.array(
    z.object({
      type: z.enum([
        "direct",
        "related",
        "former_client",
        "financial_interest",
        "personal_interest",
      ]),
      description: z.string(),
      relatedMatterId: z.string().uuid().optional(),
      riskLevel: z.enum(["low", "medium", "high", "critical"]),
    })
  ),
  waiverObtained: z.boolean().default(false),
  waiverDetails: z.string().optional(),
  checkedBy: z.string().uuid(),
  checkedAt: z.string().datetime(),
  reviewedBy: z.string().uuid().optional(),
  reviewedAt: z.string().datetime().optional(),
  status: z.enum(["pending", "cleared", "conflict", "waived"]),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ConflictCheckResult = z.infer<typeof ConflictCheckResultSchema>;

export const MatterSchema = z.object({
  id: z.string().uuid(),
  matterNumber: z.string(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  status: MatterStatus,
  priority: MatterPriority,
  type: MatterType,
  clientId: z.string().uuid(),
  clientName: z.string(),
  opposingParty: z.string().optional(),
  opposingCounsel: z.string().optional(),
  courtName: z.string().optional(),
  courtCaseNumber: z.string().optional(),
  judgeName: z.string().optional(),
  jurisdiction: z.string().optional(),
  practiceArea: z.string().optional(),
  openDate: z.string().datetime(),
  closeDate: z.string().datetime().optional(),
  statuteOfLimitations: z.string().datetime().optional(),
  isConfidential: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  budget: MatterBudgetSchema.optional(),
  assignments: z.array(MatterAssignmentSchema).default([]),
  notes: z.array(MatterNoteSchema).default([]),
  conflictChecks: z.array(ConflictCheckResultSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Matter = z.infer<typeof MatterSchema>;

export const CreateMatterSchema = MatterSchema.omit({
  id: true,
  matterNumber: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  assignments: true,
  notes: true,
  conflictChecks: true,
  budget: true,
});

export type CreateMatterInput = z.infer<typeof CreateMatterSchema>;

export const UpdateMatterSchema = MatterSchema.partial().omit({
  id: true,
  matterNumber: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateMatterInput = z.infer<typeof UpdateMatterSchema>;

export const MatterFilterSchema = z.object({
  status: z.array(MatterStatus).optional(),
  priority: z.array(MatterPriority).optional(),
  type: z.array(MatterType).optional(),
  clientId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  openDateFrom: z.string().datetime().optional(),
  openDateTo: z.string().datetime().optional(),
  closeDateFrom: z.string().datetime().optional(),
  closeDateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  jurisdiction: z.string().optional(),
  practiceArea: z.string().optional(),
  sortBy: z
    .enum([
      "title",
      "status",
      "priority",
      "openDate",
      "closeDate",
      "createdAt",
      "updatedAt",
    ])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type MatterFilter = z.infer<typeof MatterFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MatterStats {
  totalMatters: number;
  activeMatters: number;
  mattersByStatus: Record<MatterStatus, number>;
  mattersByPriority: Record<MatterPriority, number>;
  mattersByType: Record<MatterType, number>;
  overdueMatters: number;
  upcomingDeadlines: number;
}

export interface MatterTimelineEvent {
  id: string;
  matterId: string;
  type: string;
  title: string;
  description: string;
  date: string;
  userId: string;
  userName: string;
  metadata: Record<string, unknown>;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let matters: Matter[] = [];
let counter = 1;

function generateMatterNumber(): string {
  const year = new Date().getFullYear();
  const num = String(counter++).padStart(5, "0");
  return `MAT-${year}-${num}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Status Lifecycle ───────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<MatterStatus, MatterStatus[]> = {
  intake: ["investigation", "closed"],
  investigation: ["discovery", "closed", "archived"],
  discovery: ["trial", "investigation", "closed", "archived"],
  trial: ["appeal", "closed", "archived"],
  appeal: ["closed", "archived"],
  closed: ["archived", "investigation"],
  archived: ["intake"],
};

export function canTransitionStatus(
  current: MatterStatus,
  target: MatterStatus
): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}

export function getValidTransitions(current: MatterStatus): MatterStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

// ─── Matter Service ─────────────────────────────────────────────────────────

export const MatterService = {
  /**
   * Create a new matter with conflict check
   */
  create(input: CreateMatterInput, userId: string): Matter {
    const validated = CreateMatterSchema.parse(input);

    const matter: Matter = {
      ...validated,
      id: generateId(),
      matterNumber: generateMatterNumber(),
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
      assignments: [],
      notes: [],
      conflictChecks: [],
    };

    // Auto-run conflict check
    const conflictCheck = MatterService.runConflictCheck(
      matter.id,
      matter.clientName,
      matter.opposingParty ?? "",
      userId
    );
    matter.conflictChecks.push(conflictCheck);

    matters.push(matter);
    return matter;
  },

  /**
   * Get matter by ID
   */
  getById(id: string): Matter | undefined {
    return matters.find((m) => m.id === id);
  },

  /**
   * Get matter by matter number
   */
  getByMatterNumber(matterNumber: string): Matter | undefined {
    return matters.find((m) => m.matterNumber === matterNumber);
  },

  /**
   * Update matter
   */
  update(
    id: string,
    input: UpdateMatterInput,
    userId: string
  ): Matter | undefined {
    const index = matters.findIndex((m) => m.id === id);
    if (index === -1) return undefined;

    const validated = UpdateMatterSchema.parse(input);
    const updated: Matter = {
      ...matters[index],
      ...validated,
      updatedAt: now(),
      updatedBy: userId,
    };

    matters[index] = updated;
    return updated;
  },

  /**
   * Delete matter (soft delete by archiving)
   */
  delete(id: string, userId: string): boolean {
    const matter = matters.find((m) => m.id === id);
    if (!matter) return false;

    if (matter.status !== "closed") {
      throw new Error(
        "Only closed matters can be archived. Close the matter first."
      );
    }

    matter.status = "archived";
    matter.updatedAt = now();
    matter.updatedBy = userId;
    return true;
  },

  /**
   * Transition matter status
   */
  transitionStatus(
    id: string,
    targetStatus: MatterStatus,
    userId: string,
    notes?: string
  ): Matter {
    const matter = matters.find((m) => m.id === id);
    if (!matter) {
      throw new Error(`Matter not found: ${id}`);
    }

    if (!canTransitionStatus(matter.status, targetStatus)) {
      throw new Error(
        `Invalid status transition from ${matter.status} to ${targetStatus}. ` +
          `Valid transitions: ${getValidTransitions(matter.status).join(", ")}`
      );
    }

    const previousStatus = matter.status;
    matter.status = targetStatus;
    matter.updatedAt = now();
    matter.updatedBy = userId;

    // Close date when matter is closed
    if (targetStatus === "closed" && !matter.closeDate) {
      matter.closeDate = now();
    }

    return matter;
  },

  /**
   * Assign user to matter
   */
  assignUser(
    matterId: string,
    userId: string,
    role: Role,
    assignedBy: string,
    responsibilities?: string[]
  ): MatterAssignment {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter) {
      throw new Error(`Matter not found: ${matterId}`);
    }

    // Check if already assigned
    const existing = matter.assignments.find(
      (a) => a.userId === userId && a.isActive
    );
    if (existing) {
      throw new Error(`User ${userId} is already assigned to this matter`);
    }

    const assignment: MatterAssignment = {
      id: generateId(),
      matterId,
      userId,
      role,
      assignedAt: now(),
      assignedBy,
      isActive: true,
      responsibilities,
      createdAt: now(),
      updatedAt: now(),
    };

    matter.assignments.push(assignment);
    matter.updatedAt = now();
    matter.updatedBy = assignedBy;
    return assignment;
  },

  /**
   * Remove user from matter
   */
  removeAssignment(
    matterId: string,
    userId: string,
    removedBy: string
  ): boolean {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter) return false;

    const assignment = matter.assignments.find(
      (a) => a.userId === userId && a.isActive
    );
    if (!assignment) return false;

    assignment.isActive = false;
    assignment.removedAt = now();
    assignment.updatedAt = now();
    matter.updatedAt = now();
    matter.updatedBy = removedBy;
    return true;
  },

  /**
   * Get all assignments for a matter
   */
  getAssignments(matterId: string): MatterAssignment[] {
    const matter = matters.find((m) => m.id === matterId);
    return matter?.assignments.filter((a) => a.isActive) ?? [];
  },

  /**
   * Get matters assigned to a user
   */
  getByAssignedUser(userId: string): Matter[] {
    return matters.filter((m) =>
      m.assignments.some((a) => a.userId === userId && a.isActive)
    );
  },

  /**
   * Create matter budget
   */
  createBudget(
    matterId: string,
    budget: Omit<MatterBudget, "id" | "matterId" | "createdAt" | "updatedAt">,
    userId: string
  ): MatterBudget {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter) {
      throw new Error(`Matter not found: ${matterId}`);
    }

    if (matter.budget) {
      throw new Error("Budget already exists. Use updateBudget instead.");
    }

    const newBudget: MatterBudget = {
      ...budget,
      id: generateId(),
      matterId,
      createdAt: now(),
      updatedAt: now(),
    };

    matter.budget = newBudget;
    matter.updatedAt = now();
    matter.updatedBy = userId;
    return newBudget;
  },

  /**
   * Update matter budget
   */
  updateBudget(
    matterId: string,
    updates: Partial<
      Omit<MatterBudget, "id" | "matterId" | "createdAt" | "updatedAt">
    >,
    userId: string
  ): MatterBudget | undefined {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter || !matter.budget) return undefined;

    matter.budget = {
      ...matter.budget,
      ...updates,
      updatedAt: now(),
    };
    matter.updatedAt = now();
    matter.updatedBy = userId;
    return matter.budget;
  },

  /**
   * Track hours against budget
   */
  trackHours(
    matterId: string,
    hours: number,
    userId: string
  ): MatterBudget | undefined {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter || !matter.budget) return undefined;

    matter.budget.spentHours += hours;
    matter.budget.spentAmount = matter.budget.spentHours * matter.budget.hourlyRate;
    matter.budget.updatedAt = now();
    matter.updatedAt = now();
    matter.updatedBy = userId;
    return matter.budget;
  },

  /**
   * Add note to matter
   */
  addNote(
    matterId: string,
    note: Omit<MatterNote, "id" | "matterId" | "createdAt" | "updatedAt">,
    userId: string
  ): MatterNote {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter) {
      throw new Error(`Matter not found: ${matterId}`);
    }

    const newNote: MatterNote = {
      ...note,
      id: generateId(),
      matterId,
      createdAt: now(),
      updatedAt: now(),
    };

    matter.notes.push(newNote);
    matter.updatedAt = now();
    matter.updatedBy = userId;
    return newNote;
  },

  /**
   * Update note
   */
  updateNote(
    matterId: string,
    noteId: string,
    updates: Partial<Omit<MatterNote, "id" | "matterId" | "createdAt" | "updatedAt">>,
    userId: string
  ): MatterNote | undefined {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter) return undefined;

    const noteIndex = matter.notes.findIndex((n) => n.id === noteId);
    if (noteIndex === -1) return undefined;

    matter.notes[noteIndex] = {
      ...matter.notes[noteIndex],
      ...updates,
      updatedAt: now(),
    };
    matter.updatedAt = now();
    matter.updatedBy = userId;
    return matter.notes[noteIndex];
  },

  /**
   * Delete note
   */
  deleteNote(matterId: string, noteId: string, userId: string): boolean {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter) return false;

    const noteIndex = matter.notes.findIndex((n) => n.id === noteId);
    if (noteIndex === -1) return false;

    matter.notes.splice(noteIndex, 1);
    matter.updatedAt = now();
    matter.updatedBy = userId;
    return true;
  },

  /**
   * Run conflict check
   */
  runConflictCheck(
    matterId: string,
    clientName: string,
    opposingParty: string,
    userId: string
  ): ConflictCheckResult {
    const conflicts: ConflictCheckResult["conflictDetails"] = [];

    // Check against existing matters
    for (const existingMatter of matters) {
      if (existingMatter.id === matterId) continue;

      // Direct conflict: same client
      if (
        existingMatter.clientName.toLowerCase() === clientName.toLowerCase()
      ) {
        conflicts.push({
          type: "direct",
          description: `Same client as matter ${existingMatter.matterNumber}: ${existingMatter.title}`,
          relatedMatterId: existingMatter.id,
          riskLevel: "critical",
        });
      }

      // Related conflict: opposing party is our client
      if (
        opposingParty &&
        existingMatter.clientName.toLowerCase() === opposingParty.toLowerCase()
      ) {
        conflicts.push({
          type: "related",
          description: `Opposing party "${opposingParty}" is a client in matter ${existingMatter.matterNumber}`,
          relatedMatterId: existingMatter.id,
          riskLevel: "high",
        });
      }

      // Our client is opposing party in another matter
      if (
        existingMatter.opposingParty?.toLowerCase() ===
        clientName.toLowerCase()
      ) {
        conflicts.push({
          type: "former_client",
          description: `Client "${clientName}" is opposing party in matter ${existingMatter.matterNumber}`,
          relatedMatterId: existingMatter.id,
          riskLevel: "high",
        });
      }
    }

    const hasConflict = conflicts.some(
      (c) => c.riskLevel === "critical" || c.riskLevel === "high"
    );

    const result: ConflictCheckResult = {
      id: generateId(),
      matterId,
      clientName,
      opposingParty,
      conflictFound: hasConflict,
      conflictDetails: conflicts,
      checkedBy: userId,
      checkedAt: now(),
      status: hasConflict ? "conflict" : "cleared",
      createdAt: now(),
      updatedAt: now(),
    };

    return result;
  },

  /**
   * Search and filter matters
   */
  search(filter: MatterFilter): PaginatedResult<Matter> {
    const validated = MatterFilterSchema.parse(filter);
    let filtered = [...matters];

    // Status filter
    if (validated.status?.length) {
      filtered = filtered.filter((m) =>
        validated.status!.includes(m.status)
      );
    }

    // Priority filter
    if (validated.priority?.length) {
      filtered = filtered.filter((m) =>
        validated.priority!.includes(m.priority)
      );
    }

    // Type filter
    if (validated.type?.length) {
      filtered = filtered.filter((m) => validated.type!.includes(m.type));
    }

    // Client filter
    if (validated.clientId) {
      filtered = filtered.filter((m) => m.clientId === validated.clientId);
    }

    // Assigned user filter
    if (validated.assignedUserId) {
      filtered = filtered.filter((m) =>
        m.assignments.some(
          (a) => a.userId === validated.assignedUserId && a.isActive
        )
      );
    }

    // Date range filters
    if (validated.openDateFrom) {
      filtered = filtered.filter(
        (m) => new Date(m.openDate) >= new Date(validated.openDateFrom!)
      );
    }
    if (validated.openDateTo) {
      filtered = filtered.filter(
        (m) => new Date(m.openDate) <= new Date(validated.openDateTo!)
      );
    }
    if (validated.closeDateFrom) {
      filtered = filtered.filter(
        (m) =>
          m.closeDate && new Date(m.closeDate) >= new Date(validated.closeDateFrom!)
      );
    }
    if (validated.closeDateTo) {
      filtered = filtered.filter(
        (m) =>
          m.closeDate && new Date(m.closeDate) <= new Date(validated.closeDateTo!)
      );
    }

    // Text search
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term) ||
          m.matterNumber.toLowerCase().includes(term) ||
          m.clientName.toLowerCase().includes(term) ||
          m.courtCaseNumber?.toLowerCase().includes(term) ||
          false
      );
    }

    // Tags filter
    if (validated.tags?.length) {
      filtered = filtered.filter((m) =>
        validated.tags!.some((tag) => m.tags.includes(tag))
      );
    }

    // Jurisdiction filter
    if (validated.jurisdiction) {
      filtered = filtered.filter(
        (m) =>
          m.jurisdiction?.toLowerCase() ===
          validated.jurisdiction!.toLowerCase()
      );
    }

    // Practice area filter
    if (validated.practiceArea) {
      filtered = filtered.filter(
        (m) =>
          m.practiceArea?.toLowerCase() ===
          validated.practiceArea!.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[validated.sortBy] ?? "";
      const bVal = b[validated.sortBy] ?? "";
      const comparison = String(aVal).localeCompare(String(bVal));
      return validated.sortOrder === "asc" ? comparison : -comparison;
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / validated.limit);
    const start = (validated.page - 1) * validated.limit;
    const items = filtered.slice(start, start + validated.limit);

    return {
      items,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages,
    };
  },

  /**
   * Get matter statistics
   */
  getStats(): MatterStats {
    const activeStatuses: MatterStatus[] = [
      "intake",
      "investigation",
      "discovery",
      "trial",
      "appeal",
    ];

    const mattersByStatus = {} as Record<MatterStatus, number>;
    const mattersByPriority = {} as Record<MatterPriority, number>;
    const mattersByType = {} as Record<MatterType, number>;

    for (const status of Object.values(MatterStatus.enum)) {
      mattersByStatus[status] = 0;
    }
    for (const priority of Object.values(MatterPriority.enum)) {
      mattersByPriority[priority] = 0;
    }
    for (const type of Object.values(MatterType.enum)) {
      mattersByType[type] = 0;
    }

    let overdueMatters = 0;
    let upcomingDeadlines = 0;
    const nowDate = new Date();
    const thirtyDaysFromNow = new Date(
      nowDate.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    for (const matter of matters) {
      mattersByStatus[matter.status]++;
      mattersByPriority[matter.priority]++;
      mattersByType[matter.type]++;

      if (
        activeStatuses.includes(matter.status) &&
        matter.statuteOfLimitations
      ) {
        const solDate = new Date(matter.statuteOfLimitations);
        if (solDate < nowDate) {
          overdueMatters++;
        } else if (solDate <= thirtyDaysFromNow) {
          upcomingDeadlines++;
        }
      }
    }

    return {
      totalMatters: matters.length,
      activeMatters: matters.filter((m) =>
        activeStatuses.includes(m.status)
      ).length,
      mattersByStatus,
      mattersByPriority,
      mattersByType,
      overdueMatters,
      upcomingDeadlines,
    };
  },

  /**
   * Get matters with overdue deadlines
   */
  getOverdueMatters(): Matter[] {
    const nowDate = new Date();
    return matters.filter(
      (m) =>
        m.statuteOfLimitations &&
        new Date(m.statuteOfLimitations) < nowDate &&
        m.status !== "closed" &&
        m.status !== "archived"
    );
  },

  /**
   * Get matters approaching deadlines
   */
  getUpcomingDeadlines(daysAhead: number = 30): Matter[] {
    const nowDate = new Date();
    const futureDate = new Date(
      nowDate.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );

    return matters.filter(
      (m) =>
        m.statuteOfLimitations &&
        new Date(m.statuteOfLimitations) >= nowDate &&
        new Date(m.statuteOfLimitations) <= futureDate &&
        m.status !== "closed" &&
        m.status !== "archived"
    );
  },

  /**
   * Get timeline for a matter
   */
  getTimeline(
    matterId: string,
    page: number = 1,
    limit: number = 50
  ): PaginatedResult<MatterTimelineEvent> {
    const matter = matters.find((m) => m.id === matterId);
    if (!matter) {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }

    const events: MatterTimelineEvent[] = [];

    // Matter creation
    events.push({
      id: generateId(),
      matterId,
      type: "matter_created",
      title: "Matter Created",
      description: `Matter "${matter.title}" was created`,
      date: matter.createdAt,
      userId: matter.createdBy,
      userName: "System",
      metadata: { matterNumber: matter.matterNumber },
    });

    // Status changes
    events.push({
      id: generateId(),
      matterId,
      type: "status_change",
      title: "Status Set",
      description: `Status set to ${matter.status}`,
      date: matter.createdAt,
      userId: matter.createdBy,
      userName: "System",
      metadata: { status: matter.status },
    });

    // Assignments
    for (const assignment of matter.assignments) {
      events.push({
        id: assignment.id,
        matterId,
        type: "assignment",
        title: "User Assigned",
        description: `User assigned as ${assignment.role}`,
        date: assignment.assignedAt,
        userId: assignment.assignedBy,
        userName: "System",
        metadata: { userId: assignment.userId, role: assignment.role },
      });
    }

    // Notes
    for (const note of matter.notes) {
      events.push({
        id: note.id,
        matterId,
        type: "note_added",
        title: note.title,
        description: note.content.substring(0, 200),
        date: note.createdAt,
        userId: note.authorId,
        userName: "System",
        metadata: { category: note.category, isConfidential: note.isConfidential },
      });
    }

    // Conflict checks
    for (const check of matter.conflictChecks) {
      events.push({
        id: check.id,
        matterId,
        type: "conflict_check",
        title: "Conflict Check",
        description: check.conflictFound
          ? "Conflict detected"
          : "No conflicts found",
        date: check.checkedAt,
        userId: check.checkedBy,
        userName: "System",
        metadata: {
          conflictFound: check.conflictFound,
          status: check.status,
        },
      });
    }

    // Sort by date descending
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const total = events.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = events.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  },

  /**
   * Bulk update status
   */
  bulkUpdateStatus(
    matterIds: string[],
    targetStatus: MatterStatus,
    userId: string
  ): { updated: string[]; errors: { matterId: string; error: string }[] } {
    const updated: string[] = [];
    const errors: { matterId: string; error: string }[] = [];

    for (const id of matterIds) {
      try {
        MatterService.transitionStatus(id, targetStatus, userId);
        updated.push(id);
      } catch (error) {
        errors.push({
          matterId: id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { updated, errors };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    matters = [];
    counter = 1;
  },
};
