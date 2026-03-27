import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { requireUser } from "@/lib/tenant"
import { getAiUsage } from "@/actions/settings"
import { getTeamMembers } from "@/actions/team"
import { getJoinRequests, getPendingRequestCount } from "@/actions/join-requests"
import { Progress } from "@/components/ui/progress"
import { AiProviderForm } from "@/components/settings/ai-provider-form"
import { TeamMembers } from "@/components/settings/team-members"
import { JoinRequestsTab } from "@/components/settings/join-requests-tab"
import { PermissionsTab } from "@/components/settings/permissions-tab"
import { AccountTab } from "@/components/settings/account-tab"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export const metadata: Metadata = { title: "Settings" }

const VALID_TABS = ["members", "requests", "permissions", "ai-provider", "account"] as const
type Tab = (typeof VALID_TABS)[number]

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  let user: Awaited<ReturnType<typeof requireUser>>
  try {
    user = await requireUser()
  } catch {
    redirect("/onboarding")
  }

  const { tab: rawTab } = await searchParams
  const tab: Tab = VALID_TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "members"

  const isManager = user.role === "OWNER" || user.role === "ADMIN"

  const [usage, members, joinRequests, pendingCount] = await Promise.all([
    getAiUsage(),
    getTeamMembers(),
    isManager ? getJoinRequests() : Promise.resolve([]),
    isManager ? getPendingRequestCount() : Promise.resolve(0),
  ])

  if (!usage) redirect("/onboarding")

  const { aiProvider, dailyAiUsage, dailyAiLimit } = usage
  const usagePct = Math.round((dailyAiUsage / dailyAiLimit) * 100)
  const isAtLimit = dailyAiUsage >= dailyAiLimit

  const tabs = [
    { id: "members", label: "Members" },
    ...(isManager ? [{ id: "requests", label: "Join Requests", badge: pendingCount }] : []),
    { id: "permissions", label: "Permissions" },
    { id: "ai-provider", label: "AI Provider" },
    { id: "account", label: "Account" },
  ]

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your workspace, team, and preferences.
        </p>
      </div>

      <Suspense>
        <SettingsTabs tabs={tabs} />
      </Suspense>

      {/* Members */}
      {tab === "members" && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">Team members</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {members.length} member{members.length !== 1 ? "s" : ""} in this workspace.
              {isManager && " Role changes take effect immediately."}
            </p>
          </div>
          <TeamMembers
            members={members}
            currentUserId={user.id}
            currentUserRole={user.role}
            inviteUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/join/${user.tenant.slug}`}
          />
        </section>
      )}

      {/* Join Requests — managers only */}
      {tab === "requests" && isManager && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">Join requests</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              People who have requested access to this workspace.
            </p>
          </div>
          <JoinRequestsTab requests={joinRequests} currentUserRole={user.role} />
        </section>
      )}

      {/* Permissions reference */}
      {tab === "permissions" && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">Permissions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              What each role can and cannot do in this workspace.
            </p>
          </div>
          <PermissionsTab />
        </section>
      )}

      {/* AI Provider */}
      {tab === "ai-provider" && (
        <section className="space-y-6">
          <div>
            <h2 className="font-medium">AI Provider</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose the model used to analyze tickets and suggest responses.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <p className="text-sm font-medium">Daily usage</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resets at midnight UTC</span>
                <span className={isAtLimit ? "text-destructive font-semibold" : "font-medium"}>
                  {dailyAiUsage} / {dailyAiLimit} requests
                </span>
              </div>
              <Progress value={usagePct} />
            </div>
            {isAtLimit && (
              <p className="text-sm text-destructive">
                Daily limit reached. New tickets will queue for manual review until midnight UTC.
              </p>
            )}
          </div>
          <div className="rounded-lg border bg-card p-5">
            <AiProviderForm currentProvider={aiProvider} />
          </div>
        </section>
      )}

      {/* Account */}
      {tab === "account" && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">Account</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Your profile and session.</p>
          </div>
          <AccountTab
            user={{
              name: user.name ?? null,
              email: user.email,
              role: user.role,
              tenantName: user.tenant.name,
            }}
          />
        </section>
      )}
    </main>
  )
}
