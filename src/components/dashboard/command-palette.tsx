"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { toast } from "sonner"
import { Settings, Plus, LogOut, Ticket } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { getTickets } from "@/actions/tickets"
import { CreateTicketDialog } from "@/components/dashboard/create-ticket-dialog"

type TicketResult = {
  id: string
  subject: string
  status: string
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<TicketResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const router = useRouter()
  const { signOut } = useClerk()

  // Open on Cmd+K / Ctrl+K
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // 300ms debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const tickets = await getTickets({ search: query.trim() })
        setResults(
          tickets.map((t) => ({ id: t.id, subject: t.subject, status: t.status }))
        )
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function close() {
    setOpen(false)
    setQuery("")
    setResults([])
  }

  function handleTicketSelect(id: string) {
    router.push(`/dashboard/tickets/${id}`)
    close()
  }

  function handleNavigate(path: string) {
    router.push(path)
    close()
  }

  async function handleLogout() {
    close()
    await signOut({ redirectUrl: "/sign-in" })
  }

  function handleNewTicket() {
    close()
    setDialogOpen(true)
  }

  return (
    <>
      <CreateTicketDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

          {/* Panel */}
          <div
            className="relative w-full max-w-lg rounded-xl border bg-popover shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search tickets, or type a command..."
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                {/* Ticket search results */}
                {query.trim() && (
                  <>
                    {isSearching && (
                      <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                    )}
                    {!isSearching && results.length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">No tickets found for &quot;{query}&quot;</div>
                    )}
                    {!isSearching && results.length > 0 && (
                      <CommandGroup heading="Tickets">
                        {results.map((ticket) => (
                          <CommandItem
                            key={ticket.id}
                            value={ticket.id}
                            onSelect={() => handleTicketSelect(ticket.id)}
                            className="cursor-pointer"
                          >
                            <Ticket className="opacity-50" />
                            <span className="flex-1 truncate">
                              {ticket.subject}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {ticket.status.replace(/_/g, " ")}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    <CommandSeparator />
                  </>
                )}

                {/* Quick actions — always visible */}
                <CommandGroup heading="Actions">
                  <CommandItem
                    value="new-ticket"
                    onSelect={handleNewTicket}
                    className="cursor-pointer"
                  >
                    <Plus className="opacity-50" />
                    Create New Ticket
                    <CommandShortcut>⌘N</CommandShortcut>
                  </CommandItem>
                  <CommandItem
                    value="settings"
                    onSelect={() => handleNavigate("/dashboard/settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="opacity-50" />
                    Go to Settings
                  </CommandItem>
                  <CommandItem
                    value="logout"
                    onSelect={handleLogout}
                    className="cursor-pointer text-destructive data-[selected=true]:text-destructive"
                  >
                    <LogOut className="opacity-50" />
                    Logout
                  </CommandItem>
                </CommandGroup>
              </CommandList>

              {/* Footer hint */}
              <div className="border-t px-3 py-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono">↵</kbd> select</span>
                <span><kbd className="font-mono">Esc</kbd> close</span>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  )
}
