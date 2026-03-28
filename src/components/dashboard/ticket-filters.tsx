"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { TicketStatus, Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

export function TicketFilters({
  currentStatus,
  currentPriority,
}: {
  currentStatus?: TicketStatus | null
  currentPriority?: Priority | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setFilter(key: "status" | "priority", value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectClass = cn(
    "text-sm border rounded-md px-2 py-1 bg-background cursor-pointer",
    "text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  )

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus ?? ""}
        onChange={(e) => setFilter("status", e.target.value)}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">Status: All</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      <select
        value={currentPriority ?? ""}
        onChange={(e) => setFilter("priority", e.target.value)}
        className={selectClass}
        aria-label="Filter by priority"
      >
        <option value="">Priority: All</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
    </div>
  )
}
