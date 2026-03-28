"use client"

import { useState } from "react"
import { X, Activity } from "lucide-react"
import type { Priority, TicketStatus } from "@/lib/types"
import Link from "next/link"

type ActivityItem = {
  id: string
  ticketNumber: number | null
  subject: string
  status: TicketStatus
  priority: Priority
  updatedAt: Date
  event: string
}

const EVENT_DOT: Record<string, string> = {
  Resolved: "bg-emerald-400",
  Created: "bg-blue-400",
  Assigned: "bg-amber-400",
  Updated: "bg-slate-400",
}

const PRIORITY_DOT: Record<Priority, string> = {
  CRITICAL: "border-red-400",
  HIGH: "border-orange-400",
  MEDIUM: "border-blue-400",
  LOW: "border-slate-300",
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Show recent activity"
      >
        <Activity className="size-4" />
        Activity
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-card border-l shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-medium text-sm">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Last {activities.length} ticket events</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-8">No activity yet</p>
          ) : (
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-0">
                {activities.map((item, idx) => (
                  <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {/* Dot */}
                    <div
                      className={`relative z-10 mt-0.5 size-[18px] shrink-0 rounded-full border-2 bg-card ${PRIORITY_DOT[item.priority]}`}
                    >
                      <div
                        className={`absolute inset-[3px] rounded-full ${EVENT_DOT[item.event] ?? "bg-slate-400"}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/dashboard/tickets/${item.id}`}
                          className="text-sm font-medium leading-tight line-clamp-2 hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          {item.subject}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-muted-foreground">{item.event}</span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(item.updatedAt)}</span>
                        {item.ticketNumber != null && (
                          <>
                            <span className="text-xs text-muted-foreground/50">·</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              #{String(item.ticketNumber).padStart(3, "0")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
