"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Filter,
} from "lucide-react"

const calendarEvents = [
  { id: 1, title: "Meridian v. TechVault - Discovery Deposition", date: "2025-09-05", time: "10:00 AM", type: "court", color: "bg-red-500", matter: "Meridian v. TechVault" },
  { id: 2, title: "Series D Partner Meeting", date: "2025-09-08", time: "2:00 PM", type: "meeting", color: "bg-blue-500", matter: "Meridian Series D" },
  { id: 3, title: "Trust Review - Sarah Chen", date: "2025-09-10", time: "11:00 AM", type: "meeting", color: "bg-emerald-500", matter: "Chen Estate Planning" },
  { id: 4, title: "Patent Response Filing Deadline", date: "2025-09-15", time: "5:00 PM", type: "deadline", color: "bg-amber-500", matter: "Meridian v. TechVault" },
  { id: 5, title: "Greenfield Lease Negotiation", date: "2025-09-18", time: "3:00 PM", type: "meeting", color: "bg-violet-500", matter: "Greenfield Lease" },
  { id: 6, title: "M&A Due Diligence Review", date: "2025-09-20", time: "9:00 AM", type: "meeting", color: "bg-blue-500", matter: "Greenfield M&A" },
  { id: 7, title: "Ninth Circuit Oral Argument", date: "2025-10-01", time: "9:00 AM", type: "court", color: "bg-red-500", matter: "PCEC v. State EPA" },
]

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return calendarEvents.filter((e) => e.date === dateStr)
  }

  const selectedEvents = selectedDate
    ? calendarEvents.filter((e) => e.date === selectedDate)
    : calendarEvents.filter((e) => {
        const eventDate = new Date(e.date)
        return eventDate.getMonth() === month && eventDate.getFullYear() === year
      }).slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500">Court dates, deadlines, and meetings</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar grid */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {months[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-slate-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(null) }} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-100">
                Today
              </button>
              <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-slate-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-px">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-medium text-slate-500">
                  {day}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 rounded-lg bg-slate-50/50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const events = getEventsForDate(day)
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                const isSelected = selectedDate === dateStr

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      "h-24 rounded-lg border border-transparent p-1 text-left transition-colors hover:border-slate-200",
                      isSelected && "border-slate-900 bg-slate-50",
                      isToday && !isSelected && "bg-blue-50"
                    )}
                  >
                    <span className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday ? "bg-slate-900 text-white" : "text-slate-700"
                    )}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {events.slice(0, 2).map((event) => (
                        <div key={event.id} className="flex items-center gap-1">
                          <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", event.color)} />
                          <span className="truncate text-[10px] text-slate-600">{event.title.split(" - ")[0]}</span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <span className="text-[10px] text-slate-400">+{events.length - 2} more</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - upcoming events */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {selectedDate ? `Events on ${formatDate(selectedDate)}` : "Upcoming Events"}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {selectedEvents.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No events scheduled
                </div>
              ) : (
                selectedEvents.map((event) => (
                  <div key={event.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", event.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{event.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{event.time}</span>
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{event.matter}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Event Types</h3>
            <div className="space-y-2">
              {[
                { label: "Court Date", color: "bg-red-500" },
                { label: "Deadline", color: "bg-amber-500" },
                { label: "Meeting", color: "bg-blue-500" },
              ].map((type) => (
                <div key={type.label} className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", type.color)} />
                  <span className="text-xs text-slate-600">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
