// ─── Core Entity Types ───────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  isActive: boolean;
}

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

// ─── User Types ──────────────────────────────────────────────────────────────

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGING_PARTNER"
  | "SENIOR_PARTNER"
  | "JUNIOR_PARTNER"
  | "OF_COUNSEL"
  | "SENIOR_ASSOCIATE"
  | "ASSOCIATE"
  | "PARALEGAL"
  | "LEGAL_SECRETARY"
  | "INTERN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface User extends BaseEntity {
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  phone: string | null;
  title: string | null;
  barNumber: string | null;
  jurisdiction: string | null;
  bio: string | null;
  timezone: string;
  locale: string;
}

export interface UserWithFirms extends User {
  firmMemberships: FirmMemberWithFirm[];
}

export interface UserProfile extends Pick<User, "id" | "name" | "email" | "image" | "role" | "title" | "barNumber" | "jurisdiction"> {
  firm?: FirmBasic | null;
  firmRole?: FirmRole | null;
}

export type FirmRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface FirmMember extends BaseEntity {
  role: FirmRole;
  joinedAt: Date;
  isActive: boolean;
  userId: string;
  firmId: string;
}

export interface FirmMemberWithFirm extends FirmMember {
  firm: FirmBasic;
}

export interface FirmMemberWithUser extends FirmMember {
  user: Pick<User, "id" | "name" | "email" | "image" | "role" | "title">;
}

// ─── Firm Types ──────────────────────────────────────────────────────────────

export type SubscriptionPlan = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface LawFirm extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  taxId: string | null;
  barNumber: string | null;
  jurisdiction: string | null;
  billingAddress: string | null;
  settings: FirmSettings | null;
  subscription: SubscriptionPlan;
  subscriptionEnd: Date | null;
  isActive: boolean;
}

export interface FirmBasic extends Pick<LawFirm, "id" | "name" | "slug" | "logo" | "isActive"> {}

export interface FirmWithMembers extends LawFirm {
  members: FirmMemberWithUser[];
  _count: {
    members: number;
    matters: number;
    clients: number;
  };
}

export interface FirmSettings {
  defaultBillingRate?: number;
  defaultCurrency: string;
  taxRate?: number;
  invoicePrefix?: string;
  invoiceTerms?: string;
  invoiceNotes?: string;
  matterNumberPrefix?: string;
  enableTimeTracking: boolean;
  enableInvoicing: boolean;
  enableNotifications: boolean;
  enableAI: boolean;
  workingHoursPerDay: number;
  workingDaysPerWeek: number;
  notificationSettings?: {
    email: boolean;
    inApp: boolean;
    deadlineReminderDays: number;
  };
}

// ─── Client Types ────────────────────────────────────────────────────────────

export type ClientType = "INDIVIDUAL" | "CORPORATE" | "GOVERNMENT" | "NON_PROFIT" | "OTHER";

export interface Client extends BaseEntity, SoftDeletable {
  name: string;
  type: ClientType;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  company: string | null;
  taxId: string | null;
  notes: string | null;
  firmId: string;
}

export interface ClientWithDetails extends Client {
  contacts: ClientContact[];
  matters: MatterBasic[];
  _count: {
    matters: number;
    contacts: number;
  };
}

export interface ClientBasic extends Pick<Client, "id" | "name" | "type" | "email" | "company"> {}

export interface ClientContact extends BaseEntity {
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  isPrimary: boolean;
  clientId: string;
}

// ─── Matter Types ────────────────────────────────────────────────────────────

export type MatterStatus =
  | "OPEN"
  | "PENDING"
  | "ACTIVE"
  | "ON_HOLD"
  | "SETTLED"
  | "CLOSED"
  | "DISMISSED"
  | "WON"
  | "LOST";

export type MatterType =
  | "LITIGATION"
  | "ARBITRATION"
  | "MEDIATION"
  | "TRANSACTIONAL"
  | "ADVISORY"
  | "REGULATORY"
  | "COMPLIANCE"
  | "INTELLECTUAL_PROPERTY"
  | "REAL_ESTATE"
  | "FAMILY_LAW"
  | "CRIMINAL"
  | "BANKRUPTCY"
  | "IMMIGRATION"
  | "LABOR_EMPLOYMENT"
  | "TAX"
  | "ESTATE_PLANNING"
  | "ENVIRONMENTAL"
  | "OTHER";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";

