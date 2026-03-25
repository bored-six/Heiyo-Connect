export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Progress } from "@/components/ui/progress";
import { NavLogoutButton } from "@/components/dashboard/nav-logout-button";
import Link from "next/link";

async function getNavUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      tenant: {
        select: { dailyAiUsage: true, dailyAiLimit: true },
      },
    },
  });
  return user?.tenant ?? null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const usage = await getNavUsage(userId);
  const usagePct = usage
    ? Math.round((usage.dailyAiUsage / usage.dailyAiLimit) * 100)
    : 0;
  const isAtLimit = usage ? usage.dailyAiUsage >= usage.dailyAiLimit : false;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-lg tracking-tight">Heiyo Connect</span>

        <div className="flex items-center gap-6">
          {/* Navigation links */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link
              href="/dashboard/tickets"
              className="hover:text-foreground transition-colors"
            >
              Tickets
            </Link>
            <Link
              href="/dashboard/settings"
              className="hover:text-foreground transition-colors"
            >
              Settings
            </Link>
          </div>

          <NavLogoutButton />

          {/* AI Usage indicator */}
          {usage && (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="AI requests used today — click to manage"
            >
              <div className="flex flex-col items-end gap-1 min-w-[100px]">
                <span className={isAtLimit ? "text-destructive font-semibold" : ""}>
                  {isAtLimit ? "AI Limit Reached" : `AI: ${usage.dailyAiUsage}/${usage.dailyAiLimit}`}
                </span>
                <Progress value={usagePct} className="w-24 h-1.5" />
              </div>
            </Link>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
