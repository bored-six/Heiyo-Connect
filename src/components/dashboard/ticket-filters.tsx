"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { TicketStatus, Priority } from "@prisma/client"
import { cn } from "@/lib/utils"

// Match STATUS_COLORS from ticket-table.tsx — active pill uses filled variant
const STATUS_ACTIVE: Record<TicketStatus, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-700 border-amber-300",
  RESOLVED: "bg-slate-200 text-slate-600 border-slate-400",
  CLOSED: "bg-slate-200 text-slate-500 border-slate-400",
}

const PRIORITY_ACTIVE: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-400",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-300",
  HIGH: "bg-orange-100 text-orange-700 border-orange-300",
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
}

const STATUS_OPTIONS: { label: string; value: TicketStatus | null }[] = [
  { label: "All", value: null },
  { label: "Open", value: TicketStatus.OPEN },
  { label: "In Progress", value: TicketStatus.IN_PROGRESS },
  { label: "Resolved", value: TicketStatus.RESOLVED },
]

const PRIORITY_OPTIONS: { label: string; value: Priority | null }[] = [
  { label: "All", value: null },
  { label: "Critical", value: Priority.CRITICAL },
  { label: "High", value: Priority.HIGH },
  { label: "Medium", value: Priority.MEDIUM },
  { label: "Low", value: Priority.LOW },
]

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

  function setFilter(key: "status" | "priority", value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const ghostBase =
    "rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer"
  const ghostInactive =
    "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Status filter group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium mr-0.5">Status:</span>
        {STATUS_OPTIONS.map(({ label, value }) => {
          const isActive = (value === null && !currentStatus) || currentStatus === value
          return (
            <button
              key={label}
              onClick={() =>
                setFilter("status", isActive && value !== null ? null : value)
              }
              className={cn(
                ghostBase,
                isActive && value !== null
                  ? STATUS_ACTIVE[value as TicketStatus]
                  : isActive
                  ? "border-foreground/40 text-foreground bg-muted/60"
                  : ghostInactive
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="w-px h-4 bg-border hidden sm:block" />

      {/* Priority filter group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium mr-0.5">Priority:</span>
        {PRIORITY_OPTIONS.map(({ label, value }) => {
          const isActive = (value === null && !currentPriority) || currentPriority === value
          return (
            <button
              key={label}
              onClick={() =>
                setFilter("priority", isActive && value !== null ? null : value)
              }
              className={cn(
                ghostBase,
                isActive && value !== null
                  ? PRIORITY_ACTIVE[value as Priority]
                  : isActive
                  ? "border-foreground/40 text-foreground bg-muted/60"
                  : ghostInactive
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
