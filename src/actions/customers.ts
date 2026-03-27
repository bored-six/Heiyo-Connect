"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";

export async function getCustomers() {
  const user = await requireUser();

  const customers = await prisma.customer.findMany({
    where: { tenantId: user.tenantId },
    include: {
      tickets: {
        select: { status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => {
    const sorted = [...c.tickets].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const openCount = c.tickets.filter(
      (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
    ).length;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      ticketCount: c.tickets.length,
      openCount,
      lastTicketAt: sorted[0]?.createdAt ?? null,
      lastTicketStatus: sorted[0]?.status ?? null,
    };
  });
}

export async function getCustomerById(customerId: string) {
  const user = await requireUser();

  return prisma.customer.findFirst({
    where: { id: customerId, tenantId: user.tenantId },
    include: {
      tickets: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          _count: { select: { messages: true } },
        },
      },
    },
  });
}
