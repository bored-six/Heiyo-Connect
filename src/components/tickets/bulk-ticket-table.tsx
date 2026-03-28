"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { TicketStatus, Priority } from "@/lib/types"

const ALL_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]
import { bulkUpdateTickets, updateTicketStatus, assignTicket } from "@/actions/tickets"
import { TicketEmptyState } from "@/components/tickets/empty-state"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-slate-500/15 text-slate-400",
  MEDIUM: "bg-blue-500/15 text-blue-400",
  HIGH: "bg-orange-500/15 text-orange-400",
  CRITICAL: "bg-red-500/15 text-red-400",
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CUSTOMER: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

const STATUS_STYLE: Record<TicketStatus, { backgroundColor: string; color: string }> = {
  OPEN:                { backgroundColor: "rgba(16,185,129,0.15)",  color: "#34d399" },
  IN_PROGRESS:         { backgroundColor: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  WAITING_ON_CUSTOMER: { backgroundColor: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  RESOLVED:            { backgroundColor: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  CLOSED:              { backgroundColor: "rgba(100,116,139,0.10)", color: "#64748b" },
}

type SortField = "createdAt" | "priority" | "status" | "messages"
type SortDir = "asc" | "desc"

type Ticket = {
  id: string
  ticketNumber: number | null
  subject: string
  status: TicketStatus
  priority: Priority
  createdAt: Date
  customer: { name: string; email: string }
  assignedAgent: { id: string; name: string | null; avatarUrl: string | null } | null
  _count: { messages: number }
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  className,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDir: SortDir
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = currentSort === field
  const nextDir: SortDir = isActive && currentDir === "asc" ? "desc" : "asc"

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", field)
    params.set("dir", nextDir)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <th className={cn("text-left px-4 py-3 font-medium text-muted-foreground", className)}>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <span className={cn("text-xs", isActive ? "text-foreground" : "text-muted-foreground/40")}>
          {isActive ? (currentDir === "asc" ? "▲" : "▼") : "▲"}
        </span>
      </button>
    </th>
  )
}

export function BulkTicketTable({
  tickets,
  currentUserId,
  currentSort = "createdAt",
  currentDir = "desc",
  currentStatus,
  currentPriority,
}: {
  tickets: Ticket[]
  currentUserId: string
  currentSort?: SortField
  currentDir?: SortDir
  currentStatus?: TicketStatus | null
  currentPriority?: Priority | null
}) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [pending, setPending] = React.useState<"resolve" | "close" | "assign_me" | null>(null)
  const [pendingStatusId, setPendingStatusId] = React.useState<string | null>(null)
  const [optimisticStatuses, setOptimisticStatuses] = React.useState<Record<string, TicketStatus>>({})


  const allIds = tickets.map((t) => t.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulk(action: "resolve" | "close" | "assign_me") {
    if (selected.size === 0) return
    setPending(action)
    await bulkUpdateTickets({ ticketIds: Array.from(selected), action })
    setSelected(new Set())
    setPending(null)
    router.refresh()
  }

  async function handleStatusChange(ticketId: string, status: TicketStatus) {
    setOptimisticStatuses((prev) => ({ ...prev, [ticketId]: status }))
    setPendingStatusId(ticketId)
    await updateTicketStatus({ ticketId, status })
    setPendingStatusId(null)
    router.refresh()
  }

  async function handleResolve(ticketId: string) {
    await updateTicketStatus({ ticketId, status: "RESOLVED" })
    router.refresh()
  }

  async function handleAssignToMe(ticketId: string) {
    await assignTicket({ ticketId, agentId: currentUserId })
    router.refresh()
  }

  return (
    <div>
      {/* Bulk action toolbar */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30 text-sm transition-all",
          someSelected ? "opacity-100" : "opacity-0 pointer-events-none select-none"
        )}
      >
        <span className="text-muted-foreground font-medium">
          {selected.size} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <button
          onClick={() => handleBulk("resolve")}
          disabled={!!pending}
          className="rounded px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          {pending === "resolve" ? "Resolving…" : "Resolve"}
        </button>
        <button
          onClick={() => handleBulk("assign_me")}
          disabled={!!pending}
          className="rounded px-2.5 py-1 text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          {pending === "assign_me" ? "Assigning…" : "Assign to Me"}
        </button>
        <button
          onClick={() => handleBulk("close")}
          disabled={!!pending}
          className="rounded px-2.5 py-1 text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {pending === "close" ? "Closing…" : "Close"}
        </button>
        <button
          onClick={() => setSelected(new Set())}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-border"
                  aria-label="Select all tickets"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Ticket ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Customer</th>
              <SortableHeader label="Status" field="status" currentSort={currentSort} currentDir={currentDir} />
              <SortableHeader label="Priority" field="priority" currentSort={currentSort} currentDir={currentDir} />
              <SortableHeader label="Messages" field="messages" currentSort={currentSort} currentDir={currentDir} className="hidden md:table-cell" />
              <SortableHeader label="Created" field="createdAt" currentSort={currentSort} currentDir={currentDir} className="hidden md:table-cell" />
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tickets.length === 0 ? (
              <TicketEmptyState filtered={!!(currentStatus || currentPriority)} />
            ) : (
              tickets.map((ticket) => {
                const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                const isAssignedToMe = ticket.assignedAgent?.id === currentUserId
                const isSelected = selected.has(ticket.id)

                return (
                  <tr
                    key={ticket.id}
                    className={cn(
                      "hover:bg-muted/40 transition-colors group",
                      isSelected && "bg-blue-50/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(ticket.id)}
                        className="rounded border-border"
                        aria-label={`Select ticket ${ticket.ticketNumber}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs border-l-2 border-l-transparent group-hover:border-l-blue-400 transition-colors duration-150">
                      {ticket.ticketNumber != null ? `#${String(ticket.ticketNumber).padStart(3, "0")}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      <div>{ticket.customer.name}</div>
                      <div className="text-xs">{ticket.customer.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-flex items-center">
                        <select
                          value={optimisticStatuses[ticket.id] ?? ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={pendingStatusId === ticket.id}
                          style={{
                            ...STATUS_STYLE[optimisticStatuses[ticket.id] ?? ticket.status],
                            transition: "background-color 350ms ease, color 350ms ease",
                          }}
                          className="appearance-none rounded-full pl-2.5 pr-6 py-0.5 text-xs font-medium border-0 cursor-pointer outline-none disabled:opacity-60"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-background text-foreground">
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 h-3 w-3 pointer-events-none opacity-60" style={{ color: STATUS_STYLE[optimisticStatuses[ticket.id] ?? ticket.status].color }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {ticket._count.messages}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAssignToMe(ticket.id)}
                          disabled={!!isAssignedToMe}
                          className="rounded px-2 py-1 text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isAssignedToMe ? "Assigned" : "Assign to Me"}
                        </button>
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          disabled={isResolved}
                          className="rounded px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isResolved ? "Resolved" : "Resolve"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
