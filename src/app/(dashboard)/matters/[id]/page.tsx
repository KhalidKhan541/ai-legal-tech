"use client"

import { use } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockMatters, mockDocuments, mockTasks, mockClients } from "@/lib/mock-data"
import { TimelineView } from "@/components/matters/timeline-view"
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Users,
  FileText,
  Clock,
  DollarSign,
  Calendar,
  AlertTriangle,
  Scale,
  Bot,
  MessageSquare,
  Download,
  ExternalLink,
  Copy,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react"

const statusColors: Record<string, string> = {
  intake: "bg-slate-100 text-slate-700 border-slate-200",
  investigation: "bg-blue-50 text-blue-700 border-blue-200",
  discovery: "bg-purple-50 text-purple-700 border-purple-200",
  trial: "bg-amber-50 text-amber-700 border-amber-200",
  appeal: "bg-orange-50 text-orange-700 border-orange-200",
  closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-50 text-slate-500 border-slate-200",
}

const statusSteps = ["intake", "investigation", "discovery", "trial", "appeal", "closed"]

export default function MatterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const matter = mockMatters.find((m) => m.id === id) ?? mockMatters[0]
  const client = mockClients.find((c) => c.id === matter.clientId)
  const matterDocs = mockDocuments.filter((d) => d.matterId === matter.id)
  const matterTasks = mockTasks.filter((t) => t.matterId === matter.id)

  const currentIndex = statusSteps.indexOf(matter.status)
  const budgetPercent = matter.budget
    ? Math.round((matter.budget.spentHours / matter.budget.estimatedHours) * 100)
    : null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link href="/matters" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Matters
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{matter.title}</h1>
            {matter.isConfidential && (
              <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">CONFIDENTIAL</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{matter.matterNumber}</span>
            <span>&middot;</span>
            <span>{matter.clientName}</span>
            {matter.courtCaseNumber && (
              <>
                <span>&middot;</span>
                <span>Case #{matter.courtCaseNumber}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bot className="mr-1.5 h-3.5 w-3.5" />
            AI Summary
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="px-2">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status pipeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold capitalize transition-colors",
                    i <= currentIndex
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-400"
                  )}
                >
                  {i < currentIndex ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={cn(
                  "mt-1.5 text-[11px] font-medium capitalize",
                  i <= currentIndex ? "text-slate-900" : "text-slate-400"
                )}>
                  {step}
                </span>
              </div>
              {i < statusSteps.length - 1 && (
                <div className={cn(
                  "mx-2 h-0.5 w-12 sm:w-20 lg:w-28",
                  i < currentIndex ? "bg-slate-900" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Description</h2>
            <p className="text-sm leading-relaxed text-slate-600">{matter.description}</p>
            {matter.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {matter.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Timeline</h2>
              <Link href={`/matters/${matter.id}/timeline`}>
                <Button variant="ghost" size="sm">
                  Full timeline <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="p-5">
              <TimelineView events={[
                { id: "1", type: "matter_created", title: "Matter Created", date: matter.createdAt, description: `Matter "${matter.title}" was created` },
                { id: "2", type: "status_change", title: "Status Updated", date: matter.updatedAt, description: `Status changed to ${matter.status}` },
              ]} />
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Documents
                <span className="ml-2 text-sm font-normal text-slate-400">({matterDocs.length})</span>
              </h2>
              <Link href="/documents">
                <Button variant="ghost" size="sm">
                  View all <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {matterDocs.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{doc.name}</div>
                    <div className="text-xs text-slate-500">{doc.category} &middot; v{doc.version}</div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    doc.status === "draft" ? "bg-slate-100 text-slate-600" :
                    doc.status === "review" ? "bg-amber-100 text-amber-700" :
                    doc.status === "final" ? "bg-emerald-100 text-emerald-700" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Matter Details</h3>
            <dl className="space-y-3">
              {[
                { label: "Status", value: <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border", statusColors[matter.status])}>{matter.status}</span> },
                { label: "Priority", value: <span className="text-sm font-medium capitalize">{matter.priority}</span> },
                { label: "Type", value: <span className="text-sm capitalize">{matter.type.replace("_", " ")}</span> },
                { label: "Open Date", value: formatDate(matter.openDate) },
                matter.statuteOfLimitations && { label: "SOL", value: formatDate(matter.statuteOfLimitations), highlight: true },
                matter.courtName && { label: "Court", value: matter.courtName },
                matter.judgeName && { label: "Judge", value: matter.judgeName },
                matter.opposingParty && { label: "Opposing Party", value: matter.opposingParty },
                matter.opposingCounsel && { label: "Opposing Counsel", value: matter.opposingCounsel },
                matter.jurisdiction && { label: "Jurisdiction", value: matter.jurisdiction },
                matter.practiceArea && { label: "Practice Area", value: matter.practiceArea },
              ].filter(Boolean).map((item, i) => item && (
                <div key={i} className="flex items-center justify-between">
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className={cn("text-sm", item.highlight ? "font-medium text-amber-600" : "text-slate-700")}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Budget */}
          {budgetPercent !== null && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Budget</h3>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(matter.budget!.spentAmount)}
                </span>
                <span className="text-xs text-slate-500">
                  of {formatCurrency(matter.budget!.totalBudget)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    budgetPercent > 90 ? "bg-red-500" : budgetPercent > 70 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>{matter.budget!.spentHours}h / {matter.budget!.estimatedHours}h</span>
                <span>{budgetPercent}%</span>
              </div>
            </div>
          )}

          {/* Tasks */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Tasks ({matterTasks.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {matterTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    {task.status === "done" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm",
                        task.status === "done" ? "text-slate-400 line-through" : "text-slate-900"
                      )}>
                        {task.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {task.assigneeName} &middot; {formatDate(task.dueDate ?? "")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Conflict Check</h3>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">Cleared</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Last checked: {formatDate(matter.updatedAt)}
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              <Scale className="mr-1.5 h-3.5 w-3.5" />
              Re-run Conflict Check
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
