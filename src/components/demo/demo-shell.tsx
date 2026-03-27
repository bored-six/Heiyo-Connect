"use client"

import { useReducer, useState, useMemo } from "react"
import { DEMO_TICKETS, DEMO_CUSTOMERS, type DemoTicket } from "@/lib/demo-data"
import type { TicketStatus, Priority, Channel } from "@prisma/client"
import { X, Plus, Search } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

type SortField = "createdAt" | "priority" | "status" | "messages"
type SortDir = "asc" | "desc"

type State = {
  tickets: DemoTicket[]
  nextNumber: number
}

type Action =
  | { type: "CREATE"; ticket: DemoTicket }
  | { type: "SET_STATUS"; id: string; status: TicketStatus }
  | { type: "ASSIGN"; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CREATE":
      return { ...state, tickets: [action.ticket, ...state.tickets], nextNumber: state.nextNumber + 1 }
    case "SET_STATUS":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.id ? { ...t, status: action.status, resolvedAt: action.status === "RESOLVED" ? new Date() : t.resolvedAt } : t
        ),
      }
    case "ASSIGN":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.id ? { ...t, assignedAgent: { id: "agent-1", name: "Alex Kim", avatarUrl: null } } : t
        ),
      }
    default:
      return state
  }
}

// ── Priority / Status helpers ────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
const STATUS_ORDER: Record<TicketStatus, number> = { OPEN: 0, IN_PROGRESS: 1, WAITING_ON_CUSTOMER: 2, RESOLVED: 3, CLOSED: 4 }

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-slate-500/15 text-slate-400",
  MEDIUM: "bg-blue-500/15 text-blue-400",
  HIGH: "bg-orange-500/15 text-orange-400",
  CRITICAL: "bg-red-500/15 text-red-400",
}

