"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { CreateTicketDialog } from "@/components/dashboard/create-ticket-dialog"

export function TicketEmptyState({ filtered = false }: { filtered?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false)

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
                  Create your first ticket to get started. Your team can collaborate, triage priorities, and respond to customers all in one place.
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Create first ticket
                  </button>
                </div>
              </div>
            </div>
          )}
        </td>
      </tr>
    </>
  )
}
