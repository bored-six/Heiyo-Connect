"use server"

import { z } from "zod"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

const OnboardingSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
})

type OnboardingState = { error: string | null } | null

export async function createTenantAndUser(
  _prev: OnboardingState,
  formData: FormData
): Promise<{ error: string | null }> {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const parsed = OnboardingSchema.safeParse({
    companyName: formData.get("companyName"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { companyName } = parsed.data
  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/sign-in")

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (existing) redirect("/dashboard")

  const slug =
    companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) +
    "-" +
    Date.now().toString(36)

  try {
    await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        users: {
          create: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0].emailAddress,
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
              : null,
            avatarUrl: clerkUser.imageUrl ?? null,
            role: "OWNER",
          },
        },
      },
    })
  } catch {
    return { error: "Failed to create workspace. Please try again." }
  }

  redirect("/dashboard")
}

export async function joinTenant(
  _prev: { error: string | null } | null,
  formData: FormData
): Promise<{ error: string | null }> {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const slug = formData.get("slug") as string
  if (!slug) return { error: "Invalid invite link" }

  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/sign-in")

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (existing) redirect("/dashboard")

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) return { error: "Invalid or expired invite link. Ask your team for a new one." }

  try {
    await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
          : null,
        avatarUrl: clerkUser.imageUrl ?? null,
        role: "AGENT",
        tenantId: tenant.id,
      },
    })
  } catch {
    return { error: "Failed to join workspace. Please try again." }
  }

  redirect("/dashboard")
}
