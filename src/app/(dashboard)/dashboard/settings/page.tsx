import type { Metadata } from "next";
import { requireUser } from "@/lib/tenant";

export const metadata: Metadata = { title: "Settings" };
import { redirect } from "next/navigation";
import { getAiUsage } from "@/actions/settings";
import { getTeamMembers } from "@/actions/team";
import { Progress } from "@/components/ui/progress";
import { AiProviderForm } from "@/components/settings/ai-provider-form";
import { TeamMembers } from "@/components/settings/team-members";

export default async function SettingsPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/onboarding");
  }

  const [usage, members] = await Promise.all([getAiUsage(), getTeamMembers()]);
  if (!usage) redirect("/onboarding");

  const { aiProvider, dailyAiUsage, dailyAiLimit } = usage;
  const usagePct = Math.round((dailyAiUsage / dailyAiLimit) * 100);
  const isAtLimit = dailyAiUsage >= dailyAiLimit;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI provider and usage limits.
        </p>
      </div>

      {/* AI Usage */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-medium">AI Analysis Usage</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resets at midnight UTC.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today's usage</span>
            <span className={isAtLimit ? "text-destructive font-semibold" : "font-medium"}>
              {dailyAiUsage} / {dailyAiLimit} requests
            </span>
          </div>
          <Progress value={usagePct} />
        </div>

        {isAtLimit && (
          <p className="text-sm text-destructive">
            Daily limit reached. New tickets will receive a manual review placeholder until midnight UTC.
          </p>
        )}
      </section>

      {/* AI Provider */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-medium">AI Provider</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose the model used to analyze tickets and suggest responses.
            Active from the next ticket created.
          </p>
        </div>

        <AiProviderForm currentProvider={aiProvider} />
      </section>

      {/* Team */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-medium">Team</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} member{members.length !== 1 ? "s" : ""} in this workspace.
            {(user.role === "OWNER" || user.role === "ADMIN") && (
              <span> Role changes take effect immediately.</span>
            )}
          </p>
        </div>

        <TeamMembers
          members={members}
          currentUserId={user.id}
          currentUserRole={user.role}
        />
      </section>
    </main>
  );
}
