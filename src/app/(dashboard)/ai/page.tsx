"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LegalAssistant } from "@/components/ai/legal-assistant"
import {
  Bot,
  Sparkles,
  FileText,
  Scale,
  Search,
  MessageSquare,
  Zap,
  BookOpen,
  Clock,
  Send,
  Paperclip,
  Mic,
} from "lucide-react"

const suggestedPrompts = [
  { icon: FileText, label: "Review a contract", prompt: "Review the attached contract and identify any high-risk clauses that need negotiation." },
  { icon: Scale, label: "Legal research", prompt: "Research the latest case law on patent claim construction under Oracle v. Google." },
  { icon: Search, label: "Case analysis", prompt: "Analyze the strength of our patent infringement claims in Meridian v. TechVault." },
  { icon: BookOpen, label: "Summarize document", prompt: "Summarize the key provisions and obligations in the Commercial Sublease agreement." },
]

const chatHistory = [
  {
    role: "assistant" as const,
    content: "Hello! I'm LexAI, your AI legal assistant. I can help you with contract review, legal research, document analysis, and more. How can I assist you today?",
    timestamp: "10:00 AM",
  },
]

export default function AIPage() {
  const [messages, setMessages] = useState(chatHistory)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1500))

    const aiResponse = {
      role: "assistant" as const,
      content: `I've analyzed your request regarding "${input.slice(0, 50)}...". Based on my analysis of the relevant case law and legal precedents, here are my findings:\n\n1. **Key Issue**: The primary legal question involves interpretation of contractual provisions.\n2. **Relevant Authority**: Based on recent decisions in this jurisdiction, courts have generally...\n3. **Recommendation**: I recommend reviewing the following provisions and considering the suggested amendments.\n\nWould you like me to elaborate on any of these points or generate a more detailed analysis?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, aiResponse])
    setIsTyping(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar - capabilities */}
        <div className="hidden lg:block space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">AI Capabilities</h3>
            <div className="space-y-3">
              {[
                { icon: FileText, label: "Contract Review", desc: "Analyze contracts, identify risks" },
                { icon: Scale, label: "Legal Research", desc: "Find case law, statutes, regulations" },
                { icon: Search, label: "Case Analysis", desc: "Evaluate case strengths and strategies" },
                { icon: BookOpen, label: "Document Summary", desc: "Summarize lengthy legal documents" },
                { icon: Zap, label: "Draft Generation", desc: "Generate first drafts of legal documents" },
                { icon: MessageSquare, label: "Client Communication", desc: "Draft client emails and letters" },
              ].map((cap) => {
                const Icon = cap.icon
                return (
                  <div key={cap.label} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{cap.label}</div>
                      <div className="text-xs text-slate-500">{cap.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Conversations</h3>
            <div className="space-y-2">
              {["Contract review - SaaS License", "Patent infringement analysis", "Lease negotiation strategy"].map((conv, i) => (
                <button key={i} className="w-full rounded-lg p-2 text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  {conv}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-legal-500 to-legal-700">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">LexAI Assistant</h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online &middot; Powered by GPT-4
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-legal-100">
                      <Bot className="h-4 w-4 text-legal-600" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-900"
                  )}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    <div className={cn(
                      "mt-1 text-[10px]",
                      msg.role === "user" ? "text-slate-400" : "text-slate-400"
                    )}>
                      {msg.timestamp}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                      AR
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-legal-100">
                    <Bot className="h-4 w-4 text-legal-600" />
                  </div>
                  <div className="rounded-xl bg-slate-100 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
              <div className="border-t border-slate-100 px-5 py-3">
                <div className="text-xs font-medium text-slate-500 mb-2">Suggested:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((sp) => {
                    const Icon = sp.icon
                    return (
                      <button
                        key={sp.label}
                        onClick={() => setInput(sp.prompt)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        <Icon className="h-3 w-3" />
                        {sp.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-200 p-4">
              <div className="flex items-end gap-2">
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <Paperclip className="h-4 w-4" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask LexAI anything about your legal matters..."
                    className="flex min-h-[44px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                </div>
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <Mic className="h-4 w-4" />
                </button>
                <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 text-center">
                LexAI provides legal information, not legal advice. Always verify AI-generated content with authoritative sources.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
