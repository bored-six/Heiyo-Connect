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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}
    >
      <nav style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="24" height="24" rx="6" fill="#6366F1"/>
              <rect x="5.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
              <rect x="15.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
              <rect x="5.5" y="10" width="13" height="3.5" rx="1.5" fill="white"/>
            </svg>
            <span className="font-semibold text-base tracking-tight" style={{ color: "#1E293B" }}>
              Heiyo
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Nav links */}
            <div className="flex items-center gap-5 text-sm" style={{ color: "#64748B" }}>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-slate-900"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/tickets"
                className="transition-colors hover:text-slate-900"
              >
                Tickets
              </Link>
              <Link
                href="/dashboard/customers"
                className="transition-colors hover:text-slate-900"
              >
                Customers
              </Link>
              <Link
                href="/dashboard/reports"
                className="transition-colors hover:text-slate-900"
              >
                Reports
              </Link>
              <Link
                href="/dashboard/settings"
                className="transition-colors hover:text-slate-900"
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
