"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockTimeEntries, mockMatters } from "@/lib/mock-data"
import { TimeTracker } from "@/components/billing/time-tracker"
import {
  Plus,
  Clock,
  Play,
  Pause,
  StopCircle,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  Circle,
  Timer,
  TrendingUp,
  BarChart3,
} from "lucide-react"

const categories = ["all", "meeting", "research", "drafting", "court", "travel", "admin", "other"] as const

const categoryColors: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-700",
  research: "bg-purple-100 text-purple-700",
  drafting: "bg-emerald-100 text-emerald-700",
  court: "bg-red-100 text-red-700",
  travel: "bg-amber-100 text-amber-700",
  admin: "bg-slate-100 text-slate-600",
  other: "bg-slate-100 text-slate-600",
}

export default function TimeTrackingPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isTracking, setIsTracking] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const filtered = mockTimeEntries.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false
    return true
  })

  const totalHours = filtered.reduce((s, t) => s + t.hours, 0)
  const totalBilled = filtered.filter((t) => t.billed).reduce((s, t) => s + t.hours * t.rate, 0)
  const totalUnbilled = filtered.filter((t) => !t.billed).reduce((s, t) => s + t.hours * t.rate, 0)
  const unbilledHours = filtered.filter((t) => !t.billed).reduce((s, t) => s + t.hours, 0)

  // Category breakdown
  const categoryBreakdown = categories.filter((c) => c !== "all").map((cat) => ({
    category: cat,
    hours: mockTimeEntries.filter((t) => t.category === cat).reduce((s, t) => s + t.hours, 0),
  })).filter((c) => c.hours > 0).sort((a, b) => b.hours - a.hours)

  const maxHours = Math.max(...categoryBreakdown.map((c) => c.hours), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
          <p className="text-sm text-slate-500">Track and manage billable hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Time
          </Button>
        </div>
      </div>

      {/* Timer */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              isTracking ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-400"
            )}>
              <Timer className="h-8 w-8" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {String(Math.floor(elapsedTime / 3600)).padStart(2, "0")}:
                {String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, "0")}:
                {String(elapsedTime % 60).padStart(2, "0")}
              </div>
              <div className="text-sm text-slate-500">
                {isTracking ? "Recording time..." : "Timer stopped"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isTracking ? (
              <Button onClick={() => setIsTracking(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsTracking(false)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button variant="destructive" onClick={() => { setIsTracking(false); setElapsedTime(0) }}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, icon: Clock, color: "bg-blue-50 text-blue-600" },
          { label: "Billed Amount", value: formatCurrency(totalBilled), icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Unbilled Amount", value: formatCurrency(totalUnbilled), icon: Circle, color: "bg-amber-50 text-amber-600" },
          { label: "Unbilled Hours", value: `${unbilledHours.toFixed(1)}h`, icon: TrendingUp, color: "bg-violet-50 text-violet-600" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", stat.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Time entries */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  categoryFilter === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {filtered.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{entry.description}</div>
                    <div className="text-xs text-slate-500">{entry.matterTitle}</div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", categoryColors[entry.category])}>
                    {entry.category}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{entry.hours}h</div>
                    <div className="text-xs text-slate-500">@ {formatCurrency(entry.rate)}/hr</div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-20 text-right">
                    {formatCurrency(entry.hours * entry.rate)}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                    entry.billed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {entry.billed ? "Billed" : "Unbilled"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Hours by Category</h3>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium capitalize text-slate-700">{cat.category}</span>
                    <span className="text-xs text-slate-500">{cat.hours}h</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${(cat.hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Quick Log</h3>
            <TimeTracker />
          </div>
        </div>
      </div>
    </div>
  )
}
