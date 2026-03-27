"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";

export async function getCustomers() {
  const user = await requireUser();

  const customers = await prisma.customer.findMany({
    where: { tenantId: user.tenantId },
    include: {
      _count: { select: { tickets: true } },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, status: true, priority: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    ticketCount: c._count.tickets,
    lastTicketAt: c.tickets[0]?.createdAt ?? null,
    lastTicketStatus: c.tickets[0]?.status ?? null,
    lastTicketPriority: c.tickets[0]?.priority ?? null,
  }));
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
