"use client"

import { use } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockContracts } from "@/lib/mock-data"
import { ContractReviewPanel } from "@/components/contracts/contract-review-panel"
import { ClauseAnalyzer } from "@/components/contracts/clause-analyzer"
import {
  ArrowLeft,
  Download,
  Share2,
  Edit,
  FileSignature,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react"

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const contract = mockContracts.find((c) => c.id === id) ?? mockContracts[0]

  const riskColor = contract.riskScore >= 70 ? "text-red-600 bg-red-50 border-red-200" :
    contract.riskScore >= 40 ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-emerald-600 bg-emerald-50 border-emerald-200"

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Contracts
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{contract.title}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              contract.status === "active" ? "bg-emerald-100 text-emerald-700" :
              contract.status === "under_review" ? "bg-amber-100 text-amber-700" :
              contract.status === "draft" ? "bg-slate-100 text-slate-600" :
              "bg-slate-100 text-slate-500"
            )}>
              {contract.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{contract.clientName} &middot; {contract.type}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-2", riskColor)}>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-lg font-bold">Risk: {contract.riskScore}/100</span>
          </div>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Download</Button>
          <Button variant="outline" size="sm"><Edit className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Effective Date", value: formatDate(contract.effectiveDate) },
          { label: "Expiration", value: contract.expirationDate ? formatDate(contract.expirationDate) : "N/A" },
          { label: "Contract Value", value: contract.value ? formatCurrency(contract.value) : "N/A" },
          { label: "Clauses", value: `${contract.clauses.length} total` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {contract.aiSummary && (
        <div className="rounded-xl border border-legal-200 bg-legal-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-legal-600 text-white">
              <FileSignature className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-legal-800">AI Contract Analysis</h3>
          </div>
          <p className="text-sm leading-relaxed text-legal-700">{contract.aiSummary}</p>
        </div>
      )}

      {/* Clauses */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Clause Analysis</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {contract.clauses.map((clause) => (
            <ClauseAnalyzer key={clause.id} clause={clause} />
          ))}
        </div>
      </div>
    </div>
  )
}
