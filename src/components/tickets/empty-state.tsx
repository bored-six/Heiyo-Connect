"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { InboxIcon, DatabaseIcon, PlusIcon } from "lucide-react"
import { seedDemoData } from "@/actions/seed"
import { CreateTicketDialog } from "@/components/dashboard/create-ticket-dialog"
import { useState } from "react"

export function TicketEmptyState() {
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  function handleSeed() {
    startTransition(async () => {
      const result = await seedDemoData()
      if (result.success) {
        toast.success(`Seeded ${result.data.count} demo tickets!`)
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
        <td colSpan={7}>
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <InboxIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No tickets yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              When customers reach out, their tickets will appear here. Create
              your first ticket manually, or instantly populate the dashboard
              with 15 realistic demo tickets.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleSeed}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DatabaseIcon className="h-3.5 w-3.5" />
                {isPending ? "Seeding…" : "Populate Demo Data"}
              </button>
              <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Create first ticket
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Demo data includes 15 tickets across all priorities, spread over 7 days
            </p>
          </div>
        </td>
      </tr>
    </>
  )
}
