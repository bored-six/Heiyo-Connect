import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-lg tracking-tight">Heiyo Connect</span>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
          <a href="/dashboard/tickets" className="hover:text-foreground transition-colors">Tickets</a>
          <a href="/dashboard/settings" className="hover:text-foreground transition-colors">Settings</a>
        </div>
      </nav>
      {children}
    </div>
  );
}
