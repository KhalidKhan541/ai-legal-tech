"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Briefcase,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  FileText,
  CheckSquare,
  Scale,
  Bot,
  Calendar,
  BarChart3,
} from "lucide-react"

const stats = [
  {
    label: "Active Matters",
    value: "24",
    change: "+3 this month",
    trend: "up" as const,
    icon: Briefcase,
    color: "bg-blue-500",
    href: "/matters",
  },
  {
    label: "Total Clients",
    value: "42",
    change: "+5 this month",
    trend: "up" as const,
    icon: Users,
    color: "bg-emerald-500",
    href: "/clients",
  },
  {
    label: "Revenue (MTD)",
    value: "$87,450",
    change: "+12% vs last month",
    trend: "up" as const,
    icon: DollarSign,
    color: "bg-violet-500",
    href: "/billing",
  },
  {
    label: "Unbilled Hours",
    value: "34.5",
    change: "-8.2 from last week",
    trend: "down" as const,
    icon: Clock,
    color: "bg-amber-500",
    href: "/time",
  },
]

const recentMatters = [
  { id: "mt-001", title: "Meridian v. TechVault Patent Dispute", status: "discovery", priority: "high", client: "Meridian Technologies", updatedAt: "2025-08-28" },
  { id: "mt-003", title: "Meridian Series D Financing", status: "trial", priority: "high", client: "Meridian Technologies", updatedAt: "2025-09-01" },
  { id: "mt-004", title: "Greenfield Commercial Lease", status: "investigation", priority: "urgent", client: "Greenfield Holdings", updatedAt: "2025-08-30" },
  { id: "mt-006", title: "PCEC v. State EPA", status: "appeal", priority: "medium", client: "PCEC", updatedAt: "2025-08-15" },
]

const upcomingTasks = [
  { id: "task-001", title: "File patent infringement response", dueDate: "2025-09-15", priority: "urgent", matter: "Meridian v. TechVault" },
  { id: "task-002", title: "Review trust document v3", dueDate: "2025-09-10", priority: "medium", matter: "Chen Estate Planning" },
  { id: "task-003", title: "Schedule Series D partner meeting", dueDate: "2025-09-20", priority: "high", matter: "Meridian Series D" },
  { id: "task-004", title: "Prepare lease comparison chart", dueDate: "2025-09-08", priority: "high", matter: "Greenfield Lease" },
]

const alerts = [
  { id: 1, type: "deadline" as const, message: "Statute of limitations approaching: Meridian v. TechVault (15 days)", severity: "high" },
  { id: 2, type: "overdue" as const, message: "Invoice INV-2025-003 is 35 days overdue - PCEC", severity: "high" },
  { id: 3, type: "conflict" as const, message: "New conflict check required for Greenfield M&A target", severity: "medium" },
]

const statusColors: Record<string, string> = {
  intake: "bg-slate-100 text-slate-700",
  investigation: "bg-blue-100 text-blue-700",
  discovery: "bg-purple-100 text-purple-700",
  trial: "bg-amber-100 text-amber-700",
  appeal: "bg-orange-100 text-orange-700",
  closed: "bg-emerald-100 text-emerald-700",
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good morning, Alexandra</h1>
            <p className="mt-1 text-slate-300">
              You have <span className="font-semibold text-amber-400">3 urgent tasks</span> and{" "}
              <span className="font-semibold text-red-400">1 overdue invoice</span> requiring attention.
            </p>
          </div>
          <div className="hidden gap-3 lg:flex">
            <Link href="/ai">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Bot className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </Link>
            <Link href="/calendar">
              <Button className="bg-white text-slate-900 hover:bg-white/90">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", stat.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    stat.trend === "up" ? "text-emerald-600" : "text-slate-500"
                  )}>
                    {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Matters */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Matters</h2>
            <Link href="/matters">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMatters.map((matter) => (
              <Link
                key={matter.id}
                href={`/matters/${matter.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{matter.title}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{matter.client}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", priorityColors[matter.priority])}>
                    {matter.priority}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusColors[matter.status])}>
                    {matter.status}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(matter.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Alerts & Upcoming Tasks */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Alerts</h2>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                {alerts.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      alert.severity === "high" ? "text-red-500" : "text-amber-500"
                    )} />
                    <p className="text-sm text-slate-700 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Upcoming Tasks</h2>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{task.matter}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", priorityColors[task.priority])}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { label: "New Matter", href: "/matters", icon: Briefcase, color: "bg-blue-50 text-blue-600" },
            { label: "Add Client", href: "/clients", icon: Users, color: "bg-emerald-50 text-emerald-600" },
            { label: "Upload Document", href: "/documents", icon: FileText, color: "bg-violet-50 text-violet-600" },
            { label: "New Task", href: "/tasks", icon: CheckSquare, color: "bg-amber-50 text-amber-600" },
            { label: "Start Timer", href: "/time", icon: Clock, color: "bg-orange-50 text-orange-600" },
            { label: "AI Research", href: "/research", icon: Scale, color: "bg-pink-50 text-pink-600" },
          ].map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-sm"
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", action.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
