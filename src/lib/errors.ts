// ─── Base Error Classes ──────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
    };
  }
}

// ─── Authentication Errors ───────────────────────────────────────────────────

export class AuthenticationError extends AppError {
  constructor(
    message: string = "Authentication required",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 401, "AUTHENTICATION_ERROR", true, details, requestId);
    this.name = "AuthenticationError";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(
    message: string = "Invalid email or password",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 401, "INVALID_CREDENTIALS", true, details, requestId);
    this.name = "InvalidCredentialsError";
  }
}

export class AccountLockedError extends AppError {
  constructor(
    message: string = "Account has been locked due to too many failed attempts",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 423, "ACCOUNT_LOCKED", true, details, requestId);
    this.name = "AccountLockedError";
  }
}

export class AccountSuspendedError extends AppError {
  constructor(
    message: string = "Account has been suspended",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 403, "ACCOUNT_SUSPENDED", true, details, requestId);
    this.name = "AccountSuspendedError";
  }
}

export class TokenExpiredError extends AppError {
  constructor(
    message: string = "Token has expired",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 401, "TOKEN_EXPIRED", true, details, requestId);
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AppError {
  constructor(
    message: string = "Invalid token",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 401, "INVALID_TOKEN", true, details, requestId);
    this.name = "InvalidTokenError";
  }
}

// ─── Authorization Errors ────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  constructor(
    message: string = "You don't have permission to perform this action",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 403, "FORBIDDEN", true, details, requestId);
    this.name = "ForbiddenError";
  }
}

export class InsufficientRoleError extends AppError {
  constructor(
    requiredRole: string,
    currentRole: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      `Insufficient permissions. Required: ${requiredRole}, Current: ${currentRole}`,
      403,
      "INSUFFICIENT_ROLE",
      true,
      { requiredRole, currentRole, ...details },
      requestId
    );
    this.name = "InsufficientRoleError";
  }
}

// ─── Validation Errors ───────────────────────────────────────────────────────

export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    fields: Record<string, string[]> = {},
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 400, "VALIDATION_ERROR", true, { fields, ...details }, requestId);
    this.name = "ValidationError";
    this.fields = fields;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields,
    };
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(
    fieldErrors: Array<{ path: string; message: string }>,
    requestId?: string
  ) {
    const fields: Record<string, string[]> = {};
    for (const error of fieldErrors) {
      const path = error.path || "root";
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(error.message);
    }

    super("Schema validation failed", fields, undefined, requestId);
    this.name = "SchemaValidationError";
  }
}

// ─── Not Found Errors ────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier?: string | number,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(message, 404, "NOT_FOUND", true, { resource, identifier, ...details }, requestId);
    this.name = "NotFoundError";
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("User", identifier, details, requestId);
    this.name = "UserNotFoundError";
  }
}

export class FirmNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Law Firm", identifier, details, requestId);
    this.name = "FirmNotFoundError";
  }
}

export class MatterNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Matter", identifier, details, requestId);
    this.name = "MatterNotFoundError";
  }
}

export class ClientNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Client", identifier, details, requestId);
    this.name = "ClientNotFoundError";
  }
}

export class DocumentNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Document", identifier, details, requestId);
    this.name = "DocumentNotFoundError";
  }
}

export class ContractNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Contract", identifier, details, requestId);
    this.name = "ContractNotFoundError";
  }
}

export class TaskNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Task", identifier, details, requestId);
    this.name = "TaskNotFoundError";
  }
}

export class InvoiceNotFoundError extends NotFoundError {
  constructor(
    identifier?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Invoice", identifier, details, requestId);
    this.name = "InvoiceNotFoundError";
  }
}

// ─── Conflict Errors ─────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource already exists",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 409, "CONFLICT", true, details, requestId);
    this.name = "ConflictError";
  }
}

export class DuplicateEmailError extends ConflictError {
  constructor(
    email: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      `An account with email '${email}' already exists`,
      { email, ...details },
      requestId
    );
    this.name = "DuplicateEmailError";
  }
}

