import { notFound } from "next/navigation"
import Link from "next/link"
import { getTicketById } from "@/actions/tickets"
import { CopyButton } from "@/components/tickets/copy-button"
import { ArrowLeft, Bot, User, Clock } from "lucide-react"

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-slate-100 text-slate-500",
  CLOSED: "bg-slate-100 text-slate-400",
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ticket = await getTicketById(id)

  if (!ticket) notFound()

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Ticket header */}
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold leading-tight">{ticket.subject}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
              {ticket.status.replace(/_/g, " ")}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
              {ticket.priority}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {ticket.customer.name} &lt;{ticket.customer.email}&gt;
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>

        <p className="text-sm text-foreground/80 whitespace-pre-wrap pt-1">{ticket.description}</p>
      </div>

      {/* AI Suggested Response — prominent section */}
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

      {/* Messages thread */}
      {ticket.messages.length > 0 && (
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium">Messages ({ticket.messages.length})</h2>
          </div>
          <div className="divide-y">
            {ticket.messages.map((msg) => (
              <div key={msg.id} className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {msg.isFromAgent ? (msg.author?.name ?? "Agent") : ticket.customer.name}
                  </span>
                  {msg.isAiGenerated && (
                    <span className="inline-flex items-center gap-0.5 text-blue-600">
                      <Bot className="h-3 w-3" />
                      AI
                    </span>
                  )}
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No messages yet */}
      {ticket.messages.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No messages yet on this ticket.
        </div>
      )}
    </main>
  )
}
