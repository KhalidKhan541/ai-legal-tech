import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "default" | "primary" | "white"
}

const sizeClasses = {
  xs: "h-3 w-3 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
  xl: "h-12 w-12 border-4",
}

const variantClasses = {
  default: "border-slate-200 border-t-slate-900",
  primary: "border-blue-200 border-t-blue-600",
  white: "border-white/30 border-t-white",
}

function Spinner({
  size = "md",
  variant = "default",
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingOverlayProps {
  children?: React.ReactNode
  text?: string
  fullScreen?: boolean
  className?: string
}

function LoadingOverlay({
  children,
  text = "Loading...",
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen && "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm",
        !fullScreen && "relative min-h-[200px]",
        className
      )}
    >
      <Spinner size="lg" />
      {text && <p className="text-sm text-slate-500">{text}</p>}
      {children}
    </div>
  )
}

interface LoadingButtonProps {
  loading: boolean
  children: React.ReactNode
  className?: string
}

function LoadingButton({ loading, children, className }: LoadingButtonProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {loading && <Spinner size="sm" variant="white" />}
      {children}
    </span>
  )
}

export { Spinner, LoadingOverlay, LoadingButton }
