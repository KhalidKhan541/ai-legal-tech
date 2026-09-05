"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { FileText, Users, Clock, AlertTriangle, ChevronRight } from "lucide-react"
import type { Matter } from "@/store"

const statusColors: Record<string, string> = {
  intake: "bg-slate-100 text-slate-700",
  investigation: "bg-blue-100 text-blue-700",
  discovery: "bg-purple-100 text-purple-700",
  trial: "bg-amber-100 text-amber-700",
  appeal: "bg-orange-100 text-orange-700",
  closed: "bg-emerald-100 text-emerald-700",
}

const priorityIndicators: Record<string, string> = {
  low: "border-slate-300",
  medium: "border-blue-400",
  high: "border-amber-400",
  urgent: "border-red-400",
}

export function MatterCard({ matter }: { matter: Matter }) {
  const hasDeadline = matter.statuteOfLimitations && new Date(matter.statuteOfLimitations) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return (
    <Link href={`/matters/${matter.id}`}>
      <div className={cn(
        "group rounded-xl border-2 border-l-4 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 cursor-pointer",
        priorityIndicators[matter.priority]
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-legal-700 transition-colors">
                {matter.title}
              </h3>
              {matter.isConfidential && (
                <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 uppercase">
                  Confidential
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500">{matter.matterNumber}</div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
          {matter.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {matter.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {matter.clientName.split(" ")[0]}
            </span>
            {hasDeadline && (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Deadline soon
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", statusColors[matter.status])}>
              {matter.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
