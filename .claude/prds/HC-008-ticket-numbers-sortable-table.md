**Ticket:** HC-008
**Status:** Complete
**Created:** 2026-03-26

# PRD: HC-008 — Ticket Numbers and Sortable Columns

## Summary
Added sequential ticket numbers to all tickets and made key columns in the All Tickets table sortable via URL-based navigation.

## Requirements

### Original Requirements
1. Add `ticketNumber` (autoincrement) to the `Ticket` Prisma model
2. Update `getTickets()` to accept `sort` and `dir` params
3. Thread `searchParams` from the dashboard page into `getTickets()`
4. Display `#NNN` (zero-padded) as the first column in TicketTable
5. Make Priority, Status, Created, and Messages columns sortable with ▲/▼ indicators

### Acceptance Criteria
- Ticket numbers display as `#001`, `#002`, etc. in the table
- Clicking a sortable column header navigates to `?sort=X&dir=asc/desc`
- Clicking the active column toggles direction
- Sort indicator (▲/▼) appears only on the active column
- All DB queries remain scoped to `tenantId`

## Architecture

### Design Decisions
- **URL-based sorting** (not client state): sort/dir live in the URL search params so the page is bookmarkable and refreshable. The Server Component re-fetches on navigation.
- **`SortableHeader` as an inline client component**: the table is already `"use client"` (needed for `useOptimistic`), so `SortableHeader` is colocated in `ticket-table.tsx` without a separate file. Uses `useRouter` + `useSearchParams` to toggle sort.
- **`messages` sort** uses Prisma's `_count` relation ordering: `orderBy: { messages: { _count: sortDir } }`.
- **Default sort**: `createdAt desc` (unchanged from original behavior).
- **Sort validation in page.tsx**: unknown `sort` values fall back to `createdAt` to prevent invalid Prisma queries.

## Implementation

### Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| `Ticket` model | Prisma schema | `prisma/schema.prisma` | Added `ticketNumber Int @default(autoincrement())` | Complete |
| `getTickets()` | Server Action | `src/actions/tickets.ts` | Added `sort` + `dir` params, dynamic `orderBy` | Complete |
| `DashboardPage` | Server Component | `src/app/(dashboard)/dashboard/page.tsx` | Reads `searchParams`, validates sort, passes to getTickets + TicketTable | Complete |
| `TicketTable` | Client Component | `src/components/dashboard/ticket-table.tsx` | Added `#NNN` column, `currentSort`/`currentDir` props | Complete |
| `SortableHeader` | Client Component (inline) | `src/components/dashboard/ticket-table.tsx` | Clickable column header with sort indicator | Complete |

### Key Implementation Details
- `ticketNumber` displayed as `#${String(n).padStart(3, "0")}` in a `font-mono text-xs` cell
- `SortableHeader` uses `useSearchParams()` to preserve existing query params (e.g., filters) when toggling sort
- Sort indicator: active column shows real ▲/▼; inactive columns show faint ▲ as affordance
- `colSpan` on `TicketEmptyState` needs updating if it hardcodes column count (now 8 columns)

## Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Initial implementation | HC-008 requirement |
