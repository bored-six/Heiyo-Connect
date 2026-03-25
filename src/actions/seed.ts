"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/tenant"
import { Channel, Priority, TicketStatus } from "@prisma/client"

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Seed data ────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: "Priya Mehra", email: "priya.mehra@acmecorp.io" },
  { name: "Carlos Rivas", email: "c.rivas@globex.com" },
  { name: "Hannah Park", email: "hannah@stellar.dev" },
  { name: "James Okafor", email: "j.okafor@veridian.co" },
  { name: "Amelia Torres", email: "amelia.t@brightwave.io" },
]

type SeedTicket = {
  customer: number
  subject: string
  description: string
  status: TicketStatus
  priority: Priority
  channel: Channel
  daysAgo: number
  /** true = AI-analyzed, false = manual-review fallback */
  ai: boolean
  tags: string[]
}

const TICKETS: SeedTicket[] = [
  // ── CRITICAL ──────────────────────────────────────────────────
  {
    customer: 0,
    subject: "Production API returning 503 for all enterprise accounts",
    description:
      "Since 14:30 UTC today every request to /api/v2/orders returns HTTP 503. Enterprise clients are impacted and we're losing ~$4k/minute. Needs immediate triage.",
    status: TicketStatus.IN_PROGRESS,
    priority: Priority.CRITICAL,
    channel: Channel.EMAIL,
    daysAgo: 0,
    ai: true,
    tags: ["api", "production", "critical-incident"],
  },
  {
    customer: 3,
    subject: "Data export contains rows from a different tenant — possible breach",
    description:
      "I downloaded our monthly CSV export and rows 500–600 contain customer records from what appears to be a completely different organisation. This is a serious data issue.",
    status: TicketStatus.OPEN,
    priority: Priority.CRITICAL,
    channel: Channel.EMAIL,
    daysAgo: 1,
    ai: true,
    tags: ["security", "data-leak", "urgent"],
  },
  // ── HIGH ──────────────────────────────────────────────────────
  {
    customer: 1,
    subject: "Billing portal not reflecting payment made 3 days ago",
    description:
      "We transferred $12,400 on the 18th and the dashboard still shows the balance as outstanding. Our CFO needs urgent clarification before end of day.",
    status: TicketStatus.OPEN,
    priority: Priority.HIGH,
    channel: Channel.EMAIL,
    daysAgo: 1,
    ai: true,
    tags: ["billing", "payment"],
  },
  {
    customer: 2,
    subject: "SSO broken after maintenance window — entire team locked out",
    description:
      "Since last night's maintenance window our SAML SSO integration is broken. All agents are locked out. We have a 9 AM stand-up in 2 hours — this is blocking everyone.",
    status: TicketStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    channel: Channel.CHAT,
    daysAgo: 2,
    ai: true,
    tags: ["sso", "auth", "maintenance"],
  },
  {
    customer: 4,
    subject: "Webhook signature verification fails on all events",
    description:
      "Starting yesterday our webhook endpoint rejects every event because signature verification fails. We haven't changed our secret — suspect your signing key was rotated without notice.",
    status: TicketStatus.WAITING_ON_CUSTOMER,
    priority: Priority.HIGH,
    channel: Channel.API,
    daysAgo: 3,
    ai: false, // manual-review fallback
    tags: ["webhooks", "manual-review"],
  },
  // ── MEDIUM ────────────────────────────────────────────────────
  {
    customer: 0,
    subject: "Analytics charts blank on Safari 16 — affecting weekly reporting",
    description:
      "The Reports page charts are completely blank for all Safari users on our team. Chrome and Firefox work fine. This is blocking our weekly executive reporting workflow.",
    status: TicketStatus.OPEN,
    priority: Priority.MEDIUM,
    channel: Channel.EMAIL,
    daysAgo: 2,
    ai: true,
    tags: ["browser-compat", "charts"],
  },
  {
    customer: 1,
    subject: "How do I configure custom roles for our enterprise plan?",
    description:
      "I'm the workspace admin and want to set up custom permission roles but can't find the setting. We're on the Enterprise plan. Can you guide me through the configuration?",
    status: TicketStatus.RESOLVED,
    priority: Priority.MEDIUM,
    channel: Channel.CHAT,
    daysAgo: 3,
    ai: true,
    tags: ["roles", "permissions"],
  },
  {
    customer: 3,
    subject: "Need consolidated Q1 invoice with line items for finance team",
    description:
      "Finance needs a single invoice covering January–March with individual line items for each subscription tier. Can you generate that and send it to billing@veridian.co?",
    status: TicketStatus.RESOLVED,
    priority: Priority.MEDIUM,
    channel: Channel.EMAIL,
    daysAgo: 4,
    ai: true,
    tags: ["billing", "invoice"],
  },
  {
    customer: 2,
    subject: "API rate limit docs contradict actual behaviour — 429s at 200 req/min",
    description:
      "Your docs state the limit is 1000 req/min but we're hitting 429s at ~200 req/min consistently. Either the docs are wrong or there's a bug. We need clarification.",
    status: TicketStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    channel: Channel.EMAIL,
    daysAgo: 4,
    ai: false, // manual-review fallback
    tags: ["api", "documentation", "manual-review"],
  },
  {
    customer: 4,
    subject: "Import silently fails on files over 50 MB with no error message",
    description:
      "When I try to import a 78 MB CSV the UI spins forever then resets — no error shown. Smaller files work fine. Is there a documented limit I'm not aware of?",
    status: TicketStatus.OPEN,
    priority: Priority.MEDIUM,
    channel: Channel.EMAIL,
    daysAgo: 5,
    ai: true,
    tags: ["import", "bug"],
  },
  {
    customer: 0,
    subject: "Slack integration stopped posting ticket notifications — no errors",
    description:
      "We connected Slack two weeks ago and it worked great. Since Monday all notifications stopped. The integration shows 'Connected' in settings but nothing posts to the channel.",
    status: TicketStatus.OPEN,
    priority: Priority.MEDIUM,
    channel: Channel.SOCIAL,
    daysAgo: 5,
    ai: true,
    tags: ["integrations", "slack"],
  },
  // ── LOW ───────────────────────────────────────────────────────
  {
    customer: 1,
    subject: "Date picker resets to '7 days' on every page visit — please persist",
    description:
      "Small UX request: every time I navigate to Reports the date range resets to 'last 7 days'. I always use 30 days — it would be great if the preference persisted.",
    status: TicketStatus.RESOLVED,
    priority: Priority.LOW,
    channel: Channel.EMAIL,
    daysAgo: 5,
    ai: true,
    tags: ["feature-request", "ux"],
  },
  {
    customer: 3,
    subject: "Typo on Settings page — 'Notificaitons'",
    description:
      "Minor but: the Settings > Notifications tab heading reads 'Notificaitons'. Just flagging it so it gets cleaned up.",
    status: TicketStatus.CLOSED,
    priority: Priority.LOW,
    channel: Channel.EMAIL,
    daysAgo: 6,
    ai: true,
    tags: ["typo", "ui"],
  },
  {
    customer: 2,
    subject: "Dark mode request for agent dashboard — late-shift eye strain",
    description:
      "Our agents work late shifts and the bright white dashboard causes significant eye strain. A dark mode toggle would make a big difference. Is this on the roadmap?",
    status: TicketStatus.OPEN,
    priority: Priority.LOW,
    channel: Channel.EMAIL,
    daysAgo: 6,
    ai: false, // manual-review fallback
    tags: ["feature-request", "dark-mode", "manual-review"],
  },
  {
    customer: 4,
    subject: "Where can I find your SLA and uptime history for procurement review?",
    description:
      "We're going through a procurement review and legal needs your SLA document plus recent uptime history. Can you point me to the right resources or attach them here?",
    status: TicketStatus.RESOLVED,
    priority: Priority.LOW,
    channel: Channel.EMAIL,
    daysAgo: 6,
    ai: true,
    tags: ["sla", "compliance"],
  },
]

