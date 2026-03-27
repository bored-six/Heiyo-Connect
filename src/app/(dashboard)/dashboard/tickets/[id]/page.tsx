import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getTicketById } from "@/actions/tickets"
import { getTeamMembers } from "@/actions/team"
import { requireUser } from "@/lib/tenant"
import { CopyButton } from "@/components/tickets/copy-button"
import { ReplySection } from "@/components/tickets/reply-section"
import { AssignAgentDropdown } from "@/components/tickets/assign-agent-dropdown"
import { ArrowLeft, Bot, User, Clock, Tag, Hash, Zap } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const ticket = await getTicketById(id)
  if (!ticket) return { title: "Ticket" }
  return { title: `#${ticket.ticketNumber} ${ticket.subject}` }
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  CRITICAL: "bg-red-100 text-red-600",
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-slate-100 text-slate-600",
  CLOSED: "bg-slate-100 text-slate-500",
}

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  CHAT: "Chat",
  PHONE: "Phone",
  SOCIAL: "Social",
  API: "API",
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let currentUser
  try {
    currentUser = await requireUser()
  } catch {
    redirect("/onboarding")
  }

  const { id } = await params
  const [ticket, agents] = await Promise.all([getTicketById(id), getTeamMembers()])

  if (!ticket) notFound()

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">

        {/* ── Main content ── */}
        <div className="space-y-6 min-w-0">
          {/* Ticket header */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">#{ticket.ticketNumber}</span>
                </div>
                <h1 className="text-xl font-semibold leading-tight">{ticket.subject}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                  {ticket.status.replace(/_/g, " ")}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <Link href={`/dashboard/customers/${ticket.customerId}`} className="hover:text-foreground transition-colors hover:underline">
                  {ticket.customer.name}
                </Link>
                <span className="text-muted-foreground/60">&lt;{ticket.customer.email}&gt;</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="text-sm text-foreground/80 whitespace-pre-wrap pt-1">{ticket.description}</p>
          </div>

          {/* AI Suggested Response */}
          {ticket.aiSuggestedResponse && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <h2 className="font-medium text-blue-900">AI Suggested Response</h2>
                  {ticket.aiPriority && (
                    <span className="text-xs text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
                      AI Priority: {ticket.aiPriority}
                    </span>
                  )}
                </div>
                <CopyButton text={ticket.aiSuggestedResponse} />
              </div>
              <p className="text-sm text-blue-900/80 whitespace-pre-wrap leading-relaxed">
                {ticket.aiSuggestedResponse}
              </p>
            </div>
          )}

          {/* Message thread + reply */}
          <ReplySection
            messages={ticket.messages.map((msg) => ({
              id: msg.id,
              body: msg.body,
              senderRole: (msg.senderRole ?? (msg.isFromAgent ? "AGENT" : "USER")) as "USER" | "AGENT" | "SYSTEM",
              isAiGenerated: msg.isAiGenerated,
              createdAt: msg.createdAt,
              author: msg.author
                ? { id: msg.author.id, name: msg.author.name, avatarUrl: msg.author.avatarUrl }
                : null,
            }))}
            ticketId={ticket.id}
            aiSuggestedResponse={ticket.aiSuggestedResponse ?? null}
            customerName={ticket.customer.name}
            currentUserName={ticket.assignedAgent?.name ?? null}
          />
        </div>

        {/* ── Properties sidebar ── */}
        <aside className="space-y-3 lg:sticky lg:top-6">
          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Properties
            </h3>

            {/* Assignee */}
            <AssignAgentDropdown
              ticketId={ticket.id}
              agents={agents}
              currentAgentId={ticket.assignedAgentId}
            />

            {/* Status */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</p>
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                  {ticket.priority}
                </span>
                {ticket.aiPriority && ticket.aiPriority !== ticket.priority && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3 text-blue-400" />
                    AI: {ticket.aiPriority}
                  </span>
                )}
              </div>
            </div>

            {/* Channel */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Channel</p>
              <p className="text-sm">{CHANNEL_LABELS[ticket.channel] ?? ticket.channel}</p>
            </div>

            {/* Customer link */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</p>
              <Link
                href={`/dashboard/customers/${ticket.customerId}`}
                className="text-sm text-primary hover:underline"
              >
                {ticket.customer.name}
              </Link>
            </div>

            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket number */}
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Hash className="h-3 w-3" /> Ticket
              </p>
              <p className="text-sm font-mono text-muted-foreground">#{ticket.ticketNumber}</p>
            </div>
          </div>
        </aside>

      </div>
    </main>
  )
}
