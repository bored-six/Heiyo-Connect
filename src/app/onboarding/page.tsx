import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createTenantAndUser } from "@/actions/onboarding"

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (existing) redirect("/dashboard")
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
