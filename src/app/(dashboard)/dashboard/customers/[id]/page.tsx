import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/tenant";
import { getCustomerById } from "@/actions/customers";
import { ArrowLeft, Mail, Phone, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    await requireUser();
  } catch {
    return { title: "Customer" };
  }
  const customer = await getCustomerById(id);
  if (!customer) return { title: "Customer" };
  return { title: customer.name };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-slate-100 text-slate-600",
  CLOSED: "bg-slate-100 text-slate-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-500",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  CRITICAL: "bg-red-100 text-red-600",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireUser();
  } catch {
    redirect("/onboarding");
  }

  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) notFound();

  const openCount = customer.tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Customer card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{customer.name}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {customer.email}
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3 text-center shrink-0">
            <div className="rounded-lg bg-muted px-4 py-2">
              <p className="text-xl font-semibold">{customer.tickets.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg bg-muted px-4 py-2">
              <p className="text-xl font-semibold text-emerald-600">{openCount}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Customer since {new Date(customer.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Tickets */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium">Tickets</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {customer.tickets.length} total
          </span>
        </div>

        {customer.tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No tickets yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Messages</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customer.tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground font-mono">
                    #{ticket.ticketNumber}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="hover:text-primary transition-colors font-medium"
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                    >
                      {ticket.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket._count.messages}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
