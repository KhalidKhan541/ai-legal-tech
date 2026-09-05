"use client"

import { use } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockDocuments } from "@/lib/mock-data"
import { DocumentViewer } from "@/components/documents/document-viewer"
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Share2,
  FileText,
  Clock,
  User,
  Tag,
  History,
  Eye,
  MessageSquare,
  Lock,
  CheckCircle2,
} from "lucide-react"

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const doc = mockDocuments.find((d) => d.id === id) ?? mockDocuments[0]

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const versions = [
    { version: doc.version, date: doc.uploadedAt, author: "Alexandra Reed", size: doc.size },
    ...(doc.version > 1 ? [{ version: doc.version - 1, date: "2025-08-01T00:00:00Z", author: "David Park", size: doc.size - 120000 }] : []),
    ...(doc.version > 2 ? [{ version: doc.version - 2, date: "2025-07-15T00:00:00Z", author: "Alexandra Reed", size: doc.size - 250000 }] : []),
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Documents
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{doc.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{doc.category}</span>
              <span>&middot;</span>
              <span>v{doc.version}</span>
              <span>&middot;</span>
              <span>{formatSize(doc.size)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Download</Button>
          <Button variant="outline" size="sm"><Share2 className="mr-1.5 h-3.5 w-3.5" />Share</Button>
          <Button variant="outline" size="sm"><Edit className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Preview</h2>
            </div>
            <div className="p-5">
              <DocumentViewer document={doc} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">AI Analysis</h2>
            </div>
            <div className="p-5">
              <div className="rounded-lg bg-legal-50 border border-legal-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-legal-600" />
                  <span className="text-sm font-medium text-legal-800">Document Summary</span>
                </div>
                <p className="text-sm text-legal-700 leading-relaxed">
                  This {doc.category.toLowerCase()} document is currently in <strong>{doc.status}</strong> status.
                  It has been tagged with: {doc.tags.join(", ")}. The document is {formatSize(doc.size)} in size
                  and is at version {doc.version}.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Details</h3>
            <dl className="space-y-3">
              {[
                { label: "Type", value: doc.type },
                { label: "Category", value: doc.category },
                { label: "Size", value: formatSize(doc.size) },
                { label: "MIME Type", value: doc.mimeType },
                { label: "Status", value: <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", doc.status === "draft" ? "bg-slate-100 text-slate-600" : doc.status === "review" ? "bg-amber-100 text-amber-700" : doc.status === "final" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{doc.status}</span> },
                { label: "Version", value: `v${doc.version}` },
                { label: "Uploaded", value: formatDate(doc.uploadedAt) },
                { label: "Uploaded By", value: doc.uploadedBy },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="text-sm text-slate-700">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Version History</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {versions.map((v) => (
                <div key={v.version} className="flex items-center gap-3 px-5 py-3">
                  <History className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">Version {v.version}</div>
                    <div className="text-xs text-slate-500">{v.author} &middot; {formatDate(v.date)}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="px-2">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
