import { getTickets } from "@/actions/tickets";

export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { TicketTable } from "@/components/dashboard/ticket-table";
import { TicketFilters } from "@/components/dashboard/ticket-filters";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { CreateTicketButton } from "@/components/dashboard/create-ticket-button";
import { getAiUsage } from "@/actions/settings";
import { AiProvider, TicketStatus, Priority } from "@prisma/client";

const AI_PROVIDER_SHORT: Record<AiProvider, string> = {
  GEMINI: "Gemini 2.0 Flash",
  GROQ: "Llama 3 (Groq)",
  MISTRAL: "Mistral Small",
};

const VALID_STATUSES = Object.values(TicketStatus);
const VALID_PRIORITIES = Object.values(Priority);

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

  const [tickets, aiUsage] = await Promise.all([
    getTickets({ sort, dir, status, priority }),
    getAiUsage(),
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
          <CommandPalette />
          <CreateTicketButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Open", value: stats.open, color: "text-emerald-600" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
          { label: "Critical", value: stats.critical, color: "text-red-600" },
          { label: "Resolved", value: stats.resolved, color: "text-slate-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Ticket Table — client component with useOptimistic quick actions + Pusher */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col gap-3">
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
