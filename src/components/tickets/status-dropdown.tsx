"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateTicketStatus } from "@/actions/tickets"

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED"

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CUSTOMER: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

const ALL_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]

export function StatusDropdown({
  ticketId,
  currentStatus,
}: {
  ticketId: string
  currentStatus: TicketStatus
}) {
  const [selected, setSelected] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    const next = value as TicketStatus
    const previous = selected
    setSelected(next)
    startTransition(async () => {
      const result = await updateTicketStatus({ ticketId, status: next })
      if (result.success) {
        toast.success(`Status set to ${STATUS_LABELS[next]}`)
      } else {
        setSelected(previous)
        toast.error(result.error ?? "Failed to update status")
      }
    })
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Status
      </label>
      <select
        value={selected}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 cursor-pointer"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {isPending && <p className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  )
}
