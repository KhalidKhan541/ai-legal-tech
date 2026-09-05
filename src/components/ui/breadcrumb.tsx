"use client"

import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps {
  items: {
    label: string
    href?: string
    onClick?: () => void
    icon?: React.ReactNode
  }[]
  separator?: React.ReactNode
  maxItems?: number
  className?: string
}

function Breadcrumb({
  items,
  separator = <ChevronRight className="h-4 w-4 text-slate-400" />,
  maxItems = 5,
  className,
}: BreadcrumbProps) {
  const [expanded, setExpanded] = React.useState(false)

  const shouldCollapse = items.length > maxItems && !expanded
  const visibleItems = shouldCollapse
    ? [...items.slice(0, 1), ...items.slice(-2)]
    : items

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      <ol className="flex items-center space-x-1">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1
          const isCollapsed =
            shouldCollapse && index === 1

          return (
            <li key={item.label} className="flex items-center space-x-1">
              {index > 0 && (
                <span className="flex items-center">
                  {isCollapsed ? (
                    <button
                      onClick={() => setExpanded(true)}
                      className="flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  ) : (
                    separator
                  )}
                </span>
              )}
              {isCollapsed ? null : (
                <span className="flex items-center">
                  {item.icon && (
                    <span className="mr-1">{item.icon}</span>
                  )}
                  {isLast ? (
                    <span className="font-medium text-slate-900">
                      {item.label}
                    </span>
                  ) : item.href ? (
                    <a
                      href={item.href}
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-slate-500">{item.label}</span>
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface BreadcrumbItemProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  className?: string
}

function BreadcrumbItem({
  children,
  href,
  onClick,
  active,
  className,
}: BreadcrumbItemProps) {
  return (
    <li className={cn("flex items-center", className)}>
      {active ? (
        <span className="font-medium text-slate-900">{children}</span>
      ) : href ? (
        <a
          href={href}
          className="text-slate-500 hover:text-slate-900 transition-colors"
        >
          {children}
        </a>
      ) : onClick ? (
        <button
          onClick={onClick}
          className="text-slate-500 hover:text-slate-900 transition-colors"
        >
          {children}
        </button>
      ) : (
        <span className="text-slate-500">{children}</span>
      )}
    </li>
  )
}

export { Breadcrumb, BreadcrumbItem }