const STATUS_STYLE: Record<TicketStatus, { backgroundColor: string; color: string }> = {
  OPEN:                { backgroundColor: "rgba(16,185,129,0.15)", color: "#34d399" },
  IN_PROGRESS:         { backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  WAITING_ON_CUSTOMER: { backgroundColor: "rgba(245,158,11,0.15)", color: "#fbbf24" },
  RESOLVED:            { backgroundColor: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  CLOSED:              { backgroundColor: "rgba(100,116,139,0.10)", color: "#64748b" },
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

// ── Create Ticket Dialog ─────────────────────────────────────────────────────

function CreateTicketDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (t: DemoTicket) => void
}) {
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("MEDIUM")
  const [channel, setChannel] = useState<Channel>("EMAIL")
  const [customerIdx, setCustomerIdx] = useState(0)

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const customer = DEMO_CUSTOMERS[customerIdx]
    onCreate({
      id: `demo-${Date.now()}`,
      ticketNumber: 0, // set by caller
      subject,
      description,
      status: "OPEN",
      priority,
      channel,
      tags: [],
      createdAt: new Date(),
      customer,
      assignedAgent: null,
      _count: { messages: 0 },
      aiSuggestedResponse: `Thank you for reaching out about "${subject}". I've reviewed the details and will follow up shortly.`,
      aiAnalyzedAt: new Date(),
    })
    setSubject("")
    setDescription("")
    setPriority("MEDIUM")
    setChannel("EMAIL")
    setCustomerIdx(0)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={customerIdx}
              onChange={(e) => setCustomerIdx(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEMO_CUSTOMERS.map((c, i) => (
                <option key={c.id} value={i}>{c.name} — {c.company}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Brief description of the issue"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Full details of the issue…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EMAIL">Email</option>
                <option value="CHAT">Chat</option>
                <option value="PHONE">Phone</option>
                <option value="SOCIAL">Social</option>
                <option value="API">API</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Ticket Detail Drawer ─────────────────────────────────────────────────────

function TicketDrawer({
  ticket,
  onClose,
  onStatusChange,
}: {
  ticket: DemoTicket | null
  onClose: () => void
  onStatusChange: (id: string, status: TicketStatus) => void
}) {
  if (!ticket) return null

  const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl shadow-2xl border-l overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">
              #{String(ticket.ticketNumber).padStart(3, "0")}
            </p>
            <h2 className="text-base font-semibold leading-snug">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span style={STATUS_STYLE[ticket.status]} className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                {ticket.status.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                {ticket.priority}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Customer</p>
              <p className="font-medium">{ticket.customer.name}</p>
              <p className="text-xs text-muted-foreground">{ticket.customer.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Channel</p>
              <p className="font-medium capitalize">{ticket.channel.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p>{ticket.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assigned</p>
              <p>{ticket.assignedAgent?.name ?? "Unassigned"}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Description</p>
            <p className="text-sm leading-relaxed text-slate-700">{ticket.description}</p>
          </div>

          {/* AI suggestion */}
          {ticket.aiSuggestedResponse && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI Suggested Response</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{ticket.aiSuggestedResponse}</p>
            </div>
          )}

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <select
              value={ticket.status}
              onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Demo mode — changes are not saved and reset on refresh.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Shell ───────────────────────────────────────────────────────────────

export function DemoShell() {
  const [state, dispatch] = useReducer(reducer, {
    tickets: DEMO_TICKETS,
    nextNumber: DEMO_TICKETS.length + 1,
  })

  const [filterStatus, setFilterStatus] = useState<TicketStatus | "">("")
  const [filterPriority, setFilterPriority] = useState<Priority | "">("")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortField>("createdAt")
  const [dir, setDir] = useState<SortDir>("desc")
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<DemoTicket | null>(null)

  function handleSort(field: SortField) {
    if (sort === field) setDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSort(field); setDir("desc") }
  }

  const filtered = useMemo(() => {
    let list = [...state.tickets]
    if (filterStatus) list = list.filter((t) => t.status === filterStatus)
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.customer.name.toLowerCase().includes(q) ||
          t.customer.company.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let cmp = 0
      if (sort === "createdAt") cmp = a.createdAt.getTime() - b.createdAt.getTime()
      else if (sort === "priority") cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      else if (sort === "status") cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      else if (sort === "messages") cmp = a._count.messages - b._count.messages
      return dir === "asc" ? cmp : -cmp
    })
    return list
  }, [state.tickets, filterStatus, filterPriority, search, sort, dir])

  // Stats
  const total = state.tickets.length
  const open = state.tickets.filter((t) => t.status === "OPEN").length
  const critical = state.tickets.filter((t) => t.priority === "CRITICAL" && t.status !== "RESOLVED" && t.status !== "CLOSED").length
  const resolved = state.tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length

  function handleCreate(t: DemoTicket) {
    dispatch({ type: "CREATE", ticket: { ...t, ticketNumber: state.nextNumber } })
  }

  function SortTh({ label, field, className }: { label: string; field: SortField; className?: string }) {
    const active = sort === field
    return (
      <th className={`text-left px-4 py-3 font-medium text-muted-foreground ${className ?? ""}`}>
        <button onClick={() => handleSort(field)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
          {label}
          <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground/40"}`}>
            {active ? (dir === "asc" ? "▲" : "▼") : "▲"}
          </span>
        </button>
      </th>
    )
  }

  return (
    <>
      <CreateTicketDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <TicketDrawer
        ticket={selected}
        onClose={() => setSelected(null)}
        onStatusChange={(id, status) => {
          dispatch({ type: "SET_STATUS", id, status })
          setSelected((s) => (s ? { ...s, status } : null))
        }}
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Demo Workspace · {total} tickets</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={total} color="text-foreground" />
          <StatCard label="Open" value={open} color="text-emerald-500" />
          <StatCard label="Critical" value={critical} color="text-red-500" />
          <StatCard label="Resolved" value={resolved} color="text-slate-500" />
        </div>

        {/* Ticket table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap">
            <h2 className="font-medium shrink-0">All Tickets</h2>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets…"
                  className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 w-44"
                />
              </div>
              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TicketStatus | "")}
                className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | "")}
                className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">All priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Ticket ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Customer</th>
                  <SortTh label="Status" field="status" />
                  <SortTh label="Priority" field="priority" />
                  <SortTh label="Messages" field="messages" className="hidden md:table-cell" />
                  <SortTh label="Created" field="createdAt" className="hidden md:table-cell" />
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No tickets match your filters.</td></tr>
                ) : (
                  filtered.map((ticket) => {
                    const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                    return (
                      <tr key={ticket.id} className="hover:bg-muted/40 transition-colors group">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs border-l-2 border-l-transparent group-hover:border-l-blue-400 transition-colors">
                          #{String(ticket.ticketNumber).padStart(3, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelected(ticket)}
                            className="font-medium hover:underline text-left line-clamp-1"
                          >
                            {ticket.subject}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          <div>{ticket.customer.name}</div>
                          <div className="text-xs">{ticket.customer.company}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span style={STATUS_STYLE[ticket.status]} className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                            {ticket.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{ticket._count.messages}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                          {ticket.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => dispatch({ type: "ASSIGN", id: ticket.id })}
                              disabled={!!ticket.assignedAgent}
                              className="rounded px-2 py-1 text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {ticket.assignedAgent ? "Assigned" : "Assign to Me"}
                            </button>
                            <button
                              onClick={() => dispatch({ type: "SET_STATUS", id: ticket.id, status: "RESOLVED" })}
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

        <p className="text-xs text-center text-muted-foreground pb-4">
          Demo mode · {filtered.length} of {total} tickets shown · All changes reset on refresh
        </p>
      </main>
    </>
  )
}
