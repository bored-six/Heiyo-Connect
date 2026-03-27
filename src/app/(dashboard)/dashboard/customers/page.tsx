import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/tenant";
import { getCustomers } from "@/actions/customers";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-slate-100 text-slate-600",
  CLOSED: "bg-slate-100 text-slate-500",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default async function CustomersPage() {
  try {
    await requireUser();
  } catch {
    redirect("/onboarding");
  }

  const customers = await getCustomers();

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {customers.length} customer{customers.length !== 1 ? "s" : ""} across all tickets
        </p>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No customers yet. Customers are created automatically when tickets are submitted.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Tickets</th>
                <th className="px-4 py-3 text-left font-medium">Last Ticket</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Member since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="group"
                    >
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{customer.ticketCount}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.lastTicketAt ? timeAgo(customer.lastTicketAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {customer.lastTicketStatus ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[customer.lastTicketStatus]}`}
                      >
                        {customer.lastTicketStatus.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString()}
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
