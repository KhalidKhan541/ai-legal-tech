"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Bot,
  BookOpen,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Clock,
  Star,
  ChevronRight,
  Download,
  RefreshCw,
  Sparkles,
} from "lucide-react"

const mockResults = [
  {
    id: 1,
    title: "Oracle Am., Inc. v. Google LLC, 886 F.3d 1179 (Fed. Cir. 2019)",
    court: "Federal Circuit",
    year: 2019,
    citation: "886 F.3d 1179",
    relevance: 95,
    summary: "The Federal Circuit held that API declarations are copyrightable, but reversal on fair use grounds established important precedent for software interoperability. The Supreme Court later reversed on fair use.",
    keyPoints: [
      "API declarations are copyrightable subject matter",
      "Fair use defense applies to reimplementation for interoperability",
      "The merger doctrine and scènes à faire doctrines have limits in software context",
    ],
    status: "good_law",
    tags: ["copyright", "API", "software", "fair use"],
  },
  {
    id: 2,
    title: "Alice Corp. Pty. Ltd. v. CLS Bank Int'l, 573 U.S. 208 (2014)",
    court: "Supreme Court",
    year: 2014,
    citation: "573 U.S. 208",
    relevance: 88,
    summary: "Established the two-step framework for determining patent eligibility under 35 U.S.C. § 101. Abstract ideas implemented on generic computers are not patentable.",
    keyPoints: [
      "Two-step test: (1) determine if claim is directed to abstract idea, (2) if so, check for inventive concept",
      "Computer-implemented abstract ideas require an inventive concept to be patentable",
      "Merely implementing an abstract idea on a generic computer is insufficient",
    ],
    status: "good_law",
    tags: ["patent", "section 101", "abstract ideas", "software patents"],
  },
  {
    id: 3,
    title: "Nautilus, Inc. v. Biosig Instruments, Inc., 572 U.S. 898 (2014)",
    court: "Supreme Court",
    year: 2014,
    citation: "572 U.S. 898",
    relevance: 76,
    summary: "Clarified the definiteness requirement under 35 U.S.C. § 112, holding that a patent claim is indefinite only if it is insolubly ambiguous.",
    keyPoints: [
      "Claims must inform those skilled in the art about the scope of the invention with reasonable certainty",
      "Claims are not indefinite merely because they are subject to construction disputes",
      "Impossibility of determining scope is the standard, not mere difficulty",
    ],
    status: "good_law",
    tags: ["patent", "definiteness", "claim construction", "section 112"],
  },
]

export function ResearchPanel({ query }: { query: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-legal-600" />
            <h2 className="text-base font-semibold text-slate-900">Research Results</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLoading(!loading)}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="rounded-lg bg-slate-50 p-4 mb-4">
            <div className="flex items-start gap-3">
              <Bot className="mt-0.5 h-5 w-5 shrink-0 text-legal-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">AI Summary</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Based on the query &ldquo;{query}&rdquo;, I found {mockResults.length} highly relevant authorities
                  spanning Supreme Court and Federal Circuit precedent. The most relevant case addresses
                  the intersection of software copyright and patent eligibility, which appears directly
                  applicable to your research question.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {mockResults.map((result) => (
              <div key={result.id} className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{result.title}</h4>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        {result.court}
                      </span>
                      <span>{result.year}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {result.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-legal-50 px-2 py-1">
                    <Star className="h-3 w-3 text-legal-600" />
                    <span className="text-xs font-semibold text-legal-700">{result.relevance}%</span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">{result.summary}</p>

                <div className="mt-3">
                  <h5 className="text-xs font-semibold text-slate-500 mb-1">Key Holdings:</h5>
                  <ul className="space-y-1">
                    {result.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {result.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                    <Copy className="h-3 w-3" />
                    Copy citation
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                    <ExternalLink className="h-3 w-3" />
                    View full case
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
