export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheOptions {
  ttl?: number;
  maxEntries?: number;
  onEviction?: (key: string, value: unknown) => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

type CacheEntryWithMetadata<T> = CacheEntry<T> & { accessCount: number; lastAccessed: number };

export class MemoryCache {
  private store = new Map<string, CacheEntryWithMetadata<unknown>>();
  private options: Required<CacheOptions>;
  private stats = { hits: 0, misses: 0 };

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 300_000,
      maxEntries: options.maxEntries ?? 1000,
      onEviction: options.onEviction ?? (() => {}),
    };
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntryWithMetadata<T> | undefined;
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.options.onEviction(key, entry.value);
      this.store.delete(key);
      this.stats.misses++;
      return undefined;
    }
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    return entry.value;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (this.store.size >= this.options.maxEntries) {
      this.evictLRU();
    }
    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + (ttl ?? this.options.ttl),
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (entry) {
      this.options.onEviction(key, entry.value);
    }
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  getMany<T>(keys: string[]): (T | undefined)[] {
    return keys.map((key) => this.get<T>(key));
  }

  setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttl);
    }
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    return this.store.size;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.store.size,
      hitRate: total === 0 ? 0 : this.stats.hits / total,
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.store.get(oldestKey);
      if (entry) {
        this.options.onEviction(oldestKey, entry.value);
      }
      this.store.delete(oldestKey);
    }
  }
}

// ─── Cache-Aside Pattern ─────────────────────────────────────────────────────

export class CacheAside<T = unknown> {
  private cache: MemoryCache;
  private fetcher: (key: string) => Promise<T>;

  constructor(fetcher: (key: string) => Promise<T>, options: CacheOptions = {}) {
    this.cache = new MemoryCache(options);
    this.fetcher = fetcher;
  }

  async get(key: string, ttl?: number): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await this.fetcher(key);
    this.cache.set(key, value, ttl);
    return value;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

// ─── Singleton Cache Instance ────────────────────────────────────────────────

let globalCache: MemoryCache | null = null;

export function getGlobalCache(options?: CacheOptions): MemoryCache {
  if (!globalCache) {
    globalCache = new MemoryCache(options);
  }
  return globalCache;
}

// ─── Cache Key Builders ──────────────────────────────────────────────────────

export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  matter: (id: string) => `matter:${id}`,
  client: (id: string) => `client:${id}`,
  document: (id: string) => `document:${id}`,
  contract: (id: string) => `contract:${id}`,
  invoice: (id: string) => `invoice:${id}`,
  timeEntry: (matterId: string) => `timeEntries:${matterId}`,
  matterList: (userId: string, page: number) => `matters:${userId}:${page}`,
  clientList: (userId: string, page: number) => `clients:${userId}:${page}`,
  documentList: (matterId: string, page: number) => `documents:${matterId}:${page}`,
  searchResults: (query: string) => `search:${query}`,
  dashboardStats: (userId: string) => `dashboard:${userId}`,
  recentActivity: (userId: string) => `activity:${userId}`,
};
