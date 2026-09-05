"use client";

import * as React from "react";

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const TOAST_LIMIT = 5;
const DEFAULT_DURATION = 5000;

let toastCounter = 0;

function generateId(): string {
  return `toast_${++toastCounter}_${Date.now()}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = generateId();
      const newToast: Toast = { ...toast, id };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        if (updated.length > TOAST_LIMIT) {
          const removed = updated.pop();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return updated;
      });

      const duration = toast.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  const success = React.useCallback(
    (title: string, description?: string) => {
      addToast({ variant: "success", title, description });
    },
    [addToast]
  );

  const error = React.useCallback(
    (title: string, description?: string) => {
      addToast({ variant: "error", title, description, duration: 8000 });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (title: string, description?: string) => {
      addToast({ variant: "warning", title, description });
    },
    [addToast]
  );

  const info = React.useCallback(
    (title: string, description?: string) => {
      addToast({ variant: "info", title, description });
    },
    [addToast]
  );

  const dismiss = React.useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  const dismissAll = React.useCallback(() => {
    setToasts([]);
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
  }, []);

  React.useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
      dismiss,
      dismissAll,
    }),
    [toasts, addToast, removeToast, success, error, warning, info, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 sm:max-w-[420px]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const variantStyles: Record<ToastVariant, string> = {
    default: "border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100",
    success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
    error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  };

  const iconMap: Record<ToastVariant, string> = {
    default: "",
    success: "\u2714",
    error: "\u2716",
    warning: "\u26A0",
    info: "\u2139",
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-lg border p-4 shadow-lg transition-all duration-200 ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      } ${variantStyles[toast.variant]}`}
    >
      <div className="flex items-start gap-3">
        {toast.variant !== "default" && (
          <span className="mt-0.5 text-lg leading-none">
            {iconMap[toast.variant]}
          </span>
        )}
        <div className="flex-1">
          <div className="text-sm font-semibold">{toast.title}</div>
          {toast.description && (
            <div className="mt-1 text-sm opacity-80">{toast.description}</div>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:opacity-80"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Dismiss"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
