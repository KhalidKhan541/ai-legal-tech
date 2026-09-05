"use client"

import { use } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockMatters } from "@/lib/mock-data"
import { TimelineView } from "@/components/matters/timeline-view"
import { ArrowLeft, Filter, Download } from "lucide-react"

const mockTimelineEvents = [
  { id: "1", type: "matter_created", title: "Matter Created", date: "2025-02-10T00:00:00Z", description: "Matter \"Meridian v. TechVault Patent Dispute\" was opened for intake." },
  { id: "2", type: "conflict_check", title: "Conflict Check Completed", date: "2025-02-10T12:00:00Z", description: "Conflict check cleared. No conflicts found with existing matters." },
  { id: "3", type: "assignment", title: "Attorney Assigned", date: "2025-02-11T00:00:00Z", description: "Alexandra Reed assigned as lead attorney. David Park assigned as associate." },
  { id: "4", type: "status_change", title: "Status: Investigation", date: "2025-02-15T00:00:00Z", description: "Matter progressed from intake to investigation phase." },
  { id: "5", type: "note_added", title: "Initial Case Assessment", date: "2025-02-20T00:00:00Z", description: "Case assessment complete. Three patents at issue: US 11,234,567; US 11,345,678; US 11,456,789. All relate to neural network optimization." },
  { id: "6", type: "document_added", title: "Complaint Filed", date: "2025-03-01T00:00:00Z", description: "Patent infringement complaint filed with U.S. District Court, Northern District of California. Case number: 3:25-cv-04821." },
  { id: "7", type: "status_change", title: "Status: Discovery", date: "2025-05-15T00:00:00Z", description: "Matter progressed to discovery phase. Document production and depositions scheduled." },
  { id: "8", type: "deadline", title: "SOL Reminder", date: "2025-06-01T00:00:00Z", description: "Statute of limitations for counterclaim: February 10, 2026." },
  { id: "9", type: "note_added", title: "Expert Witness Retained", date: "2025-07-15T00:00:00Z", description: "Dr. Sarah Kim (MIT) retained as technical expert for patent claim construction analysis." },
  { id: "10", type: "document_added", title: "Discovery Responses Due", date: "2025-08-15T00:00:00Z", description: "First set of interrogatories and document requests served on defendant." },
]

export default function MatterTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const matter = mockMatters.find((m) => m.id === id) ?? mockMatters[0]

  const typeCounts = mockTimelineEvents.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href={`/matters/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Matter
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Case Timeline</h1>
          <p className="text-sm text-slate-500">
            {matter.title} &middot; {matter.matterNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filter Events
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total Events", value: mockTimelineEvents.length, color: "text-slate-900" },
          { label: "Documents", value: typeCounts["document_added"] || 0, color: "text-blue-600" },
          { label: "Status Changes", value: typeCounts["status_change"] || 0, color: "text-purple-600" },
          { label: "Notes", value: typeCounts["note_added"] || 0, color: "text-emerald-600" },
          { label: "Deadlines", value: typeCounts["deadline"] || 0, color: "text-amber-600" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
            <div className={cn("text-xl font-bold", item.color)}>{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Activity Timeline</h2>
        </div>
        <div className="p-5">
          <TimelineView events={mockTimelineEvents} />
        </div>
      </div>
    </div>
  )
}
