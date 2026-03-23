import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { cache } from "react";
import { notFound } from "next/navigation";

/**
 * Gets the current tenant for the authenticated user.
 * Uses React cache() to avoid duplicate DB calls per request.
 */
export const getCurrentTenant = cache(async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });

  return user?.tenant ?? null;
});

/**
 * Gets the current user with tenant.
 * Throws if unauthenticated.
 */
export const requireUser = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });

  if (!user) {
    throw new Error("User not found — complete onboarding first");
  }

  return user;
});

/**
 * Verifies the authenticated user owns the given ticket (IDOR guard).
 * Calls notFound() on mismatch — safe to use in Server Components and Actions.
 */
export async function verifyTenantAccess(ticketId: string): Promise<void> {
  const user = await requireUser();

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId: user.tenantId },
    select: { id: true },
  });

  if (!ticket) notFound();
}
