import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/tenant";
import { getCustomers } from "@/actions/customers";
import { CustomerGrid } from "@/components/customers/customer-grid";
import { Users, TicketCheck, ActivitySquare } from "lucide-react";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  try {
    await requireUser();
  } catch {
    redirect("/onboarding");
  }

  const customers = await getCustomers();

  const totalTickets = customers.reduce((s, c) => s + c.ticketCount, 0);
  const activeCount = customers.filter((c) => c.openCount > 0).length;
  const resolvedOnlyCount = customers.filter(
    (c) => c.ticketCount > 0 && c.openCount === 0
  ).length;

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everyone who has ever submitted a ticket in your workspace
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </div>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ActivitySquare className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Have Open Tickets</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TicketCheck className="h-4 w-4 text-slate-400" />
            <p className="text-xs text-muted-foreground">Fully Resolved</p>
          </div>
          <p className="text-2xl font-bold">{resolvedOnlyCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TicketCheck className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-muted-foreground">Total Tickets</p>
          </div>
          <p className="text-2xl font-bold">{totalTickets}</p>
        </div>
      </div>

      {/* Customer card grid with search */}
      <CustomerGrid customers={customers} />
    </main>
  );
}
