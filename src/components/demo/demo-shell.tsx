"use client"

import { useReducer, useState, useMemo, useEffect, useRef } from "react"
import { DEMO_TICKETS, DEMO_CUSTOMERS, type DemoTicket, type DemoCustomer } from "@/lib/demo-data"
import type { TicketStatus, Priority, Channel } from "@/lib/types"
import { X, Plus, Search, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, AnimatePresence } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts"

// ── Types ────────────────────────────────────────────────────────────────────

type View = "dashboard" | "tickets" | "customers" | "reports"
type SortField = "createdAt" | "priority" | "status" | "messages"
type SortDir = "asc" | "desc"

type State = { tickets: DemoTicket[]; nextNumber: number }
type Action =
  | { type: "CREATE"; ticket: DemoTicket }
  | { type: "SET_STATUS"; id: string; status: TicketStatus }
  | { type: "ASSIGN"; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CREATE":
      return { tickets: [action.ticket, ...state.tickets], nextNumber: state.nextNumber + 1 }
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CUSTOMER: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const allZero = data.every((v) => v === 0)
  if (allZero) {
    return (
      <svg viewBox="0 0 60 20" className="w-full h-5" preserveAspectRatio="none">
        <line x1="0" y1="10" x2="60" y2="10" stroke={color} strokeWidth="1.5" strokeOpacity="0.35" />
      </svg>
    )
  }
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 60
    const y = 18 - (v / max) * 16
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg viewBox="0 0 60 20" className="w-full h-5" preserveAspectRatio="none">
      <path d={`M ${points.join(" L ")}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
    </svg>
  )
}

// ── Animated Stat Card (matches real dashboard) ──────────────────────────────

function StatCard({ label, value, colorClass, sparkline, sparklineColor }: {
  label: string; value: number; colorClass: string; sparkline: number[]; sparklineColor: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 800

  useEffect(() => {
    startRef.current = null
    if (value === 0) { setDisplayed(0); return }
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / DURATION, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * value))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value])

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 tabular-nums ${colorClass}`}>{displayed}</p>
      <div className="mt-3 opacity-70">
        <Sparkline data={sparkline} color={sparklineColor} />
      </div>
    </div>
  )
}

// ── Donut Card (matches real dashboard) ──────────────────────────────────────

