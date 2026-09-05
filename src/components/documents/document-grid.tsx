"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { FileText, Download, MoreHorizontal, Eye, Tag, Clock } from "lucide-react"
import type { Document } from "@/store"

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  review: "bg-amber-100 text-amber-700",
  final: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-100 text-slate-500",
}

const typeIcons: Record<string, string> = {
  legal_filing: "📄",
  analysis: "📊",
  contract: "📝",
  financial: "💰",
  spreadsheet: "📊",
  form: "📋",
}

export function DocumentGrid({ documents }: { documents: Document[] }) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <Link key={doc.id} href={`/documents/${doc.id}`}>
          <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg">
                {typeIcons[doc.type] || "📄"}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="rounded p-1 hover:bg-slate-100">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                </button>
                <button className="rounded p-1 hover:bg-slate-100">
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <h3 className="mt-3 text-sm font-medium text-slate-900 truncate group-hover:text-legal-700 transition-colors">
              {doc.name}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>{doc.category}</span>
              <span>&middot;</span>
              <span>v{doc.version}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {doc.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {formatDate(doc.uploadedAt)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{formatSize(doc.size)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", statusColors[doc.status])}>
                  {doc.status}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
