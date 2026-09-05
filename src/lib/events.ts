export type EventListener<T = unknown> = (data: T) => void | Promise<void>;

export interface EventOptions {
  once?: boolean;
  priority?: number;
}

interface ListenerEntry<T = unknown> {
  listener: EventListener<T>;
  options: EventOptions;
  id: string;
}

export class TypedEventEmitter<
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  private listeners = new Map<string, ListenerEntry[]>();

  on<K extends keyof TEvents & string>(
    event: K,
    listener: EventListener<TEvents[K]>,
    options?: EventOptions
  ): () => void {
    return this.addListener(event, listener, options);
  }

  once<K extends keyof TEvents & string>(
    event: K,
    listener: EventListener<TEvents[K]>
  ): () => void {
    return this.addListener(event, listener, { once: true });
  }

  off<K extends keyof TEvents & string>(
    event: K,
    listener: EventListener<TEvents[K]>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    const idx = eventListeners.findIndex((e) => e.listener === listener);
    if (idx !== -1) {
      eventListeners.splice(idx, 1);
    }

    if (eventListeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  removeAllListeners(event?: keyof TEvents & string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: keyof TEvents & string): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  async emit<K extends keyof TEvents & string>(
    event: K,
    data: TEvents[K]
  ): Promise<boolean> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) return false;

    const sorted = [...eventListeners].sort(
      (a, b) => (b.options.priority ?? 0) - (a.options.priority ?? 0)
    );

    const toRemove: string[] = [];

    for (const entry of sorted) {
      try {
        await entry.listener(data);
      } catch (error) {
        console.error(`[EventEmitter] Error in listener for "${event}":`, error);
      }

      if (entry.options.once) {
        toRemove.push(entry.id);
      }
    }

    if (toRemove.length > 0) {
      const remaining = eventListeners.filter((e) => !toRemove.includes(e.id));
      if (remaining.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, remaining);
      }
    }

    return true;
  }

  emitSync<K extends keyof TEvents & string>(event: K, data: TEvents[K]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) return false;

    for (const entry of eventListeners) {
      try {
        entry.listener(data);
      } catch (error) {
        console.error(`[EventEmitter] Error in sync listener for "${event}":`, error);
      }

      if (entry.options.once) {
        entry.id = "__removed__";
      }
    }

    const remaining = eventListeners.filter((e) => e.id !== "__removed__");
    if (remaining.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, remaining);
    }

    return true;
  }

  prependListener<K extends keyof TEvents & string>(
    event: K,
    listener: EventListener<TEvents[K]>,
    options?: EventOptions
  ): () => void {
    return this.addListener(event, listener, { ...options, priority: Infinity });
  }

  private addListener<K extends keyof TEvents & string>(
    event: K,
    listener: EventListener<TEvents[K]>,
    options?: EventOptions
  ): () => void {
    const id = crypto.randomUUID();
    const entry: ListenerEntry<TEvents[K]> = { listener, options: options ?? {}, id };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(entry);

    return () => this.off(event, listener);
  }
}

// ─── Application Events ──────────────────────────────────────────────────────

export interface AppEvents {
  "matter:created": { matterId: string; title: string };
  "matter:updated": { matterId: string; changes: string[] };
  "matter:closed": { matterId: string };
  "client:created": { clientId: string; name: string };
  "client:updated": { clientId: string; changes: string[] };
  "document:uploaded": { documentId: string; matterId: string; name: string };
  "document:version-created": { documentId: string; version: number };
  "contract:created": { contractId: string; title: string };
  "contract:signed": { contractId: string };
  "invoice:created": { invoiceId: string; amount: number };
  "invoice:paid": { invoiceId: string; amount: number };
  "time-entry:created": { entryId: string; matterId: string; hours: number };
  "user:login": { userId: string };
  "user:logout": { userId: string };
  "notification:sent": { userId: string; type: string };
  "ai:analysis:completed": { documentId: string; resultType: string };
  "search:performed": { query: string; resultCount: number };
}

export const appEvents = new TypedEventEmitter<AppEvents>();

export default appEvents;
