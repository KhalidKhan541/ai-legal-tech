"use client"

import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Download,
  Send,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
} from "lucide-react"
import type { Invoice } from "@/store"

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { color: "bg-slate-100 text-slate-600", icon: FileText },
  sent: { color: "bg-blue-100 text-blue-700", icon: Send },
  paid: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  overdue: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
  void: { color: "bg-slate-100 text-slate-500", icon: Clock },
}

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Issued</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice) => {
              const config = statusConfig[invoice.status]
              const Icon = config.icon
              return (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{invoice.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <div className="text-sm text-slate-900">{invoice.clientName}</div>
                      {invoice.matterTitle && (
                        <div className="text-xs text-slate-500">{invoice.matterTitle}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold text-slate-900">{formatCurrency(invoice.total)}</div>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(invoice.amount)} + {formatCurrency(invoice.tax)} tax
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", config.color)}>
                      <Icon className="h-3 w-3" />
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">{formatDate(invoice.issuedDate)}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{formatDate(invoice.dueDate)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded p-1.5 hover:bg-slate-100 text-slate-400">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded p-1.5 hover:bg-slate-100 text-slate-400">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {invoice.status === "draft" && (
                        <button className="rounded p-1.5 hover:bg-slate-100 text-slate-400">
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button className="rounded p-1.5 hover:bg-slate-100 text-slate-400">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {invoices.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No invoices found.</p>
        </div>
      )}
    </div>
  )
}
