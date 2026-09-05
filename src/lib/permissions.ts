import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ─── Permission Types ────────────────────────────────────────────────────────

export type Permission =
  | "firm:create"
  | "firm:read"
  | "firm:update"
  | "firm:delete"
  | "firm:manage_members"
  | "firm:manage_settings"
  | "firm:manage_billing"
  | "firm:view_analytics"
  | "client:create"
  | "client:read"
  | "client:update"
  | "client:delete"
  | "client:read_all"
  | "matter:create"
  | "matter:read"
  | "matter:update"
  | "matter:delete"
  | "matter:read_all"
  | "matter:manage_team"
  | "matter:manage_billing"
  | "matter:view_financials"
  | "document:create"
  | "document:read"
  | "document:update"
  | "document:delete"
  | "document:read_confidential"
  | "document:manage_folders"
  | "contract:create"
  | "contract:read"
  | "contract:update"
  | "contract:delete"
  | "contract:approve"
  | "contract:execute"
  | "task:create"
  | "task:read"
  | "task:update"
  | "task:delete"
  | "task:assign"
  | "time:create"
  | "time:read"
  | "time:update"
  | "time:delete"
  | "time:read_all"
  | "invoice:create"
  | "invoice:read"
  | "invoice:update"
  | "invoice:delete"
  | "invoice:approve"
  | "invoice:send"
  | "invoice:read_all"
  | "calendar:create"
  | "calendar:read"
  | "calendar:update"
  | "calendar:delete"
  | "calendar:read_all"
  | "deadline:create"
  | "deadline:read"
  | "deadline:update"
  | "deadline:delete"
  | "research:create"
  | "research:read"
  | "research:update"
  | "research:delete"
  | "ai:use"
  | "ai:read_history"
  | "notification:read"
  | "notification:manage"
  | "user:read"
  | "user:update"
  | "user:manage_roles"
  | "report:view"
  | "report:export"
  | "settings:manage";