export class DuplicateSlugError extends ConflictError {
  constructor(
    slug: string,
    resource: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      `${resource} with slug '${slug}' already exists`,
      { slug, resource, ...details },
      requestId
    );
    this.name = "DuplicateSlugError";
  }
}

// ─── Business Logic Errors ───────────────────────────────────────────────────

export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: string = "BUSINESS_LOGIC_ERROR",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 422, code, true, details, requestId);
    this.name = "BusinessLogicError";
  }
}

export class MatterAlreadyClosedError extends BusinessLogicError {
  constructor(
    matterId: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      "Cannot modify a closed matter",
      "MATTER_ALREADY_CLOSED",
      { matterId, ...details },
      requestId
    );
    this.name = "MatterAlreadyClosedError";
  }
}

export class InvoiceAlreadyPaidError extends BusinessLogicError {
  constructor(
    invoiceId: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      "Invoice has already been fully paid",
      "INVOICE_ALREADY_PAID",
      { invoiceId, ...details },
      requestId
    );
    this.name = "InvoiceAlreadyPaidError";
  }
}

export class ContractAlreadyExecutedError extends BusinessLogicError {
  constructor(
    contractId: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      "Cannot modify an executed contract",
      "CONTRACT_ALREADY_EXECUTED",
      { contractId, ...details },
      requestId
    );
    this.name = "ContractAlreadyExecutedError";
  }
}

export class InsufficientFundsError extends BusinessLogicError {
  constructor(
    required: number,
    available: number,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      `Insufficient funds. Required: $${required.toFixed(2)}, Available: $${available.toFixed(2)}`,
      "INSUFFICIENT_FUNDS",
      { required, available, ...details },
      requestId
    );
    this.name = "InsufficientFundsError";
  }
}

export class DeadlinePassedError extends BusinessLogicError {
  constructor(
    deadline: Date,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      `Deadline has already passed: ${deadline.toISOString()}`,
      "DEADLINE_PASSED",
      { deadline: deadline.toISOString(), ...details },
      requestId
    );
    this.name = "DeadlinePassedError";
  }
}

// ─── Rate Limiting Errors ────────────────────────────────────────────────────

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(
    message: string = "Rate limit exceeded",
    retryAfter: number = 60,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true, { retryAfter, ...details }, requestId);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ─── External Service Errors ─────────────────────────────────────────────────

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string = "External service error",
    statusCode: number = 502,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, statusCode, "EXTERNAL_SERVICE_ERROR", true, { service, ...details }, requestId);
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

export class AIServiceError extends ExternalServiceError {
  constructor(
    message: string = "AI service error",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("AI", message, 502, details, requestId);
    this.name = "AIServiceError";
  }
}

export class StorageServiceError extends ExternalServiceError {
  constructor(
    message: string = "Storage service error",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Storage", message, 502, details, requestId);
    this.name = "StorageServiceError";
  }
}

export class EmailServiceError extends ExternalServiceError {
  constructor(
    message: string = "Email service error",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Email", message, 502, details, requestId);
    this.name = "EmailServiceError";
  }
}

// ─── File Errors ─────────────────────────────────────────────────────────────

export class FileError extends AppError {
  constructor(
    message: string,
    code: string = "FILE_ERROR",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 400, code, true, details, requestId);
    this.name = "FileError";
  }
}

export class FileTooLargeError extends FileError {
  constructor(
    maxSize: number,
    actualSize: number,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      `File size ${actualSize} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      "FILE_TOO_LARGE",
      { maxSize, actualSize, ...details },
      requestId
    );
    this.name = "FileTooLargeError";
  }
}

export class InvalidFileTypeError extends FileError {
  constructor(
    allowedTypes: string[],
    actualType: string,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(
      `File type '${actualType}' is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      "INVALID_FILE_TYPE",
      { allowedTypes, actualType, ...details },
      requestId
    );
    this.name = "InvalidFileTypeError";
  }
}