export interface Matter extends BaseEntity, SoftDeletable {
  title: string;
  matterNumber: string;
  description: string | null;
  status: MatterStatus;
  type: MatterType;
  priority: Priority;
  practiceArea: string | null;
  court: string | null;
  judge: string | null;
  caseNumber: string | null;
  filingDate: Date | null;
  trialDate: Date | null;
  statuteOfLimitations: Date | null;
  estimatedValue: number | null;
  billedAmount: number;
  paidAmount: number;
  trustBalance: number;
  openDate: Date;
  closeDate: Date | null;
  metadata: Record<string, unknown> | null;
  firmId: string;
  clientId: string;
  ownerId: string;
}

export interface MatterBasic extends Pick<Matter, "id" | "title" | "matterNumber" | "status" | "type" | "priority" | "openDate"> {}

export interface MatterWithDetails extends Matter {
  client: ClientBasic;
  owner: Pick<User, "id" | "name" | "email" | "image">;
  team: MatterTeamMember[];
  _count: {
    documents: number;
    tasks: number;
    timeEntries: number;
    deadlines: number;
  };
}

export interface MatterTeamMember {
  id: string;
  role: TeamRole;
  joinedAt: Date;
  user: Pick<User, "id" | "name" | "email" | "image" | "title">;
}

export type TeamRole = "LEAD" | "MEMBER" | "REVIEWER" | "VIEWER";

export interface MatterNote extends BaseEntity {
  title: string | null;
  content: string;
  isPrivate: boolean;
  matterId: string;
  authorId: string;
  author?: Pick<User, "id" | "name" | "image">;
}

// ─── Document Types ──────────────────────────────────────────────────────────

export type DocumentType =
  | "CONTRACT"
  | "AGREEMENT"
  | "MOTION"
  | "BRIEF"
  | "MEMO"
  | "LETTER"
  | "DEPOSITION"
  | "AFFIDAVIT"
  | "PETITION"
  | "COMPLAINT"
  | "ANSWER"
  | "DISCOVERY"
  | "EVIDENCE"
  | "BILLING"
  | "CORRESPONDENCE"
  | "COURT_FILING"
  | "OTHER";

export type DocumentStatus = "DRAFT" | "REVIEW" | "APPROVED" | "FILED" | "EXECUTED" | "ARCHIVED";

export interface Document extends BaseEntity, SoftDeletable {
  name: string;
  originalName: string | null;
  description: string | null;
  type: DocumentType;
  mimeType: string | null;
  size: number | null;
  url: string;
  storageKey: string | null;
  checksum: string | null;
  isConfidential: boolean;
  status: DocumentStatus;
  version: number;
  metadata: Record<string, unknown> | null;
  matterId: string | null;
  firmId: string;
  authorId: string;
  folderId: string | null;
}

export interface DocumentWithDetails extends Document {
  author: Pick<User, "id" | "name" | "image">;
  matter?: MatterBasic | null;
  folder?: DocumentFolderBasic | null;
  tags: DocumentTag[];
  versions: DocumentVersion[];
  _count: {
    versions: number;
  };
}

export interface DocumentBasic extends Pick<Document, "id" | "name" | "type" | "status" | "size" | "createdAt"> {}

export interface DocumentVersion extends BaseEntity {
  version: number;
  url: string;
  storageKey: string | null;
  size: number | null;
  checksum: string | null;
  changeNote: string | null;
  documentId: string;
}

export interface DocumentFolder extends BaseEntity {
  name: string;
  description: string | null;
  path: string;
  parentId: string | null;
  firmId: string;
}

export interface DocumentFolderBasic extends Pick<DocumentFolder, "id" | "name" | "path"> {}

export interface DocumentFolderWithChildren extends DocumentFolder {
  children: DocumentFolderWithChildren[];
  _count: {
    documents: number;
    children: number;
  };
}

export interface DocumentTag extends BaseEntity {
  name: string;
  color: string | null;
  documentId: string;
}

// ─── Contract Types ──────────────────────────────────────────────────────────

export type ContractStatus =
  | "DRAFT"
  | "IN_NEGOTIATION"
  | "PENDING_APPROVAL"
  | "PENDING_SIGNATURE"
  | "EXECUTED"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "RENEWED";

export type ClauseStatus = "DRAFT" | "PROPOSED" | "NEGOTIATING" | "AGREED" | "REJECTED";

export type SignatureStatus = "PENDING" | "SIGNED" | "DECLINED" | "EXPIRED";

