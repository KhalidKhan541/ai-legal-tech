export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  source?: string;
}

export interface AnalyticsConfig {
  writeKey?: string;
  endpoint?: string;
  flushInterval?: number;
  maxBatchSize?: number;
  enabled?: boolean;
}

export interface IdentifyTraits {
  userId: string;
  email?: string;
  name?: string;
  plan?: string;
  role?: string;
  [key: string]: unknown;
}

export interface PageViewData {
  name: string;
  path: string;
  referrer?: string;
  search?: string;
  properties?: Record<string, unknown>;
}

export interface TrackData {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface RevenueData {
  orderId: string;
  total: number;
  currency: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

// ─── Analytics Provider Abstraction ──────────────────────────────────────────

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void | Promise<void>;
  identify(traits: IdentifyTraits): void | Promise<void>;
  page(data: PageViewData): void | Promise<void>;
  flush(): Promise<void>;
}

// ─── In-Memory Analytics Provider ────────────────────────────────────────────

class InMemoryAnalyticsProvider implements AnalyticsProvider {
  private events: AnalyticsEvent[] = [];
  private maxSize: number;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
  }

  track(event: AnalyticsEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize);
    }
  }

  identify(_traits: IdentifyTraits): void {}
  page(_data: PageViewData): void {}

  async flush(): Promise<void> {
    this.events = [];
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

// ─── Analytics Client ────────────────────────────────────────────────────────

class AnalyticsClient {
  private provider: AnalyticsProvider;
  private config: AnalyticsConfig;
  private buffer: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      flushInterval: config.flushInterval ?? 30_000,
      maxBatchSize: config.maxBatchSize ?? 20,
      enabled: config.enabled ?? true,
    };
    this.provider = new InMemoryAnalyticsProvider();
    this.sessionId = this.generateSessionId();
  }

  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  track(
    event: string,
    properties?: Record<string, string | number | boolean>,
    userId?: string
  ): void {
    if (!this.config.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties,
      timestamp: Date.now(),
      userId,
      sessionId: this.sessionId,
    };

    this.buffer.push(analyticsEvent);

    if (this.buffer.length >= (this.config.maxBatchSize ?? 20)) {
      this.flushBuffer();
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    this.provider.identify({
      userId,
      ...traits,
    });
  }

  page(data: PageViewData): void {
    if (!this.config.enabled) return;

    this.provider.page(data);
  }

  trackMatterCreated(matterId: string, title: string, userId: string): void {
    this.track("matter_created", { matterId, title }, userId);
  }

  trackMatterUpdated(matterId: string, changes: string[], userId: string): void {
    this.track("matter_updated", { matterId, changes: changes.join(",") }, userId);
  }

  trackDocumentUploaded(documentId: string, matterId: string, fileName: string, userId: string): void {
    this.track("document_uploaded", { documentId, matterId, fileName }, userId);
  }

  trackContractReviewed(contractId: string, aiScore: number, userId: string): void {
    this.track("contract_reviewed", { contractId, aiScore }, userId);
  }

  trackInvoiceCreated(invoiceId: string, amount: number, userId: string): void {
    this.track("invoice_created", { invoiceId, amount }, userId);
  }

  trackTimeEntryCreated(entryId: string, matterId: string, hours: number, userId: string): void {
    this.track("time_entry_created", { entryId, matterId, hours }, userId);
  }

  trackSearch(query: string, resultCount: number, userId?: string): void {
    this.track("search_performed", { query, resultCount }, userId);
  }

  trackRevenue(data: RevenueData, userId?: string): void {
    this.track("revenue", {
      orderId: data.orderId,
      total: data.total,
      currency: data.currency,
      productCount: data.products?.length ?? 0,
    }, userId);
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track("error", {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      ...context,
    });
  }

  async flush(): Promise<void> {
    await this.flushBuffer();
    await this.provider.flush();
  }

  startAutoFlush(): void {
    this.stopAutoFlush();
    this.flushTimer = setInterval(() => this.flushBuffer(), this.config.flushInterval);
  }

  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  getBufferedEvents(): AnalyticsEvent[] {
    return [...this.buffer];
  }

  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    for (const event of events) {
      try {
        await this.provider.track(event);
      } catch (error) {
        console.error("[Analytics] Failed to track event:", error);
      }
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let analyticsInstance: AnalyticsClient | null = null;

export function getAnalytics(config?: AnalyticsConfig): AnalyticsClient {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsClient(config);
  }
  return analyticsInstance;
}

export function configureAnalytics(config: AnalyticsConfig): AnalyticsClient {
  analyticsInstance = new AnalyticsClient(config);
  return analyticsInstance;
}

// ─── React Hook Helper ───────────────────────────────────────────────────────

export function createAnalyticsHook(analytics: AnalyticsClient) {
  return function useAnalytics() {
    return {
      track: (event: string, properties?: Record<string, string | number | boolean>, userId?: string) =>
        analytics.track(event, properties, userId),
      identify: (userId: string, traits?: Record<string, unknown>) =>
        analytics.identify(userId, traits),
      page: (data: PageViewData) => analytics.page(data),
    };
  };
}
