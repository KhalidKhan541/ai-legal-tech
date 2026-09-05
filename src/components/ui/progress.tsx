"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string
    showValue?: boolean
    formatValue?: (value: number) => string
  }
>(
  (
    {
      className,
      value,
      indicatorClassName,
      showValue = false,
      formatValue,
      ...props
    },
    ref
  ) => (
    <div className={cn("w-full", className)}>
      {showValue && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-slate-500">Progress</span>
          <span className="text-sm font-medium text-slate-700">
            {formatValue ? formatValue(value || 0) : `${Math.round(value || 0)}%`}
          </span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-slate-100",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 bg-slate-900 transition-all",
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
)
Progress.displayName = ProgressPrimitive.Root.displayName

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  formatValue?: (value: number) => string
  variant?: "default" | "success" | "warning" | "danger"
}

const variantColors = {
  default: "stroke-slate-900",
  success: "stroke-emerald-500",
  warning: "stroke-amber-500",
  danger: "stroke-red-500",
}

function CircularProgress({
  value,
  size = 64,
  strokeWidth = 4,
  className,
  showValue = false,
  formatValue,
  variant = "default",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-300", variantColors[variant])}
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-medium">
          {formatValue ? formatValue(value) : `${Math.round(value)}%`}
        </span>
      )}
    </div>
  )
}

interface StepProgressProps {
  steps: {
    label: string
    description?: string
    status: "completed" | "current" | "upcoming"
  }[]
  className?: string
}

function StepProgress({ steps, className }: StepProgressProps) {
  return (
    <nav className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                step.status === "completed" && "bg-slate-900 text-white",
                step.status === "current" && "border-2 border-slate-900 text-slate-900",
                step.status === "upcoming" && "border-2 border-slate-200 text-slate-400"
              )}
            >
              {step.status === "completed" ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="ml-2 hidden sm:block">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "current" ? "text-slate-900" : "text-slate-500"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-slate-500">{step.description}</p>
              )}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px flex-1",
                step.status === "completed" ? "bg-slate-900" : "bg-slate-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export { Progress, CircularProgress, StepProgress }
