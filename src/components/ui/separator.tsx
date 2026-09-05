"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-slate-100",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

interface DividerProps {
  orientation?: "horizontal" | "vertical"
  label?: string
  className?: string
}

function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (label) {
    return (
      <div
        className={cn(
          "relative flex items-center",
          orientation === "horizontal" ? "w-full" : "h-full flex-col",
          className
        )}
      >
        <Separator
          orientation={orientation}
          className="flex-1"
        />
        <span className="absolute bg-white px-2 text-xs text-slate-500">
          {label}
        </span>
        <Separator
          orientation={orientation}
          className="flex-1"
        />
      </div>
    )
  }

  return <Separator orientation={orientation} className={className} />
}

export { Separator, Divider }
