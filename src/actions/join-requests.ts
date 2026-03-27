"use server"

import { z } from "zod"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/tenant"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { redirect } from "next/navigation"

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

const SubmitSchema = z.object({
  tenantId: z.string(),
  message: z.string().max(500).optional(),
})

const ApproveSchema = z.object({
  requestId: z.string(),
  role: z.nativeEnum(Role),
})

export async function submitJoinRequest(data: unknown): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/sign-in")

  const { tenantId, message } = SubmitSchema.parse(data)

  // Ensure the tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return { success: false, error: "Workspace not found" }

  // Get or create DB user
  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
          : null,
        avatarUrl: clerkUser.imageUrl ?? null,
      },
    })
  }

  // Already a member?
  const existing = await prisma.tenantMembership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  })
  if (existing) return { success: false, error: "You are already a member of this workspace" }

  // Upsert request (idempotent — clicking submit twice is safe)
  await prisma.joinRequest.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    create: { userId: user.id, tenantId, message: message ?? null, status: "PENDING" },
    update: { status: "PENDING", message: message ?? null, updatedAt: new Date() },
  })

  return { success: true, data: undefined }
}

export async function getJoinRequests() {
  const user = await requireUser()
  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    return []
  }

  return prisma.joinRequest.findMany({
    where: { tenantId: user.tenantId, status: "PENDING" },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function getPendingRequestCount(): Promise<number> {
  const user = await requireUser()
  if (user.role !== "OWNER" && user.role !== "ADMIN") return 0

  return prisma.joinRequest.count({
    where: { tenantId: user.tenantId, status: "PENDING" },
  })
}

export async function approveJoinRequest(data: unknown): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()
    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    const { requestId, role } = ApproveSchema.parse(data)

    // ADMINs can only assign AGENT or VIEWER
    if (currentUser.role === "ADMIN" && (role === "OWNER" || role === "ADMIN")) {
      return { success: false, error: "Admins can only assign Agent or Viewer roles" }
    }

    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    })
    if (!request) return { success: false, error: "Request not found" }
    if (request.tenantId !== currentUser.tenantId) {
      return { success: false, error: "Request not found" }
    }

    await prisma.$transaction([
      prisma.tenantMembership.upsert({
        where: { userId_tenantId: { userId: request.userId, tenantId: request.tenantId } },
        create: { userId: request.userId, tenantId: request.tenantId, role },
        update: { role },
      }),
      prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      }),
    ])

    revalidatePath("/dashboard/settings")
    return { success: true, data: undefined }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: "Failed to approve request" }
  }
}

export async function denyJoinRequest(requestId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()
    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    const request = await prisma.joinRequest.findUnique({ where: { id: requestId } })
    if (!request || request.tenantId !== currentUser.tenantId) {
      return { success: false, error: "Request not found" }
    }

    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "DENIED" },
    })

    revalidatePath("/dashboard/settings")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to deny request" }
  }
}
