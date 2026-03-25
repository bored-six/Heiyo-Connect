# PRD: HC-009 — Ticket Status & Priority Filters

**Ticket:** HC-009
**Status:** Complete
**Created:** 2026-03-26
**Last Updated:** 2026-03-26

## Summary

Add Status and Priority filter pill controls to the All Tickets table on the dashboard. Filters are URL-param-driven (same pattern as existing sort), enabling bookmarkable filtered views.

## Requirements

### Original Requirements

- Status filter pills: All | Open | In Progress | Resolved (maps to `OPEN | IN_PROGRESS | RESOLVED`)
- Priority filter pills: All | Critical | High | Medium | Low (maps to `CRITICAL | HIGH | MEDIUM | LOW`)
- Rendered as pill/tab buttons in a single compact row — not dropdowns
- Active pill is visually distinct (colored fill matching badge colors)
- Clicking a pill sets `?status=OPEN&priority=CRITICAL` in URL, preserving existing sort params
- Clicking active pill (or "All") clears that filter param
- Server-side filtering via `getTickets()` action (already had status/priority params wired up)
- Contextual empty state: "No tickets match your filters" vs "No tickets yet"

### Discovered Requirements

- `TicketTable` previously owned its outer card wrapper and "All Tickets" heading. Moving filters into the card header required lifting the card wrapper up to the dashboard page and stripping it from `TicketTable`. This keeps the header/filters/table visually unified inside one card.

## Architecture

### Design Decisions

- `TicketFilters` is a `'use client'` component — uses `useSearchParams`, `usePathname`, `useRouter` to update URL params without full page navigation
- Active "All" pill uses a neutral muted style; active specific value uses the same color family as the badge in the table row (emerald/blue/amber/slate for status; slate/blue/orange/red for priority)
- Clicking the currently-active non-All pill clears the filter (acts as a toggle) — same UX as toggling a chip off
- `getTickets()` already had `status` and `priority` filter support — no changes needed to the action
- Status/priority params validated server-side against `Object.values(TicketStatus)` / `Object.values(Priority)` allowlists before passing to `getTickets()`

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| TicketFilters | Client Component | `src/components/dashboard/ticket-filters.tsx` | Pill filter UI — sets status/priority URL params | Complete |
| TicketTable | Client Component | `src/components/dashboard/ticket-table.tsx` | Accepts currentStatus/currentPriority props; stripped outer card wrapper | Updated |
| TicketEmptyState | Client Component | `src/components/tickets/empty-state.tsx` | Accepts `filtered` prop — shows contextual message | Updated |
| DashboardPage | Server Component | `src/app/(dashboard)/dashboard/page.tsx` | Parses status/priority from searchParams, passes to getTickets + components | Updated |

### Key Changes

**`ticket-filters.tsx` (new)**
- Two filter groups (Status / Priority) rendered as pill buttons
- Clones existing search params before setting new values (preserves sort)
- Active pill: colored per badge palette; inactive: ghost border style
- "All" pill: active when no filter param present for that axis

**`ticket-table.tsx`**
- Removed outer `rounded-lg border bg-card shadow-sm overflow-hidden` wrapper and "All Tickets" heading — now owned by dashboard page
- Added `currentStatus?: TicketStatus | null` and `currentPriority?: Priority | null` props
- Passes `filtered={!!(currentStatus || currentPriority)}` to `TicketEmptyState`

**`empty-state.tsx`**
- Added `filtered?: boolean` prop
- When `filtered=true`: shows "No tickets match your filters" with no seed/create buttons
- When `filtered=false` (default): shows original empty state with seed + create CTAs

**`dashboard/page.tsx`**
- Added `status` and `priority` to `searchParams` type
- Validates both against Prisma enum allowlists before passing to `getTickets()`
- Wraps table in card with header row containing `<TicketFilters />` below "All Tickets" heading
- Passes `currentStatus` and `currentPriority` to both `<TicketFilters />` and `<TicketTable />`

### Business Rules

- Filter params are validated server-side — invalid values are silently ignored (treated as "All")
- Filters compound — both status AND priority can be active simultaneously
- Stats cards (Open / In Progress / Critical / Resolved) always show totals across ALL tickets, ignoring active filters (stats are computed from unfiltered `getTickets` result context)

## Testing

Manual verification:
1. Click "Open" pill → URL updates to `?status=OPEN`, table shows only open tickets
2. Click "Critical" pill → URL updates to `?status=OPEN&priority=CRITICAL`, both filters apply
3. Sort header click → `?status=OPEN&priority=CRITICAL&sort=priority&dir=asc`, filters preserved
4. Click active "Open" pill → clears status param, priority remains
5. Click "All" for Status → clears status param
6. Filter to combination with no results → "No tickets match your filters" empty state
7. Navigate with no filters active → original empty state with seed/create buttons

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Created | HC-009 implementation |
| 2026-03-26 | Lifted card wrapper from TicketTable to dashboard page | Needed unified header for filters + title inside same card |
| 2026-03-26 | Replaced pill buttons with compact native `<select>` dropdowns | Visual redesign — filters moved inline with "All Tickets" heading (right-aligned). Status/Priority selects show active value on load via `currentStatus`/`currentPriority` props. Toggle-off behavior removed (selects always have a value, "All" = empty string = param deleted). |
