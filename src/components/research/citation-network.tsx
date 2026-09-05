"use client"

import { cn } from "@/lib/utils"
import { Scale, ExternalLink, ArrowRight } from "lucide-react"

const nodes = [
  { id: "n1", label: "Alice Corp. v. CLS Bank", type: "supreme_court", x: 200, y: 80 },
  { id: "n2", label: "Oracle v. Google", type: "federal_circuit", x: 80, y: 200 },
  { id: "n3", label: "Bilski v. Kappos", type: "supreme_court", x: 320, y: 200 },
  { id: "n4", label: "Mayo v. Prometheus", type: "supreme_court", x: 200, y: 320 },
  { id: "n5", label: "Nautilus v. Biosig", type: "supreme_court", x: 80, y: 340 },
]

const edges = [
  { from: "n1", to: "n2", label: "distinguished" },
  { from: "n1", to: "n3", label: "followed" },
  { from: "n1", to: "n4", label: "related" },
  { from: "n3", to: "n4", label: "cited by" },
  { from: "n4", to: "n5", label: "cited by" },
]

const nodeColors: Record<string, string> = {
  supreme_court: "bg-red-100 border-red-300 text-red-800",
  federal_circuit: "bg-blue-100 border-blue-300 text-blue-800",
  district_court: "bg-slate-100 border-slate-300 text-slate-800",
}

export function CitationNetwork() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Citation Network</h2>
        <p className="text-xs text-slate-500">Related cases and citation relationships</p>
      </div>

      <div className="p-4">
        {/* Visual network */}
        <div className="relative rounded-lg border border-slate-200 bg-slate-50" style={{ height: "400px" }}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400">
            {edges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from)
              const toNode = nodes.find((n) => n.id === edge.to)
              if (!fromNode || !toNode) return null
              return (
                <g key={i}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray={edge.label === "distinguished" ? "4,4" : "none"}
                  />
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 - 5}
                    textAnchor="middle"
                    className="fill-slate-400 text-[8px]"
                  >
                    {edge.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              className={cn(
                "absolute flex items-center justify-center rounded-lg border px-2 py-1 text-[9px] font-medium shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                nodeColors[node.type]
              )}
              style={{
                left: `${(node.x / 400) * 100}%`,
                top: `${(node.y / 400) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <Scale className="mr-1 h-2.5 w-2.5" />
              {node.label.length > 20 ? node.label.slice(0, 20) + "..." : node.label}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-slate-500">Legend</h4>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Supreme Court", color: "bg-red-100 border-red-300" },
              { label: "Federal Circuit", color: "bg-blue-100 border-blue-300" },
              { label: "Related", color: "border-slate-300" },
              { label: "Distinguished", color: "border-slate-300 border-dashed" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={cn("h-2.5 w-2.5 rounded-sm border", item.color)} />
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick access list */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h4 className="mb-2 text-xs font-semibold text-slate-500">Key Authorities</h4>
          <div className="space-y-1.5">
            {nodes.slice(0, 4).map((node) => (
              <button
                key={node.id}
                className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-medium text-slate-700">{node.label}</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
