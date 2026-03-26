"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";
import { analyzeTicketWithProvider } from "@/lib/ai-gateway";
import { verifyTenantAccess } from "@/lib/tenant";
import { emitTicketCreated } from "@/lib/pusher-server";
import { Channel, Priority, TicketStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────

const CreateTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  channel: z.nativeEnum(Channel).default(Channel.EMAIL),
  priority: z.nativeEnum(Priority).optional(),
});

const UpdateTicketStatusSchema = z.object({
  ticketId: z.string().cuid(),
  status: z.nativeEnum(TicketStatus),
});

const AssignTicketSchema = z.object({
  ticketId: z.string().cuid(),
  agentId: z.string().cuid().nullable(),
});

// ─────────────────────────────────────────────
// ACTION RESULT TYPE
// ─────────────────────────────────────────────

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────

/**
 * Creates a new support ticket scoped to the authenticated user's tenant.
 * Triggers AI analysis in the background — Pusher emit fires after AI priority is set.
 */
export async function createTicket(
  formData: z.input<typeof CreateTicketSchema>
): Promise<ActionResult<{ ticketId: string }>> {
  try {
    const user = await requireUser();
    const validated = CreateTicketSchema.parse(formData);

    // Upsert customer — unique per tenant + email
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_email: {
          tenantId: user.tenantId,
          email: validated.customerEmail,
        },
      },
      create: {
        email: validated.customerEmail,
        name: validated.customerName,
        tenantId: user.tenantId,
      },
      update: {
        name: validated.customerName,
      },
    });

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject: validated.subject,
        description: validated.description,
        channel: validated.channel,
        priority: validated.priority ?? Priority.MEDIUM,
        tenantId: user.tenantId,
        customerId: customer.id,
        assignedAgentId: user.id,
      },
    });

    // Trigger AI analysis in the background — Pusher emit fires AFTER AI sets priority
    analyzeTicketAsync(
      ticket.id,
      validated.subject,
      validated.description,
      user.tenantId,
      customer.name,
      customer.email,
      ticket.createdAt.toISOString()
    );

    revalidatePath("/dashboard");
    return { success: true, data: { ticketId: ticket.id } };
  } catch (error) {
    console.error("createTicket error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create ticket" };
  }
}

/**
 * Runs AI analysis on a ticket, updates the DB record, then emits Pusher event.
 * Called in the background — Pusher fires with AI-assigned priority.
 */
async function analyzeTicketAsync(
  ticketId: string,
  subject: string,
  description: string,
  tenantId: string,
  customerName: string,
  customerEmail: string,
  createdAt: string
) {
  try {
    const analysis = await analyzeTicketWithProvider(subject, description, tenantId);

    const updated = await prisma.ticket.update({
      where: { id: ticketId, tenantId },
      data: {
        aiSuggestedResponse: analysis.suggestedResponse,
        aiPriority: analysis.priority as Priority,
        aiAnalyzedAt: new Date(),
        tags: analysis.tags,
        // Auto-upgrade priority if AI deems it higher (skip on limit-exceeded fallback)
        ...(!analysis.limitExceeded && { priority: analysis.priority as Priority }),
      },
      select: { priority: true, status: true },
    });

    // Emit AFTER AI analysis so the toast contains the AI-assigned priority
    await emitTicketCreated(tenantId, {
      ticket: {
        id: ticketId,
        subject,
        priority: updated.priority,
        status: updated.status,
        createdAt,
        customer: { name: customerName, email: customerEmail },
      },
    });

    // No revalidatePath needed here — force-dynamic on layout/page ensures
    // router.refresh() (triggered by the Pusher event above) always fetches fresh data.
  } catch (error) {
    console.error("AI analysis failed for ticket", ticketId, error);
  }
}

type SortField = "createdAt" | "priority" | "status" | "messages";
type SortDir = "asc" | "desc";

/**
 * Fetches all tickets for the authenticated user's tenant.
 * Enforces tenant isolation at the query level.
 * Supports sort/dir for column sorting.
 */
