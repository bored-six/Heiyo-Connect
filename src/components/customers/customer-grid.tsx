"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  ticketCount: number;
  openCount: number;
  lastTicketAt: Date | null;
  lastTicketStatus: string | null;
};

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

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

export function CustomerGrid({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase())
      )
    : customers;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          {query ? `No customers match "${query}"` : "No customers yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => {
            const avatarColor = getAvatarColor(customer.name);
            const hasOpen = customer.openCount > 0;

            return (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${customer.id}`}
                className="group rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 select-none ${avatarColor}`}
                    >
                      {getInitials(customer.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                    </div>
                  </div>
                  {/* Open ticket dot */}
                  {hasOpen && (
                    <span className="size-2 rounded-full bg-emerald-500 mt-1 shrink-0" title="Has open tickets" />
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-center">
                    <p className="text-lg font-bold">{customer.ticketCount}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className={`flex-1 rounded-lg px-3 py-2 text-center ${hasOpen ? "bg-emerald-50" : "bg-muted/50"}`}>
                    <p className={`text-lg font-bold ${hasOpen ? "text-emerald-600" : ""}`}>{customer.openCount}</p>
                    <p className="text-xs text-muted-foreground">Open</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last active: {customer.lastTicketAt ? timeAgo(customer.lastTicketAt) : "Never"}</span>
                  <span className="text-primary/60 group-hover:text-primary transition-colors font-medium">
                    View →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
