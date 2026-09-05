"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { useDashboardStore } from "@/store"
import {
  GripVertical,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react"
import type { Task } from "@/store"

const columns = [
  { id: "todo" as const, label: "To Do", color: "bg-slate-500" },
  { id: "in_progress" as const, label: "In Progress", color: "bg-blue-500" },
  { id: "review" as const, label: "Review", color: "bg-amber-500" },
  { id: "done" as const, label: "Done", color: "bg-emerald-500" },
]

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-l-red-500",
  high: "bg-amber-50 text-amber-700 border-l-amber-500",
  medium: "bg-blue-50 text-blue-700 border-l-blue-500",
  low: "bg-slate-50 text-slate-600 border-l-slate-400",
}

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const moveTask = useDashboardStore((s) => s.moveTask)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault()
    if (draggedTask) {
      moveTask(draggedTask, targetStatus)
      setDraggedTask(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id)
        return (
          <div
            key={col.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", col.color)} />
                <h3 className="text-sm font-semibold text-slate-900">{col.label}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {colTasks.length}
                </span>
              </div>
              <button className="rounded p-1 hover:bg-slate-100 text-slate-400">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 p-3 min-h-[200px]">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  className={cn(
                    "group cursor-grab rounded-lg border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
                    priorityStyles[task.priority]
                  )}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium text-slate-900 line-clamp-2">{task.title}</h4>
                    <button className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100">
                      <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>

                  {task.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{task.description}</p>
                  )}

                  {task.matterTitle && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {task.matterTitle}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px]",
                          new Date(task.dueDate) < new Date() ? "text-red-500" : "text-slate-400"
                        )}>
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    {task.assigneeName && (
                      <div className="flex items-center gap-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-600">
                          {task.assigneeName.split(" ").map((n) => n[0]).join("")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {colTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-xs text-slate-400">No tasks</div>
                  <div className="text-[10px] text-slate-300">Drag tasks here</div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
