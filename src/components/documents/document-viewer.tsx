"use client"

import { cn } from "@/lib/utils"
import { FileText, Download, Maximize2, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import type { Document } from "@/store"

export function DocumentViewer({ document }: { document: Document }) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
        <div className="flex items-center gap-2">
          <button className="rounded p-1.5 hover:bg-slate-200 text-slate-500">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-slate-600">100%</span>
          <button className="rounded p-1.5 hover:bg-slate-200 text-slate-500">
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-slate-300" />
          <button className="rounded p-1.5 hover:bg-slate-200 text-slate-500">
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded p-1.5 hover:bg-slate-200 text-slate-500">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 hover:bg-slate-200 text-slate-500">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Document preview placeholder */}
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-base font-medium text-slate-700">{document.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {document.mimeType} &middot; Version {document.version}
          </p>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-slate-400">Document preview would render here</p>
            <p className="text-xs text-slate-400">Supports PDF, DOCX, and image formats</p>
          </div>
        </div>
      </div>
    </div>
  )
}
