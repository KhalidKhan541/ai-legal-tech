export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  meta: ApiMeta;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error: ApiError;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  user: ApiUser;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  firmName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  firmId?: string;
  firmName?: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  locale: string;
  theme: "light" | "dark" | "system";
  notifications: NotificationPreferences;
  billing: BillingPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  deadlineReminders: boolean;
  invoiceReminders: boolean;
  taskAssignments: boolean;
}

export interface BillingPreferences {
  defaultRate: number;
  currency: string;
  autoIncrementInvoiceNumber: boolean;
}

// ─── Upload Types ────────────────────────────────────────────────────────────

export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  key: string;
  size: number;
  contentType: string;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  activeMatters: number;
  pendingTasks: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  unbilledHours: number;
  totalRevenue: number;
  revenueThisMonth: number;
  clientCount: number;
  documentCount: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardChartData {
  label: string;
  value: number;
  color?: string;
}

// ─── Search Types ────────────────────────────────────────────────────────────

export interface GlobalSearchResult {
  type: "matter" | "client" | "document" | "contract" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  score: number;
}

export interface GlobalSearchResponse {
  results: GlobalSearchResult[];
  total: number;
  query: string;
  took: number;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export type NotificationType =
  | "deadline"
  | "task"
  | "invoice"
  | "document"
  | "comment"
  | "system"
  | "mention";

// ─── Export Types ────────────────────────────────────────────────────────────

export interface ExportRequest {
  format: "csv" | "pdf" | "xlsx";
  entity: "matters" | "clients" | "documents" | "invoices" | "time_entries";
  filters?: Record<string, unknown>;
  columns?: string[];
}

export interface ExportResponse {
  downloadUrl: string;
  expiresAt: Date;
  fileSize: number;
}
