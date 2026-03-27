"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { TicketStatus, Priority } from "@prisma/client"
import { updateTicketStatus, assignTicket } from "@/actions/tickets"
import { TicketEmptyState } from "@/components/tickets/empty-state"
import { useTicketSocket } from "@/hooks/useTicketSocket"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-slate-500/15 text-slate-400",
  MEDIUM: "bg-blue-500/15 text-blue-400",
  HIGH: "bg-orange-500/15 text-orange-400",
  CRITICAL: "bg-red-500/15 text-red-400",
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "bg-emerald-500/15 text-emerald-400",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400",
  WAITING_ON_CUSTOMER: "bg-amber-500/15 text-amber-400",
  RESOLVED: "bg-slate-500/15 text-slate-400",
  CLOSED: "bg-slate-500/10 text-slate-500",
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CUSTOMER: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

// Inline styles for status pill — enables smooth CSS color transitions between states
const STATUS_STYLE: Record<TicketStatus, { backgroundColor: string; color: string }> = {
  OPEN:                  { backgroundColor: "rgba(16,185,129,0.15)",  color: "#34d399" },
  IN_PROGRESS:           { backgroundColor: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  WAITING_ON_CUSTOMER:   { backgroundColor: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  RESOLVED:              { backgroundColor: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  CLOSED:                { backgroundColor: "rgba(100,116,139,0.10)", color: "#64748b" },
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

type OptimisticTicket = Ticket & { optimisticStatus?: TicketStatus; optimisticAssigned?: boolean }

type OptimisticAction =
  | { type: "resolve"; ticketId: string }
  | { type: "assign"; ticketId: string }
  | { type: "setStatus"; ticketId: string; status: TicketStatus }

function applyOptimistic(tickets: OptimisticTicket[], action: OptimisticAction): OptimisticTicket[] {
  return tickets.map((t) => {
    if (t.id !== action.ticketId) return t
    if (action.type === "resolve") return { ...t, status: TicketStatus.RESOLVED, optimisticStatus: TicketStatus.RESOLVED }
    if (action.type === "assign") return { ...t, optimisticAssigned: true }
    if (action.type === "setStatus") return { ...t, status: action.status, optimisticStatus: action.status }
    return t
  })
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

export function TicketTable({
  tickets,
  currentUserId,
  tenantId,
  currentSort = "createdAt",
  currentDir = "desc",
  currentStatus,
  currentPriority,
}: {
  tickets: Ticket[]
  currentUserId: string
  tenantId: string
  currentSort?: SortField
  currentDir?: SortDir
  currentStatus?: TicketStatus | null
  currentPriority?: Priority | null
}) {
  const router = useRouter()
  const [optimisticTickets, addOptimistic] = React.useOptimistic<OptimisticTicket[], OptimisticAction>(
    tickets,
    applyOptimistic
  )

  useTicketSocket({
    tenantId,
    onTicketCreated: () => router.refresh(),
  })

  async function handleStatusChange(ticketId: string, status: TicketStatus) {
    React.startTransition(() => {
      addOptimistic({ type: "setStatus", ticketId, status })
    })
    await updateTicketStatus({ ticketId, status })
  }

  async function handleResolve(ticketId: string) {
    React.startTransition(() => {
      addOptimistic({ type: "resolve", ticketId })
    })
    await updateTicketStatus({ ticketId, status: TicketStatus.RESOLVED })
  }

  async function handleAssignToMe(ticketId: string) {
    React.startTransition(() => {
      addOptimistic({ type: "assign", ticketId })
    })
    await assignTicket({ ticketId, agentId: currentUserId })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Ticket ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Customer</th>
              <SortableHeader
                label="Status"
                field="status"
                currentSort={currentSort}
                currentDir={currentDir}
              />
              <SortableHeader
                label="Priority"
                field="priority"
                currentSort={currentSort}
                currentDir={currentDir}
              />
              <SortableHeader
                label="Messages"
                field="messages"
                currentSort={currentSort}
                currentDir={currentDir}
                className="hidden md:table-cell"
              />
              <SortableHeader
                label="Created"
                field="createdAt"
                currentSort={currentSort}
                currentDir={currentDir}
                className="hidden md:table-cell"
              />
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {optimisticTickets.length === 0 ? (
              <TicketEmptyState filtered={!!(currentStatus || currentPriority)} />
            ) : (
              optimisticTickets.map((ticket) => {
                const isResolved = ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED
                const isAssignedToMe = ticket.assignedAgent?.id === currentUserId || ticket.optimisticAssigned

                return (
                  <tr key={ticket.id} className="hover:bg-muted/40 transition-colors group">
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
                          value={ticket.optimisticStatus ?? ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            ...STATUS_STYLE[ticket.optimisticStatus ?? ticket.status],
                            transition: "background-color 350ms ease, color 350ms ease",
                          }}
                          className="appearance-none rounded-full pl-2.5 pr-6 py-0.5 text-xs font-medium border-0 cursor-pointer outline-none"
                        >
                          {Object.values(TicketStatus).map((s) => (
                            <option key={s} value={s} className="bg-background text-foreground">
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 h-3 w-3 pointer-events-none opacity-60" style={{ color: STATUS_STYLE[ticket.optimisticStatus ?? ticket.status].color }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}
                      >
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
  )
}
