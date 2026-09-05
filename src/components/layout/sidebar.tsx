"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  FileSignature,
  Search,
  CheckSquare,
  Calendar,
  DollarSign,
  Clock,
  Bot,
  Settings,
  ChevronLeft,
  ChevronDown,
  Scale,
  LogOut,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Case Management",
    items: [
      { label: "Matters", href: "/matters", icon: Briefcase, badge: 6 },
      { label: "Clients", href: "/clients", icon: Users },
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "Contracts", href: "/contracts", icon: FileSignature, badge: 2 },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Legal Research", href: "/research", icon: Search },
      { label: "AI Assistant", href: "/ai", icon: Bot, badge: "New" },
    ],
  },
  {
    label: "Productivity",
    items: [
      { label: "Tasks", href: "/tasks", icon: CheckSquare, badge: 8 },
      { label: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Overview", href: "/billing", icon: DollarSign },
      { label: "Invoices", href: "/billing/invoices", icon: FileText },
      { label: "Time Tracking", href: "/time", icon: Clock },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    navigation.map((g) => g.label)
  )

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label)
        ? prev.filter((g) => g !== label)
        : [...prev, label]
    )
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Scale className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white">LexAI</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navigation.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                {group.label}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    !expandedGroups.includes(group.label) && "-rotate-90"
                  )}
                />
              </button>
            )}
            {collapsed && (
              <div className="mb-1 border-t border-slate-800 pt-2" />
            )}
            {(expandedGroups.includes(group.label) || collapsed) && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                typeof item.badge === "string"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-800 p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white",
            pathname === "/settings" && "bg-white/10 text-white"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        {!collapsed && (
          <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-legal-600 text-sm font-medium text-white">
              AR
            </div>
            <div className="flex-1 truncate">
              <div className="text-sm font-medium text-white">Alexandra Reed</div>
              <div className="text-xs text-slate-500">Senior Partner</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
