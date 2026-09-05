"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store"
import {
  Search,
  Bell,
  Plus,
  Command,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const user = useAppStore((s) => s.user)
  const notifications = useAppStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const breadcrumb = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
      return label
    })

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/80 backdrop-blur-md px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          Home
        </Link>
        {breadcrumb.map((segment, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-slate-300">/</span>
            <span className={cn(
              "font-medium",
              i === breadcrumb.length - 1 ? "text-slate-900" : "text-slate-500"
            )}>
              {segment}
            </span>
          </span>
        ))}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div
          className={cn(
            "relative flex items-center transition-all",
            searchFocused ? "w-80" : "w-64"
          )}
        >
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search matters, clients..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-12 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="absolute right-2 flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            <Command className="h-2.5 w-2.5" /> K
          </div>
        </div>

        {/* Quick actions */}
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Matter
        </Button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserMenu(false)
            }}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
                <button className="text-xs text-legal-600 hover:text-legal-700">
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "border-b border-slate-50 px-4 py-3 hover:bg-slate-50",
                        !n.read && "bg-blue-50/50"
                      )}
                    >
                      <div className="text-sm font-medium text-slate-900">{n.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                <Link
                  href="/settings"
                  className="text-xs font-medium text-legal-600 hover:text-legal-700"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifications(false)
            }}
            className="flex items-center gap-2 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
              {user?.name?.split(" ").map((n) => n[0]).join("") ?? "AR"}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">
                  {user?.name ?? "Alexandra Reed"}
                </div>
                <div className="text-xs text-slate-500">
                  {user?.email ?? "alexandra@reedlaw.com"}
                </div>
              </div>
              <div className="p-1.5">
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </button>
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </button>
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <Moon className="h-4 w-4 text-slate-400" />
                  Dark mode
                </button>
              </div>
              <div className="border-t border-slate-100 p-1.5">
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
