"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    className={cn("grid gap-2", className)}
    {...props}
    ref={ref}
  />
))
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    label?: string
    description?: string
  }
>(({ className, label, description, id, ...props }, ref) => {
  const itemId = id || React.useId()

  return (
    <div className="flex items-start gap-2">
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-slate-200 text-slate-900 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className="h-3.5 w-3.5 fill-slate-900 text-slate-900" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={itemId}
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      )}
    </div>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupWithLabelsProps {
  options: RadioOption[]
  value?: string
  onValueChange?: (value: string) => void
  orientation?: "horizontal" | "vertical"
  name?: string
  disabled?: boolean
  className?: string
}

function RadioGroupWithLabels({
  options,
  value,
  onValueChange,
  orientation = "vertical",
  name,
  disabled,
  className,
}: RadioGroupWithLabelsProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
      name={name}
      disabled={disabled}
      className={cn(
        orientation === "horizontal" ? "flex flex-wrap gap-4" : "grid gap-2",
        className
      )}
    >
      {options.map((option) => (
        <RadioGroupItem
          key={option.value}
          value={option.value}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
        />
      ))}
    </RadioGroup>
  )
}

export { RadioGroup, RadioGroupItem, RadioGroupWithLabels }