// ─── Role Permission Maps ────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "firm:create", "firm:read", "firm:update", "firm:delete",
    "firm:manage_members", "firm:manage_settings", "firm:manage_billing", "firm:view_analytics",
    "client:create", "client:read", "client:update", "client:delete", "client:read_all",
    "matter:create", "matter:read", "matter:update", "matter:delete", "matter:read_all",
    "matter:manage_team", "matter:manage_billing", "matter:view_financials",
    "document:create", "document:read", "document:update", "document:delete",
    "document:read_confidential", "document:manage_folders",
    "contract:create", "contract:read", "contract:update", "contract:delete",
    "contract:approve", "contract:execute",
    "task:create", "task:read", "task:update", "task:delete", "task:assign",
    "time:create", "time:read", "time:update", "time:delete", "time:read_all",
    "invoice:create", "invoice:read", "invoice:update", "invoice:delete",
    "invoice:approve", "invoice:send", "invoice:read_all",
    "calendar:create", "calendar:read", "calendar:update", "calendar:delete", "calendar:read_all",
    "deadline:create", "deadline:read", "deadline:update", "deadline:delete",
    "research:create", "research:read", "research:update", "research:delete",
    "ai:use", "ai:read_history",
    "notification:read", "notification:manage",
    "user:read", "user:update", "user:manage_roles",
    "report:view", "report:export", "settings:manage",
  ],
  ADMIN: [
    "firm:read", "firm:update", "firm:manage_members", "firm:manage_settings",
    "firm:manage_billing", "firm:view_analytics",
    "client:create", "client:read", "client:update", "client:delete", "client:read_all",
    "matter:create", "matter:read", "matter:update", "matter:delete", "matter:read_all",
    "matter:manage_team", "matter:manage_billing", "matter:view_financials",
    "document:create", "document:read", "document:update", "document:delete",
    "document:read_confidential", "document:manage_folders",
    "contract:create", "contract:read", "contract:update", "contract:delete", "contract:approve",
    "task:create", "task:read", "task:update", "task:delete", "task:assign",
    "time:create", "time:read", "time:update", "time:delete", "time:read_all",
    "invoice:create", "invoice:read", "invoice:update", "invoice:delete", "invoice:approve",
    "invoice:send", "invoice:read_all",
    "calendar:create", "calendar:read", "calendar:update", "calendar:delete", "calendar:read_all",
    "deadline:create", "deadline:read", "deadline:update", "deadline:delete",
    "research:create", "research:read", "research:update", "research:delete",
    "ai:use", "ai:read_history",
    "notification:read", "notification:manage",
    "user:read", "user:update",
    "report:view", "report:export", "settings:manage",
  ],
  MANAGING_PARTNER: [
    "firm:read", "firm:update", "firm:view_analytics",
    "client:create", "client:read", "client:update", "client:read_all",
    "matter:create", "matter:read", "matter:update", "matter:delete", "matter:read_all",
    "matter:manage_team", "matter:manage_billing", "matter:view_financials",
    "document:create", "document:read", "document:update", "document:delete",
    "document:read_confidential",
    "contract:create", "contract:read", "contract:update", "contract:approve",
    "task:create", "task:read", "task:update", "task:delete", "task:assign",
    "time:create", "time:read", "time:update", "time:read_all",
    "invoice:create", "invoice:read", "invoice:update", "invoice:approve", "invoice:read_all",
    "calendar:create", "calendar:read", "calendar:update", "calendar:read_all",
    "deadline:create", "deadline:read", "deadline:update",
    "research:create", "research:read", "research:update",
    "ai:use", "ai:read_history",
    "notification:read",
    "user:read",
    "report:view", "report:export",
  ],
  SENIOR_PARTNER: [
    "firm:read", "firm:view_analytics",
    "client:create", "client:read", "client:update", "client:read_all",
    "matter:create", "matter:read", "matter:update", "matter:read_all",
    "matter:manage_team", "matter:view_financials",
    "document:create", "document:read", "document:update", "document:read_confidential",
    "contract:create", "contract:read", "contract:update", "contract:approve",
    "task:create", "task:read", "task:update", "task:assign",
    "time:create", "time:read", "time:update", "time:read_all",
    "invoice:create", "invoice:read", "invoice:update", "invoice:read_all",
    "calendar:create", "calendar:read", "calendar:update", "calendar:read_all",
    "deadline:create", "deadline:read", "deadline:update",
    "research:create", "research:read", "research:update",
    "ai:use", "ai:read_history",
    "notification:read",
    "user:read",
    "report:view",
  ],
  JUNIOR_PARTNER: [
    "firm:read",
    "client:create", "client:read", "client:update", "client:read_all",
    "matter:create", "matter:read", "matter:update", "matter:read_all",
    "matter:manage_team",
    "document:create", "document:read", "document:update", "document:read_confidential",
    "contract:create", "contract:read", "contract:update",
    "task:create", "task:read", "task:update", "task:assign",
    "time:create", "time:read", "time:update", "time:read_all",
    "invoice:create", "invoice:read", "invoice:update", "invoice:read_all",
    "calendar:create", "calendar:read", "calendar:update", "calendar:read_all",
    "deadline:create", "deadline:read", "deadline:update",
    "research:create", "research:read", "research:update",
    "ai:use", "ai:read_history",
    "notification:read",
    "user:read",
    "report:view",
  ],
  OF_COUNSEL: [
    "firm:read",
    "client:read", "client:read_all",
    "matter:read", "matter:read_all",
    "document:create", "document:read", "document:update",
    "contract:create", "contract:read", "contract:update",
    "task:create", "task:read", "task:update",
    "time:create", "time:read", "time:update",
    "invoice:read", "invoice:read_all",
    "calendar:create", "calendar:read", "calendar:update",
    "deadline:create", "deadline:read", "deadline:update",
    "research:create", "research:read", "research:update",
    "ai:use", "ai:read_history",
    "notification:read",
    "user:read",
    "report:view",
  ],
  SENIOR_ASSOCIATE: [
    "firm:read",
    "client:read", "client:read_all",
    "matter:read", "matter:read_all",
    "document:create", "document:read", "document:update",
    "contract:create", "contract:read", "contract:update",
    "task:create", "task:read", "task:update",
    "time:create", "time:read", "time:update",
    "invoice:read",
    "calendar:create", "calendar:read", "calendar:update",
    "deadline:create", "deadline:read", "deadline:update",
    "research:create", "research:read", "research:update",
    "ai:use", "ai:read_history",
    "notification:read",
    "user:read",
  ],
  ASSOCIATE: [
    "firm:read",
    "client:read",
    "matter:read",
    "document:create", "document:read", "document:update",
    "task:create", "task:read", "task:update",
    "time:create", "time:read", "time:update",
    "invoice:read",
    "calendar:create", "calendar:read", "calendar:update",
    "deadline:create", "deadline:read", "deadline:update",
    "research:create", "research:read", "research:update",
    "ai:use", "ai:read_history",
    "notification:read",
  ],
  PARALEGAL: [
    "firm:read",
    "client:read",
    "matter:read",
    "document:create", "document:read", "document:update",
    "task:read", "task:update",
    "time:create", "time:read", "time:update",
    "calendar:read",
    "deadline:read", "deadline:update",
    "research:read", "research:update",
    "notification:read",
  ],
  LEGAL_SECRETARY: [
    "firm:read",
    "client:read",
    "matter:read",
    "document:create", "document:read", "document:update",
    "task:read",
    "calendar:create", "calendar:read", "calendar:update",
    "deadline:read",
    "notification:read",
  ],
  INTERN: [
    "firm:read",
    "client:read",
    "matter:read",
    "document:read",
    "task:read",
    "calendar:read",
    "notification:read",
  ],
};

