"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockMatters } from "@/lib/mock-data"
import {
  Play,
  Pause,
  StopCircle,
  Clock,
  CheckCircle2,
} from "lucide-react"

const categories = [
  { id: "meeting", label: "Meeting" },
  { id: "research", label: "Research" },
  { id: "drafting", label: "Drafting" },
  { id: "court", label: "Court" },
  { id: "travel", label: "Travel" },
  { id: "admin", label: "Admin" },
  { id: "other", label: "Other" },
]

export function TimeTracker() {
  const [isTracking, setIsTracking] = useState(false)
  const [description, setDescription] = useState("")
  const [selectedMatter, setSelectedMatter] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("research")
  const [elapsed, setElapsed] = useState(0)

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {/* Timer display */}
      <div className="text-center">
        <div className={cn(
          "text-3xl font-bold font-mono",
          isTracking ? "text-red-600" : "text-slate-900"
        )}>
          {formatTime(elapsed)}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {isTracking ? "Recording..." : "Ready to track"}
        </div>
      </div>

      {/* Matter selection */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Matter</label>
        <select
          value={selectedMatter}
          onChange={(e) => setSelectedMatter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
        >
          <option value="">Select a matter</option>
          {mockMatters.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isTracking ? (
          <Button
            onClick={() => setIsTracking(true)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            size="sm"
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Start
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setIsTracking(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Pause className="mr-1.5 h-3.5 w-3.5" />
              Pause
            </Button>
            <Button
              onClick={() => {
                setIsTracking(false)
                setElapsed(0)
              }}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <StopCircle className="mr-1.5 h-3.5 w-3.5" />
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
