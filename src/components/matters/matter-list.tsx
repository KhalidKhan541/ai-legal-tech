"use client"

import { MatterCard } from "./matter-card"
import type { Matter } from "@/store"

export function MatterList({ matters }: { matters: Matter[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matters.map((matter) => (
        <MatterCard key={matter.id} matter={matter} />
      ))}
    </div>
  )
}