// ─── Firm Role Permission Overrides ──────────────────────────────────────────

const FIRM_ROLE_OVERRIDES: Record<string, Partial<Record<Permission, boolean>>> = {
  OWNER: {
    "firm:delete": true,
    "firm:manage_settings": true,
    "firm:manage_billing": true,
    "user:manage_roles": true,
    "settings:manage": true,
  },
  ADMIN: {
    "firm:manage_members": true,
    "firm:manage_settings": true,
    "user:manage_roles": true,
  },
  MANAGER: {
    "firm:manage_billing": true,
    "matter:manage_team": true,
    "task:assign": true,
  },
  MEMBER: {},
  VIEWER: {
    "client:create": false,
    "client:update": false,
    "client:delete": false,
    "matter:create": false,
    "matter:update": false,
    "matter:delete": false,
    "document:create": false,
    "document:update": false,
    "document:delete": false,
    "contract:create": false,
    "contract:update": false,
    "contract:delete": false,
    "contract:approve": false,
    "task:create": false,
    "task:update": false,
    "task:delete": false,
    "task:assign": false,
    "time:create": false,
    "time:update": false,
    "time:delete": false,
    "invoice:create": false,
    "invoice:update": false,
    "invoice:delete": false,
    "invoice:approve": false,
    "calendar:create": false,
    "calendar:update": false,
    "calendar:delete": false,
    "deadline:create": false,
    "deadline:update": false,
    "deadline:delete": false,
    "research:create": false,
    "research:update": false,
    "research:delete": false,
    "ai:use": false,
  },
};

// ─── Permission Checker Class ────────────────────────────────────────────────

export class PermissionChecker {
  private userRole: string;
  private firmRole: string | null;
  private userId: string;
  private firmId: string | null;
  private permissions: Set<Permission>;

  constructor(
    userId: string,
    userRole: string,
    firmId: string | null,
    firmRole: string | null
  ) {
    this.userId = userId;
    this.userRole = userRole;
    this.firmId = firmId;
    this.firmRole = firmRole;
    this.permissions = this.buildPermissions();
  }

  private buildPermissions(): Set<Permission> {
    const basePermissions = ROLE_PERMISSIONS[this.userRole] ?? [];
    const effectivePermissions = new Set<Permission>(basePermissions);

    // Apply firm role overrides
    if (this.firmRole) {
      const overrides = FIRM_ROLE_OVERRIDES[this.firmRole] ?? {};
      for (const [permission, allowed] of Object.entries(overrides)) {
        if (allowed === true) {
          effectivePermissions.add(permission as Permission);
        } else if (allowed === false) {
          effectivePermissions.delete(permission as Permission);
        }
      }
    }

    return effectivePermissions;
  }

  /**
   * Check if user has a specific permission
   */
  has(permission: Permission): boolean {
    return this.permissions.has(permission);
  }

  /**
   * Check if user has all specified permissions
   */
  hasAll(permissions: Permission[]): boolean {
    return permissions.every((p) => this.permissions.has(p));
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAny(permissions: Permission[]): boolean {
    return permissions.some((p) => this.permissions.has(p));
  }

  /**
   * Get all permissions for this user
   */
  getAll(): Permission[] {
    return Array.from(this.permissions);
  }

  /**
   * Assert that user has a permission, throw if not
   */
  assert(permission: Permission): void {
    if (!this.has(permission)) {
      throw new PermissionError(
        `Missing required permission: ${permission}`,
        permission
      );
    }
  }

  /**
   * Assert that user has all permissions, throw if not
   */
  assertAll(permissions: Permission[]): void {
    const missing = permissions.filter((p) => !this.has(p));
    if (missing.length > 0) {
      throw new PermissionError(
        `Missing required permissions: ${missing.join(", ")}`,
        missing[0]
      );
    }
  }
}

// ─── Permission Error ────────────────────────────────────────────────────────

export class PermissionError extends Error {
  public permission: Permission;
  public statusCode: number = 403;

