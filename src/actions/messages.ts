"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, verifyTenantAccess } from "@/lib/tenant";
import { generateReply } from "@/lib/gemini";

const SendMessageSchema = z.object({
  ticketId: z.string().cuid(),
  body: z.string().min(1).max(10000),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Sends a message on a ticket thread.
 * Validates tenant ownership before inserting.
 */
export async function sendMessage(
  data: z.infer<typeof SendMessageSchema>
): Promise<ActionResult<{ messageId: string }>> {
  try {
    const user = await requireUser();
    const validated = SendMessageSchema.parse(data);
    await verifyTenantAccess(validated.ticketId);

    const ticket = await prisma.ticket.findFirst({
      where: { id: validated.ticketId, tenantId: user.tenantId },
      select: { id: true },
    });

    if (!ticket) return { success: false, error: "Ticket not found" };

    const message = await prisma.message.create({
      data: {
        body: validated.body,
        isFromAgent: true,
        tenantId: user.tenantId,
        ticketId: validated.ticketId,
        authorId: user.id,
      },
    });

    revalidatePath(`/dashboard/tickets/${validated.ticketId}`);
    return { success: true, data: { messageId: message.id } };
  } catch (error) {
    return { success: false, error: "Failed to send message" };
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
