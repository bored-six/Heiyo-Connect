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

  const slug =
    companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) +
    "-" +
    Date.now().toString(36)

  try {
    // Get or create the global User record
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

    // Create the tenant + membership in one transaction
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    })

    // Set active workspace cookie
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.set("hw_workspace", tenant.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    })
  } catch {
    return { error: "Failed to create workspace. Please try again." }
  }

  redirect("/dashboard")
}

export async function joinTenant(
  _prev: OnboardingState,
  formData: FormData
): Promise<{ error: string | null }> {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Accept full URL (https://app.../join/slug) or bare slug
  const raw = (formData.get("inviteLink") ?? formData.get("slug") ?? "") as string
  const slug = extractSlug(raw.trim())
  if (!slug) return { error: "Invalid invite link" }

  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/sign-in")

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) return { error: "Invalid or expired invite link. Ask your team for a new one." }

  try {
    // Get or create the global User record
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

    // Already a member → just set cookie and send to dashboard
    const existing = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    })
    if (existing) {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      cookieStore.set("hw_workspace", tenant.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      })
      redirect("/dashboard")
    }

    // Submit a join request — owner/admin must approve before access is granted
    await prisma.joinRequest.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      create: { userId: user.id, tenantId: tenant.id, status: "PENDING" },
      update: { status: "PENDING", updatedAt: new Date() },
    })
  } catch {
    return { error: "Failed to send join request. Please try again." }
  }

  redirect(`/join/${slug}`)
}

function extractSlug(input: string): string {
  try {
    const url = new URL(input)
    const parts = url.pathname.split("/").filter(Boolean)
    const joinIndex = parts.indexOf("join")
    if (joinIndex !== -1 && parts[joinIndex + 1]) {
      return parts[joinIndex + 1]
    }
  } catch {
    // Not a URL — treat as bare slug
  }
  return input
}
