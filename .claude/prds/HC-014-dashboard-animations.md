# PRD: HC-014 — Dashboard Animations & Data Visualisation

**Ticket:** HC-014
**Status:** Complete
**Created:** 2026-03-26
**Last Updated:** 2026-03-28

## Summary

Upgrade the dashboard with animated stat counters, SVG sparklines, a donut chart on the Resolved card, an activity timeline drawer, and animated status pills — all using real DB data.

## Requirements

### Original Requirements

1. **Animated stat counters** — count-up animation (ease-out cubic, 800ms) on dashboard stat cards
2. **SVG sparklines** — 7-day per-status/priority trend line behind each stat card
3. **Donut chart** — SVG arc on the Resolved card showing resolution rate %
4. **Activity timeline** — collapsible right-side drawer, dot timeline colour-coded by event type and priority
5. **Animated status pill** — smooth CSS transition (350ms ease) on status badge bg + text colour

### Discovered Requirements

- `getSparklineData()` action needed: 7-day ticket counts grouped by status/priority from DB
- `getRecentActivity()` action needed: recent ticket events (created/resolved/assigned/updated)
- CRITICAL priority pulse ring was added then reverted — too distracting

## Architecture

### Design Decisions

- **Client components for animation** — `StatCard` and `DonutCard` use `'use client'` with `useEffect` for CSS animation; server components cannot animate. Server components pass `value` prop, client components run the count-up.
- **SVG arc for donut** — `stroke-dasharray` / `stroke-dashoffset` approach with ease-out cubic keyframe animation on load. No chart library dependency.
- **Activity timeline as collapsible drawer** — `ActivityTimeline` renders as a fixed right-side panel toggled by a button. Dot colour by event type, border colour by priority.
- **CSS transition for status pill** — inline `transition: background-color 350ms ease, color 350ms ease` — works with optimistic state updates without JS animation library.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| StatCard | Client Component | `src/components/dashboard/stat-card.tsx` | Animated counter + SVG sparkline | Complete |
| DonutCard | Client Component | `src/components/dashboard/donut-card.tsx` | SVG arc donut with resolution rate | Complete |
| ActivityTimeline | Client Component | `src/components/dashboard/activity-timeline.tsx` | Collapsible drawer with dot timeline | Complete |
| getSparklineData | Server Action | `src/actions/tickets.ts` | 7-day ticket counts for sparklines | Complete |
| getRecentActivity | Server Action | `src/actions/tickets.ts` | Recent events for timeline | Complete |
| Dashboard page | Server Component | `src/app/(dashboard)/dashboard/page.tsx` | Fetches sparkline + activity data, passes to components | Complete |
| TicketTable | Client Component | `src/components/dashboard/ticket-table.tsx` | Animated status pill + row hover | Complete |
| loading.tsx | Server Component | `src/app/(dashboard)/dashboard/loading.tsx` | Skeleton updated with sparkline row | Complete |

### Business Rules

- Sparklines show the last 7 days of ticket activity — stale data is acceptable (no live polling)
- Resolution rate = resolved tickets / total tickets × 100, clamped to 0–100
- Activity timeline shows the most recent 20 events across all tickets in the tenant
- Row hover shows a blue left-border accent via Tailwind `group-hover`

## Testing

Manual verification:
- [ ] Stat cards count up from 0 on page load
- [ ] Sparklines render real 7-day data (not flat lines)
- [ ] Donut arc animates on load, shows correct resolution %
- [ ] Activity timeline drawer opens/closes, dots are colour-coded
- [ ] Status pill transitions smoothly when status changes via optimistic UI

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Complete implementation | HC-014 |
| 2026-03-26 | Removed CRITICAL badge pulse animation | Too distracting, reverted |
