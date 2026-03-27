# PRD: HC-019 — Customer Directory (CRM-Style)

**Ticket:** HC-019
**Status:** Complete
**Created:** 2026-03-27
**Last Updated:** 2026-03-28

## Summary

Two-phase delivery: first, a basic customer table at `/dashboard/customers` with per-customer detail pages; then a redesign to a CRM-style card grid with live search, avatar initials, open-ticket indicators, and summary stats.

## Sub-features

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Customers table + detail pages | Complete |
| Phase 2 | CRM-style card grid redesign | Complete |

## Requirements

### Original Requirements

1. **Customer list** — name, email, ticket count, last ticket status/date, member-since
2. **Customer detail page** — profile card (total/open counts) + full ticket history
3. **Nav link** — "Customers" added to dashboard sidebar

### Discovered Requirements (Phase 2 Redesign)

- Card grid needed to match the visual quality of the rest of the dashboard
- `getCustomers` needed `openCount` (OPEN + IN_PROGRESS) per customer for the green dot indicator
- 4-stat header row (Total Customers, Have Open, Fully Resolved, Total Tickets) replaces plain heading
- Live search needed client-side (no URL param approach) — `CustomerGrid` handles search internally

## Architecture

### Design Decisions

- **`CustomerGrid` as client component** — live search is purely client-side filtering of the server-fetched customer array. No debounced server action needed because customer lists are typically small (< 500) and filtering in memory is instant.
- **Color-hashed avatar initials** — deterministic colour assignment based on `name.charCodeAt(0) % palette.length` — same person always gets same colour, no DB field needed.
- **Green dot for open tickets** — rendered on the avatar when `openCount > 0`; communicates urgency at a glance.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| customers action | Server Actions | `src/actions/customers.ts` | getCustomers (with openCount), getCustomerById | Complete |
| Customers page | Server Component | `src/app/(dashboard)/dashboard/customers/page.tsx` | 4-stat header + CustomerGrid | Complete |
| Customer detail page | Server Component | `src/app/(dashboard)/dashboard/customers/[id]/page.tsx` | Profile card + ticket history table | Complete |
| CustomerGrid | Client Component | `src/components/customers/customer-grid.tsx` | Live-search card grid with avatar + stats | Complete |
| Dashboard layout | Server Component | `src/app/(dashboard)/layout.tsx` | Added "Customers" nav link | Complete |

### Data Model

No schema changes. Uses existing `Customer` model with `Ticket` relation.

`getCustomers` computes per customer:
- `ticketCount` — total tickets
- `openCount` — tickets with status `OPEN` or `IN_PROGRESS`
- `lastTicket` — most recent ticket (status + date)

### Business Rules

- All customer queries scoped to `tenantId`
- Customer detail page shows tickets in reverse chronological order
- "Have Open" stat = customers with at least one OPEN or IN_PROGRESS ticket

## Testing

Manual verification:
- [ ] `/dashboard/customers` shows card grid with avatar initials
- [ ] Live search filters cards as user types
- [ ] Green dot appears on customers with open tickets
- [ ] 4-stat header shows correct counts
- [ ] Clicking a card navigates to `/dashboard/customers/[id]`
- [ ] Detail page shows profile card + ticket history

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-27 | Phase 1: basic table + detail pages | HC-019 |
| 2026-03-27 | Phase 2: redesign to CRM-style card grid | Portfolio polish |
