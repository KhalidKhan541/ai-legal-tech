"use client"

import { useEffect, useCallback, useRef } from "react"

type KeyHandler = (event: KeyboardEvent) => void

interface UseKeyPressOptions {
  target?: EventTarget | null
  enabled?: boolean
}

export function useKeyPress(
  key: string,
  handler: KeyHandler,
  options: UseKeyPressOptions = {}
) {
  const { target = typeof window !== "undefined" ? window : null, enabled = true } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === key && enabled) {
        handlerRef.current(event)
      }
    },
    [key, enabled]
  )

  useEffect(() => {
    if (!target) return

    target.addEventListener("keydown", handleKeyDown as EventListener)
    return () => target.removeEventListener("keydown", handleKeyDown as EventListener)
  }, [target, handleKeyDown])
}

export function useKeyPressMultiple(
  keys: string[],
  handler: KeyHandler,
  options: UseKeyPressOptions = {}
) {
  const { target = typeof window !== "undefined" ? window : null, enabled = true } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (keys.includes(event.key) && enabled) {
        handlerRef.current(event)
      }
    },
    [keys, enabled]
  )

  useEffect(() => {
    if (!target) return

    target.addEventListener("keydown", handleKeyDown as EventListener)
    return () => target.removeEventListener("keydown", handleKeyDown as EventListener)
  }, [target, handleKeyDown])
}

export function useKeyboardShortcuts(
  shortcuts: Record<string, KeyHandler>,
  options: UseKeyPressOptions = {}
) {
  const { target = typeof window !== "undefined" ? window : null, enabled = true } = options
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const key = event.key.toLowerCase()
      const modifiers: string[] = []

      if (event.ctrlKey || event.metaKey) modifiers.push("ctrl")
      if (event.shiftKey) modifiers.push("shift")
      if (event.altKey) modifiers.push("alt")

      const shortcutKey = [...modifiers, key].join("+")
      const handler = shortcutsRef.current[shortcutKey]

      if (handler) {
        event.preventDefault()
        handler(event)
      }
    },
    [enabled]
  )

  useEffect(() => {
    if (!target) return

    target.addEventListener("keydown", handleKeyDown as EventListener)
    return () => target.removeEventListener("keydown", handleKeyDown as EventListener)
  }, [target, handleKeyDown])
}

export function useHotkey(
  combo: string,
  handler: KeyHandler,
  options: UseKeyPressOptions = {}
) {
  const parseCombo = (combo: string) => {
    const parts = combo.toLowerCase().split("+")
    return {
      ctrl: parts.includes("ctrl") || parts.includes("meta"),
      shift: parts.includes("shift"),
      alt: parts.includes("alt"),
      key: parts.filter(
        (p) => !["ctrl", "meta", "shift", "alt"].includes(p)
      )[0],
    }
  }

  const { target = typeof window !== "undefined" ? window : null, enabled = true } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const comboRef = useRef(parseCombo(combo))

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const { ctrl, shift, alt, key } = comboRef.current

      if (
        (ctrl && !(event.ctrlKey || event.metaKey)) ||
        (!ctrl && (event.ctrlKey || event.metaKey)) ||
        (shift && !event.shiftKey) ||
        (!shift && event.shiftKey) ||
        (alt && !event.altKey) ||
        (!alt && event.altKey)
      ) {
        return
      }

      if (event.key.toLowerCase() === key) {
        event.preventDefault()
        handlerRef.current(event)
      }
    },
    [enabled]
  )

  useEffect(() => {
    if (!target) return

    target.addEventListener("keydown", handleKeyDown as EventListener)
    return () => target.removeEventListener("keydown", handleKeyDown as EventListener)
  }, [target, handleKeyDown])
}
