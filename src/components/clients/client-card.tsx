"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Mail, Phone, Building2, MapPin, ChevronRight, Briefcase, DollarSign } from "lucide-react"
import type { Client } from "@/store"

const typeColors: Record<string, string> = {
  individual: "bg-blue-100 text-blue-700",
  corporate: "bg-violet-100 text-violet-700",
  nonprofit: "bg-emerald-100 text-emerald-700",
  government: "bg-amber-100 text-amber-700",
}

export function ClientCard({ client }: { client: Client }) {
  const initials = client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)

  return (
    <Link href={`/clients/${client.id}`}>
      <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-600 group-hover:bg-legal-50 group-hover:text-legal-700 transition-colors">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-legal-700 transition-colors">
                {client.name}
              </h3>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", typeColors[client.type])}>
                {client.type}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              {client.company && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {client.company}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <DollarSign className="h-3 w-3" />
              Total Billed
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">{formatCurrency(client.totalBilled)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Briefcase className="h-3 w-3" />
              Matters
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">{client.matters.length}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {client.email.length > 25 ? client.email.slice(0, 25) + "..." : client.email}
          </span>
          {client.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {client.phone}
            </span>
          )}
        </div>

        {client.outstandingBalance > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            Outstanding balance: {formatCurrency(client.outstandingBalance)}
          </div>
        )}
      </div>
    </Link>
  )
}
