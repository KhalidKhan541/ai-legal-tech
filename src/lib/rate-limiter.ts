export interface RateLimiterConfig {
  capacity: number;
  refillRate: number;
  refillInterval?: number;
}

export interface RateLimiterResult {
  allowed: boolean;
  tokens: number;
  retryAfter?: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class TokenBucketRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private config: Required<RateLimiterConfig>;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimiterConfig) {
    this.config = {
      capacity: config.capacity,
      refillRate: config.refillRate,
      refillInterval: config.refillInterval ?? 1000,
    };
  }

  consume(key: string, tokens = 1): RateLimiterResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.config.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    this.refill(bucket, now);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return { allowed: true, tokens: bucket.tokens };
    }

    const timeToRefill = Math.ceil(
      ((tokens - bucket.tokens) / this.config.refillRate) * this.config.refillInterval
    );

    return {
      allowed: false,
      tokens: bucket.tokens,
      retryAfter: timeToRefill,
    };
  }

  peek(key: string): RateLimiterResult {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      return { allowed: true, tokens: this.config.capacity };
    }

    const now = Date.now();
    this.refill(bucket, now);

    return {
      allowed: bucket.tokens >= 1,
      tokens: bucket.tokens,
    };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  resetAll(): void {
    this.buckets.clear();
  }

  getRemainingTokens(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return this.config.capacity;

    const now = Date.now();
    this.refill(bucket, now);
    return bucket.tokens;
  }

  private refill(bucket: TokenBucket, now: number): void {
    const elapsed = now - bucket.lastRefill;
    const refillCount = (elapsed / this.config.refillInterval) * this.config.refillRate;

    if (refillCount > 0) {
      bucket.tokens = Math.min(this.config.capacity, bucket.tokens + refillCount);
      bucket.lastRefill = now;
    }
  }

  startCleanup(intervalMs = 60_000): void {
    this.stopCleanup();
    this.cleanupIntervalId = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets) {
        this.refill(bucket, now);
        if (bucket.tokens >= this.config.capacity) {
          this.buckets.delete(key);
        }
      }
    }, intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  getStats(): {
    totalBuckets: number;
    activeBuckets: number;
    config: Required<RateLimiterConfig>;
  } {
    const now = Date.now();
    let activeBuckets = 0;

    for (const bucket of this.buckets.values()) {
      this.refill(bucket, now);
      if (bucket.tokens < this.config.capacity) {
        activeBuckets++;
      }
    }

    return {
      totalBuckets: this.buckets.size,
      activeBuckets,
      config: this.config,
    };
  }
}

// ─── Pre-configured Limiters ─────────────────────────────────────────────────

export const apiLimiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 10,
  refillInterval: 1000,
});

export const authLimiter = new TokenBucketRateLimiter({
  capacity: 5,
  refillRate: 1,
  refillInterval: 60_000,
});

export const uploadLimiter = new TokenBucketRateLimiter({
  capacity: 10,
  refillRate: 1,
  refillInterval: 60_000,
});

export const searchLimiter = new TokenBucketRateLimiter({
  capacity: 30,
  refillRate: 5,
  refillInterval: 1000,
});

// ─── Middleware Helper ────────────────────────────────────────────────────────

export function createRateLimitMiddleware(
  limiter: TokenBucketRateLimiter,
  keyExtractor?: (request: { headers?: Record<string, string>; ip?: string }) => string
) {
  return (request: { headers?: Record<string, string>; ip?: string }): RateLimiterResult => {
    const key = keyExtractor
      ? keyExtractor(request)
      : request.headers?.["x-forwarded-for"] ||
        request.headers?.["x-real-ip"] ||
        request.ip ||
        "anonymous";

    return limiter.consume(key);
  };
}