// ─── Database Errors ─────────────────────────────────────────────────────────

export class DatabaseError extends AppError {
  constructor(
    message: string = "Database error occurred",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, 500, "DATABASE_ERROR", false, details, requestId);
    this.name = "DatabaseError";
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super("Failed to connect to database", details, requestId);
    this.name = "DatabaseConnectionError";
  }
}

export class TransactionError extends DatabaseError {
  constructor(
    message: string = "Transaction failed",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, details, requestId);
    this.name = "TransactionError";
  }
}

// ─── API Errors ──────────────────────────────────────────────────────────────

export class APIError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "API_ERROR",
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message, statusCode, code, true, details, requestId);
    this.name = "APIError";
  }
}

export class MethodNotAllowedError extends APIError {
  constructor(
    method: string,
    path: string,
    requestId?: string
  ) {
    super(
      `Method ${method} not allowed for ${path}`,
      405,
      "METHOD_NOT_ALLOWED",
      { method, path },
      requestId
    );
    this.name = "MethodNotAllowedError";
  }
}

export class PayloadTooLargeError extends APIError {
  constructor(
    maxSize: number,
    requestId?: string
  ) {
    super(
      `Request payload exceeds maximum size of ${maxSize} bytes`,
      413,
      "PAYLOAD_TOO_LARGE",
      { maxSize },
      requestId
    );
    this.name = "PayloadTooLargeError";
  }
}

// ─── Error Response Helper ───────────────────────────────────────────────────

export interface ErrorResponse {
  success: false;
  error: {
    name: string;
    message: string;
    statusCode: number;
    code: string;
    details?: Record<string, unknown>;
    fields?: Record<string, string[]>;
    timestamp: string;
    requestId?: string;
  };
}

export function formatErrorResponse(
  error: Error,
  requestId?: string
): ErrorResponse {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp,
        requestId: error.requestId ?? requestId,
      },
    };

    if (error instanceof ValidationError && error.fields) {
      response.error.fields = error.fields;
    }

    return response;
  }

  // Unknown error
  return {
    success: false,
    error: {
      name: "InternalServerError",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message,
      statusCode: 500,
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

// ─── Error Handler Middleware ────────────────────────────────────────────────

export function handleError(
  error: Error,
  requestId?: string
): { status: number; body: ErrorResponse } {
  const response = formatErrorResponse(error, requestId);

  return {
    status: response.error.statusCode,
    body: response,
  };
}

// ─── Error Type Guards ───────────────────────────────────────────────────────

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

// ─── Error Constants ─────────────────────────────────────────────────────────

export const ERROR_CODES = {
  // Authentication
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",

  // Authorization
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_ROLE: "INSUFFICIENT_ROLE",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SCHEMA_VALIDATION_ERROR: "SCHEMA_VALIDATION_ERROR",

  // Not Found
  NOT_FOUND: "NOT_FOUND",

  // Conflict
  CONFLICT: "CONFLICT",
  DUPLICATE_EMAIL: "DUPLICATE_EMAIL",
  DUPLICATE_SLUG: "DUPLICATE_SLUG",

  // Business Logic
  BUSINESS_LOGIC_ERROR: "BUSINESS_LOGIC_ERROR",
  MATTER_ALREADY_CLOSED: "MATTER_ALREADY_CLOSED",
  INVOICE_ALREADY_PAID: "INVOICE_ALREADY_PAID",
  CONTRACT_ALREADY_EXECUTED: "CONTRACT_ALREADY_EXECUTED",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  DEADLINE_PASSED: "DEADLINE_PASSED",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // External Services
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  STORAGE_SERVICE_ERROR: "STORAGE_SERVICE_ERROR",
  EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR",

  // Files
  FILE_ERROR: "FILE_ERROR",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",

  // Database
  DATABASE_ERROR: "DATABASE_ERROR",
  DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR",
  TRANSACTION_ERROR: "TRANSACTION_ERROR",

  // API
  API_ERROR: "API_ERROR",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",

  // Internal
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
