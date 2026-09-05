"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  MessageSquare,
  Copy,
  ExternalLink,
} from "lucide-react"
import type { ContractClause } from "@/store"

export function ClauseAnalyzer({ clause }: { clause: ContractClause }) {
  const [expanded, setExpanded] = useState(false)

  const riskStyles = {
    critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
    high: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
    medium: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    low: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  }

  const styles = riskStyles[clause.riskLevel]

  return (
    <div className="p-5">
      <div
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", styles.dot)} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{clause.section}</span>
                <span className="text-sm font-semibold text-slate-900">{clause.title}</span>
              </div>
              {!expanded && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-1">{clause.content}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", styles.text, styles.bg)}>
              {clause.riskLevel} risk
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 ml-5 space-y-4">
          {/* Original clause text */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Original Text</h4>
            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 font-mono">
              {clause.content}
            </div>
          </div>

          {/* AI Analysis */}
          {clause.aiAnalysis && (
            <div className={cn("rounded-lg border p-3", styles.bg, styles.border)}>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className={cn("h-3.5 w-3.5", styles.text)} />
                <span className={cn("text-xs font-semibold", styles.text)}>AI Analysis</span>
              </div>
              <p className={cn("text-xs leading-relaxed", styles.text)}>{clause.aiAnalysis}</p>
            </div>
          )}

          {/* Suggested changes */}
          {clause.suggestedChanges && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Suggested Revision</span>
              </div>
              <p className="text-xs leading-relaxed text-blue-700">{clause.suggestedChanges}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
              <Copy className="h-3 w-3" />
              Copy clause
            </button>
            <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
              <ExternalLink className="h-3 w-3" />
              View precedent
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
