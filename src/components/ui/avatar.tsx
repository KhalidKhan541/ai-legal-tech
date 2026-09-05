"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-slate-100",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface UserAvatarProps {
  name: string
  image?: string | null
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  showStatus?: boolean
  status?: "online" | "offline" | "away" | "busy"
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
}

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-slate-400",
  away: "bg-amber-500",
  busy: "bg-red-500",
}

function UserAvatar({
  name,
  image,
  size = "md",
  className,
  showStatus = false,
  status = "offline",
}: UserAvatarProps) {
  return (
    <div className="relative inline-flex">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={image || undefined} alt={name} />
        <AvatarFallback className="bg-slate-200 text-slate-600 font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            statusColors[status],
            size === "xs" && "h-1.5 w-1.5",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            size === "xl" && "h-3.5 w-3.5"
          )}
        />
      )}
    </div>
  )
}

interface AvatarGroupProps {
  avatars: {
    name: string
    image?: string | null
  }[]
  max?: number
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

function AvatarGroup({ avatars, max = 3, size = "md", className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className={cn("flex items-center", className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={avatar.name}
          className={cn(
            "relative inline-flex",
            index > 0 && "-ml-2"
          )}
          style={{ zIndex: max - index }}
        >
          <UserAvatar name={avatar.name} image={avatar.image} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "relative inline-flex -ml-2",
            sizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-slate-600 font-medium">
            +{remaining}
          </div>
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, AvatarGroup }
