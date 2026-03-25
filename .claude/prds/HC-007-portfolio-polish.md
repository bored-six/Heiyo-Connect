# PRD: HC-007 — Portfolio Polish (Recruiter-Ready)

**Ticket:** HC-007
**Status:** Complete
**Created:** 2026-03-26
**Last Updated:** 2026-03-26

## Summary

A presentation-layer pass to make the app recruiter-ready with zero friction.
No logic changes to `ai-gateway.ts` or `tenant.ts` — purely onboarding and visual polish.

## Requirements

### Original Requirements

1. **Landing Page** — Midnight theme (dark-950 bg), Hero value prop, 3-feature grid (AI Triage, Real-time, Analytics), Get Started CTA strip, "Powered by Gemini 2.0 & Llama 3.1" badge.
2. **Seed Demo Data** — `src/actions/seed.ts` server action: 15 realistic tickets, 5 customers, spread over 7 days, 3 manual-review fallbacks, mixed priorities/statuses. Empty state shows "Populate Demo Data" button when tickets.length === 0.
3. **Mobile Responsiveness** — Audit Reports grid + TicketTable for mobile. CommandPalette gets a visible Search icon button for touch users.
4. **Empty States** — Dashboard (0 tickets) and Reports (0 analytics data) handle gracefully with helpful prompts.

### Discovered Requirements

- `TicketEmptyState` colSpan was 6 but table has 7 columns — fixed to 7.
- "Create first ticket" button in empty state was a `<Link>` to `/dashboard/tickets/new` (non-existent route) — replaced with `CreateTicketDialog` button.
- `CommandPalette` was only keyboard-accessible (Cmd+K) — added a rendered trigger button and moved it into the dashboard header alongside `CreateTicketButton`.

## Architecture

### Design Decisions

- **Midnight landing page uses inline styles** (not Tailwind tokens) to avoid theme-variable interference — the landing page must be dark regardless of the app's light/dark CSS variables.
- **Seed action uses explicit `createdAt`** — Prisma allows overriding `@default(now())` fields when a value is provided, enabling the 7-day spread.
- **`TicketEmptyState` converted to client component** — needed `useTransition` + `useRouter` for the seed button. Required `"use client"` directive.
- **`ReportsEmptyState` is a local function** inside `reports-charts.tsx` — single use, no reason to extract.
- **CommandPalette now renders its own trigger button** — keeps the open/close state co-located and avoids lifting state into the Server Component dashboard page.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| `seedDemoData` | Server Action | `src/actions/seed.ts` | Create 15 demo tickets for current tenant | ✅ |
| `Home` | Server Component | `src/app/page.tsx` | Midnight themed landing page | ✅ |
| `TicketEmptyState` | Client Component | `src/components/tickets/empty-state.tsx` | Empty state with seed + create CTAs | ✅ |
| `CommandPalette` | Client Component | `src/components/dashboard/command-palette.tsx` | Added visible Search trigger button | ✅ |
| `DashboardPage` | Server Component | `src/app/(dashboard)/dashboard/page.tsx` | Moved CommandPalette into header | ✅ |
| `ReportsCharts` | Client Component | `src/components/dashboard/reports-charts.tsx` | Added ReportsEmptyState for 0 tickets | ✅ |
| `TicketTable` | Client Component | `src/components/dashboard/ticket-table.tsx` | Hide Customer (<sm), Messages/Created (<md) | ✅ |

### Seed Data Shape (15 tickets)

| Priority | Count | Statuses |
|----------|-------|---------|
| CRITICAL | 2 | IN_PROGRESS, OPEN |
| HIGH | 3 | OPEN, IN_PROGRESS, WAITING_ON_CUSTOMER |
| MEDIUM | 6 | OPEN × 3, IN_PROGRESS × 1, RESOLVED × 2 |
| LOW | 4 | RESOLVED × 2, OPEN × 1, CLOSED × 1 |

- 3 manual-review fallbacks (`ai: false`) — no `aiAnalyzedAt` / `aiSuggestedResponse`
- 12 AI-analyzed tickets — `aiAnalyzedAt`, `aiPriority`, `aiSuggestedResponse` set
- `createdAt` spread: days 0–6 ago; `resolvedAt` = createdAt + 4 hours for resolved/closed

### Business Rules

- `seedDemoData` is a no-op if the tenant already has tickets — returns a descriptive error.
- All seeded data is scoped to `user.tenantId` — multi-tenant isolation preserved.
- Seed button uses `useTransition` — shows "Seeding…" while pending, calls `router.refresh()` on success.

## Testing

Manual verification:
1. Unauthenticated visit to `/` → Midnight landing page renders correctly.
2. Sign in → Dashboard with 0 tickets → "Populate Demo Data" button visible.
3. Click "Populate Demo Data" → 15 tickets seeded, toast "Seeded 15 demo tickets!", table populates.
4. Click again → toast error "You already have 15 tickets..."
5. Reports page with 0 data → empty state with "Go to Dashboard" link.
6. Reports with seeded data → all 4 charts render with real data.
7. Mobile (375px) → Customer column hidden, Subject/Status/Priority/Actions visible, horizontal scroll if needed.
8. CommandPalette Search button visible in dashboard header at all screen sizes.

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Created | HC-007 initial implementation |
