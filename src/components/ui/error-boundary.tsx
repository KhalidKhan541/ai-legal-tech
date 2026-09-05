"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, RefreshCw, Home, Copy } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  onReset?: () => void
  className?: string
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  className,
}: ErrorFallbackProps) {
  const [copied, setCopied] = React.useState(false)

  const errorDetails = error
    ? `Error: ${error.message}\n\n${error.stack || ""}`
    : "Unknown error"

  const copyError = async () => {
    await navigator.clipboard.writeText(errorDetails)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-red-100 p-3">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        Something went wrong
      </h3>
      <p className="mb-6 max-w-md text-sm text-slate-500">
        An unexpected error occurred. Please try again or contact support if
        the problem persists.
      </p>
      <div className="flex items-center gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
        <button
          onClick={copyError}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied!" : "Copy error"}
        </button>
      </div>
      {process.env.NODE_ENV === "development" && errorInfo && (
        <details className="mt-6 w-full max-w-lg">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Error details
          </summary>
          <pre className="mt-2 overflow-auto rounded-md bg-slate-900 p-4 text-left text-xs text-slate-100">
            {errorDetails}
            {"\n\nComponent Stack:\n"}
            {errorInfo.componentStack}
          </pre>
        </details>
      )}
    </div>
  )
}

function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

export { ErrorBoundary, ErrorFallback, withErrorBoundary }
