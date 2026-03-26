"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DatabaseIcon,
  PlusIcon,
  SparklesIcon,
  ZapIcon,
  BarChart3Icon,
} from "lucide-react"
import { seedDemoData } from "@/actions/seed"
import { CreateTicketDialog } from "@/components/dashboard/create-ticket-dialog"

export function TicketEmptyState({ filtered = false }: { filtered?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  function handleSeed() {
    startTransition(async () => {
      const result = await seedDemoData()
      if (result.success) {
        toast.success(`Seeded ${result.data.count} demo tickets — charts are live!`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <CreateTicketDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <tr>
        <td colSpan={8}>
          {filtered ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                {/* Inbox + magnifying glass — no results from filter */}
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="3" y="13" width="22" height="15" rx="2.5" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5"/>
                  <rect x="7" y="18" width="14" height="2" rx="1" fill="#CBD5E1"/>
                  <rect x="7" y="22" width="9" height="2" rx="1" fill="#CBD5E1"/>
                  <path d="M3 20.5 L8 28 H20 L25 20.5" stroke="#94A3B8" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                  <circle cx="25" cy="9" r="6" fill="white" stroke="#6366F1" strokeWidth="1.5"/>
                  <circle cx="25" cy="9" r="3" fill="#EEF2FF"/>
                  <line x1="29.2" y1="13.2" x2="31.5" y2="15.5" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-1">No tickets match your filters</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try adjusting or clearing the status and priority filters above.
              </p>
            </div>
          ) : (
            <div className="px-6 py-14">
              <div className="max-w-2xl mx-auto">
                {/* Central icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-30 bg-primary" />
                    <div className="relative rounded-full bg-primary/10 border border-primary/20 p-5">
                      {/* Inbox with document illustration */}
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary" aria-hidden="true">
                        <rect x="4" y="15" width="32" height="20" rx="3.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="13" y="19" width="14" height="10" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="16" y1="23" x2="24" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <line x1="16" y1="26" x2="21" y2="26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M4 26 L11 35 H29 L36 26" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                        <circle cx="10" cy="9" r="1.5" fill="currentColor" fillOpacity="0.45"/>
                        <circle cx="31" cy="7" r="1" fill="currentColor" fillOpacity="0.35"/>
                        <circle cx="34" cy="13" r="1.5" fill="currentColor" fillOpacity="0.3"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Your dashboard is ready
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mx-auto mb-8">
                  Populate it with 15 realistic demo tickets — spread across priorities,
                  statuses, and 7 days — so your charts and AI triage look production-ready
                  instantly.
                </p>

                {/* Feature preview pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                  {[
                    { icon: <SparklesIcon className="h-3 w-3" />, label: "AI-triaged priorities" },
                    { icon: <ZapIcon className="h-3 w-3" />, label: "Pusher real-time toasts" },
                    { icon: <BarChart3Icon className="h-3 w-3" />, label: "Analytics-ready data" },
                  ].map((p) => (
                    <span
                      key={p.label}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground border"
                    >
                      {p.icon}
                      {p.label}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleSeed}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isPending ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Seeding…
                      </>
                    ) : (
                      <>
                        <DatabaseIcon className="h-3.5 w-3.5" />
                        Seed 15 demo tickets
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Create first ticket
                  </button>
                </div>

                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Demo data spans 7 days · 4 priority levels · AI suggested responses pre-filled
                </p>
              </div>
            </div>
          )}
        </td>
      </tr>
    </>
  )
}
