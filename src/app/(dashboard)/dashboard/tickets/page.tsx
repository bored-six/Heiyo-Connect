import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/tenant"
import { getTickets } from "@/actions/tickets"
import { BulkTicketTable } from "@/components/tickets/bulk-ticket-table"
import { TicketFilters } from "@/components/dashboard/ticket-filters"
import { CreateTicketButton } from "@/components/dashboard/create-ticket-button"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { TicketSearch } from "@/components/tickets/ticket-search"
import { TicketStatus, Priority } from "@prisma/client"

export const metadata: Metadata = { title: "Tickets" }
export const dynamic = "force-dynamic"

const VALID_STATUSES = Object.values(TicketStatus)
const VALID_PRIORITIES = Object.values(Priority)

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; status?: string; priority?: string; q?: string }>
}) {
  let user
  try {
    user = await requireUser()
  } catch {
    redirect("/onboarding")
  }

  const params = await searchParams
  const validSorts = ["createdAt", "priority", "status", "messages"] as const
  type SortField = (typeof validSorts)[number]
  const sort = validSorts.includes(params.sort as SortField)
    ? (params.sort as SortField)
    : "createdAt"
  const dir = params.dir === "asc" ? "asc" : "desc"
  const search = params.q?.trim() || undefined

  const status = VALID_STATUSES.includes(params.status as TicketStatus)
    ? (params.status as TicketStatus)
    : undefined
  const priority = VALID_PRIORITIES.includes(params.priority as Priority)
    ? (params.priority as Priority)
    : undefined

  const tickets = await getTickets({ sort, dir, status, priority, search })

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CommandPalette />
          <CreateTicketButton />
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <h2 className="font-medium shrink-0">All Tickets</h2>
          <div className="flex items-center gap-2 ml-auto">
            <TicketSearch defaultValue={search} />
            <TicketFilters currentStatus={status} currentPriority={priority} />
          </div>
        </div>
        <BulkTicketTable
          tickets={tickets}
          currentUserId={user.id}
          currentSort={sort}
          currentDir={dir}
          currentStatus={status}
          currentPriority={priority}
        />
      </div>
    </main>
  )
}