// ─── Action ───────────────────────────────────────────────────────────────────

export async function seedDemoData(): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireUser()

    const existing = await prisma.ticket.count({
      where: { tenantId: user.tenantId },
    })
    if (existing > 0) {
      return {
        success: false,
        error: `You already have ${existing} ticket${existing === 1 ? "" : "s"}. Clear them first to re-seed.`,
      }
    }

    const now = Date.now()

    // Upsert all demo customers scoped to this tenant
    const customerRecords = await Promise.all(
      CUSTOMERS.map((c) =>
        prisma.customer.upsert({
          where: { tenantId_email: { tenantId: user.tenantId, email: c.email } },
          create: { ...c, tenantId: user.tenantId },
          update: {},
        })
      )
    )

    // Create tickets — spread over last 7 days
    const created = await Promise.all(
      TICKETS.map((t) => {
        const createdAt = new Date(now - t.daysAgo * 86_400_000)
        const resolvedAt =
          t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
            ? new Date(createdAt.getTime() + 4 * 3_600_000)
            : undefined

        return prisma.ticket.create({
          data: {
            subject: t.subject,
            description: t.description,
            status: t.status,
            priority: t.priority,
            channel: t.channel,
            tags: t.tags,
            tenantId: user.tenantId,
            customerId: customerRecords[t.customer].id,
            assignedAgentId: user.id,
            createdAt,
            ...(resolvedAt && { resolvedAt }),
            // AI fields — only for non-manual-review tickets
            ...(t.ai && {
              aiAnalyzedAt: new Date(createdAt.getTime() + 30_000),
              aiPriority: t.priority,
              aiSuggestedResponse: `Thank you for reaching out about "${t.subject}". I've reviewed the details and escalated this to the appropriate team. We'll follow up within our agreed SLA window. In the meantime, please let us know if anything changes on your end.`,
            }),
          },
        })
      })
    )

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    return { success: true, data: { count: created.length } }
  } catch (error) {
    console.error("seedDemoData error:", error)
    return { success: false, error: "Failed to seed demo data. Please try again." }
  }
}
