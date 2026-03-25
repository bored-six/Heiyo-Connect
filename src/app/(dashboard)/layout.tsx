export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavLogoutButton } from "@/components/dashboard/nav-logout-button";
import { NavUsageBar } from "@/components/dashboard/nav-usage-bar";
import { SparklesIcon } from "lucide-react";
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#09090f", color: "#f1f5f9" }}
    >
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4" style={{ color: "#818cf8" }} />
            <span className="font-semibold text-base tracking-tight text-white">
              Heiyo Connect
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Nav links */}
            <div className="flex items-center gap-5 text-sm" style={{ color: "#94a3b8" }}>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/tickets"
                className="transition-colors hover:text-white"
              >
                Tickets
              </Link>
              <Link
                href="/dashboard/reports"
                className="transition-colors hover:text-white"
              >
                Reports
              </Link>
              <Link
                href="/dashboard/settings"
                className="transition-colors hover:text-white"
              >
                Settings
              </Link>
            </div>

            <NavLogoutButton />

            {usage && (
              <NavUsageBar
                initialUsage={usage.dailyAiUsage}
                dailyAiLimit={usage.dailyAiLimit}
                tenantId={usage.id}
              />
            )}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
