import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WorkspaceChoice } from "@/components/onboarding/workspace-choice"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { join } = await searchParams

  // Load existing memberships for this Clerk user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      memberships: {
        include: { tenant: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const memberships = user?.memberships ?? []

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <WorkspaceChoice
        memberships={memberships.map((m) => ({
          tenantId: m.tenantId,
          tenantName: m.tenant.name,
          tenantSlug: m.tenant.slug,
          role: m.role,
        }))}
        defaultJoinSlug={join}
      />
    </div>
  )
}
