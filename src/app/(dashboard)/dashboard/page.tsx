import { getTickets, getSparklineData, getRecentActivity } from "@/actions/tickets";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { TicketTable } from "@/components/dashboard/ticket-table";
import { TicketFilters } from "@/components/dashboard/ticket-filters";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { CreateTicketButton } from "@/components/dashboard/create-ticket-button";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutCard } from "@/components/dashboard/donut-card";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { getAiUsage } from "@/actions/settings";
import type { AiProvider, TicketStatus, Priority } from "@prisma/client";

const AI_PROVIDER_SHORT: Record<AiProvider, string> = {
  GEMINI: "Gemini 2.0 Flash",
  GROQ: "Llama 3 (Groq)",
  MISTRAL: "Mistral Small",
};

const VALID_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];
const VALID_PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; status?: string; priority?: string }>;
}) {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const validSorts = ["createdAt", "priority", "status", "messages"] as const;
  type SortField = (typeof validSorts)[number];
  const sort = validSorts.includes(params.sort as SortField)
    ? (params.sort as SortField)
    : "createdAt";
  const dir = params.dir === "asc" ? "asc" : "desc";

  const status = VALID_STATUSES.includes(params.status as TicketStatus)
    ? (params.status as TicketStatus)
    : undefined;
  const priority = VALID_PRIORITIES.includes(params.priority as Priority)
    ? (params.priority as Priority)
    : undefined;

  const [tickets, aiUsage, sparkline, activity] = await Promise.all([
    getTickets({ sort, dir, status, priority }),
    getAiUsage(),
    getSparklineData(),
    getRecentActivity(),
  ]);

  const stats = {
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    critical: tickets.filter((t) => t.priority === "CRITICAL").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {user.tenant.name} — Support Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user.name ?? user.email}
          </p>
          {aiUsage && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active AI: {AI_PROVIDER_SHORT[aiUsage.aiProvider]}
            </span>
          )}
        </div>
        {/* Search + Create — CommandPalette renders its own trigger button */}
        <div className="flex items-center gap-2 shrink-0">
          <ActivityTimeline activities={activity} />
          <CommandPalette />
          <CreateTicketButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Open"
          value={stats.open}
          colorClass="text-emerald-600"
          sparkline={sparkline.open}
          sparklineColor="#10b981"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          colorClass="text-blue-600"
          sparkline={sparkline.inProgress}
          sparklineColor="#3b82f6"
        />
        <StatCard
          label="Critical"
          value={stats.critical}
          colorClass="text-red-600"
          sparkline={sparkline.critical}
          sparklineColor="#ef4444"
        />
        <DonutCard
          resolved={stats.resolved}
          total={tickets.length}
        />
      </div>

      {/* Ticket Table — client component with useOptimistic quick actions + Pusher */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-medium">All Tickets</h2>
          <TicketFilters currentStatus={status} currentPriority={priority} />
        </div>
        <TicketTable
          tickets={tickets}
          currentUserId={user.id}
          tenantId={user.tenantId}
          currentSort={sort}
          currentDir={dir}
          currentStatus={status}
          currentPriority={priority}
        />
      </div>
    </main>
  );
}
