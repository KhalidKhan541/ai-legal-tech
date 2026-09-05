import { z } from "zod";

// ─── Common Schemas ──────────────────────────────────────────────────────────

export const idSchema = z.string().cuid();
export const emailSchema = z.string().email("Invalid email address");
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]{10,}$/, "Invalid phone number").optional();
export const urlSchema = z.string().url("Invalid URL");
export const dateSchema = z.string().datetime().or(z.date());
export const positiveNumberSchema = z.number().positive("Must be a positive number");
export const nonNegativeNumberSchema = z.number().nonnegative("Must be non-negative");
export const percentageSchema = z.number().min(0).max(100);
export const currencySchema = z.string().length(3, "Currency must be 3 characters").default("USD");

// ─── Pagination & Filtering ──────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: idSchema.optional(),
  orderBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(200).optional(),
});

export const dateRangeSchema = z.object({
  start: dateSchema,
  end: dateSchema,
});

export const bulkActionSchema = z.object({
  ids: z.array(idSchema).min(1).max(100),
  action: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  title: z.string().max(100).optional(),
  barNumber: z.string().max(50).optional(),
  jurisdiction: z.string().max(100).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ─── User Schemas ────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema,
  title: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  timezone: z.string().default("America/New_York"),
  locale: z.string().default("en-US"),
  image: urlSchema.optional(),
});

export const updateUserRoleSchema = z.object({
  userId: idSchema,
  role: z.enum([
    "SUPER_ADMIN", "ADMIN", "MANAGING_PARTNER", "SENIOR_PARTNER",
    "JUNIOR_PARTNER", "OF_COUNSEL", "SENIOR_ASSOCIATE", "ASSOCIATE",
    "PARALEGAL", "LEGAL_SECRETARY", "INTERN",
  ]),
});

// ─── Firm Schemas ────────────────────────────────────────────────────────────

export const createFirmSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000).optional(),
  website: urlSchema.optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().length(2).default("US"),
  taxId: z.string().max(50).optional(),
  barNumber: z.string().max(50).optional(),
  jurisdiction: z.string().max(100).optional(),
});

export const updateFirmSchema = createFirmSchema.partial();

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]).default("MEMBER"),
  message: z.string().max(500).optional(),
});

export const firmSettingsSchema = z.object({
  defaultBillingRate: positiveNumberSchema.optional(),
  defaultCurrency: currencySchema,
  taxRate: percentageSchema.optional(),
  invoicePrefix: z.string().max(10).optional(),
  invoiceTerms: z.string().max(2000).optional(),
  invoiceNotes: z.string().max(2000).optional(),
  matterNumberPrefix: z.string().max(10).optional(),
  enableTimeTracking: z.boolean().default(true),
  enableInvoicing: z.boolean().default(true),
  enableNotifications: z.boolean().default(true),
  enableAI: z.boolean().default(false),
  workingHoursPerDay: z.number().min(1).max(24).default(8),
  workingDaysPerWeek: z.number().min(1).max(7).default(5),
  notificationSettings: z.object({
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
    deadlineReminderDays: z.number().min(0).max(30).default(7),
  }).optional(),
});

// ─── Client Schemas ──────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["INDIVIDUAL", "CORPORATE", "GOVERNMENT", "NON_PROFIT", "OTHER"]).default("INDIVIDUAL"),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().length(2).default("US"),
  company: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const createClientContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: emailSchema.optional(),
  phone: phoneSchema,
  title: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  clientId: idSchema,
});

export const updateClientContactSchema = createClientContactSchema.partial().omit({ clientId: true });

// ─── Matter Schemas ──────────────────────────────────────────────────────────

export const createMatterSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  type: z.enum([
    "LITIGATION", "ARBITRATION", "MEDIATION", "TRANSACTIONAL",
    "ADVISORY", "REGULATORY", "COMPLIANCE", "INTELLECTUAL_PROPERTY",
    "REAL_ESTATE", "FAMILY_LAW", "CRIMINAL", "BANKRUPTCY",
    "IMMIGRATION", "LABOR_EMPLOYMENT", "TAX", "ESTATE_PLANNING",
    "ENVIRONMENTAL", "OTHER",
  ]).default("LITIGATION"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).default("MEDIUM"),
  practiceArea: z.string().max(200).optional(),
  court: z.string().max(200).optional(),
  judge: z.string().max(200).optional(),
  caseNumber: z.string().max(100).optional(),
  filingDate: dateSchema.optional(),
  trialDate: dateSchema.optional(),
  statuteOfLimitations: dateSchema.optional(),
  estimatedValue: nonNegativeNumberSchema.optional(),
  clientId: idSchema,
  teamMemberIds: z.array(idSchema).optional(),
});

