"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockDocuments } from "@/lib/mock-data"
import { DocumentGrid } from "@/components/documents/document-grid"
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  FileText,
  FolderOpen,
  Upload,
  X,
} from "lucide-react"

const categories = ["All", "Court Filings", "Research", "Drafts", "Contracts", "Transaction Documents", "Working Papers", "Intake"]
const statuses = ["all", "draft", "review", "final", "archived"] as const
const sortOptions = ["uploadedAt", "name", "size"] as const

export default function DocumentsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"uploadedAt" | "name" | "size">("uploadedAt")

  const filtered = useMemo(() => {
    let result = [...mockDocuments]
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((d) => d.name.toLowerCase().includes(term) || d.tags.some((t) => t.includes(term)))
    }
    if (category !== "All") result = result.filter((d) => d.category === category)
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter)
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "size") return b.size - a.size
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    })
    return result
  }, [search, category, statusFilter, sortBy])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Library</h1>
          <p className="text-sm text-slate-500">{filtered.length} documents</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none"
        >
          {statuses.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
        </select>
        <div className="flex rounded-md border border-slate-200">
          <button onClick={() => setViewMode("grid")} className={cn("flex h-10 w-10 items-center justify-center rounded-l-md", viewMode === "grid" ? "bg-slate-100" : "")}>
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={cn("flex h-10 w-10 items-center justify-center rounded-r-md border-l border-slate-200", viewMode === "list" ? "bg-slate-100" : "")}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              category === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No documents found</h3>
          <p className="mt-1 text-sm text-slate-500">Upload documents or adjust your filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <DocumentGrid documents={filtered} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filtered.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{doc.name}</div>
                  <div className="text-xs text-slate-500">{doc.category} &middot; v{doc.version}</div>
                </div>
                <span className="text-xs text-slate-500">{formatSize(doc.size)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                  doc.status === "draft" ? "bg-slate-100 text-slate-600" :
                  doc.status === "review" ? "bg-amber-100 text-amber-700" :
                  doc.status === "final" ? "bg-emerald-100 text-emerald-700" :
                  "bg-slate-100 text-slate-500"
                )}>{doc.status}</span>
                <span className="text-xs text-slate-400">{formatDate(doc.uploadedAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
