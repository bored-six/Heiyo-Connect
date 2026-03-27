import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { cache } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

const WORKSPACE_COOKIE = "hw_workspace";

/**
 * Returns the full user + active workspace membership.
 * Spreads tenantId, tenant, and role to the top level so all existing
 * callers (actions, pages) continue to work without changes.
 */
export const requireUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      memberships: {
        include: { tenant: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) throw new Error("User not found — complete onboarding first");
  if (user.memberships.length === 0) throw new Error("No workspace membership found");

  // Resolve active workspace from cookie, fall back to first membership
  const cookieStore = await cookies();
  const activeId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const membership =
    user.memberships.find((m) => m.tenantId === activeId) ?? user.memberships[0];

  return {
    ...user,
    tenantId: membership.tenantId,
    tenant: membership.tenant,
    role: membership.role,
    membership,
    allMemberships: user.memberships,
  };
});

/**
 * Gets the current tenant for the authenticated user (lightweight, no throw).
 */
export const getCurrentTenant = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const user = await requireUser();
    return user.tenant;
  } catch {
    return null;
  }
});

/**
 * Verifies the authenticated user owns the given ticket (IDOR guard).
 */
export async function verifyTenantAccess(ticketId: string): Promise<void> {
  const user = await requireUser();

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId: user.tenantId },
    select: { id: true },
  });

  if (!ticket) notFound();
}