export interface Contract extends BaseEntity, SoftDeletable {
  title: string;
  status: ContractStatus;
  type: string | null;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  signedDate: Date | null;
  totalValue: number | null;
  currency: string;
  renewalTerms: string | null;
  terminationClause: string | null;
  governingLaw: string | null;
  metadata: Record<string, unknown> | null;
  firmId: string;
  clientId: string;
  matterId: string | null;
  templateId: string | null;
  documentId: string | null;
}

export interface ContractWithDetails extends Contract {
  client: ClientBasic;
  matter?: MatterBasic | null;
  template?: ContractTemplateBasic | null;
  document?: DocumentBasic | null;
  clauses: ContractClause[];
  signatures: ContractSignature[];
  _count: {
    clauses: number;
    signatures: number;
  };
}

export interface ContractBasic extends Pick<Contract, "id" | "title" | "status" | "type" | "totalValue" | "effectiveDate"> {}

export interface ContractClause extends BaseEntity {
  title: string;
  content: string;
  order: number;
  section: string | null;
  isNegotiable: boolean;
  status: ClauseStatus;
  version: number;
  metadata: Record<string, unknown> | null;
  contractId: string;
}

export interface ContractTemplate extends BaseEntity {
  name: string;
  description: string | null;
  content: string;
  category: string | null;
  isDefault: boolean;
  metadata: Record<string, unknown> | null;
  firmId: string;
}

export interface ContractTemplateBasic extends Pick<ContractTemplate, "id" | "name" | "category" | "isDefault"> {}

export interface ContractSignature extends BaseEntity {
  name: string;
  email: string;
  role: string | null;
  status: SignatureStatus;
  signedAt: Date | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  contractId: string;
}

// ─── Task Types ──────────────────────────────────────────────────────────────

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED" | "CANCELLED";

export interface Task extends BaseEntity, SoftDeletable {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  billable: boolean;
  order: number | null;
  metadata: Record<string, unknown> | null;
  matterId: string;
  parentId: string | null;
}

export interface TaskWithDetails extends Task {
  assignees: TaskAssigneeWithUser[];
  comments: TaskComment[];
  _count: {
    subtasks: number;
    comments: number;
  };
}

export interface TaskBasic extends Pick<Task, "id" | "title" | "status" | "priority" | "dueDate" | "billable"> {}

export interface TaskAssignee extends BaseEntity {
  assignedAt: Date;
  taskId: string;
  userId: string;
}

export interface TaskAssigneeWithUser extends TaskAssignee {
  user: Pick<User, "id" | "name" | "email" | "image">;
}

export interface TaskComment extends BaseEntity {
  content: string;
  taskId: string;
  authorId: string;
  author?: Pick<User, "id" | "name" | "image">;
}

// ─── Time Entry Types ────────────────────────────────────────────────────────

export interface TimeEntry extends BaseEntity, SoftDeletable {
  description: string;
  date: Date;
  hours: number;
  rate: number;
  amount: number;
  isBillable: boolean;
  isBilled: boolean;
  category: string | null;
  metadata: Record<string, unknown> | null;
  matterId: string;
  userId: string;
  taskId: string | null;
  invoiceId: string | null;
}

export interface TimeEntryWithDetails extends TimeEntry {
  matter: MatterBasic;
  user: Pick<User, "id" | "name" | "image">;
  task?: TaskBasic | null;
}

export interface TimeEntryBasic extends Pick<TimeEntry, "id" | "description" | "date" | "hours" | "rate" | "amount" | "isBillable"> {}

export interface TimeEntrySummary {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalAmount: number;
  billedAmount: number;
  unbilledAmount: number;
  byUser: {
    userId: string;
    userName: string;
    hours: number;
    amount: number;
  }[];
  byMatter: {
    matterId: string;
    matterTitle: string;
    hours: number;
    amount: number;
  }[];
  byDate: {
    date: string;
    hours: number;
    amount: number;
  }[];
}

// ─── Invoice Types ───────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "SENT"
  | "VIEWED"
  | "PAID"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "WRITTEN_OFF";

export type InvoiceType = "REGULAR" | "PROFORMA" | "CREDIT_NOTE" | "DEBIT_NOTE" | "TRUST_REQUEST";

export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "CHECK" | "CASH" | "WIRE" | "ACH" | "OTHER";

export interface Invoice extends BaseEntity, SoftDeletable {
  invoiceNumber: string;
  status: InvoiceStatus;
  type: InvoiceType;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  balance: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  notes: string | null;
  terms: string | null;
  metadata: Record<string, unknown> | null;
  firmId: string;
  clientId: string;
  matterId: string;
}

export interface InvoiceWithDetails extends Invoice {
  client: ClientBasic;
  matter: MatterBasic;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  _count: {
    lineItems: number;
    payments: number;
  };
}

