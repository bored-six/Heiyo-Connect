import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { analyzeTicket } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

const AnalyzeRequestSchema = z.object({
  subject: z.string().min(3),
  description: z.string().min(10),
  ticketId: z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = AnalyzeRequestSchema.parse(body);

    // Get customer history if ticketId provided
    let customerHistory;
    if (validated.ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: validated.ticketId },
        include: {
          customer: {
            include: { _count: { select: { tickets: true } } },
          },
        },
      });

      if (ticket) {
        const resolvedCount = await prisma.ticket.count({
          where: {
            customerId: ticket.customerId,
            status: { in: ["RESOLVED", "CLOSED"] },
          },
        });

        customerHistory = {
          totalTickets: ticket.customer._count.tickets,
          resolvedTickets: resolvedCount,
        };
      }
    }

    const analysis = await analyzeTicket(
      validated.subject,
      validated.description,
      customerHistory
    );

    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("AI analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
