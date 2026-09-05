import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface IllustrationEmptyProps {
  type?: "cases" | "documents" | "search" | "calendar" | "default"
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const illustrations = {
  cases: (
    <svg viewBox="0 0 200 160" fill="none" className="h-32 w-32">
      <rect x="20" y="40" width="160" height="100" rx="8" fill="#f1f5f9" />
      <rect x="30" y="50" width="60" height="20" rx="4" fill="#e2e8f0" />
      <rect x="30" y="80" width="140" height="8" rx="2" fill="#e2e8f0" />
      <rect x="30" y="96" width="140" height="8" rx="2" fill="#e2e8f0" />
      <rect x="30" y="112" width="100" height="8" rx="2" fill="#e2e8f0" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 200 160" fill="none" className="h-32 w-32">
      <rect x="40" y="20" width="120" height="120" rx="8" fill="#f1f5f9" />
      <rect x="50" y="30" width="80" height="12" rx="2" fill="#e2e8f0" />
      <rect x="50" y="50" width="100" height="6" rx="2" fill="#e2e8f0" />
      <rect x="50" y="62" width="100" height="6" rx="2" fill="#e2e8f0" />
      <rect x="50" y="74" width="100" height="6" rx="2" fill="#e2e8f0" />
      <rect x="50" y="86" width="70" height="6" rx="2" fill="#e2e8f0" />
      <rect x="50" y="110" width="40" height="16" rx="4" fill="#cbd5e1" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 160" fill="none" className="h-32 w-32">
      <circle cx="85" cy="75" r="40" stroke="#e2e8f0" strokeWidth="4" fill="none" />
      <line x1="115" y1="105" x2="150" y2="140" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="85" cy="75" r="20" fill="#f1f5f9" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 200 160" fill="none" className="h-32 w-32">
      <rect x="30" y="30" width="140" height="110" rx="8" fill="#f1f5f9" />
      <rect x="30" y="30" width="140" height="30" rx="8" fill="#e2e8f0" />
      <rect x="50" y="75" width="20" height="20" rx="4" fill="#e2e8f0" />
      <rect x="80" y="75" width="20" height="20" rx="4" fill="#e2e8f0" />
      <rect x="110" y="75" width="20" height="20" rx="4" fill="#e2e8f0" />
      <rect x="50" y="105" width="20" height="20" rx="4" fill="#e2e8f0" />
      <rect x="80" y="105" width="20" height="20" rx="4" fill="#cbd5e1" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 200 160" fill="none" className="h-32 w-32">
      <rect x="40" y="40" width="120" height="80" rx="8" fill="#f1f5f9" />
      <rect x="60" y="60" width="80" height="8" rx="2" fill="#e2e8f0" />
      <rect x="60" y="76" width="60" height="8" rx="2" fill="#e2e8f0" />
      <rect x="60" y="92" width="40" height="8" rx="2" fill="#e2e8f0" />
    </svg>
  ),
}

function IllustrationEmpty({
  type = "default",
  title,
  description,
  action,
  className,
}: IllustrationEmptyProps) {
  const titles: Record<string, string> = {
    cases: "No cases yet",
    documents: "No documents uploaded",
    search: "No results found",
    calendar: "No upcoming events",
    default: "Nothing here yet",
  }

  const descriptions: Record<string, string> = {
    cases: "Create your first case to get started with case management.",
    documents: "Upload documents to keep your files organized and accessible.",
    search: "Try adjusting your search terms or filters.",
    calendar: "Your schedule is clear. Add an event to get started.",
    default: "Get started by creating something new.",
  }

  return (
    <EmptyState
      icon={illustrations[type]}
      title={title || titles[type]}
      description={description || descriptions[type]}
      action={action}
      className={className}
    />
  )
}

export { EmptyState, IllustrationEmpty }
