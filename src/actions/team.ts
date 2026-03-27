"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const UpdateRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(Role),
});

export async function getTeamMembers() {
  const user = await requireUser();

  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId: user.tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    ...m.user,
    role: m.role,
    membershipId: m.id,
  }));
}

export async function updateMemberRole(data: unknown): Promise<ActionResult> {
  try {
    const currentUser = await requireUser();

    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    const { userId, role } = UpdateRoleSchema.parse(data);

    if (userId === currentUser.id) {
      return { success: false, error: "Cannot change your own role" };
    }

    const target = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId: currentUser.tenantId } },
    });
    if (!target) return { success: false, error: "User not found" };

    if (role === "OWNER" || target.role === "OWNER") {
      if (currentUser.role !== "OWNER") {
        return { success: false, error: "Only owners can modify owner-level roles" };
      }
    }

    if (currentUser.role === "ADMIN" && (role === "OWNER" || role === "ADMIN")) {
      return { success: false, error: "Admins can only assign Agent or Viewer roles" };
    }

    await prisma.tenantMembership.update({
      where: { userId_tenantId: { userId, tenantId: currentUser.tenantId } },
      data: { role },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update role" };
  }
}

export async function removeMember(userId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireUser();

    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    if (userId === currentUser.id) {
      return { success: false, error: "Cannot remove yourself" };
    }

    const target = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId: currentUser.tenantId } },
    });
    if (!target) return { success: false, error: "User not found" };

    if (target.role === "OWNER" && currentUser.role !== "OWNER") {
      return { success: false, error: "Only owners can remove other owners" };
    }

    // Remove membership only — the User record stays (they may have other workspaces)
    await prisma.tenantMembership.delete({
      where: { userId_tenantId: { userId, tenantId: currentUser.tenantId } },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to remove member" };
  }
}
