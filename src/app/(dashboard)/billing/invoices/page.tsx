"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockInvoices } from "@/lib/mock-data"
import { InvoiceList } from "@/components/billing/invoice-list"
import {
  Plus,
  Search,
  Filter,
  FileText,
  DollarSign,
  Download,
  Send,
} from "lucide-react"

const statusFilters = ["all", "draft", "sent", "paid", "overdue", "void"] as const

export default function InvoicesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    let result = [...mockInvoices]
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(term) ||
          i.clientName.toLowerCase().includes(term)
      )
    }
    if (statusFilter !== "all") result = result.filter((i) => i.status === statusFilter)
    return result
  }, [search, statusFilter])

  const totalAmount = filtered.reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">{filtered.length} invoices &middot; {formatCurrency(totalAmount)} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <InvoiceList invoices={filtered} />
    </div>
  )
}
