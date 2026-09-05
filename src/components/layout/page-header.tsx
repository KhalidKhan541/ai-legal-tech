import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
  tabs?: {
    label: string
    value: string
    icon?: React.ReactNode
  }[]
  activeTab?: string
  onTabChange?: (value: string) => void
  className?: string
}

function PageHeader({
  title,
  description,
  icon,
  breadcrumbs,
  actions,
  tabs,
  activeTab,
  onTabChange,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-slate-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.label}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-slate-900 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  className={cn(
                    index === breadcrumbs.length - 1 &&
                      "font-medium text-slate-900"
                  )}
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                className={cn(
                  "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeTab === tab.value
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

interface PageSectionProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function PageSection({
  title,
  description,
  actions,
  children,
  className,
}: PageSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export { PageHeader, PageSection }
