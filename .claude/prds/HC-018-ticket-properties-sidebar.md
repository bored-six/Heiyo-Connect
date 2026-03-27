# PRD: HC-018 — Ticket Properties Sidebar

**Ticket:** HC-018
**Status:** Complete
**Created:** 2026-03-27
**Last Updated:** 2026-03-28

## Summary

Restructure the ticket detail page into a two-column layout with a sticky 260px Properties sidebar showing assignee, status, priority (with AI diff indicator), channel, customer link, tags, and ticket number.

## Requirements

### Original Requirements

1. **Two-column layout** — main content (header, AI response, thread) + sticky Properties sidebar
2. **Assignee dropdown** — reassign to any team member with optimistic update + revert on error
3. **Properties sidebar** — Status, Priority (with AI diff), Channel, Customer link, Tags, Ticket #
4. **"Saving…" feedback** — visible state while assignment server action runs

### Discovered Requirements

- `AssignAgentDropdown` existed but was hidden (no visible border/bg) and had broken cleanup (anonymous function in socket.off) — rewrote as a controlled `useState` component
- Priority "AI diff indicator" shows the AI-suggested priority vs current if they differ (e.g., "AI suggested HIGH, currently MEDIUM")

## Architecture

### Design Decisions

- **Sticky sidebar via CSS `sticky`** — `position: sticky; top: 1.5rem` keeps the sidebar in view while the ticket thread scrolls. No JS scroll listener.
- **Controlled `useState` in AssignAgentDropdown** — previous version used uncontrolled select; rewritten with explicit `useState` + optimistic update + revert pattern matching HC-010's approach.
- **Server Component outer, Client Component inner** — `page.tsx` is async server component that fetches ticket + team members; passes data to client components for interactive bits.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Ticket detail page | Server Component | `src/app/(dashboard)/dashboard/tickets/[id]/page.tsx` | Full page rewrite: two-column layout + sidebar data fetch | Complete |
| AssignAgentDropdown | Client Component | `src/components/tickets/assign-agent-dropdown.tsx` | Controlled assignee select with optimistic update | Complete |

### Business Rules

- Any authenticated agent can be assigned to any ticket within the tenant
- Assignment is scoped to `tenantId` — agents from other tenants are never shown
- Optimistic update reverts to previous assignee if server action fails
- Priority AI diff is read-only — it shows the AI's suggestion but status dropdown controls the actual status

## Testing

Manual verification:
- [ ] Ticket detail shows two-column layout on desktop (stacks on mobile)
- [ ] Properties sidebar is sticky while scrolling the thread
- [ ] Assignee dropdown shows all team members, updates optimistically
- [ ] "Saving…" text appears during assignment action
- [ ] Revert happens if assignment fails

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-27 | Complete implementation | HC-018 |
