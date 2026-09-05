"use client"

import { use } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockClients, mockMatters, mockInvoices } from "@/lib/mock-data"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  Edit,
  MoreHorizontal,
  ExternalLink,
  Clock,
  TrendingUp,
} from "lucide-react"

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const client = mockClients.find((c) => c.id === id) ?? mockClients[0]
  const clientMatters = mockMatters.filter((m) => m.clientId === client.id)
  const clientInvoices = mockInvoices.filter((i) => i.clientId === client.id)

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Clients
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-700">
            {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{client.email}</span>
              {client.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{client.phone}</span>}
            </div>
            {client.company && (
              <div className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                <Building2 className="h-3.5 w-3.5" />{client.company}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Edit className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
          <Button variant="outline" size="sm" className="px-2"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Matters", value: clientMatters.length, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
          { label: "Total Billed", value: formatCurrency(client.totalBilled), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
          { label: "Outstanding", value: formatCurrency(client.outstandingBalance), icon: TrendingUp, color: client.outstandingBalance > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600" },
          { label: "Client Since", value: formatDate(client.createdAt), icon: Clock, color: "bg-violet-50 text-violet-600" },
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
                  <div className="text-sm font-semibold text-slate-900">{stat.value}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Matters */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Matters ({clientMatters.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {clientMatters.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No matters for this client.</div>
            ) : clientMatters.map((matter) => (
              <Link key={matter.id} href={`/matters/${matter.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 truncate">{matter.title}</div>
                  <div className="text-xs text-slate-500">{matter.matterNumber}</div>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                  matter.status === "discovery" ? "bg-purple-100 text-purple-700" :
                  matter.status === "trial" ? "bg-amber-100 text-amber-700" :
                  matter.status === "appeal" ? "bg-orange-100 text-orange-700" :
                  "bg-slate-100 text-slate-600"
                )}>
                  {matter.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Invoices ({clientInvoices.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {clientInvoices.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No invoices for this client.</div>
            ) : clientInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{inv.invoiceNumber}</div>
                  <div className="text-xs text-slate-500">{formatDate(inv.issuedDate)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(inv.total)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    inv.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                    inv.status === "overdue" ? "bg-red-100 text-red-700" :
                    inv.status === "sent" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact & Address */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Contact Information</h3>
          <dl className="space-y-3">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-slate-400" /><dd className="text-sm text-slate-700">{client.email}</dd></div>
            {client.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-slate-400" /><dd className="text-sm text-slate-700">{client.phone}</dd></div>}
            {client.company && <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-slate-400" /><dd className="text-sm text-slate-700">{client.company}</dd></div>}
            {client.address && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-slate-400" /><dd className="text-sm text-slate-700">{client.address}</dd></div>}
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Notes</h3>
          <p className="text-sm text-slate-600">{client.notes || "No notes for this client."}</p>
        </div>
      </div>
    </div>
  )
}