export async function getTickets(filters?: {
  status?: TicketStatus;
  priority?: Priority;
  search?: string;
  sort?: SortField;
  dir?: SortDir;
}) {
  const user = await requireUser();

  const sortField: SortField = filters?.sort ?? "createdAt";
  const sortDir: SortDir = filters?.dir ?? "desc";

  let orderBy: object;
  if (sortField === "messages") {
    orderBy = { messages: { _count: sortDir } };
  } else {
    orderBy = { [sortField]: sortDir };
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: user.tenantId, // CRITICAL: always scope to tenant
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.search && {
        OR: [
          { subject: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { customer: { name: { contains: filters.search, mode: "insensitive" } } },
          { customer: { email: { contains: filters.search, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      assignedAgent: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { messages: true } },
    },
    orderBy,
  });

  return tickets;
}

/**
 * Fetches a single ticket by ID, scoped to the current tenant.
 */
export async function getTicketById(ticketId: string) {
  const user = await requireUser();

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      tenantId: user.tenantId, // CRITICAL: tenant scope check
    },
    include: {
      customer: true,
      assignedAgent: { select: { id: true, name: true, avatarUrl: true, email: true } },
      messages: {
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return ticket;
}

/**
 * Updates ticket status, scoped to tenant.
 */
export async function updateTicketStatus(
  data: z.infer<typeof UpdateTicketStatusSchema>
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const validated = UpdateTicketStatusSchema.parse(data);
    await verifyTenantAccess(validated.ticketId);

    await prisma.ticket.update({
      where: {
        id: validated.ticketId,
        tenantId: user.tenantId, // enforce tenant ownership
      },
      data: {
        status: validated.status,
        ...(validated.status === TicketStatus.RESOLVED && { resolvedAt: new Date() }),
      },
    });

    revalidatePath("/dashboard/tickets");
    revalidatePath(`/dashboard/tickets/${validated.ticketId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to update ticket status" };
  }
}

/**
 * Returns the 10 most recently updated tickets for the activity timeline panel.
 */
export async function getRecentActivity() {
  const user = await requireUser();

  const tickets = await prisma.ticket.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      assignedAgentId: true,
    },
  });

  return tickets.map((t) => {
    let event: string;
    if (t.resolvedAt && Math.abs(t.resolvedAt.getTime() - t.updatedAt.getTime()) < 5000) {
      event = "Resolved";
    } else if (Math.abs(t.createdAt.getTime() - t.updatedAt.getTime()) < 5000) {
      event = "Created";
    } else if (t.assignedAgentId) {
      event = "Assigned";
    } else {
      event = "Updated";
    }
    return { ...t, event };
  });
}

/**
 * Returns 7-day daily ticket counts for sparkline charts on the dashboard.
 * Each array index = days ago (index 0 = 6 days ago, index 6 = today).
 */
export async function getSparklineData() {
  const user = await requireUser();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentTickets, resolvedTickets] = await Promise.all([
    prisma.ticket.findMany({
      where: { tenantId: user.tenantId, createdAt: { gte: sevenDaysAgo } },
      select: { status: true, priority: true, createdAt: true },
    }),
    prisma.ticket.findMany({
      where: { tenantId: user.tenantId, resolvedAt: { gte: sevenDaysAgo } },
      select: { resolvedAt: true },
    }),
  ]);

  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  return {
    open: buckets.map(
      (day) =>
        recentTickets.filter(
          (t) => t.status === TicketStatus.OPEN && t.createdAt.toDateString() === day
        ).length
    ),
    inProgress: buckets.map(
      (day) =>
        recentTickets.filter(
          (t) => t.status === TicketStatus.IN_PROGRESS && t.createdAt.toDateString() === day
        ).length
    ),
    critical: buckets.map(
      (day) =>
        recentTickets.filter(
          (t) => t.priority === Priority.CRITICAL && t.createdAt.toDateString() === day
        ).length
    ),
    resolved: buckets.map(
      (day) =>
        resolvedTickets.filter((t) => t.resolvedAt?.toDateString() === day).length
    ),
  };
}

/**
 * Assigns a ticket to an agent, scoped to tenant.
 */
export async function assignTicket(
  data: z.infer<typeof AssignTicketSchema>
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const validated = AssignTicketSchema.parse(data);
    await verifyTenantAccess(validated.ticketId);

    await prisma.ticket.update({
      where: {
        id: validated.ticketId,
        tenantId: user.tenantId,
      },
      data: { assignedAgentId: validated.agentId },
    });

    revalidatePath(`/dashboard/tickets/${validated.ticketId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to assign ticket" };
  }
}
