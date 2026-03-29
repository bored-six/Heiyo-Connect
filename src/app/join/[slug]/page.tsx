import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { JoinRequestForm } from "@/components/join/join-request-form"
import { Clock } from "lucide-react"

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { userId } = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight mb-2">Invalid invite link</h1>
          <p className="text-sm text-muted-foreground">
            This link is invalid or has expired. Ask your team for a new one.
          </p>
        </div>
      </div>
    )
  }

  // Logged-in user flow
  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        memberships: { where: { tenantId: tenant.id } },
        joinRequests: { where: { tenantId: tenant.id } },
      },
    })

    // No DB record yet → onboarding creates the user record first
    if (!dbUser) {
      redirect(`/onboarding?join=${encodeURIComponent(slug)}`)
    }

    // Already a member of this workspace
    if (dbUser.memberships.length > 0) {
      redirect("/dashboard")
    }

    // Has a pending request
    const pendingRequest = dbUser.joinRequests.find((r) => r.status === "PENDING")
    if (pendingRequest) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="size-5 text-amber-600" />
              </div>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Request pending</h1>
            <p className="text-sm text-muted-foreground">
              Your request to join{" "}
              <span className="font-medium text-foreground">{tenant.name}</span> is awaiting
              approval. You&apos;ll be notified once an owner approves it.
            </p>
            <Link href="/dashboard" className="inline-block text-sm text-primary hover:underline">
              Go to your dashboard →
            </Link>
          </div>
        </div>
      )
    }

    // Was denied
    const denied = dbUser.joinRequests.find((r) => r.status === "DENIED")
    if (denied) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold tracking-tight">Request declined</h1>
            <p className="text-sm text-muted-foreground">
              Your request to join{" "}
              <span className="font-medium text-foreground">{tenant.name}</span> was declined.
              Contact the workspace owner if you think this was a mistake.
            </p>
          </div>
        </div>
      )
    }

    // Show request form
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              Join {tenant.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Send a request to join this workspace. An owner or admin will approve it and
              assign your role.
            </p>
          </div>
          <JoinRequestForm tenantId={tenant.id} tenantName={tenant.name} />
        </div>
      </div>
    )
  }

  // Not logged in — show auth options
  const joinParam = `?join=${encodeURIComponent(slug)}`

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card rounded-xl shadow-sm border p-8 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Join {tenant.name}</h1>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account to request access to this workspace.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/sign-up${joinParam}`}
            className="flex w-full items-center justify-center rounded-md bg-foreground text-white text-sm font-medium py-2 hover:bg-foreground/90 transition-colors"
          >
            Create an account
          </Link>
          <Link
            href={`/sign-in${joinParam}`}
            className="flex w-full items-center justify-center rounded-md border border-border text-sm font-medium py-2 hover:bg-background transition-colors"
          >
            Sign in to an existing account
          </Link>
        </div>
      </div>
    </div>
  )
}
