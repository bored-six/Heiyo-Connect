"use client"

import * as React from "react"
import Link from "next/link"
import { TicketStatus, Priority } from "@prisma/client"
import { updateTicketStatus, assignTicket } from "@/actions/tickets"
import { TicketEmptyState } from "@/components/tickets/empty-state"

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-slate-100 text-slate-500",
  CLOSED: "bg-slate-100 text-slate-400",
}

type Ticket = {
  id: string
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

function applyOptimistic(tickets: OptimisticTicket[], action: OptimisticAction): OptimisticTicket[] {
  return tickets.map((t) => {
    if (t.id !== action.ticketId) return t
    if (action.type === "resolve") return { ...t, status: TicketStatus.RESOLVED, optimisticStatus: TicketStatus.RESOLVED }
    if (action.type === "assign") return { ...t, optimisticAssigned: true }
    return t
  })
}

export function TicketTable({
  tickets,
  currentUserId,
}: {
  tickets: Ticket[]
  currentUserId: string
}) {
  const [optimisticTickets, addOptimistic] = React.useOptimistic<OptimisticTicket[], OptimisticAction>(
    tickets,
    applyOptimistic
  )

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
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-medium">All Tickets</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Messages</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {optimisticTickets.length === 0 ? (
              <TicketEmptyState />
            ) : (
              optimisticTickets.map((ticket) => {
                const isResolved = ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED
                const isAssignedToMe = ticket.assignedAgent?.id === currentUserId || ticket.optimisticAssigned

                return (
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{ticket.customer.name}</div>
                      <div className="text-xs">{ticket.customer.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket._count.messages}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
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