function DonutCard({ resolved, total }: { resolved: number; total: number }) {
  const rate = total === 0 ? 0 : Math.round((resolved / total) * 100)
  const R = 26; const SIZE = 68; const cx = SIZE / 2
  const circumference = 2 * Math.PI * R

  const [progress, setProgress] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 900

  useEffect(() => {
    startRef.current = null
    if (rate === 0) { setProgress(0); return }
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / DURATION, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(eased * rate)
      if (p < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [rate])

  const dashArray = `${(progress / 100) * circumference} ${circumference}`

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">Resolved</p>
      <div className="flex items-center gap-4 mt-2">
        <div className="relative shrink-0">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle cx={cx} cy={cx} r={R} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
            <circle cx={cx} cy={cx} r={R} fill="none" stroke="#64748b" strokeWidth="5" strokeDasharray={dashArray} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-muted-foreground tabular-nums mt-1">{resolved}</p>
          <p className="text-xs text-muted-foreground mt-0.5">of {total} tickets</p>
        </div>
      </div>
    </div>
  )
}

// ── Create Ticket Dialog ──────────────────────────────────────────────────────

function CreateTicketDialog({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (t: DemoTicket) => void
}) {
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("MEDIUM")
  const [channel, setChannel] = useState<Channel>("EMAIL")
  const [customerIdx, setCustomerIdx] = useState(0)

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate({
      id: `demo-${Date.now()}`,
      ticketNumber: 0,
      subject, description,
      status: "OPEN", priority, channel,
      tags: [],
      createdAt: new Date(),
      customer: DEMO_CUSTOMERS[customerIdx],
      assignedAgent: null,
      _count: { messages: 0 },
      aiSuggestedResponse: `Thank you for reaching out about "${subject}". I've reviewed the details and will follow up shortly.`,
      aiAnalyzedAt: new Date(),
    })
    setSubject(""); setDescription(""); setPriority("MEDIUM"); setChannel("EMAIL"); setCustomerIdx(0)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-popover rounded-xl shadow-xl border border-border w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">New Ticket</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Customer</label>
            <select value={customerIdx} onChange={(e) => setCustomerIdx(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
              {DEMO_CUSTOMERS.map((c, i) => <option key={c.id} value={i}>{c.name} — {c.company}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required
              placeholder="Brief description of the issue"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}
              placeholder="Full details of the issue…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="EMAIL">Email</option><option value="CHAT">Chat</option>
                <option value="PHONE">Phone</option><option value="SOCIAL">Social</option><option value="API">API</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit"
              className="flex-1 rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">Create Ticket</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Ticket Detail Drawer ──────────────────────────────────────────────────────

function TicketDrawer({ ticket, onClose, onStatusChange }: {
  ticket: DemoTicket | null; onClose: () => void
  onStatusChange: (id: string, status: TicketStatus) => void
}) {
  if (!ticket) return null
  const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-popover w-full max-w-xl shadow-2xl border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-popover border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">#{String(ticket.ticketNumber).padStart(3, "0")}</p>
            <h2 className="text-base font-semibold leading-snug">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span style={STATUS_STYLE[ticket.status]} className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                {ticket.status.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
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
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Description</p>
            <p className="text-sm leading-relaxed text-foreground/80">{ticket.description}</p>
          </div>
          {ticket.aiSuggestedResponse && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">AI Suggested Response</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{ticket.aiSuggestedResponse}</p>
            </div>
          )}
          {ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <select value={ticket.status} onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Close</button>
          </div>
          <p className="text-xs text-center text-muted-foreground pt-2">Demo mode — changes reset on refresh.</p>
        </div>
      </div>
    </div>
  )
}

// ── Ticket Table (shared between Dashboard + Tickets view) ────────────────────

function TicketTable({ tickets, onSelect, onAssign, onResolve, onStatusChange }: {
  tickets: DemoTicket[]
  onSelect: (t: DemoTicket) => void
  onAssign: (id: string) => void
  onResolve: (id: string) => void
  onStatusChange: (id: string, status: TicketStatus) => void
}) {
  const [sort, setSort] = useState<SortField>("createdAt")
  const [dir, setDir] = useState<SortDir>("desc")
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "">("")
  const [filterPriority, setFilterPriority] = useState<Priority | "">("")
  const [search, setSearch] = useState("")

  function handleSort(field: SortField) {
    if (sort === field) setDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSort(field); setDir("desc") }
  }

  const filtered = useMemo(() => {
    let list = [...tickets]
    if (filterStatus) list = list.filter((t) => t.status === filterStatus)
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) =>
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
  }, [tickets, filterStatus, filterPriority, search, sort, dir])

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
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap">
        <h2 className="font-medium shrink-0">All Tickets</h2>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets…"
              className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 w-44" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TicketStatus | "")}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | "")}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
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
            ) : filtered.map((ticket) => {
              const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED"
              return (
                <tr key={ticket.id} className="hover:bg-muted/40 transition-colors group">
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs border-l-2 border-l-transparent group-hover:border-l-blue-400 transition-colors">
                    #{String(ticket.ticketNumber).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onSelect(ticket)} className="font-medium hover:underline text-left line-clamp-1">
                      {ticket.subject}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <div>{ticket.customer.name}</div>
                    <div className="text-xs">{ticket.customer.company}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-flex items-center">
                      <select
                        value={ticket.status}
                        onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
                        onClick={(e) => e.stopPropagation()}
                        style={STATUS_STYLE[ticket.status]}
                        className="appearance-none rounded-full pl-2.5 pr-6 py-0.5 text-xs font-medium border-0 cursor-pointer outline-none"
                      >
                        {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
                          <option key={s} value={s} className="bg-popover text-foreground">
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 h-3 w-3 pointer-events-none opacity-60" style={{ color: STATUS_STYLE[ticket.status].color }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{ticket._count.messages}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{ticket.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onAssign(ticket.id)} disabled={!!ticket.assignedAgent}
                        className="rounded px-2 py-1 text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {ticket.assignedAgent ? "Assigned" : "Assign to Me"}
                      </button>
                      <button onClick={() => onResolve(ticket.id)} disabled={isResolved}
                        className="rounded px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {isResolved ? "Resolved" : "Resolve"}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Customers View ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  const parts = name.trim().split(" ")
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function CustomersView({ tickets }: { tickets: DemoTicket[] }) {
  const [query, setQuery] = useState("")

  const customers = useMemo(() =>
    DEMO_CUSTOMERS.map((c) => {
      const ct = tickets.filter((t) => t.customer.id === c.id)
      const open = ct.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length
      const resolved = ct.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length
      const lastTicketAt = ct.length > 0 ? ct.reduce((a, b) => a.createdAt > b.createdAt ? a : b).createdAt : null
      return { ...c, total: ct.length, open, resolved, lastTicketAt }
    }), [tickets])

  const filtered = query.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()))
    : customers

  const activeCount = customers.filter((c) => c.open > 0).length
  const resolvedOnlyCount = customers.filter((c) => c.total > 0 && c.open === 0).length
  const totalTickets = customers.reduce((s, c) => s + c.total, 0)

  function timeAgo(date: Date) {
    const days = Math.floor((Date.now() - date.getTime()) / 86400000)
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">Everyone who has ever submitted a ticket in your workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2">Total Customers</p>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2">Have Open Tickets</p>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2">Fully Resolved</p>
          <p className="text-2xl font-bold">{resolvedOnlyCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2">Total Tickets</p>
          <p className="text-2xl font-bold">{totalTickets}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">No customers match &ldquo;{query}&rdquo;</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const hasOpen = c.open > 0
            return (
              <div key={c.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 select-none ${getAvatarColor(c.name)}`}>
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                  {hasOpen && <span className="size-2 rounded-full bg-emerald-500 mt-1 shrink-0" title="Has open tickets" />}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-center">
                    <p className="text-lg font-bold">{c.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className={`flex-1 rounded-lg px-3 py-2 text-center ${hasOpen ? "bg-emerald-50" : "bg-muted/50"}`}>
                    <p className={`text-lg font-bold ${hasOpen ? "text-emerald-600" : ""}`}>{c.open}</p>
                    <p className="text-xs text-muted-foreground">Open</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.company}</span>
                  <span>Last active: {c.lastTicketAt ? timeAgo(c.lastTicketAt) : "Never"}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Reports View (Recharts — matches real dashboard) ─────────────────────────

const REPORT_PRIORITY_COLORS: Record<string, string> = {
  LOW: "#64748b", MEDIUM: "#eab308", HIGH: "#f97316", CRITICAL: "#ef4444",
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function FadeUp({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.35 }} className={className}>
      {children}
    </motion.div>
  )
}

function ReportStatCard({ label, value, sub, glowColor, index }: {
  label: string; value: string; sub?: string; glowColor: string; index: number
}) {
  return (
    <FadeUp index={index} className="rounded-xl border bg-card p-5 shadow-sm relative overflow-hidden">
      <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: glowColor }} />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </FadeUp>
  )
}

function generateDailyVolume(tickets: DemoTicket[]) {
  const days: { date: string; created: number; resolved: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString("en-US", { weekday: "short" })
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999)
    const created = tickets.filter((t) => t.createdAt >= dayStart && t.createdAt <= dayEnd).length
    const resolved = tickets.filter((t) => t.resolvedAt && t.resolvedAt >= dayStart && t.resolvedAt <= dayEnd).length
    // Add some synthetic volume so the chart looks meaningful in demo
    days.push({ date: label, created: created || Math.floor(Math.random() * 6) + 2, resolved: resolved || Math.floor(Math.random() * 4) + 1 })
  }
  return days
}

function ReportsView({ tickets }: { tickets: DemoTicket[] }) {
  const total = tickets.length
  const byPriority = (p: Priority) => tickets.filter((t) => t.priority === p).length
  const resolved = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length
  const aiHandled = tickets.filter((t) => t.aiAnalyzedAt).length
  const manualOnly = total - aiHandled
  const efficiencyScore = total === 0 ? 0 : Math.round((aiHandled / total) * 100)
  const timeSaved = aiHandled * 10
  const timeSavedLabel = timeSaved >= 60 ? `${Math.round(timeSaved / 60)} hrs` : `${timeSaved} min`

  const dailyVolume = useMemo(() => generateDailyVolume(tickets), [tickets])

  const priorityDistribution = (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[])
    .map((p) => ({ name: p, value: byPriority(p) }))
    .filter((d) => d.value > 0)

  const aiVsManual = [
    { name: "AI Success", value: aiHandled, fill: "#6366f1" },
    { name: "Manual", value: manualOnly, fill: "#14B8A6" },
  ]

  return (
    <AnimatePresence>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executive Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">AI performance and ticket analytics</p>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ReportStatCard index={0} label="Efficiency Score" value={`${efficiencyScore}%`} sub={`${aiHandled} of ${total} AI-handled`} glowColor="#6366f1" />
          <ReportStatCard index={1} label="Time Saved" value={timeSavedLabel} sub="10 min per AI-resolved ticket" glowColor="#10b981" />
          <ReportStatCard index={2} label="Active AI Provider" value="Gemini 2.0" glowColor="#f59e0b" />
          <ReportStatCard index={3} label="Total Tickets" value={String(total)} sub="All time" glowColor="#3b82f6" />
        </div>

        {/* Area chart: 7-day volume */}
        <FadeUp index={4} className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4">Ticket Volume — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyVolume} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="demoGradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="demoGradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="created" name="Created" stroke="#6366f1" strokeWidth={2} fill="url(#demoGradCreated)" dot={false} />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#0EA5E9" strokeWidth={2} fill="url(#demoGradResolved)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </FadeUp>

        {/* Bottom row: Pie + Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority pie */}
          <FadeUp index={5} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold mb-4">AI Priority Distribution</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {priorityDistribution.map((entry) => (
                    <Cell key={entry.name} fill={REPORT_PRIORITY_COLORS[entry.name] ?? "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </FadeUp>

          {/* AI vs Manual bar */}
          <FadeUp index={6} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold mb-4">AI vs Manual Handling</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aiVsManual} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]}>
                  {aiVsManual.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </FadeUp>
        </div>

        <p className="text-xs text-center text-muted-foreground">Demo mode — data resets on refresh.</p>
      </div>
    </AnimatePresence>
  )
}

// ── Main Shell ────────────────────────────────────────────────────────────────

export function DemoShell() {
  const [state, dispatch] = useReducer(reducer, {
    tickets: DEMO_TICKETS,
    nextNumber: DEMO_TICKETS.length + 1,
  })
  const [view, setView] = useState<View>("dashboard")
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<DemoTicket | null>(null)

  function handleCreate(t: DemoTicket) {
    dispatch({ type: "CREATE", ticket: { ...t, ticketNumber: state.nextNumber } })
  }

  const total = state.tickets.length
  const open = state.tickets.filter((t) => t.status === "OPEN").length
  const inProgress = state.tickets.filter((t) => t.status === "IN_PROGRESS").length
  const critical = state.tickets.filter((t) => t.priority === "CRITICAL" && t.status !== "RESOLVED" && t.status !== "CLOSED").length
  const resolved = state.tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length

  // Generate sparkline data from tickets (synthetic 7-day trend)
  const sparklineData = useMemo(() => {
    const gen = (count: number) => {
      const base = Math.max(1, count)
      return Array.from({ length: 7 }, () => Math.max(0, base + Math.floor(Math.random() * 4) - 2))
    }
    return { open: gen(open), inProgress: gen(inProgress), critical: gen(critical) }
  }, [open, inProgress, critical])

  const navItems: { id: View; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "tickets", label: "Tickets" },
    { id: "customers", label: "Customers" },
    { id: "reports", label: "Reports" },
  ]

  return (
    <>
      <CreateTicketDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <TicketDrawer
        ticket={selected}
        onClose={() => setSelected(null)}
        onStatusChange={(id, status) => {
          dispatch({ type: "SET_STATUS", id, status })
          setSelected((s) => s ? { ...s, status } : null)
        }}
      />

      {/* Nav */}
      <nav className="border-b border-border bg-background">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#6366F1"/>
                <rect x="5.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
                <rect x="15.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
                <rect x="5.5" y="10" width="13" height="3.5" rx="1.5" fill="white"/>
              </svg>
              <span className="font-semibold text-base tracking-tight text-foreground">Heiyo</span>
            </div>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-sm font-medium text-muted-foreground">Demo Workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`transition-colors hover:text-foreground ${view === item.id ? "font-semibold text-foreground" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Ticket
            </button>
            <ThemeToggle />
            <a href="/sign-up"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Sign up free →
            </a>
          </div>
        </div>
      </nav>

      {/* Views */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {view === "dashboard" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Demo Workspace · {total} tickets</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Open" value={open} colorClass="text-emerald-600" sparkline={sparklineData.open} sparklineColor="#10b981" />
              <StatCard label="In Progress" value={inProgress} colorClass="text-blue-600" sparkline={sparklineData.inProgress} sparklineColor="#3b82f6" />
              <StatCard label="Critical" value={critical} colorClass="text-red-600" sparkline={sparklineData.critical} sparklineColor="#ef4444" />
              <DonutCard resolved={resolved} total={total} />
            </div>
            <TicketTable
              tickets={state.tickets}
              onSelect={setSelected}
              onAssign={(id) => dispatch({ type: "ASSIGN", id })}
              onResolve={(id) => dispatch({ type: "SET_STATUS", id, status: "RESOLVED" })}
              onStatusChange={(id, status) => dispatch({ type: "SET_STATUS", id, status })}
            />
          </>
        )}

        {view === "tickets" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
                <p className="text-sm text-muted-foreground mt-1">{state.tickets.length} tickets</p>
              </div>
            </div>
            <TicketTable
              tickets={state.tickets}
              onSelect={setSelected}
              onAssign={(id) => dispatch({ type: "ASSIGN", id })}
              onResolve={(id) => dispatch({ type: "SET_STATUS", id, status: "RESOLVED" })}
              onStatusChange={(id, status) => dispatch({ type: "SET_STATUS", id, status })}
            />
          </>
        )}

        {view === "customers" && <CustomersView tickets={state.tickets} />}
        {view === "reports" && <ReportsView tickets={state.tickets} />}

        <p className="text-xs text-center text-muted-foreground pb-4">
          Demo mode · All changes reset on refresh ·{" "}
          <a href="/sign-up" className="underline hover:text-indigo-600">Sign up free</a> to get started
        </p>
      </main>
    </>
  )
}
