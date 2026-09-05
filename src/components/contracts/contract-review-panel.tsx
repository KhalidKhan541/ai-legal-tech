"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ClauseAnalyzer } from "./clause-analyzer"
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Bot,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react"
import type { Contract } from "@/store"

export function ContractReviewPanel({ contract }: { contract: Contract }) {
  const [expanded, setExpanded] = useState(true)

  const riskLevel = contract.riskScore >= 70 ? "high" : contract.riskScore >= 40 ? "medium" : "low"
  const riskColors = {
    high: "text-red-600 bg-red-50 border-red-200",
    medium: "text-amber-600 bg-amber-50 border-amber-200",
    low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  }

  return (
    <div className="p-5 space-y-4">
      {/* Risk summary */}
      <div className={cn("rounded-lg border p-4", riskColors[riskLevel])}>
        <div className="flex items-center gap-2 mb-2">
          {riskLevel === "high" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span className="text-sm font-semibold">Risk Assessment: {contract.riskScore}/100</span>
        </div>
        <p className="text-xs leading-relaxed opacity-80">
          {riskLevel === "high"
            ? "This contract contains several high-risk clauses that require immediate attention before signing."
            : riskLevel === "medium"
            ? "This contract has some areas of concern that should be reviewed with counsel."
            : "This contract appears to have standard commercial terms with acceptable risk levels."}
        </p>
      </div>

      {/* AI Analysis */}
      {contract.aiSummary && (
        <div className="rounded-lg bg-legal-50 border border-legal-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-legal-600" />
            <span className="text-sm font-medium text-legal-800">AI Analysis</span>
          </div>
          <p className="text-xs leading-relaxed text-legal-700">{contract.aiSummary}</p>
        </div>
      )}

      {/* Key clauses */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-sm font-medium text-slate-900"
        >
          <span>Key Clauses ({contract.clauses.length})</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {contract.clauses.map((clause) => (
              <div key={clause.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{clause.section}</span>
                    <span className="text-sm font-medium text-slate-900">{clause.title}</span>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    clause.riskLevel === "critical" ? "bg-red-100 text-red-700" :
                    clause.riskLevel === "high" ? "bg-orange-100 text-orange-700" :
                    clause.riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {clause.riskLevel}
                  </span>
                </div>
                {clause.aiAnalysis && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{clause.aiAnalysis}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full" size="sm">
        View Full Analysis
        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
