import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight mb-2">Invalid invite link</h1>
          <p className="text-sm text-gray-500">This link is invalid or has expired. Ask your team for a new one.</p>
        </div>
      </div>
    )
  }

  // Already logged into Clerk — skip auth pages entirely
  if (userId) {
    const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (existing) {
      // Already a member of some workspace — go to dashboard
      redirect("/dashboard")
    }
    // Authenticated but no DB record yet — go straight to join onboarding
    redirect(`/onboarding?join=${encodeURIComponent(slug)}`)
  }

  // Not logged in — show options for both new and existing users
  const joinParam = `?join=${encodeURIComponent(slug)}`

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">
            Join {tenant.name}
          </h1>
          <p className="text-sm text-gray-500">
            You&apos;ve been invited to join this workspace.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/sign-up${joinParam}`}
            className="flex w-full items-center justify-center rounded-md bg-black text-white text-sm font-medium py-2 hover:bg-gray-800 transition-colors"
          >
            Create an account
          </Link>
          <Link
            href={`/sign-in${joinParam}`}
            className="flex w-full items-center justify-center rounded-md border border-gray-300 text-sm font-medium py-2 hover:bg-gray-50 transition-colors"
          >
            Sign in to an existing account
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-5 text-center">
          You&apos;ll join <span className="font-medium text-gray-600">{tenant.name}</span> as an Agent.
        </p>
      </div>
    </div>
  )
}
