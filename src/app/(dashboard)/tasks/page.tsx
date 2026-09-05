"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockTasks } from "@/lib/mock-data"
import { TaskBoard } from "@/components/tasks/task-board"
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  List,
  LayoutGrid,
  Calendar,
  Clock,
} from "lucide-react"

type ViewMode = "board" | "list"

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("board")
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

  const filtered = mockTasks.filter((t) => {
    if (search) {
      const term = search.toLowerCase()
      if (!t.title.toLowerCase().includes(term) && !(t.matterTitle?.toLowerCase().includes(term))) return false
    }
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  const stats = {
    total: mockTasks.length,
    todo: mockTasks.filter((t) => t.status === "todo").length,
    inProgress: mockTasks.filter((t) => t.status === "in_progress").length,
    review: mockTasks.filter((t) => t.status === "review").length,
    done: mockTasks.filter((t) => t.status === "done").length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
          <p className="text-sm text-slate-500">{stats.total} tasks &middot; {stats.inProgress} in progress</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "To Do", value: stats.todo, color: "text-slate-600" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
          { label: "Review", value: stats.review, color: "text-amber-600" },
          { label: "Done", value: stats.done, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          />
        </div>
        <div className="flex gap-2">
          {["urgent", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                priorityFilter === p ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-slate-200">
          <button
            onClick={() => setViewMode("board")}
            className={cn("flex h-10 w-10 items-center justify-center rounded-l-md", viewMode === "board" ? "bg-slate-100" : "")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("flex h-10 w-10 items-center justify-center rounded-r-md border-l border-slate-200", viewMode === "list" ? "bg-slate-100" : "")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "board" ? (
        <TaskBoard tasks={filtered} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filtered.map((task) => (
              <div key={task.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <div className={cn("h-2 w-2 rounded-full shrink-0",
                  task.status === "done" ? "bg-emerald-500" :
                  task.status === "in_progress" ? "bg-blue-500" :
                  task.status === "review" ? "bg-amber-500" :
                  "bg-slate-300"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                  <div className="text-xs text-slate-500">{task.matterTitle}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{task.assigneeName}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    task.priority === "urgent" ? "bg-red-100 text-red-700" :
                    task.priority === "high" ? "bg-amber-100 text-amber-700" :
                    task.priority === "medium" ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  )}>{task.priority}</span>
                  {task.dueDate && <span className="text-xs text-slate-400">{formatDate(task.dueDate)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