export interface InvoiceBasic extends Pick<Invoice, "id" | "invoiceNumber" | "status" | "total" | "dueDate"> {}

export interface InvoiceLineItem extends BaseEntity {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: string | null;
  taxRate: number | null;
  taxAmount: number | null;
  order: number | null;
  invoiceId: string;
}

export interface Payment extends BaseEntity {
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  transactionId: string | null;
  notes: string | null;
  paidAt: Date;
  invoiceId: string;
}

export interface InvoiceSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  byStatus: {
    status: InvoiceStatus;
    count: number;
    total: number;
  }[];
  byMonth: {
    month: string;
    invoiced: number;
    paid: number;
  }[];
}

// ─── Calendar Types ──────────────────────────────────────────────────────────

export type EventType = "HEARING" | "DEPOSITION" | "MEETING" | "DEADLINE" | "FILING" | "CONFERENCE" | "OTHER";

export interface Calendar extends BaseEntity {
  name: string;
  description: string | null;
  color: string | null;
  isDefault: boolean;
  firmId: string;
}

export interface CalendarEvent extends BaseEntity {
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  recurrence: string | null;
  reminder: number | null;
  type: EventType;
  metadata: Record<string, unknown> | null;
  calendarId: string;
  matterId: string | null;
  userId: string;
}

export interface CalendarEventWithDetails extends CalendarEvent {
  matter?: MatterBasic | null;
  user: Pick<User, "id" | "name" | "image">;
  calendar: Pick<Calendar, "id" | "name" | "color">;
}

// ─── Court Deadline Types ────────────────────────────────────────────────────

export type DeadlineType =
  | "FILING"
  | "RESPONSE"
  | "DISCOVERY"
  | "DEPOSITION"
  | "HEARING"
  | "TRIAL"
  | "APPEAL"
  | "STATUTE_OF_LIMITATIONS"
  | "OTHER";

export interface CourtDeadline extends BaseEntity {
  title: string;
  description: string | null;
  dueDate: Date;
  type: DeadlineType;
  isCompleted: boolean;
  completedAt: Date | null;
  reminderDays: number;
  metadata: Record<string, unknown> | null;
  matterId: string;
  trackerId: string | null;
}

export interface CourtDeadlineWithDetails extends CourtDeadline {
  matter: MatterBasic;
}

export interface DeadlineTracker extends BaseEntity {
  name: string;
  rules: Record<string, unknown>;
  isActive: boolean;
}

// ─── Party & Witness Types ───────────────────────────────────────────────────

export type PartyType = "PLAINTIFF" | "DEFENDANT" | "THIRD_PARTY" | "INTERVENOR";
export type WitnessType = "FACT" | "EXPERT" | "CHARACTER" | "REBUTTAL";

export interface OpposingParty extends BaseEntity {
  name: string;
  type: PartyType;
  counsel: string | null;
  firm: string | null;
  contactInfo: Record<string, unknown> | null;
  notes: string | null;
  matterId: string;
}

export interface Witness extends BaseEntity {
  name: string;
  type: WitnessType;
  role: string | null;
  contactInfo: Record<string, unknown> | null;
  notes: string | null;
  matterId: string;
}

export interface ExpertWitness extends BaseEntity {
  name: string;
  specialty: string;
  rate: number | null;
  firm: string | null;
  contactInfo: Record<string, unknown> | null;
  qualifications: string | null;
  notes: string | null;
  matterId: string;
}

// ─── Settlement Types ────────────────────────────────────────────────────────

export type SettlementStatus = "PROPOSING" | "NEGOTIATING" | "AGREED" | "REJECTED" | "EXECUTED" | "FAILED";

export interface Settlement extends BaseEntity {
  title: string;
  status: SettlementStatus;
  totalValue: number | null;
  currency: string;
  proposedDate: Date | null;
  acceptedDate: Date | null;
  executedDate: Date | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  matterId: string;
}

export interface SettlementWithDetails extends Settlement {
  matter: MatterBasic;
  terms: SettlementTerm[];
}

export interface SettlementTerm extends BaseEntity {
  title: string;
  description: string;
  value: number | null;
  order: number;
  isAccepted: boolean;
  metadata: Record<string, unknown> | null;
  settlementId: string;
}

// ─── Legal Research Types ────────────────────────────────────────────────────

export type ResearchStatus = "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "ARCHIVED";

export interface Citation extends BaseEntity {
  title: string;
  court: string | null;
  citation: string;
  date: Date | null;
  summary: string | null;
  url: string | null;
  jurisdiction: string | null;
  metadata: Record<string, unknown> | null;
}

