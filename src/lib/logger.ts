import { config as appConfig } from "@/lib/config";

// ─── Log Levels ──────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ─── Logger Interface ────────────────────────────────────────────────────────

export interface LogContext {
  requestId?: string;
  userId?: string;
  firmId?: string;
  matterId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  service: string;
  environment: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

// ─── Logger Configuration ────────────────────────────────────────────────────

interface LoggerConfig {
  level: LogLevel;
  format: "json" | "pretty";
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: string;
  maxFiles?: number;
  serviceName: string;
  environment: string;
}

const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || "info",
  format: process.env.NODE_ENV === "production" ? "json" : "pretty",
  enableConsole: true,
  enableFile: process.env.NODE_ENV === "production",
  filePath: process.env.LOG_FILE_PATH || "logs/app.log",
  maxFileSize: "10m",
  maxFiles: 5,
  serviceName: "ai-legal-tech",
  environment: process.env.NODE_ENV || "development",
};

// ─── Logger Class ────────────────────────────────────────────────────────────

class Logger {
  private config: LoggerConfig;
  private minLevel: number;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.minLevel = LOG_LEVELS[this.config.level];
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childConfig = {
      ...this.config,
      context: { ...((this.config as any).context || {}), ...context },
    };
    return new Logger(childConfig);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext & { error?: Error | unknown }): void {
    const errorContext = context?.error
      ? {
          ...context,
          error: this.formatError(context.error),
        }
      : context;

    this.log("error", message, errorContext);
  }

  /**
   * Log a fatal message
   */
  fatal(message: string, context?: LogContext & { error?: Error | unknown }): void {
    const errorContext = context?.error
      ? {
          ...context,
          error: this.formatError(context.error),
        }
      : context;

    this.log("fatal", message, errorContext);
  }

  /**
   * Log an HTTP request
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    this.log(level, `${method} ${path} ${statusCode}`, {
      ...context,
      method,
      path,
      statusCode,
      duration,
      type: "http",
    });
  }

  /**
   * Log a database query
   */
  query(
    operation: string,
    model: string,
    duration: number,
    context?: LogContext
  ): void {
    this.debug(`DB ${operation} on ${model}`, {
      ...context,
      operation,
      model,
      duration,
      type: "database",
    });
  }

  /**
   * Log an authentication event
   */
  auth(
    event: "login" | "logout" | "signup" | "password_reset" | "token_refresh",
    userId?: string,
    context?: LogContext
  ): void {
    this.info(`Auth: ${event}`, {
      ...context,
      userId,
      event,
      type: "auth",
    });
  }

  /**
   * Log an AI operation
   */
  ai(
    operation: string,
    model: string,
    tokensUsed: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`AI: ${operation}`, {
      ...context,
      operation,
      model,
      tokensUsed,
      duration,
      type: "ai",
    });
  }

  /**
   * Log a business event
   */
  business(
    event: string,
    entity: string,
    entityId: string,
    action: string,
    context?: LogContext
  ): void {
    this.info(`Business: ${event}`, {
      ...context,
      entity,
      entityId,
      action,
      type: "business",
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (LOG_LEVELS[level] < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment,
    };

    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    if (this.config.enableFile) {
      this.outputToFile(entry);
    }
  }

  /**
   * Format error for logging
   */
  private formatError(error: unknown): LogEntry["error"] {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return {
      name: "UnknownError",
      message: String(error),
    };
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    if (this.config.format === "json") {
      console.log(JSON.stringify(entry));
      return;
    }

    // Pretty format for development
    const timestamp = entry.timestamp.substring(11, 23);
    const level = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : "";

    const color = this.getLevelColor(entry.level);
    const reset = "\x1b[0m";

    console.log(`${color}[${timestamp}] ${level}${reset} ${entry.message}${contextStr}`);
  }

  /**
   * Output log entry to file
   */
  private outputToFile(entry: LogEntry): void {
    // In production, this would use a file transport like winston
    // For now, we'll just output to console as JSON
    if (this.config.format !== "json") {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Get color for log level
   */
  private getLevelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m",  // Green
      warn: "\x1b[33m",  // Yellow
      error: "\x1b[31m", // Red
      fatal: "\x1b[35m", // Magenta
    };
    return colors[level] || "\x1b[0m";
  }
}

// ─── Create Logger Instance ──────────────────────────────────────────────────

export const logger = new Logger({
  level: process.env.LOG_LEVEL as LogLevel || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: process.env.NODE_ENV === "production" ? "json" : "pretty",
  enableConsole: true,
  enableFile: process.env.NODE_ENV === "production",
  serviceName: "ai-legal-tech",
  environment: process.env.NODE_ENV || "development",
});

// ─── Request Logger Middleware ────────────────────────────────────────────────

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// ─── Performance Logger ──────────────────────────────────────────────────────

export class PerformanceLogger {
  private start: number;
  private operation: string;
  private context: LogContext;

  constructor(operation: string, context: LogContext = {}) {
    this.start = performance.now();
    this.operation = operation;
    this.context = context;
  }

  end(additionalContext?: LogContext): number {
    const duration = Math.round(performance.now() - this.start);

    logger.info(`Performance: ${this.operation}`, {
      ...this.context,
      ...additionalContext,
      duration,
      type: "performance",
    });

    return duration;
  }
}

// ─── Audit Logger ────────────────────────────────────────────────────────────

export class AuditLogger {
  private userId: string;
  private firmId: string | null;
  private ipAddress: string | null;
  private userAgent: string | null;

  constructor(
    userId: string,
    firmId: string | null,
    ipAddress: string | null = null,
    userAgent: string | null = null
  ) {
    this.userId = userId;
    this.firmId = firmId;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }

  log(
    action: string,
    entity: string,
    entityId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ): void {
    logger.business(action, entity, entityId, action, {
      userId: this.userId,
      firmId: this.firmId ?? undefined,
      ipAddress: this.ipAddress ?? undefined,
      userAgent: this.userAgent ?? undefined,
      oldValues,
      newValues,
      type: "audit",
    });
  }

  logCreate(entity: string, entityId: string, newValues: Record<string, unknown>): void {
    this.log("create", entity, entityId, undefined, newValues);
  }

  logUpdate(
    entity: string,
    entityId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ): void {
    this.log("update", entity, entityId, oldValues, newValues);
  }

  logDelete(entity: string, entityId: string, oldValues: Record<string, unknown>): void {
    this.log("delete", entity, entityId, oldValues);
  }

  logAccess(entity: string, entityId: string): void {
    this.log("access", entity, entityId);
  }
}

// ─── Structured Logger for Specific Domains ──────────────────────────────────

export const authLogger = logger.child({ domain: "auth" });
export const dbLogger = logger.child({ domain: "database" });
export const aiLogger = logger.child({ domain: "ai" });
export const billingLogger = logger.child({ domain: "billing" });
export const documentLogger = logger.child({ domain: "document" });
export const notificationLogger = logger.child({ domain: "notification" });

// ─── Export Logger Instance ──────────────────────────────────────────────────

export default logger;