  constructor(message: string, permission: Permission) {
    super(message);
    this.name = "PermissionError";
    this.permission = permission;
  }
}

// ─── Document Access Control ─────────────────────────────────────────────────

export interface DocumentAccessContext {
  userId: string;
  userRole: string;
  firmId: string;
  firmRole: string | null;
  documentFirmId: string;
  documentAuthorId: string;
  documentMatterId: string | null;
  documentIsConfidential: boolean;
  matterTeamMemberIds?: string[];
}

export function canAccessDocument(
  context: DocumentAccessContext,
  checker: PermissionChecker
): boolean {
  // Must be in same firm
  if (context.firmId !== context.documentFirmId) {
    return false;
  }

  // Confidential documents require special permission
  if (context.documentIsConfidential && !checker.has("document:read_confidential")) {
    return false;
  }

  return checker.has("document:read");
}

export function canEditDocument(
  context: DocumentAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.documentFirmId) {
    return false;
  }

  // Authors can always edit their own documents
  if (context.userId === context.documentAuthorId) {
    return true;
  }

  return checker.has("document:update");
}

export function canDeleteDocument(
  context: DocumentAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.documentFirmId) {
    return false;
  }

  // Authors can delete their own documents
  if (context.userId === context.documentAuthorId) {
    return true;
  }

  return checker.has("document:delete");
}

// ─── Matter Access Control ───────────────────────────────────────────────────

export interface MatterAccessContext {
  userId: string;
  userRole: string;
  firmId: string;
  firmRole: string | null;
  matterFirmId: string;
  matterOwnerId: string;
  matterTeamMemberIds: string[];
  matterIsConfidential?: boolean;
}

export function canAccessMatter(
  context: MatterAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.matterFirmId) {
    return false;
  }

  // Check for read_all permission
  if (checker.has("matter:read_all")) {
    return true;
  }

  // Owner can always access
  if (context.userId === context.matterOwnerId) {
    return true;
  }

  // Team members can access
  if (context.matterTeamMemberIds.includes(context.userId)) {
    return true;
  }

  return checker.has("matter:read");
}

export function canEditMatter(
  context: MatterAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.matterFirmId) {
    return false;
  }

  // Owner can always edit
  if (context.userId === context.matterOwnerId) {
    return true;
  }

  // Team leads can edit
  if (context.matterTeamMemberIds.includes(context.userId)) {
    return checker.has("matter:update");
  }

  return checker.has("matter:update");
}

export function canManageMatterTeam(
  context: MatterAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.matterFirmId) {
    return false;
  }

  // Owner can always manage team
  if (context.userId === context.matterOwnerId) {
    return true;
  }

  return checker.has("matter:manage_team");
}

// ─── Client Access Control ───────────────────────────────────────────────────

export interface ClientAccessContext {
  userId: string;
  userRole: string;
  firmId: string;
  firmRole: string | null;
  clientFirmId: string;
  clientOwnerId?: string;
}

export function canAccessClient(
  context: ClientAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.clientFirmId) {
    return false;
  }

  return checker.has("client:read");
}

export function canEditClient(
  context: ClientAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.clientFirmId) {
    return false;
  }

  return checker.has("client:update");
}

// ─── Time Entry Access Control ───────────────────────────────────────────────

export interface TimeEntryAccessContext {
  userId: string;
  userRole: string;
  firmId: string;
  firmRole: string | null;
  timeEntryUserId: string;
  timeEntryMatterId: string;
  matterFirmId: string;
}

export function canAccessTimeEntry(
  context: TimeEntryAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.matterFirmId) {
    return false;
  }

  // Users can always see their own time entries
  if (context.userId === context.timeEntryUserId) {
    return true;
  }

  return checker.has("time:read_all");
}

export function canCreateTimeEntry(
  context: { firmId: string; matterFirmId: string },
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.matterFirmId) {
    return false;
  }

  return checker.has("time:create");
}

// ─── Invoice Access Control ──────────────────────────────────────────────────

export interface InvoiceAccessContext {
  userId: string;
  userRole: string;
  firmId: string;
  firmRole: string | null;
  invoiceFirmId: string;
  invoiceClientId: string;
}

export function canAccessInvoice(
  context: InvoiceAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.invoiceFirmId) {
    return false;
  }

  return checker.has("invoice:read");
}

