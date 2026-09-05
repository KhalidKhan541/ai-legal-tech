"use client";

import * as React from "react";

interface QueryCacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  staleTime: number;
}

interface QueryOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isStale: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

// ─── In-Memory Query Cache ───────────────────────────────────────────────────

class QueryCache {
  private cache = new Map<string, QueryCacheEntry>();
  private subscribers = new Map<string, Set<() => void>>();

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as QueryCacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > entry.staleTime) {
      return undefined;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, staleTime: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime,
    });
    this.notify(key);
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.notify(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        this.notify(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  private notify(key: string): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      for (const sub of subs) {
        sub();
      }
    }
  }
}

const queryCache = new QueryCache();

// ─── useQuery Hook ───────────────────────────────────────────────────────────

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: QueryOptions<T>
): QueryResult<T> {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    refetchOnWindowFocus = true,
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options ?? {};

  const [data, setData] = React.useState<T | undefined>(() => {
    const cached = queryCache.get<T>(key);
    return cached !== undefined ? cached : undefined;
  });

  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(
    enabled && !queryCache.get(key)
  );
  const [isFetching, setIsFetching] = React.useState(false);
  const fetcherRef = React.useRef(fetcher);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    setIsFetching(true);
    let retries = typeof retry === "boolean" ? (retry ? 3 : 0) : retry;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const result = await fetcherRef.current();
        if (mountedRef.current) {
          setData(result);
          setError(null);
          setIsLoading(false);
          setIsFetching(false);
          queryCache.set(key, result, staleTime);
          onSuccess?.(result);
        }
        return;
      } catch (err) {
        attempt++;
        if (attempt > retries || !mountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err));
          if (mountedRef.current) {
            setError(error);
            setIsLoading(false);
            setIsFetching(false);
            onError?.(error);
          }
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }, [key, enabled, staleTime, retry, retryDelay, onSuccess, onError]);

  React.useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const cached = queryCache.get<T>(key);
    if (cached !== undefined) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [key, enabled, fetchData]);

  React.useEffect(() => {
    if (!enabled || !refetchOnWindowFocus || typeof window === "undefined") return;

    const handler = () => {
      if (document.visibilityState === "visible") {
        const cached = queryCache.get<T>(key);
        if (!cached) {
          fetchData();
        }
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [key, enabled, refetchOnWindowFocus, fetchData]);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== undefined && error === null,
    isStale: !queryCache.get(key),
    isFetching,
    refetch,
  };
}

// ─── useMutation Hook ────────────────────────────────────────────────────────

interface MutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | undefined, error: Error | null, variables: V) => void;
  invalidateKeys?: string[];
  retry?: number;
}

interface MutationResult<T, V> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  mutate: (variables: V) => void;
  mutateAsync: (variables: V) => Promise<T>;
  reset: () => void;
}

export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options?: MutationOptions<T, V>
): MutationResult<T, V> {
  const { onSuccess, onError, onSettled, invalidateKeys, retry = 0 } = options ?? {};

  const [data, setData] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutateAsync = React.useCallback(
    async (variables: V): Promise<T> => {
      setIsLoading(true);
      setError(null);

      let attempt = 0;
      let lastError: Error | null = null;

      while (attempt <= retry) {
        try {
          const result = await mutationFn(variables);
          if (mountedRef.current) {
            setData(result);
            setIsLoading(false);
            onSuccess?.(result, variables);
            onSettled?.(result, null, variables);

            if (invalidateKeys) {
              for (const key of invalidateKeys) {
                queryCache.invalidatePrefix(key);
              }
            }
          }
          return result;
        } catch (err) {
          attempt++;
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt > retry) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      const finalError = lastError!;
      if (mountedRef.current) {
        setError(finalError);
        setIsLoading(false);
        onError?.(finalError, variables);
        onSettled?.(undefined, finalError, variables);
      }
      throw finalError;
    },
    [mutationFn, retry, onSuccess, onError, onSettled, invalidateKeys]
  );

  const mutate = React.useCallback(
    (variables: V) => {
      mutateAsync(variables).catch(() => {});
    },
    [mutateAsync]
  );

  const reset = React.useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== undefined,
    mutate,
    mutateAsync,
    reset,
  };
}

// ─── Query Client Provider ───────────────────────────────────────────────────

const QueryClientContext = React.createContext<typeof queryCache | undefined>(
  undefined
);

export function QueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    return () => {
      queryCache.clear();
    };
  }, []);

  return (
    <QueryClientContext.Provider value={queryCache}>
      {children}
    </QueryClientContext.Provider>
  );
}

export function useQueryClient(): typeof queryCache {
  const context = React.useContext(QueryClientContext);
  if (!context) {
    throw new Error("useQueryClient must be used within a QueryClientProvider");
  }
  return context;
}
