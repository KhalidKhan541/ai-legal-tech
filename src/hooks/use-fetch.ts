import { useState, useEffect, useCallback, useRef } from "react";

export interface UseFetchOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transform?: (data: unknown) => T;
}

export interface UseFetchResult<T, B = unknown> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  execute: (body?: B) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useFetch<T, B = unknown>(
  url: string | null,
  options?: UseFetchOptions<T> & {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    body?: B;
    credentials?: RequestCredentials;
  }
): UseFetchResult<T, B> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (body?: B): Promise<T | null> => {
      if (!url) return null;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const fetchOptions: RequestInit = {
          method: options?.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          signal: abortControllerRef.current.signal,
          credentials: options?.credentials ?? "same-origin",
        };

        if (body && fetchOptions.method !== "GET") {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        const result = options?.transform ? options.transform(json) : (json as T);

        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
          options?.onSuccess?.(result);
        }

        return result;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setError(error);
          setIsLoading(false);
          options?.onError?.(error);
        }
        return null;
      }
    },
    [url, options]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    if (mountedRef.current) {
      setData(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options?.immediate !== false && url) {
      execute(options?.body);
    }
  }, [url]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== null && error === null,
    execute,
    reset,
    setData,
  };
}

export function useFetchMutation<T, B = unknown>(
  url: string | ((body: B) => string),
  options?: {
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    transform?: (data: unknown) => T;
  }
): UseFetchResult<T, B> {
  return useFetch<T, B>(null, {
    ...options,
    immediate: false,
  });
}
