export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NavProfileButton } from "@/components/dashboard/nav-profile-button";
import { NavUsageBar } from "@/components/dashboard/nav-usage-bar";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { NavNotificationBell } from "@/components/dashboard/nav-notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

const WORKSPACE_COOKIE = "hw_workspace";

async function getNavData(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      memberships: {
        include: {
          tenant: {
            select: { id: true, name: true, dailyAiUsage: true, dailyAiLimit: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || user.memberships.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const active =
    user.memberships.find((m) => m.tenantId === activeId) ?? user.memberships[0];

  // Fetch pending join requests for OWNER/ADMIN
  const isManager = active.role === "OWNER" || active.role === "ADMIN";
  const joinRequests = isManager
    ? await prisma.joinRequest.findMany({
        where: { tenantId: active.tenantId, status: "PENDING" },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return { user, active, all: user.memberships, joinRequests };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const data = await getNavData(userId);

  // No workspace membership — send to onboarding
  if (!data) redirect("/onboarding");

  const { user, active, all, joinRequests } = data;

  const workspaces = all.map((m) => ({
    tenantId: m.tenantId,
    tenantName: m.tenant.name,
    role: m.role,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border">
        <div className="px-6 h-14 flex items-center justify-between">
          {/* Logo + workspace switcher */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="24" height="24" rx="6" fill="#6366F1"/>
                <rect x="5.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
                <rect x="15.5" y="6" width="3" height="12" rx="1.5" fill="white"/>
                <rect x="5.5" y="10" width="13" height="3.5" rx="1.5" fill="white"/>
              </svg>
              <span className="font-semibold text-base tracking-tight text-foreground">
                Heiyo
              </span>
            </Link>

            <span className="text-gray-300 text-sm">/</span>

            <WorkspaceSwitcher
              current={{
                tenantId: active.tenantId,
                tenantName: active.tenant.name,
                role: active.role,
              }}
              all={workspaces}
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Nav links */}
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/tickets" className="transition-colors hover:text-foreground">
                Tickets
              </Link>
              <Link href="/dashboard/customers" className="transition-colors hover:text-foreground">
                Customers
              </Link>
              <Link href="/dashboard/reports" className="transition-colors hover:text-foreground">
                Reports
              </Link>
              <Link href="/dashboard/settings" className="transition-colors hover:text-foreground">
                Settings
              </Link>
            </div>

            {(active.role === "OWNER" || active.role === "ADMIN") && (
              <NavNotificationBell
                initialRequests={joinRequests}
                currentUserRole={active.role}
              />
            )}

            <ThemeToggle />

            <NavProfileButton
              name={user.name}
              email={user.email}
              avatarUrl={user.avatarUrl}
            />

            <NavUsageBar
              initialUsage={active.tenant.dailyAiUsage}
              dailyAiLimit={active.tenant.dailyAiLimit}
              tenantId={active.tenant.id}
            />
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
