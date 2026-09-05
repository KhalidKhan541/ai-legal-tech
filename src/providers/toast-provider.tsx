"use client"

import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as ToastContextProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast"

interface Toast extends Omit<ToastProps, "children"> {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  action?: React.ReactNode
}

interface ToastState {
  toasts: Toast[]
}

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "DISMISS"; toastId: string }
  | { type: "REMOVE"; toastId: string }

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      }
    case "DISMISS":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        ),
      }
    case "REMOVE":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

let toastCounter = 0

function generateToastId() {
  toastCounter += 1
  return `toast-${toastCounter}`
}

interface ToastContextValue {
  toast: (props: Omit<Toast, "id">) => string
  dismiss: (toastId: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
)

export function useToast() {
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  duration?: number
  swipeDirection?: "right" | "up" | "down" | "left"
}

export function ToastProvider({
  children,
  duration = 5000,
  swipeDirection = "right",
}: ToastProviderProps) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] })

  const toast = React.useCallback(
    (props: Omit<Toast, "id">) => {
      const id = generateToastId()
      const newToast: Toast = {
        ...props,
        id,
        open: true,
      }

      dispatch({ type: "ADD", toast: newToast })

      if (duration > 0) {
        setTimeout(() => {
          dispatch({ type: "DISMISS", toastId: id })
          setTimeout(() => {
            dispatch({ type: "REMOVE", toastId: id })
          }, 300)
        }, duration)
      }

      return id
    },
    [duration]
  )

  const dismiss = React.useCallback((toastId: string) => {
    dispatch({ type: "DISMISS", toastId })
    setTimeout(() => {
      dispatch({ type: "REMOVE", toastId })
    }, 300)
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      <ToastContextProvider swipeDirection={swipeDirection}>
        {children}
        {state.toasts.map((t) => (
          <Toast key={t.id} {...t}>
            <div className="grid gap-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && (
                <ToastDescription>{t.description}</ToastDescription>
              )}
            </div>
            {t.action}
            <ToastClose onClick={() => dismiss(t.id)} />
          </Toast>
        ))}
        <ToastViewport />
      </ToastContextProvider>
    </ToastContext.Provider>
  )
}
