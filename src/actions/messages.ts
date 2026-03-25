"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";
import { emitNewMessage } from "@/lib/pusher-server";
import { SenderRole, TicketStatus } from "@prisma/client";

const SendReplySchema = z.object({
  ticketId: z.string().cuid(),
  body: z.string().min(1).max(10000),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Sends an agent reply on a ticket thread.
 * - Creates Message with senderRole: AGENT
 * - Auto-flips ticket status OPEN → IN_PROGRESS on first reply
 * - Creates a SYSTEM audit message when status changes
 * - Emits Pusher message:new event
 */
export async function sendReply(
  data: z.infer<typeof SendReplySchema>
): Promise<ActionResult<{ messageId: string }>> {
  try {
    const user = await requireUser();
    const validated = SendReplySchema.parse(data);

    const ticket = await prisma.ticket.findFirst({
      where: { id: validated.ticketId, tenantId: user.tenantId },
      select: { id: true, status: true },
    });

    if (!ticket) return { success: false, error: "Ticket not found" };

    // Create the agent message
    const message = await prisma.message.create({
      data: {
        body: validated.body,
        senderRole: SenderRole.AGENT,
        isFromAgent: true,
        tenantId: user.tenantId,
        ticketId: validated.ticketId,
        authorId: user.id,
      },
      include: { author: { select: { name: true, avatarUrl: true } } },
    });

    // Auto-update status OPEN → IN_PROGRESS on first agent reply
    if (ticket.status === TicketStatus.OPEN) {
      await prisma.ticket.update({
        where: { id: validated.ticketId, tenantId: user.tenantId },
        data: { status: TicketStatus.IN_PROGRESS },
      });

      // Audit log — SYSTEM message for status change
      await prisma.message.create({
        data: {
          body: `Status changed to In Progress`,
          senderRole: SenderRole.SYSTEM,
          isFromAgent: false,
          tenantId: user.tenantId,
          ticketId: validated.ticketId,
        },
      });
    }

    // Emit Pusher event — fire and forget, consistent with existing pattern
    emitNewMessage(validated.ticketId, {
      message: {
        id: message.id,
        body: message.body,
        senderRole: SenderRole.AGENT,
        isFromAgent: true,
        createdAt: message.createdAt.toISOString(),
        author: message.author ?? undefined,
      },
      ticketId: validated.ticketId,
    }).catch(() => {
      // Non-fatal — message was saved to DB regardless
    });

    revalidatePath(`/dashboard/tickets/${validated.ticketId}`);
    return { success: true, data: { messageId: message.id } };
  } catch (error) {
    console.error("sendReply error:", error);
    return { success: false, error: "Failed to send reply" };
  }
}

/**
 * Generates an AI-suggested reply for the current ticket thread.
 */
export async function generateAiReply(
  ticketId: string
): Promise<ActionResult<{ suggestion: string }>> {
  try {
    const user = await requireUser();
    const { generateReply } = await import("@/lib/gemini");

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: user.tenantId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { body: true, isFromAgent: true },
        },
      },
    });

    if (!ticket) return { success: false, error: "Ticket not found" };

    const latestCustomerMessage =
      ticket.messages.find((m) => !m.isFromAgent)?.body ?? ticket.description;

    const suggestion = await generateReply(
      ticket.subject,
      ticket.messages.reverse(),
      latestCustomerMessage
    );

    return { success: true, data: { suggestion } };
  } catch (error) {
    return { success: false, error: "Failed to generate AI reply" };
  }
}
