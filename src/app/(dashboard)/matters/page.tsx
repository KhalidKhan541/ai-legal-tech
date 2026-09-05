"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockMatters } from "@/lib/mock-data"
import { MatterCard } from "@/components/matters/matter-card"
import {
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Briefcase,
  SortAsc,
  X,
} from "lucide-react"

type ViewMode = "grid" | "list"
type SortBy = "updatedAt" | "title" | "priority" | "status" | "openDate"

const statusOptions = ["intake", "investigation", "discovery", "trial", "appeal", "closed"] as const
const priorityOptions = ["low", "medium", "high", "urgent"] as const
const typeOptions = ["litigation", "transaction", "advisory", "corporate", "real_estate", "ip", "other"] as const

export default function MattersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt")
  const [showFilters, setShowFilters] = useState(false)

  const filteredMatters = useMemo(() => {
    let result = [...mockMatters]

    if (searchQuery) {
      const term = searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.matterNumber.toLowerCase().includes(term) ||
          m.clientName.toLowerCase().includes(term)
      )
    }

    if (statusFilter.length > 0) {
      result = result.filter((m) => statusFilter.includes(m.status))
    }
    if (priorityFilter.length > 0) {
      result = result.filter((m) => priorityFilter.includes(m.priority))
    }
    if (typeFilter.length > 0) {
      result = result.filter((m) => typeFilter.includes(m.type))
    }

    result.sort((a, b) => {
      if (sortBy === "priority") {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 }
        return order[a.priority] - order[b.priority]
      }
      if (sortBy === "title") return a.title.localeCompare(b.title)
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
    })

    return result
  }, [searchQuery, statusFilter, priorityFilter, typeFilter, sortBy])

  const activeFilterCount = statusFilter.length + priorityFilter.length + typeFilter.length

  const toggleFilter = (value: string, filter: string[], setter: (v: string[]) => void) => {
    setter(
      filter.includes(value)
        ? filter.filter((f) => f !== value)
        : [...filter, value]
    )
  }

  const clearFilters = () => {
    setStatusFilter([])
    setPriorityFilter([])
    setTypeFilter([])
    setSearchQuery("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matters</h1>
          <p className="text-sm text-slate-500">
            {filteredMatters.length} matter{filteredMatters.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Matter
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by title, number, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            wrapperClassName="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-slate-100")}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="openDate">Open Date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
          <div className="flex rounded-md border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-l-md",
                viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-r-md border-l border-slate-200",
                viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-legal-600 hover:text-legal-700">
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-500">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleFilter(status, statusFilter, setStatusFilter)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      statusFilter.includes(status)
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-500">Priority</label>
              <div className="flex flex-wrap gap-1.5">
                {priorityOptions.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleFilter(p, priorityFilter, setPriorityFilter)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      priorityFilter.includes(p)
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-500">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleFilter(t, typeFilter, setTypeFilter)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      typeFilter.includes(t)
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusFilter.map((s) => (
            <span key={`s-${s}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Status: {s}
              <button onClick={() => toggleFilter(s, statusFilter, setStatusFilter)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {priorityFilter.map((p) => (
            <span key={`p-${p}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Priority: {p}
              <button onClick={() => toggleFilter(p, priorityFilter, setPriorityFilter)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Matters grid/list */}
      {filteredMatters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No matters found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery || activeFilterCount > 0
              ? "Try adjusting your search or filters."
              : "Create your first matter to get started."}
          </p>
          <Button className="mt-4" size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Matter
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatters.map((matter) => (
            <MatterCard key={matter.id} matter={matter} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filteredMatters.map((matter) => (
              <Link
                key={matter.id}
                href={`/matters/${matter.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{matter.title}</span>
                    {matter.isConfidential && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">CONFIDENTIAL</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                    <span>{matter.matterNumber}</span>
                    <span>&middot;</span>
                    <span>{matter.clientName}</span>
                    {matter.jurisdiction && (
                      <>
                        <span>&middot;</span>
                        <span>{matter.jurisdiction}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                    matter.priority === "urgent" ? "bg-red-100 text-red-700" :
                    matter.priority === "high" ? "bg-amber-100 text-amber-700" :
                    matter.priority === "medium" ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {matter.priority}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                    matter.status === "intake" ? "bg-slate-100 text-slate-700" :
                    matter.status === "investigation" ? "bg-blue-100 text-blue-700" :
                    matter.status === "discovery" ? "bg-purple-100 text-purple-700" :
                    matter.status === "trial" ? "bg-amber-100 text-amber-700" :
                    matter.status === "appeal" ? "bg-orange-100 text-orange-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {matter.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