export function canApproveInvoice(
  context: InvoiceAccessContext,
  checker: PermissionChecker
): boolean {
  if (context.firmId !== context.invoiceFirmId) {
    return false;
  }

  return checker.has("invoice:approve");
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Create a permission checker for a user
 */
export async function createPermissionChecker(
  userId: string,
  firmId: string | null = null
): Promise<PermissionChecker> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new PermissionError("User not found", "user:read");
  }

  let firmRole: string | null = null;

  if (firmId) {
    const membership = await db.firmMember.findUnique({
      where: {
        userId_firmId: { userId, firmId },
      },
      select: { role: true },
    });

    firmRole = membership?.role ?? null;
  }

  return new PermissionChecker(userId, user.role, firmId, firmRole);
}

/**
 * Get all permissions for a user in a firm
 */
export async function getUserPermissions(
  userId: string,
  firmId: string | null = null
): Promise<Permission[]> {
  const checker = await createPermissionChecker(userId, firmId);
  return checker.getAll();
}

/**
 * Check if a user can perform an action
 */
export async function canPerformAction(
  userId: string,
  firmId: string | null,
  permission: Permission
): Promise<boolean> {
  const checker = await createPermissionChecker(userId, firmId);
  return checker.has(permission);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrator",
    MANAGING_PARTNER: "Managing Partner",
    SENIOR_PARTNER: "Senior Partner",
    JUNIOR_PARTNER: "Junior Partner",
    OF_COUNSEL: "Of Counsel",
    SENIOR_ASSOCIATE: "Senior Associate",
    ASSOCIATE: "Associate",
    PARALEGAL: "Paralegal",
    LEGAL_SECRETARY: "Legal Secretary",
    INTERN: "Intern",
  };

  return displayNames[role] ?? role;
}

/**
 * Get firm role display name
 */
export function getFirmRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    MANAGER: "Manager",
    MEMBER: "Member",
    VIEWER: "Viewer",
  };

  return displayNames[role] ?? role;
}

/**
 * Check if a role can manage other roles
 */
export function canManageRole(
  managerRole: string,
  targetRole: string
): boolean {
  const roleHierarchy: Record<string, number> = {
    SUPER_ADMIN: 10,
    ADMIN: 9,
    MANAGING_PARTNER: 8,
    SENIOR_PARTNER: 7,
    JUNIOR_PARTNER: 6,
    OF_COUNSEL: 5,
    SENIOR_ASSOCIATE: 4,
    ASSOCIATE: 3,
    PARALEGAL: 2,
    LEGAL_SECRETARY: 1,
    INTERN: 0,
  };

  const managerLevel = roleHierarchy[managerRole] ?? -1;
  const targetLevel = roleHierarchy[targetRole] ?? -1;

  return managerLevel > targetLevel;
}

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Get all available permissions grouped by category
 */
export function getPermissionCategories(): Record<string, Permission[]> {
  const categories: Record<string, Permission[]> = {
    "Firm Management": [
      "firm:create", "firm:read", "firm:update", "firm:delete",
      "firm:manage_members", "firm:manage_settings", "firm:manage_billing",
      "firm:view_analytics",
    ],
    "Client Management": [
      "client:create", "client:read", "client:update", "client:delete",
      "client:read_all",
    ],
    "Matter Management": [
      "matter:create", "matter:read", "matter:update", "matter:delete",
      "matter:read_all", "matter:manage_team", "matter:manage_billing",
      "matter:view_financials",
    ],
    "Document Management": [
      "document:create", "document:read", "document:update", "document:delete",
      "document:read_confidential", "document:manage_folders",
    ],
    "Contract Management": [
      "contract:create", "contract:read", "contract:update", "contract:delete",
      "contract:approve", "contract:execute",
    ],
    "Task Management": [
      "task:create", "task:read", "task:update", "task:delete", "task:assign",
    ],
    "Time & Billing": [
      "time:create", "time:read", "time:update", "time:delete", "time:read_all",
      "invoice:create", "invoice:read", "invoice:update", "invoice:delete",
      "invoice:approve", "invoice:send", "invoice:read_all",
    ],
    "Calendar": [
      "calendar:create", "calendar:read", "calendar:update", "calendar:delete",
      "calendar:read_all",
    ],
    "Deadlines": [
      "deadline:create", "deadline:read", "deadline:update", "deadline:delete",
    ],
    "Research": [
      "research:create", "research:read", "research:update", "research:delete",
    ],
    "AI Features": [
      "ai:use", "ai:read_history",
    ],
    "Notifications": [
      "notification:read", "notification:manage",
    ],
    "User Management": [
      "user:read", "user:update", "user:manage_roles",
    ],
    "Reports": [
      "report:view", "report:export",
    ],
    "Settings": [
      "settings:manage",
    ],
  };

  return categories;
}
