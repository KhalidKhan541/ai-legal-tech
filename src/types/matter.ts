export type MatterStatus =
  | "intake"
  | "investigation"
  | "discovery"
  | "trial"
  | "appeal"
  | "closed"
  | "archived";

export type MatterPriority = "low" | "medium" | "high" | "urgent";

export type MatterType =
  | "litigation"
  | "transaction"
  | "advisory"
  | "pro_bono"
  | "corporate"
  | "real_estate"
  | "family"
  | "criminal"
  | "immigration"
  | "ip"
  | "other";

export type UserRole =
  | "lead_attorney"
  | "associate"
  | "paralegal"
  | "legal_assistant"
  | "contract_attorney";

export interface Matter {
  id: string;
  matterNumber: string;
  title: string;
  description: string;
  status: MatterStatus;
  priority: MatterPriority;
  type: MatterType;
  clientId: string;
  clientName: string;
  openDate: Date;
  closeDate?: Date;
  statuteOfLimitations?: Date;
  budget: MatterBudget;
  assignments: MatterAssignment[];
  tags: string[];
  practiceArea: string;
  court?: string;
  jurisdiction?: string;
  opposingParty?: string;
  opposingCounsel?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface MatterBudget {
  estimatedHours: number;
  hourlyRate: number;
  totalBudget: number;
  spentHours: number;
  spentAmount: number;
  currency: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface MatterAssignment {
  id: string;
  matterId: string;
  userId: string;
  userName: string;
  role: UserRole;
  assignedAt: Date;
  assignedBy: string;
  removedAt?: Date;
  isActive: boolean;
  responsibilities?: string[];
}

export interface MatterNote {
  id: string;
  matterId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category:
    | "general"
    | "strategy"
    | "research"
    | "client_communication"
    | "court"
    | "settlement"
    | "billing"
    | "risk";
  isConfidential: boolean;
  isPinned: boolean;
  tags: string[];
  attachments: MatterAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MatterAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TimelineEvent {
  id: string;
  matterId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  date: Date;
  userId: string;
  userName: string;
  metadata?: Record<string, unknown>;
  isSystemGenerated: boolean;
}

export type TimelineEventType =
  | "matter_created"
  | "matter_updated"
  | "status_changed"
  | "document_uploaded"
  | "document_version_created"
  | "note_added"
  | "assignment_added"
  | "assignment_removed"
  | "time_entry_logged"
  | "invoice_created"
  | "invoice_paid"
  | "deadline_added"
  | "deadline_missed"
  | "deadline_met"
  | "contract_signed"
  | "ai_analysis_completed"
  | "comment_added"
  | "milestone_reached";

export interface MatterFilter {
  status?: MatterStatus[];
  priority?: MatterPriority[];
  type?: MatterType[];
  clientId?: string;
  assignedTo?: string;
  practiceArea?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface MatterSort {
  field: keyof Matter | "clientName" | "budget.remaining";
  order: "asc" | "desc";
}

export interface MatterStats {
  totalMatters: number;
  activeMatters: number;
  closedMatters: number;
  mattersByStatus: Record<MatterStatus, number>;
  mattersByPriority: Record<MatterPriority, number>;
  mattersByType: Record<MatterType, number>;
  totalBudget: number;
  totalSpent: number;
  averageResolutionDays: number;
}

export interface CreateMatterInput {
  title: string;
  description: string;
  type: MatterType;
  clientId: string;
  priority: MatterPriority;
  practiceArea: string;
  budget: {
    estimatedHours: number;
    hourlyRate: number;
  };
  statuteOfLimitations?: Date;
  court?: string;
  jurisdiction?: string;
  opposingParty?: string;
  opposingCounsel?: string;
  tags?: string[];
}

export interface UpdateMatterInput {
  title?: string;
  description?: string;
  status?: MatterStatus;
  priority?: MatterPriority;
  type?: MatterType;
  practiceArea?: string;
  statuteOfLimitations?: Date;
  court?: string;
  jurisdiction?: string;
  opposingParty?: string;
  opposingCounsel?: string;
  tags?: string[];
}
