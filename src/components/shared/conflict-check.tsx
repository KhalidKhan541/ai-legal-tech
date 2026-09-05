"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockMatters } from "@/lib/mock-data"
import {
  Scale,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  ArrowRight,
  Shield,
  RefreshCw,
} from "lucide-react"

interface ConflictResult {
  type: string
  description: string
  riskLevel: "low" | "medium" | "high" | "critical"
  relatedMatter?: string
}

export function ConflictCheck() {
  const [clientName, setClientName] = useState("")
  const [opposingParty, setOpposingParty] = useState("")
  const [checking, setChecking] = useState(false)
  const [results, setResults] = useState<ConflictResult[] | null>(null)

  const runCheck = async () => {
    if (!clientName) return
    setChecking(true)
    setResults(null)

    await new Promise((r) => setTimeout(r, 2000))

    // Simulate conflict check
    const mockResults: ConflictResult[] = []
    if (clientName.toLowerCase().includes("meridian")) {
      mockResults.push({
        type: "direct",
        description: `Client "${clientName}" is already represented in matter MAT-2025-00001 (Meridian v. TechVault)`,
        riskLevel: "critical",
        relatedMatter: "MAT-2025-00001",
      })
    }
    if (opposingParty && opposingParty.toLowerCase().includes("greenfield")) {
      mockResults.push({
        type: "related",
        description: `Opposing party "${opposingParty}" is a current client in MAT-2024-00004`,
        riskLevel: "high",
        relatedMatter: "MAT-2024-00004",
      })
    }

    setResults(mockResults)
    setChecking(false)
  }

  const riskStyles = {
    critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: XCircle },
    high: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: AlertTriangle },
    medium: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: AlertTriangle },
    low: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Shield className="h-4 w-4 text-slate-600" />
        <h2 className="text-base font-semibold text-slate-900">Conflict Check</h2>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Client Name</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter client name"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Opposing Party (optional)</label>
          <input
            value={opposingParty}
            onChange={(e) => setOpposingParty(e.target.value)}
            placeholder="Enter opposing party name"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          />
        </div>

        <Button onClick={runCheck} disabled={!clientName || checking} className="w-full">
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking conflicts...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Run Conflict Check
            </>
          )}
        </Button>

        {results !== null && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-emerald-700">No conflicts found</p>
                <p className="text-xs text-emerald-600">This client and opposing party are clear to proceed.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <AlertTriangle className="mx-auto h-6 w-6 text-red-500" />
                  <p className="mt-1 text-sm font-semibold text-red-700">
                    {results.length} conflict{results.length > 1 ? "s" : ""} detected
                  </p>
                </div>

                {results.map((result, i) => {
                  const style = riskStyles[result.riskLevel]
                  const Icon = style.icon
                  return (
                    <div key={i} className={cn("rounded-lg border p-3", style.bg, style.border)}>
                      <div className="flex items-start gap-2">
                        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.text)} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-semibold capitalize", style.text)}>
                              {result.type.replace(/_/g, " ")} conflict
                            </span>
                            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize", style.text, "bg-white/50")}>
                              {result.riskLevel}
                            </span>
                          </div>
                          <p className={cn("mt-1 text-xs leading-relaxed", style.text)}>
                            {result.description}
                          </p>
                          {result.relatedMatter && (
                            <button className={cn("mt-1 inline-flex items-center gap-1 text-[11px] font-medium", style.text)}>
                              View matter <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            <Button variant="outline" size="sm" className="w-full" onClick={runCheck}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Re-run Check
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
