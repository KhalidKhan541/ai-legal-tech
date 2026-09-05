"use client"

import { useState, useCallback, useMemo } from "react"

export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  return [value, toggle, setValue]
}

export function useBoolean(
  initialValue: boolean = false
): {
  value: boolean
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
} {
  const [value, setValue] = useState(initialValue)

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue((prev) => !prev), [])

  return useMemo(
    () => ({
      value,
      setTrue,
      setFalse,
      toggle,
    }),
    [value, setTrue, setFalse, toggle]
  )
}

export function useCounter(
  initialValue: number = 0,
  options: {
    min?: number
    max?: number
    step?: number
  } = {}
): {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
  set: (value: number) => void
} {
  const { min = -Infinity, max = Infinity, step = 1 } = options
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => {
    setCount((prev) => Math.min(prev + step, max))
  }, [step, max])

  const decrement = useCallback(() => {
    setCount((prev) => Math.max(prev - step, min))
  }, [step, min])

  const reset = useCallback(() => {
    setCount(initialValue)
  }, [initialValue])

  const set = useCallback(
    (value: number) => {
      setCount(Math.max(min, Math.min(max, value)))
    },
    [min, max]
  )

  return useMemo(
    () => ({
      count,
      increment,
      decrement,
      reset,
      set,
    }),
    [count, increment, decrement, reset, set]
  )
}

export function useArray<T>(initialValue: T[] = []) {
  const [array, setArray] = useState<T[]>(initialValue)

  const push = useCallback((item: T) => {
    setArray((prev) => [...prev, item])
  }, [])

  const pop = useCallback(() => {
    setArray((prev) => prev.slice(0, -1))
  }, [])

  const shift = useCallback(() => {
    setArray((prev) => prev.slice(1))
  }, [])

  const unshift = useCallback((item: T) => {
    setArray((prev) => [item, ...prev])
  }, [])

  const remove = useCallback((index: number) => {
    setArray((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const removeItem = useCallback((item: T) => {
    setArray((prev) => prev.filter((i) => i !== item))
  }, [])

  const clear = useCallback(() => {
    setArray([])
  }, [])

  const update = useCallback((index: number, item: T) => {
    setArray((prev) => prev.map((i, idx) => (idx === index ? item : i)))
  }, [])

  const replace = useCallback((oldItem: T, newItem: T) => {
    setArray((prev) =>
      prev.map((i) => (i === oldItem ? newItem : i))
    )
  }, [])

  const includes = useCallback(
    (item: T) => array.includes(item),
    [array]
  )

  return useMemo(
    () => ({
      array,
      set: setArray,
      push,
      pop,
      shift,
      unshift,
      remove,
      removeItem,
      clear,
      update,
      replace,
      includes,
      length: array.length,
    }),
    [
      array,
      setArray,
      push,
      pop,
      shift,
      unshift,
      remove,
      removeItem,
      clear,
      update,
      replace,
      includes,
    ]
  )
}
