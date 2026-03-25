import { getTenantAnalytics } from "@/lib/analytics"
import { requireUser } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ReportsCharts } from "@/components/dashboard/reports-charts"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  try {
    await requireUser()
  } catch {
    redirect("/onboarding")
  }

  const analytics = await getTenantAnalytics()

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Executive Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI performance and ticket analytics for your workspace
        </p>
      </div>

      <ReportsCharts data={analytics} />
    </main>
  )
}
