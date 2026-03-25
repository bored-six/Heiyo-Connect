export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavLogoutButton } from "@/components/dashboard/nav-logout-button";
import { NavUsageBar } from "@/components/dashboard/nav-usage-bar";
import Link from "next/link";

async function getNavUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      tenant: {
        select: { id: true, dailyAiUsage: true, dailyAiLimit: true },
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
              href="/dashboard/reports"
              className="hover:text-foreground transition-colors"
            >
              Reports
            </Link>
            <Link
              href="/dashboard/settings"
              className="hover:text-foreground transition-colors"
            >
              Settings
            </Link>
          </div>

          <NavLogoutButton />

          {/* AI Usage indicator — client component, updates live via Pusher */}
          {usage && (
            <NavUsageBar
              initialUsage={usage.dailyAiUsage}
              dailyAiLimit={usage.dailyAiLimit}
              tenantId={usage.id}
            />
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