export const updateMatterSchema = createMatterSchema.partial().omit({ clientId: true });

export const matterFilterSchema = paginationSchema.extend({
  status: z.enum([
    "OPEN", "PENDING", "ACTIVE", "ON_HOLD", "SETTLED",
    "CLOSED", "DISMISSED", "WON", "LOST",
  ]).optional(),
  type: z.enum([
    "LITIGATION", "ARBITRATION", "MEDIATION", "TRANSACTIONAL",
    "ADVISORY", "REGULATORY", "COMPLIANCE", "INTELLECTUAL_PROPERTY",
    "REAL_ESTATE", "FAMILY_LAW", "CRIMINAL", "BANKRUPTCY",
    "IMMIGRATION", "LABOR_EMPLOYMENT", "TAX", "ESTATE_PLANNING",
    "ENVIRONMENTAL", "OTHER",
  ]).optional(),
  clientId: idSchema.optional(),
  ownerId: idSchema.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).optional(),
  dateRange: dateRangeSchema.optional(),
});

// ─── Document Schemas ────────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  type: z.enum([
    "CONTRACT", "AGREEMENT", "MOTION", "BRIEF", "MEMO", "LETTER",
    "DEPOSITION", "AFFIDAVIT", "PETITION", "COMPLAINT", "ANSWER",
    "DISCOVERY", "EVIDENCE", "BILLING", "CORRESPONDENCE",
    "COURT_FILING", "OTHER",
  ]).default("OTHER"),
  matterId: idSchema.optional(),
  folderId: idSchema.optional(),
  isConfidential: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentFilterSchema = paginationSchema.extend({
  type: z.enum([
    "CONTRACT", "AGREEMENT", "MOTION", "BRIEF", "MEMO", "LETTER",
    "DEPOSITION", "AFFIDAVIT", "PETITION", "COMPLAINT", "ANSWER",
    "DISCOVERY", "EVIDENCE", "BILLING", "CORRESPONDENCE",
    "COURT_FILING", "OTHER",
  ]).optional(),
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "FILED", "EXECUTED", "ARCHIVED"]).optional(),
  matterId: idSchema.optional(),
  folderId: idSchema.optional(),
  isConfidential: z.boolean().optional(),
  dateRange: dateRangeSchema.optional(),
});

// ─── Contract Schemas ────────────────────────────────────────────────────────

export const createContractSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.string().max(100).optional(),
  effectiveDate: dateSchema.optional(),
  expirationDate: dateSchema.optional(),
  totalValue: nonNegativeNumberSchema.optional(),
  currency: currencySchema,
  renewalTerms: z.string().max(2000).optional(),
  terminationClause: z.string().max(2000).optional(),
  governingLaw: z.string().max(200).optional(),
  clientId: idSchema,
  matterId: idSchema.optional(),
  templateId: idSchema.optional(),
  documentId: idSchema.optional(),
});

export const updateContractSchema = createContractSchema.partial().omit({ clientId: true });

export const createContractClauseSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(50000),
  order: z.number().int().min(0),
  section: z.string().max(100).optional(),
  isNegotiable: z.boolean().default(false),
  contractId: idSchema,
});

export const updateContractClauseSchema = createContractClauseSchema.partial().omit({ contractId: true });

export const contractFilterSchema = paginationSchema.extend({
  status: z.enum([
    "DRAFT", "IN_NEGOTIATION", "PENDING_APPROVAL",
    "PENDING_SIGNATURE", "EXECUTED", "ACTIVE",
    "EXPIRED", "TERMINATED", "RENEWED",
  ]).optional(),
  clientId: idSchema.optional(),
  matterId: idSchema.optional(),
  dateRange: dateRangeSchema.optional(),
});

// ─── Task Schemas ────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).default("MEDIUM"),
  dueDate: dateSchema.optional(),
  estimatedHours: positiveNumberSchema.optional(),
  billable: z.boolean().default(true),
  matterId: idSchema,
  parentId: idSchema.optional(),
  assigneeIds: z.array(idSchema).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).optional(),
  dueDate: dateSchema.optional(),
  estimatedHours: positiveNumberSchema.optional(),
  actualHours: nonNegativeNumberSchema.optional(),
  billable: z.boolean().optional(),
});

export const taskFilterSchema = paginationSchema.extend({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).optional(),
  matterId: idSchema.optional(),
  assigneeId: idSchema.optional(),
  dueBefore: dateSchema.optional(),
  dueAfter: dateSchema.optional(),
  billable: z.boolean().optional(),
});

export const createTaskCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  taskId: idSchema,
});

// ─── Time Entry Schemas ──────────────────────────────────────────────────────

