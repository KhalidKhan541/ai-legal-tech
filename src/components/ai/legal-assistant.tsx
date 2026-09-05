"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Bot,
  Send,
  Paperclip,
  Mic,
  Sparkles,
  FileText,
  Scale,
  Search,
  BookOpen,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const suggestedPrompts = [
  { icon: FileText, label: "Review contract" },
  { icon: Scale, label: "Legal research" },
  { icon: Search, label: "Analyze case" },
  { icon: BookOpen, label: "Summarize doc" },
]

export function LegalAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI legal assistant. I can help with contract review, legal research, document analysis, and more. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    await new Promise((r) => setTimeout(r, 1200))

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `I've analyzed your query. Based on the relevant legal authorities and case law, here's what I found:\n\n1. **Primary Issue**: The matter involves questions of contractual interpretation.\n2. **Key Precedent**: Recent case law suggests a favorable interpretation.\n3. **Recommendation**: Consider the following approach.\n\nWould you like me to elaborate on any of these points?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, aiMsg])
    setIsTyping(false)
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-legal-500 to-legal-700">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">LexAI Assistant</h3>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px] scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "")}>
            {msg.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-legal-100">
                <Bot className="h-3 w-3 text-legal-600" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed",
              msg.role === "user"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-900"
            )}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className={cn("mt-1 text-[9px]", msg.role === "user" ? "text-slate-400" : "text-slate-400")}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-legal-100">
              <Bot className="h-3 w-3 text-legal-600" />
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="border-t border-slate-100 px-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((sp) => {
              const Icon = sp.icon
              return (
                <button
                  key={sp.label}
                  onClick={() => setInput(sp.label)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                >
                  <Icon className="h-2.5 w-2.5" />
                  {sp.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-end gap-2">
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <Mic className="h-3.5 w-3.5" />
          </button>
          <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="sm">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