export interface LegalResearch extends BaseEntity {
  title: string;
  query: string;
  summary: string | null;
  findings: string | null;
  status: ResearchStatus;
  metadata: Record<string, unknown> | null;
  matterId: string;
}

export interface LegalResearchWithDetails extends LegalResearch {
  matter: MatterBasic;
  citations: ResearchCitationWithCitation[];
  notes: ResearchNote[];
}

export interface ResearchCitation {
  id: string;
  relevance: number | null;
  notes: string | null;
  researchId: string;
  citationId: string;
}

export interface ResearchCitationWithCitation extends ResearchCitation {
  citation: Citation;
}

export interface ResearchNote extends BaseEntity {
  content: string;
  researchId: string | null;
  citationId: string | null;
  authorId: string;
  author?: Pick<User, "id" | "name" | "image">;
}

// ─── AI Types ────────────────────────────────────────────────────────────────

export type AIReviewType = "CONTRACT_ANALYSIS" | "RISK_ASSESSMENT" | "CLAUSE_REVIEW" | "COMPLIANCE_CHECK" | "SUMMARIZATION";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AIStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface AIContractReview extends BaseEntity {
  type: AIReviewType;
  input: string;
  output: string | null;
  score: number | null;
  riskLevel: RiskLevel | null;
  suggestions: Record<string, unknown> | null;
  status: AIStatus;
  tokensUsed: number | null;
  modelUsed: string | null;
  processingTime: number | null;
  metadata: Record<string, unknown> | null;
  matterId: string | null;
  contractId: string | null;
  userId: string;
}

export interface AIResearchQuery extends BaseEntity {
  query: string;
  context: string | null;
  response: string | null;
  sources: Record<string, unknown> | null;
  confidence: number | null;
  tokensUsed: number | null;
  modelUsed: string | null;
  processingTime: number | null;
  status: AIStatus;
  metadata: Record<string, unknown> | null;
  matterId: string | null;
  researchId: string | null;
  userId: string;
}

// ─── System Types ────────────────────────────────────────────────────────────

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "DEADLINE" | "ASSIGNMENT" | "COMMENT" | "UPDATE";

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: Date | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  userId: string;
}

export interface ActivityLog extends BaseEntity {
  action: string;
  entity: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  firmId: string | null;
  matterId: string | null;
}

export interface ApiKey extends BaseEntity {
  name: string;
  key: string;
  hash: string;
  expiresAt: Date | null;
  lastUsed: Date | null;
  isActive: boolean;
  userId: string;
}

export interface Webhook extends BaseEntity {
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
  lastTriggered: Date | null;
  firmId: string;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalMatters: number;
  activeMatters: number;
  totalClients: number;
  totalDocuments: number;
  pendingTasks: number;
  overdueTasks: number;
  billableHours: number;
  totalRevenue: number;
  outstandingInvoices: number;
  upcomingDeadlines: number;
}

export interface MatterStats {
  byStatus: {
    status: MatterStatus;
    count: number;
  }[];
  byType: {
    type: MatterType;
    count: number;
  }[];
  byPriority: {
    priority: Priority;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    opened: number;
    closed: number;
  }[];
}

export interface BillingStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  averageInvoiceAmount: number;
  averageDaysToPay: number;
  byMonth: {
    month: string;
    invoiced: number;
    collected: number;
  }[];
  topClients: {
    clientId: string;
    clientName: string;
    totalBilled: number;
    invoiceCount: number;
  }[];
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ─── Filter & Search Types ───────────────────────────────────────────────────

export interface DateRange {
  start: Date;
  end: Date;
}

export interface MatterFilters {
  status?: MatterStatus[];
  type?: MatterType[];
  priority?: Priority[];
  clientId?: string;
  ownerId?: string;
  teamMemberId?: string;
  practiceArea?: string;
  dateRange?: DateRange;
  search?: string;
}

export interface DocumentFilters {
  type?: DocumentType[];
  status?: DocumentStatus[];
  matterId?: string;
  folderId?: string;
  authorId?: string;
  isConfidential?: boolean;
  tags?: string[];
  dateRange?: DateRange;
  search?: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  matterId?: string;
  assigneeId?: string;
  billable?: boolean;
  dateRange?: DateRange;
  search?: string;
}

// ─── Utility Types ───────────────────────────────────────────────────────────

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type OptionalExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
    {
      [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
    }[Keys];

export type ArrayElement<ArrayType> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
