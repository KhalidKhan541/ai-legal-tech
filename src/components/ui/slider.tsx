"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string
  showValue?: boolean
  formatValue?: (value: number) => string
}

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, label, showValue = false, formatValue, ...props }, ref) => {
  const sliderId = React.useId()
  const value = props.defaultValue?.[0] ?? props.value?.[0] ?? 0

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label
              htmlFor={sliderId}
              className="text-sm font-medium text-slate-700"
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm text-slate-500">
              {formatValue ? formatValue(value) : value}
            </span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        id={sliderId}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-100">
          <SliderPrimitive.Range className="absolute h-full bg-slate-900" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-slate-900 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

interface RangeSliderProps {
  min?: number
  max?: number
  step?: number
  value?: [number, number]
  onValueChange?: (value: [number, number]) => void
  label?: string
  formatValue?: (value: number) => string
  className?: string
}

function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  label,
  formatValue,
  className,
}: RangeSliderProps) {
  const sliderId = React.useId()

  return (
    <div className={cn("w-full", className)}>
      {(label || value) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label
              htmlFor={sliderId}
              className="text-sm font-medium text-slate-700"
            >
              {label}
            </label>
          )}
          {value && (
            <span className="text-sm text-slate-500">
              {formatValue ? formatValue(value[0]) : value[0]} -{" "}
              {formatValue ? formatValue(value[1]) : value[1]}
            </span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        id={sliderId}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onValueChange as any}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-100">
          <SliderPrimitive.Range className="absolute h-full bg-slate-900" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-slate-900 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-slate-900 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  )
}

export { Slider, RangeSlider }
