import Link from "next/link"
import { InboxIcon } from "lucide-react"

export function TicketEmptyState() {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <InboxIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No tickets yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            When customers reach out, their tickets will appear here. Create your first one to get started.
          </p>
          <Link
            href="/dashboard/tickets/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Create first ticket
          </Link>
        </div>
      </td>
    </tr>
  )
}
