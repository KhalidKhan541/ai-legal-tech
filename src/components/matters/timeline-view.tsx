"use client"

import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import {
  FileText,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Scale,
  GitBranch,
  Calendar,
  ArrowUpRight,
} from "lucide-react"

interface TimelineEvent {
  id: string
  type: string
  title: string
  date: string
  description: string
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  matter_created: Scale,
  status_change: GitBranch,
  assignment: Users,
  note_added: MessageSquare,
  conflict_check: Scale,
  document_added: FileText,
  deadline: AlertTriangle,
  default: Clock,
}

const eventColors: Record<string, string> = {
  matter_created: "bg-emerald-100 text-emerald-600 border-emerald-200",
  status_change: "bg-blue-100 text-blue-600 border-blue-200",
  assignment: "bg-violet-100 text-violet-600 border-violet-200",
  note_added: "bg-amber-100 text-amber-600 border-amber-200",
  conflict_check: "bg-red-100 text-red-600 border-red-200",
  document_added: "bg-blue-100 text-blue-600 border-blue-200",
  deadline: "bg-orange-100 text-orange-600 border-orange-200",
}

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const Icon = eventIcons[event.type] || eventIcons.default
          const colorClass = eventColors[event.type] || "bg-slate-100 text-slate-600 border-slate-200"

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                colorClass
              )}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                  <span className="text-xs text-slate-400">{formatDate(event.date)}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {event.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {events.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500">
          No events in the timeline yet.
        </div>
      )}
    </div>
  )
}
