"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockClients } from "@/lib/mock-data"
import { ClientCard } from "@/components/clients/client-card"
import {
  Plus,
  Search,
  Users,
  Filter,
  Building2,
  User,
} from "lucide-react"
import { useState } from "react"

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const filtered = mockClients.filter((c) => {
    if (search) {
      const term = search.toLowerCase()
      if (!c.name.toLowerCase().includes(term) && !c.email.toLowerCase().includes(term)) return false
    }
    if (typeFilter && c.type !== typeFilter) return false
    return true
  })

  const totalBilled = mockClients.reduce((s, c) => s + c.totalBilled, 0)
  const totalOutstanding = mockClients.reduce((s, c) => s + c.outstandingBalance, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{mockClients.length} clients &middot; {formatCurrency(totalBilled)} total billed</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Total Clients</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{mockClients.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Total Billed</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totalBilled)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Outstanding</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          {["individual", "corporate", "nonprofit", "government"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                typeFilter === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No clients found</h3>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode; wrapperClassName?: string }) {
  const { leftIcon, wrapperClassName, className, ...rest } = props
  return (
    <div className={cn("relative", wrapperClassName)}>
      {leftIcon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">{leftIcon}</div>}
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          leftIcon && "pl-10",
          className
        )}
        {...rest}
      />
    </div>
  )
}
