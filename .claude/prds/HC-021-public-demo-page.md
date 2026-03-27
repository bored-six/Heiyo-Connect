# PRD: HC-021 — Public /demo Page (Zero DB, Fully Interactive)

**Ticket:** HC-021
**Status:** Complete
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Summary

Replace the old `/api/demo` redirect (which seeded real DB data into a shared demo account) with a standalone `/demo` route that is 100% client-side state — no DB reads, no DB writes, no login required. All data lives in memory and resets on refresh.

## Requirements

### Original Requirements

1. **`/demo` route** — publicly accessible, no Clerk auth
2. **`DemoShell`** — client component with `useReducer` holding all state; four views (Dashboard, Tickets, Customers, Reports)
3. **Static demo data** — realistic tickets, customers, agents in `src/lib/demo-data.ts`
4. **Interactive** — create ticket modal, status changes, assignment, resolve, view ticket drawer
5. **Demo banner** — persistent "data resets on refresh" notice + "Sign up free" CTA
6. **Remove seed button** — "Seed demo data" removed from real dashboard empty state

### Discovered Requirements

- Demo layout initially had a static nav — moved nav inside `DemoShell` so view state (`dashboard/tickets/customers/reports`) can control rendering from the same component
- Landing page links `/api/demo` needed updating to `/demo`
- `src/actions/seed.ts` and `src/app/api/demo/route.ts` deleted (replaced entirely)
- Customers view initially used plain table — redesigned to match real `/dashboard/customers` card grid (HC-021 fix commit)

## Architecture

### Design Decisions

- **`useReducer` for all state** — single source of truth for tickets, selected ticket, active view, modal open state. Avoids prop drilling across 4 views and multiple modals.
- **Zero server actions** — all "mutations" (create ticket, change status, assign) are pure state updates in the reducer. No network calls, no auth required.
- **`src/lib/demo-data.ts`** — static array of 15+ realistic tickets, 8 customers, 3 agents. Used only by `DemoShell` — not imported anywhere in the real app.
- **Slide-over drawer for ticket detail** — consistent with real app's ticket interaction pattern; avoids a separate /demo/tickets/[id] route.
- **`/demo(.*)` in middleware public routes** — ensures Clerk doesn't redirect unauthenticated visitors.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Demo page | Server Component | `src/app/demo/page.tsx` | Entry point — renders DemoShell | Complete |
| Demo layout | Server Component | `src/app/demo/layout.tsx` | Banner + "Sign up free" CTA only | Complete |
| DemoShell | Client Component | `src/components/demo/demo-shell.tsx` | All state + 4 views + modals | Complete |
| demo-data | Static data | `src/lib/demo-data.ts` | Realistic seed data (tickets, customers, agents) | Complete |
| TicketEmptyState | Client Component | `src/components/tickets/empty-state.tsx` | Seed button removed from real dashboard | Complete |
| Middleware | Config | `src/middleware.ts` | Add /demo(.*) to public routes | Complete |
| Landing page | Server Component | `src/app/page.tsx` | Update demo links /api/demo → /demo | Complete |

### Deleted Files

- `src/actions/seed.ts` — real DB seed actions replaced by demo-data.ts
- `src/app/api/demo/route.ts` — old redirect-and-seed route replaced by /demo page

### Business Rules

- All demo state is ephemeral — resets on page refresh (by design)
- Demo cannot write to the database under any circumstances
- Demo is accessible without a Clerk account
- Demo customers view matches visual design of real customers page

## Testing

Manual verification:
- [ ] `/demo` loads without login
- [ ] All 4 nav views (Dashboard, Tickets, Customers, Reports) render
- [ ] Create ticket modal works, new ticket appears in list
- [ ] Status change updates ticket in real time (local state)
- [ ] Ticket detail drawer opens with AI suggested response
- [ ] Refreshing resets all state to demo defaults
- [ ] Banner + "Sign up free" CTA visible on all views
- [ ] Real dashboard empty state no longer shows "Seed demo data" button

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | Initial implementation | HC-021 |
| 2026-03-28 | Fix: update landing page links /api/demo → /demo | HC-021 follow-up |
| 2026-03-28 | Fix: move nav into DemoShell; remove static nav from layout | Internal navigation needed view-state access |
| 2026-03-28 | Fix: redesign customers view to match real card grid | Visual consistency with real dashboard |
