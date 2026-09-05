"use client"

import { useEffect, useRef } from "react"

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export function usePreviousDistinct<T>(
  value: T,
  compare?: (a: T, b: T) => boolean
): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  const currentRef = useRef<T>(value)

  useEffect(() => {
    if (compare) {
      if (!compare(currentRef.current, value)) {
        ref.current = currentRef.current
        currentRef.current = value
      }
    } else {
      if (currentRef.current !== value) {
        ref.current = currentRef.current
        currentRef.current = value
      }
    }
  }, [value, compare])

  return ref.current
}

export function usePreviousWithIndex<T>(value: T): [T | undefined, number] {
  const ref = useRef<{ value: T | undefined; index: number }>({
    value: undefined,
    index: 0,
  })

  useEffect(() => {
    ref.current = { value, index: ref.current.index + 1 }
  }, [value])

  return [ref.current.value, ref.current.index]
}

export function usePreviousChanges<T>(value: T, maxHistory: number = 5): T[] {
  const historyRef = useRef<T[]>([])

  useEffect(() => {
    historyRef.current = [value, ...historyRef.current].slice(0, maxHistory)
  }, [value, maxHistory])

  return historyRef.current
}
