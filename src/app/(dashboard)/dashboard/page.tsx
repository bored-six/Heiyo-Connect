import { getTickets } from "@/actions/tickets";

export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { TicketTable } from "@/components/dashboard/ticket-table";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { CreateTicketButton } from "@/components/dashboard/create-ticket-button";

export default async function DashboardPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/onboarding");
  }

  const tickets = await getTickets();

  const stats = {
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    critical: tickets.filter((t) => t.priority === "CRITICAL").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Command Palette — rendered client-side, listens for Cmd+K globally */}
      <CommandPalette />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.tenant.name} — Support Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user.name ?? user.email}
          </p>
        </div>
        <CreateTicketButton />
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
      <TicketTable tickets={tickets} currentUserId={user.id} tenantId={user.tenantId} />
    </main>
  );
}
