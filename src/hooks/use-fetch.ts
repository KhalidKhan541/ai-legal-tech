"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseFetchOptions<T> {
  immediate?: boolean
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retryCount?: number
  retryDelay?: number
}

interface UseFetchResult<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  execute: (url?: string, options?: RequestInit) => Promise<T | undefined>
  reset: () => void
}

export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    immediate = true,
    initialData,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [error, setError] = useState<Error | undefined>()
  const [loading, setLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const execute = useCallback(
    async (
      executeUrl?: string,
      fetchOptions?: RequestInit
    ): Promise<T | undefined> => {
      const targetUrl = executeUrl || url
      if (!targetUrl) return undefined

      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      setLoading(true)
      setError(undefined)

      let lastError: Error | undefined

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const response = await fetch(targetUrl, {
            ...fetchOptions,
            signal: abortControllerRef.current.signal,
            headers: {
              "Content-Type": "application/json",
              ...fetchOptions?.headers,
            },
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          if (mountedRef.current) {
            setData(result)
            setLoading(false)
            onSuccess?.(result)
          }

          return result
        } catch (err) {
          lastError =
            err instanceof Error ? err : new Error("Unknown error occurred")

          if (err instanceof DOMException && err.name === "AbortError") {
            return undefined
          }

          if (attempt < retryCount) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
          }
        }
      }

      if (mountedRef.current) {
        setError(lastError)
        setLoading(false)
        onError?.(lastError!)
      }

      return undefined
    },
    [url, retryCount, retryDelay, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setError(undefined)
    setLoading(false)
  }, [initialData])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (immediate && url) {
      execute()
    }
  }, [immediate, url, execute])

  return { data, error, loading, execute, reset }
}

interface UseFetchMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void
  onError?: (error: Error, variables: V) => void
}

interface UseFetchMutationResult<T, V> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  mutate: (variables: V) => Promise<T | undefined>
  reset: () => void
}

export function useFetchMutation<T, V = any>(
  url: string,
  options: UseFetchMutationOptions<T, V> = {}
): UseFetchMutationResult<T, V> {
  const { onSuccess, onError } = options

  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mutate = useCallback(
    async (variables: V): Promise<T | undefined> => {
      setLoading(true)
      setError(undefined)

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(variables),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (mountedRef.current) {
          setData(result)
          setLoading(false)
          onSuccess?.(result, variables)
        }

        return result
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred")

        if (mountedRef.current) {
          setError(error)
          setLoading(false)
          onError?.(error, variables)
        }

        return undefined
      }
    },
    [url, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setData(undefined)
    setError(undefined)
    setLoading(false)
  }, [])

  return { data, error, loading, mutate, reset }
}
