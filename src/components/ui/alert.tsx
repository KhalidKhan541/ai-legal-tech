import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-white text-slate-950",
        destructive:
          "border-red-500/50 text-red-600 [&>svg]:text-red-600",
        success:
          "border-emerald-500/50 text-emerald-600 [&>svg]:text-emerald-600",
        warning:
          "border-amber-500/50 text-amber-600 [&>svg]:text-amber-600",
        info:
          "border-blue-500/50 text-blue-600 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      icon?: React.ReactNode
      dismissible?: boolean
      onDismiss?: () => void
    }
>(
  (
    {
      className,
      variant,
      icon,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const defaultIcons = {
      default: <Info className="h-4 w-4" />,
      destructive: <AlertCircle className="h-4 w-4" />,
      success: <CheckCircle2 className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />,
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {icon || defaultIcons[variant || "default"]}
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-md p-1 text-slate-950/50 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

interface BannerProps {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

function Banner({
  title,
  description,
  variant = "info",
  icon,
  action,
  dismissible = false,
  onDismiss,
  className,
}: BannerProps) {
  return (
    <Alert
      variant={variant}
      icon={icon}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    >
      <div className="flex items-center justify-between">
        <div>
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="ml-4 shrink-0 rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/30"
          >
            {action.label}
          </button>
        )}
      </div>
    </Alert>
  )
}

export { Alert, AlertTitle, AlertDescription, Banner }
