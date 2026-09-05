"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockContracts } from "@/lib/mock-data"
import { ContractReviewPanel } from "@/components/contracts/contract-review-panel"
import {
  Plus,
  Search,
  Filter,
  FileSignature,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
} from "lucide-react"

const statusOptions = ["all", "draft", "under_review", "pending_signature", "active", "expired", "terminated"] as const

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  under_review: "bg-amber-100 text-amber-700",
  pending_signature: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-slate-100 text-slate-500",
  terminated: "bg-red-100 text-red-700",
}

const riskColors = (score: number) => {
  if (score >= 70) return "text-red-600 bg-red-50"
  if (score >= 40) return "text-amber-600 bg-amber-50"
  return "text-emerald-600 bg-emerald-50"
}

export default function ContractsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedContract, setSelectedContract] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = [...mockContracts]
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(term) || c.clientName.toLowerCase().includes(term))
    }
    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter)
    return result
  }, [search, statusFilter])

  const stats = {
    total: mockContracts.length,
    active: mockContracts.filter((c) => c.status === "active").length,
    underReview: mockContracts.filter((c) => c.status === "under_review").length,
    highRisk: mockContracts.filter((c) => c.riskScore >= 70).length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contracts</h1>
          <p className="text-sm text-slate-500">AI-powered contract review and analysis</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Contract
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: FileSignature, color: "bg-slate-100 text-slate-600" },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Under Review", value: stats.underReview, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "High Risk", value: stats.highRisk, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
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
                  <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((contract) => (
          <div
            key={contract.id}
            className={cn(
              "rounded-xl border bg-white shadow-sm transition-all hover:shadow-md cursor-pointer",
              selectedContract === contract.id ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300"
            )}
            onClick={() => setSelectedContract(selectedContract === contract.id ? null : contract.id)}
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 truncate">{contract.title}</h3>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusColors[contract.status])}>
                      {contract.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{contract.clientName} &middot; {contract.type}</div>
                </div>
                <div className={cn("flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold", riskColors(contract.riskScore))}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {contract.riskScore}
                </div>
              </div>

              {contract.aiSummary && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {contract.aiSummary}
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span>Effective: {formatDate(contract.effectiveDate)}</span>
                {contract.expirationDate && <span>Expires: {formatDate(contract.expirationDate)}</span>}
                {contract.value && <span className="font-medium text-slate-700">{formatCurrency(contract.value)}</span>}
              </div>
            </div>

            {selectedContract === contract.id && (
              <div className="border-t border-slate-200">
                <ContractReviewPanel contract={contract} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
