import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createTenantAndUser, joinTenant } from "@/actions/onboarding"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>;
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (existing) redirect("/dashboard")

  const { join } = await searchParams

  // JOIN flow: invited user
  if (join) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: join } })
    if (tenant) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-md">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight mb-1">
                Join {tenant.name}
              </h1>
              <p className="text-sm text-gray-500">
                You&apos;ve been invited to join this workspace as an Agent.
              </p>
            </div>
            <form
              action={async (formData) => {
                "use server"
                await joinTenant(null, formData)
              }}
              className="space-y-4"
            >
              <input type="hidden" name="slug" value={join} />
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Workspace</p>
                <p className="text-sm font-medium">{tenant.name}</p>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-black text-white text-sm font-medium py-2 hover:bg-gray-800 transition-colors"
              >
                Join workspace
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Wrong workspace?{" "}
              <a href="/onboarding" className="underline hover:text-gray-600">
                Create your own instead
              </a>
            </p>
          </div>
        </div>
      )
    }
  }

  // CREATE flow: new workspace
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Welcome to Heiyo Connect</h1>
        <p className="text-sm text-gray-500 mb-6">Set up your workspace to get started.</p>
        <form
          action={async (formData) => {
            "use server"
            await createTenantAndUser(null, formData)
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company / workspace name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              placeholder="e.g. Acme Corp"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-black text-white text-sm font-medium py-2 hover:bg-gray-800 transition-colors"
          >
            Create workspace
          </button>
        </form>
      </div>
    </div>
  )
}
