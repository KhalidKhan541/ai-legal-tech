"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ResearchPanel } from "@/components/research/research-panel"
import { CitationNetwork } from "@/components/research/citation-network"
import {
  Search,
  Bot,
  BookOpen,
  Scale,
  Filter,
  Clock,
  Star,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react"

const recentSearches = [
  "Patent claim construction standards under Oracle v. Google",
  "Clean Water Act § 402 permit requirements",
  "California non-compete enforceability Bus. & Prof. Code 16600",
  "Series D preferred stock standard terms 2025",
]

const suggestedTopics = [
  { icon: Scale, title: "Patent Infringement Standards", count: "2,847 results" },
  { icon: BookOpen, title: "Environmental Regulations", count: "1,234 results" },
  { icon: Scale, title: "Corporate Finance Law", count: "3,567 results" },
  { icon: BookOpen, title: "Real Estate Lease Law", count: "987 results" },
]

export default function ResearchPage() {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) setShowResults(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Legal Research</h1>
          <p className="text-sm text-slate-500">AI-powered legal research with citation verification</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ask a legal question in plain English..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-32 py-4 text-base placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button type="submit" size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Research
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Recent:</span>
          {recentSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => { setQuery(s); setShowResults(true) }}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {s.length > 50 ? s.slice(0, 50) + "..." : s}
            </button>
          ))}
        </div>
      </div>

      {showResults ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ResearchPanel query={query} />
          </div>
          <div>
            <CitationNetwork />
          </div>
        </div>
      ) : (
        <>
          {/* Suggested topics */}
          <div>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Suggested Research Areas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {suggestedTopics.map((topic) => {
                const Icon = topic.icon
                return (
                  <button
                    key={topic.title}
                    onClick={() => { setQuery(topic.title); setShowResults(true) }}
                    className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-legal-50 group-hover:text-legal-600 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">{topic.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{topic.count}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI capabilities */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">AI Research Capabilities</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: Bot, title: "Natural Language Queries", desc: "Ask questions in plain English. Our AI understands legal context and nuance." },
                { icon: BookOpen, title: "Citation Verification", desc: "Every citation is verified against primary sources. Check case status and good law." },
                { icon: Scale, title: "Jurisdiction Analysis", desc: "Get jurisdiction-specific analysis with relevant precedent and statutory authority." },
              ].map((cap) => {
                const Icon = cap.icon
                return (
                  <div key={cap.title} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-legal-50 text-legal-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{cap.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{cap.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
