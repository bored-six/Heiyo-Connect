"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { CreateTicketDialog } from "./create-ticket-dialog"

export function CreateTicketButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Ticket
      </button>
      <CreateTicketDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
