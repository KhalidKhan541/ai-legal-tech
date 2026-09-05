interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: Date;
  endTime?: Date;
  status: 'OK' | 'ERROR';
  attributes?: Record<string, string | number>;
}

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
  traceId?: string;
}

class MonitoringService {
  private metrics: Metric[] = [];
  private spans: TraceSpan[] = [];
  private logs: LogEntry[] = [];
  private readonly maxLogEntries = 10000;
  private readonly maxMetrics = 50000;

  incrementCounter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value,
      labels,
      timestamp: new Date(),
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }

  setGauge(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  startSpan(
    operation: string,
    parentSpanId?: string,
    attributes?: Record<string, string | number>
  ): TraceSpan {
    const span: TraceSpan = {
      traceId: this.generateId(),
      spanId: this.generateId(),
      parentSpanId,
      operation,
      startTime: new Date(),
      status: 'OK',
      attributes,
    };

    this.spans.push(span);
    return span;
  }

  endSpan(
    spanId: string,
    status: 'OK' | 'ERROR' = 'OK'
  ): void {
    const span = this.spans.find((s) => s.spanId === spanId);
    if (span) {
      span.endTime = new Date();
      span.status = status;
    }
  }

  log(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
    traceId?: string
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      traceId,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries / 2);
    }

    if (level === 'error') {
      console.error(`[ERROR] ${message}`, context, error);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  trackRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ): void {
    this.incrementCounter('http_requests_total', 1, {
      method,
      path,
      status: String(statusCode),
    });

    this.recordHistogram('http_request_duration_ms', duration, {
      method,
      path,
    });
  }

  trackAIOperation(
    operation: string,
    model: string,
    duration: number,
    tokens: number,
    success: boolean
  ): void {
    this.incrementCounter('ai_operations_total', 1, {
      operation,
      model,
      success: String(success),
    });

    this.recordHistogram('ai_operation_duration_ms', duration, {
      operation,
      model,
    });

    this.recordHistogram('ai_tokens_used', tokens, {
      operation,
      model,
    });
  }

  trackDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean
  ): void {
    this.incrementCounter('db_queries_total', 1, {
      operation,
      table,
      success: String(success),
    });

    this.recordHistogram('db_query_duration_ms', duration, {
      operation,
      table,
    });
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getSpans(): TraceSpan[] {
    return [...this.spans];
  }

  getLogs(
    level?: LogEntry['level'],
    limit: number = 100
  ): LogEntry[] {
    let filtered = [...this.logs];

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    return filtered.slice(-limit);
  }

  getHealthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    metricsCount: number;
    logsCount: number;
    errorsCount: number;
  } {
    const recentErrors = this.logs.filter(
      (log) =>
        log.level === 'error' &&
        Date.now() - log.timestamp.getTime() < 5 * 60 * 1000
    );

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (recentErrors.length > 50) {
      status = 'unhealthy';
    } else if (recentErrors.length > 10) {
      status = 'degraded';
    }

    return {
      status,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      metricsCount: this.metrics.length,
      logsCount: this.logs.length,
      errorsCount: recentErrors.length,
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  reset(): void {
    this.metrics = [];
    this.spans = [];
    this.logs = [];
  }
}

export const monitoring = new MonitoringService();
export type { Metric, TraceSpan, LogEntry };