export const createTimeEntrySchema = z.object({
  description: z.string().min(1).max(2000),
  date: dateSchema,
  hours: z.number().positive().max(24),
  rate: positiveNumberSchema.optional(),
  isBillable: z.boolean().default(true),
  category: z.string().max(100).optional(),
  matterId: idSchema,
  taskId: idSchema.optional(),
});

export const updateTimeEntrySchema = z.object({
  description: z.string().min(1).max(2000).optional(),
  date: dateSchema.optional(),
  hours: z.number().positive().max(24).optional(),
  rate: positiveNumberSchema.optional(),
  isBillable: z.boolean().optional(),
  category: z.string().max(100).optional(),
});

export const timeEntryFilterSchema = paginationSchema.extend({
  matterId: idSchema.optional(),
  userId: idSchema.optional(),
  isBillable: z.boolean().optional(),
  isBilled: z.boolean().optional(),
  dateRange: dateRangeSchema.optional(),
  category: z.string().optional(),
});

// ─── Invoice Schemas ─────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  type: z.enum(["REGULAR", "PROFORMA", "CREDIT_NOTE", "DEBIT_NOTE", "TRUST_REQUEST"]).default("REGULAR"),
  clientId: idSchema,
  matterId: idSchema,
  dueDate: dateSchema,
  taxRate: percentageSchema.default(0),
  discountAmount: nonNegativeNumberSchema.default(0),
  notes: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive().default(1),
    unitPrice: positiveNumberSchema,
    category: z.string().max(100).optional(),
    taxRate: percentageSchema.optional(),
  })).min(1).max(100),
});

export const updateInvoiceSchema = z.object({
  status: z.enum([
    "DRAFT", "PENDING", "SENT", "VIEWED", "PAID",
    "PARTIALLY_PAID", "OVERDUE", "CANCELLED", "WRITTEN_OFF",
  ]).optional(),
  dueDate: dateSchema.optional(),
  notes: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
});

export const invoiceFilterSchema = paginationSchema.extend({
  status: z.enum([
    "DRAFT", "PENDING", "SENT", "VIEWED", "PAID",
    "PARTIALLY_PAID", "OVERDUE", "CANCELLED", "WRITTEN_OFF",
  ]).optional(),
  type: z.enum(["REGULAR", "PROFORMA", "CREDIT_NOTE", "DEBIT_NOTE", "TRUST_REQUEST"]).optional(),
  clientId: idSchema.optional(),
  matterId: idSchema.optional(),
  dateRange: dateRangeSchema.optional(),
  dueBefore: dateSchema.optional(),
  dueAfter: dateSchema.optional(),
});

export const createPaymentSchema = z.object({
  amount: positiveNumberSchema,
  method: z.enum(["CREDIT_CARD", "BANK_TRANSFER", "CHECK", "CASH", "WIRE", "ACH", "OTHER"]),
  reference: z.string().max(200).optional(),
  transactionId: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  invoiceId: idSchema,
});

// ─── Calendar Schemas ────────────────────────────────────────────────────────

export const createCalendarEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startTime: dateSchema,
  endTime: dateSchema,
  allDay: z.boolean().default(false),
  recurrence: z.string().max(100).optional(),
  reminder: z.number().int().min(0).max(1440).optional(),
  type: z.enum(["HEARING", "DEPOSITION", "MEETING", "DEADLINE", "FILING", "CONFERENCE", "OTHER"]).default("OTHER"),
  matterId: idSchema.optional(),
  calendarId: idSchema,
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  },
  { message: "End time must be after start time", path: ["endTime"] }
);

export const updateCalendarEventSchema = createCalendarEventSchema.partial().omit({ calendarId: true });

// ─── Court Deadline Schemas ──────────────────────────────────────────────────

export const createCourtDeadlineSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  dueDate: dateSchema,
  type: z.enum([
    "FILING", "RESPONSE", "DISCOVERY", "DEPOSITION",
    "HEARING", "TRIAL", "APPEAL", "STATUTE_OF_LIMITATIONS", "OTHER",
  ]),
  reminderDays: z.number().int().min(0).max(90).default(7),
  matterId: idSchema,
});

export const updateCourtDeadlineSchema = createCourtDeadlineSchema.partial().omit({ matterId: true });

export const deadlineFilterSchema = paginationSchema.extend({
  type: z.enum([
    "FILING", "RESPONSE", "DISCOVERY", "DEPOSITION",
    "HEARING", "TRIAL", "APPEAL", "STATUTE_OF_LIMITATIONS", "OTHER",
  ]).optional(),
  matterId: idSchema.optional(),
  isCompleted: z.boolean().optional(),
  dueBefore: dateSchema.optional(),
  dueAfter: dateSchema.optional(),
});

