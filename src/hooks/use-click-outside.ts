"use client"

import { useEffect, useRef, RefObject } from "react"

type UseClickOutsideOptions = {
  handler: (event: MouseEvent | TouchEvent) => void
  enabled?: boolean
}

export function useClickOutside<T extends HTMLElement>(
  options: UseClickOutsideOptions
): RefObject<T> {
  const ref = useRef<T>(null)
  const { handler, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      if (!ref.current || ref.current.contains(target)) {
        return
      }

      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [handler, enabled])

  return ref
}

export function useClickOutsideMultiple<T extends HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): RefObject<T>[] {
  const refs = useRef<RefObject<T>[]>([])

  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      const isInside = refs.current.some(
        (ref) => ref.current?.contains(target)
      )

      if (isInside) {
        return
      }

      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [handler, enabled])

  const addRef = (): RefObject<T> => {
    const ref = { current: null } as RefObject<T>
    refs.current.push(ref)
    return ref
  }

  return [addRef(), addRef(), addRef()]
}
