"use client"

import { useState, useCallback, useRef } from "react"

interface UseCopyToClipboardResult {
  copiedText: string | null
  isCopied: boolean
  error: Error | null
  copy: (text: string) => Promise<boolean>
  reset: () => void
}

export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      setError(null)

      timeoutRef.current = setTimeout(() => {
        setCopiedText(null)
      }, 2000)

      return true
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to copy to clipboard")
      setError(error)
      setCopiedText(null)
      return false
    }
  }, [])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setCopiedText(null)
    setError(null)
  }, [])

  return {
    copiedText,
    isCopied: copiedText !== null,
    error,
    copy,
    reset,
  }
}

interface UseCopyToClipboardWithFeedbackResult extends UseCopyToClipboardResult {
  feedback: "idle" | "copied" | "error"
}

export function useCopyToClipboardWithFeedback(): UseCopyToClipboardWithFeedbackResult {
  const { copiedText, error, copy: baseCopy, reset } = useCopyToClipboard()
  const [feedback, setFeedback] = useState<"idle" | "copied" | "error">("idle")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      const success = await baseCopy(text)

      setFeedback(success ? "copied" : "error")

      timeoutRef.current = setTimeout(() => {
        setFeedback("idle")
      }, 2000)

      return success
    },
    [baseCopy]
  )

  const resetFeedback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setFeedback("idle")
    reset()
  }, [reset])

  return {
    copiedText,
    isCopied: copiedText !== null,
    error,
    copy,
    reset: resetFeedback,
    feedback,
  }
}

export function useCopyValue<T>(
  value: T,
  serialize: (value: T) => string = JSON.stringify
): {
  copy: () => Promise<boolean>
  copied: boolean
  error: Error | null
} {
  const { copy: baseCopy, isCopied, error } = useCopyToClipboard()

  const copy = useCallback(async (): Promise<boolean> => {
    const text = serialize(value)
    return baseCopy(text)
  }, [value, serialize, baseCopy])

  return { copy, copied: isCopied, error }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function createCopyFunction(
  onCopy?: (text: string) => void,
  onError?: (error: Error) => void
): (text: string) => Promise<boolean> {
  return async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      onCopy?.(text)
      return true
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to copy to clipboard")
      onError?.(error)
      return false
    }
  }
}
