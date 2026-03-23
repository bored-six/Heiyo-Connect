# PRD: HC-004 — Velocity & UX Sprint

**Ticket:** HC-004
**Status:** Complete
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Summary

UI/UX enhancement layer making the dashboard feel like a high-performance desktop app. No schema or AI gateway changes. Four capabilities: global Cmd+K command palette, optimistic quick-action buttons, real-time sonner toast notifications, and skeleton loading states.

## Requirements

### Original Requirements

1. Global Cmd+K command palette — search tickets by Subject/ID/Customer, quick actions for Settings/New Ticket/Logout
2. Optimistic UI for Resolve + Assign to Me buttons using React 19 `useOptimistic`
3. Sonner toast on `ticket:created` socket event (priority + customer name)
4. `loading.tsx` skeleton for `/dashboard` route mirroring stats cards + table

### Discovered Requirements

- `cmdk` and `sonner` were not installed — added as dependencies
- `Skeleton` UI primitive did not exist — created `src/components/ui/skeleton.tsx`
- `Command` UI primitive did not exist — created `src/components/ui/command.tsx`
- Dashboard page was a pure Server Component with inline table — table extracted to `TicketTable` Client Component to support `useOptimistic`
- Command palette uses `shouldFilter={false}` because results come from a server action, not local data

## Architecture

### Design Decisions

- **CommandPalette as Client Component in page, not layout** — avoids bloating the layout Server Component; Cmd+K listener attaches once per page render
- **TicketTable extracted to Client Component** — Server Component passes fetched tickets + `userId` as props; client handles optimistic updates and button handlers without re-fetching
- **Toaster in root layout** — survives route transitions; `richColors` gives automatic priority-aware colour coding
- **`loading.tsx` skeleton** — Next.js App Router wraps this in Suspense automatically; matches the exact grid structure of the dashboard page for smooth transition

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Skeleton | UI primitive | `src/components/ui/skeleton.tsx` | Pulse animation block for loading states | Complete |
| Command | UI primitive | `src/components/ui/command.tsx` | cmdk wrapper (Input, List, Item, Group, etc.) | Complete |
| CommandPalette | Client Component | `src/components/dashboard/command-palette.tsx` | Cmd+K modal — search + quick actions | Complete |
| TicketTable | Client Component | `src/components/dashboard/ticket-table.tsx` | Ticket table with useOptimistic quick actions | Complete |
| DashboardLoading | Server Component | `src/app/(dashboard)/dashboard/loading.tsx` | Skeleton ghost of dashboard page | Complete |
| useTicketSocket | Hook (updated) | `src/hooks/useTicketSocket.ts` | Now fires sonner toast on ticket:created | Complete |
| layout.tsx (root) | Server Component (updated) | `src/app/layout.tsx` | Added `<Toaster richColors position="bottom-right" />` | Complete |
| dashboard/page.tsx | Server Component (updated) | `src/app/(dashboard)/dashboard/page.tsx` | Uses TicketTable + CommandPalette | Complete |

### Key Patterns

**useOptimistic:**
```typescript
const [optimisticTickets, addOptimistic] = React.useOptimistic(tickets, applyOptimistic)
// In handler:
React.startTransition(() => addOptimistic({ type: "resolve", ticketId }))
await updateTicketStatus(...)
```

**Debounced search in CommandPalette:**
```typescript
useEffect(() => {
  const timer = setTimeout(async () => {
    const tickets = await getTickets({ search: query })
    setResults(...)
  }, 300)
  return () => clearTimeout(timer)
}, [query])
```

**Socket cleanup (critical — must use named handler):**
```typescript
const handleTicketCreated = (payload) => { toast(...); onTicketCreated?.(payload) }
socket.on("ticket:created", handleTicketCreated)
// cleanup:
socket.off("ticket:created", handleTicketCreated)
```

## Testing

Manual verification checklist:
- [ ] Cmd+K opens palette; Esc closes it; clicking backdrop closes it
- [ ] Typing in palette triggers search after 300ms debounce; results show `[Subject] ([STATUS])`
- [ ] Clicking a result logs the ticket ID to console
- [ ] Quick actions navigate to correct routes / trigger logout
- [ ] "Resolve" button immediately shows RESOLVED badge; disables itself; server action runs in background
- [ ] "Assign to Me" button immediately shows "Assigned"; disables itself; server action runs in background
- [ ] Navigating to `/dashboard` with slow network shows skeleton loading state
- [ ] With Socket.io server (`pnpm dev:socket`), creating a ticket fires a toast bottom-right

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-24 | Initial implementation | HC-004 Velocity & UX Sprint |
