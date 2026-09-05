"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockInvoices, mockTimeEntries } from "@/lib/mock-data"
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileText,
  Plus,
  BarChart3,
  Calendar,
  CreditCard,
} from "lucide-react"

export default function BillingPage() {
  const totalBilled = mockInvoices.reduce((s, i) => s + i.total, 0)
  const totalPaid = mockInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0)
  const totalOutstanding = mockInvoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.total, 0)
  const totalOverdue = mockInvoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.total, 0)
  const unbilledHours = mockTimeEntries.filter((t) => !t.billed).reduce((s, t) => s + t.hours, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing Dashboard</h1>
          <p className="text-sm text-slate-500">Track revenue, invoices, and outstanding balances</p>
        </div>
        <div className="flex gap-2">
          <Link href="/billing/invoices">
            <Button variant="outline" size="sm">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Invoices
            </Button>
          </Link>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Billed", value: formatCurrency(totalBilled), icon: DollarSign, color: "bg-blue-500", trend: "+12% this month" },
          { label: "Collected", value: formatCurrency(totalPaid), icon: CreditCard, color: "bg-emerald-500", trend: `${Math.round((totalPaid / totalBilled) * 100)}% of billed` },
          { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: TrendingUp, color: "bg-amber-500", trend: "Awaiting payment" },
          { label: "Overdue", value: formatCurrency(totalOverdue), icon: AlertTriangle, color: "bg-red-500", trend: totalOverdue > 0 ? "Requires attention" : "None" },
          { label: "Unbilled Hours", value: `${unbilledHours}h`, icon: Clock, color: "bg-violet-500", trend: `~${formatCurrency(unbilledHours * 400)} potential` },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-white", metric.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{metric.label}</div>
                  <div className="text-lg font-bold text-slate-900">{metric.value}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">{metric.trend}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue chart placeholder */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Revenue Overview</h2>
          <div className="flex items-center justify-center h-48 rounded-lg bg-slate-50">
            <div className="text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Revenue chart</p>
              <p className="text-xs text-slate-400">Integrate with charting library</p>
            </div>
          </div>
        </div>

        {/* Recent invoices */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Invoices</h2>
            <Link href="/billing/invoices">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {mockInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{inv.invoiceNumber}</div>
                  <div className="text-xs text-slate-500">{inv.clientName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(inv.total)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    inv.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                    inv.status === "overdue" ? "bg-red-100 text-red-700" :
                    inv.status === "sent" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  )}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unbilled time */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Unbilled Time Entries</h2>
          <Link href="/time">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {mockTimeEntries.filter((t) => !t.billed).slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{entry.description}</div>
                <div className="text-xs text-slate-500">{entry.matterTitle} &middot; {formatDate(entry.date)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-700">{entry.hours}h @ {formatCurrency(entry.rate)}/hr</span>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(entry.hours * entry.rate)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