// ─── Legal Research Schemas ──────────────────────────────────────────────────

export const createResearchSchema = z.object({
  title: z.string().min(1).max(500),
  query: z.string().min(1).max(5000),
  matterId: idSchema,
});

export const updateResearchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  summary: z.string().max(10000).optional(),
  findings: z.string().max(50000).optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "ON_HOLD", "ARCHIVED"]).optional(),
});

export const createResearchNoteSchema = z.object({
  content: z.string().min(1).max(10000),
  researchId: idSchema.optional(),
  citationId: idSchema.optional(),
});

// ─── AI Schemas ──────────────────────────────────────────────────────────────

export const contractReviewSchema = z.object({
  contractText: z.string().min(100).max(200000),
  type: z.enum([
    "CONTRACT_ANALYSIS", "RISK_ASSESSMENT", "CLAUSE_REVIEW",
    "COMPLIANCE_CHECK", "SUMMARIZATION",
  ]),
  matterId: idSchema.optional(),
  contractId: idSchema.optional(),
  options: z.object({
    jurisdiction: z.string().max(100).optional(),
    focusAreas: z.array(z.string().max(100)).max(10).optional(),
    riskTolerance: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  }).optional(),
});

export const researchQuerySchema = z.object({
  query: z.string().min(10).max(10000),
  context: z.string().max(50000).optional(),
  matterId: idSchema.optional(),
  researchId: idSchema.optional(),
  options: z.object({
    maxSources: z.number().int().min(1).max(50).default(10),
    jurisdiction: z.string().max(100).optional(),
    dateRange: dateRangeSchema.optional(),
    practiceArea: z.string().max(200).optional(),
  }).optional(),
});

// ─── Settlement Schemas ──────────────────────────────────────────────────────

export const createSettlementSchema = z.object({
  title: z.string().min(1).max(500),
  totalValue: nonNegativeNumberSchema.optional(),
  currency: currencySchema,
  matterId: idSchema,
  terms: z.array(z.object({
    title: z.string().min(1).max(500),
    description: z.string().min(1).max(5000),
    value: nonNegativeNumberSchema.optional(),
    order: z.number().int().min(0),
  })).min(1).max(50),
});

export const updateSettlementSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: z.enum(["PROPOSING", "NEGOTIATING", "AGREED", "REJECTED", "EXECUTED", "FAILED"]).optional(),
  totalValue: nonNegativeNumberSchema.optional(),
  notes: z.string().max(5000).optional(),
});

// ─── Opposing Party & Witness Schemas ────────────────────────────────────────

export const createOpposingPartySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["PLAINTIFF", "DEFENDANT", "THIRD_PARTY", "INTERVENOR"]),
  counsel: z.string().max(200).optional(),
  firm: z.string().max(200).optional(),
  contactInfo: z.record(z.unknown()).optional(),
  notes: z.string().max(5000).optional(),
  matterId: idSchema,
});

export const createWitnessSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["FACT", "EXPERT", "CHARACTER", "REBUTTAL"]),
  role: z.string().max(200).optional(),
  contactInfo: z.record(z.unknown()).optional(),
  notes: z.string().max(5000).optional(),
  matterId: idSchema,
});

export const createExpertWitnessSchema = z.object({
  name: z.string().min(1).max(200),
  specialty: z.string().min(1).max(200),
  rate: positiveNumberSchema.optional(),
  firm: z.string().max(200).optional(),
  contactInfo: z.record(z.unknown()).optional(),
  qualifications: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  matterId: idSchema,
});

// ─── Notification Schemas ────────────────────────────────────────────────────

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR", "DEADLINE", "ASSIGNMENT", "COMMENT", "UPDATE"]).default("INFO"),
  link: z.string().max(500).optional(),
  userId: idSchema,
  metadata: z.record(z.unknown()).optional(),
});

// ─── Webhook Schemas ─────────────────────────────────────────────────────────

export const createWebhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string().min(1).max(100)).min(1).max(20),
  secret: z.string().max(200).optional(),
});

export const updateWebhookSchema = z.object({
  url: urlSchema.optional(),
  events: z.array(z.string().min(1).max(100)).min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

// ─── Export All Schemas ──────────────────────────────────────────────────────

export type PaginationInput = z.infer<typeof paginationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateFirmInput = z.infer<typeof createFirmSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateMatterInput = z.infer<typeof createMatterSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type CreateCourtDeadlineInput = z.infer<typeof createCourtDeadlineSchema>;
export type CreateResearchInput = z.infer<typeof createResearchSchema>;
export type ContractReviewInput = z.infer<typeof contractReviewSchema>;
export type ResearchQueryInput = z.infer<typeof researchQuerySchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
