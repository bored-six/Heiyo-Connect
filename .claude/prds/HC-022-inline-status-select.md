# PRD: HC-022 — Inline Status Select Across All Ticket Views

**Ticket:** HC-022
**Status:** Complete
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Summary

Add an editable status dropdown everywhere a ticket's status is displayed: the dashboard ticket table, the bulk ticket management table, the ticket detail sidebar, and the demo shell. All 5 statuses are selectable inline without navigating to the detail page.

## Requirements

### Original Requirements

1. **StatusDropdown component** — reusable controlled select with all 5 statuses (Open, In Progress, Waiting on Customer, Resolved, Closed)
2. **Dashboard TicketTable** — inline status select with `useOptimistic`
3. **BulkTicketTable** — inline status select with optimistic local state + refresh
4. **Ticket detail sidebar** — status dropdown (replaces static badge)
5. **Demo shell** — inline status select (local state, no server action)

### Discovered Requirements

- Three different tables needed three slightly different implementations (different optimistic patterns, different action signatures)
- Demo shell needed its own purely local-state version (no server action)

## Architecture

### Design Decisions

- **`StatusDropdown` as a shared primitive** — used in detail page sidebar. Table rows use inline `<select>` elements styled to match (avoids prop complexity).
- **`useOptimistic` in TicketTable** — matches HC-010 pattern. Status update is optimistic; reverts on failure.
- **Refresh after update in BulkTicketTable** — uses `router.refresh()` after server action instead of `useOptimistic` to keep the implementation simple in a table that already has complex selection state.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| StatusDropdown | Client Component | `src/components/tickets/status-dropdown.tsx` | Controlled status select with optimistic update + toast | Complete |
| TicketTable | Client Component | `src/components/dashboard/ticket-table.tsx` | Added inline status select with useOptimistic | Complete |
| BulkTicketTable | Client Component | `src/components/tickets/bulk-ticket-table.tsx` | Added inline status select with router.refresh() | Complete |
| Ticket detail page | Server Component | `src/app/(dashboard)/dashboard/tickets/[id]/page.tsx` | StatusDropdown in Properties sidebar | Complete |
| DemoShell | Client Component | `src/components/demo/demo-shell.tsx` | Inline status select updating demo useReducer state | Complete |

### Business Rules

- All 5 statuses available everywhere: `OPEN`, `IN_PROGRESS`, `WAITING_ON_CUSTOMER`, `RESOLVED`, `CLOSED`
- Status changes are scoped to `tenantId` via `requireUser()` in the underlying `updateTicketStatus` action
- Demo status changes update local reducer state only — no server action

## Testing

Manual verification:
- [ ] Dashboard table: clicking status dropdown updates row optimistically
- [ ] Bulk tickets table: clicking status dropdown updates row and refreshes
- [ ] Ticket detail sidebar: StatusDropdown shows all 5 options, updates with toast
- [ ] Demo shell: status dropdown changes ticket state locally

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | Complete implementation | HC-022 |
| 2026-03-28 | Add inline status select to demo shell | HC-022 follow-up |
