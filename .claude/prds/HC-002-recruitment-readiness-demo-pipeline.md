**Ticket:** HC-002
**Status:** Complete
**Created:** 2026-03-23
**Last Updated:** 2026-03-23

## Summary
Recruitment Readiness & Demo Pipeline — populates the database with realistic seed data across 3 tenants and enables a one-click demo login flow for recruiters, plus a polished empty state component.

## Requirements

### Original Requirements
1. `prisma/seed.ts` with 3 mock tenants, 15–20 tickets each, diverse status/priority mix, AI-simulated `aiSuggestedResponse` and `aiPriority` fields
2. "Try Demo" server action/route that signs a recruiter in as the demo user without a Clerk account (< 2s, no login screen)
3. `TicketEmptyState` component to replace blank white screen when a workspace has no tickets

### Discovered Requirements
- `prisma/schema.prisma` was missing `url` in datasource when reading — Prisma v7 with `@prisma/adapter-pg` passes the connection string directly to `PrismaPg({ connectionString })` so URL config lives in the adapter, not the schema
- `User.clerkId` is `@unique` — seed cannot create multiple users with the same Clerk ID. Demo tenant (Aura Logistics) uses `DEMO_CLERK_USER_ID` env var; other tenants use static placeholder IDs (`seed_pixelstream_agent_001`, `seed_greenleaf_agent_001`) that are not real Clerk users and cannot log in
- Clerk users are created programmatically in seed via the Clerk REST API (`POST /v1/users`) using `CLERK_SECRET_KEY` — no manual dashboard step needed. Existing users are detected via `GET /v1/users?email_address=` before creating

## Architecture

### Design Decisions
- Demo route as API route (`/api/demo`), not a Server Action — Server Actions can't issue arbitrary HTTP redirects before auth. GET `/api/demo` creates the token server-side and issues a `NextResponse.redirect`
- Clerk sign-in token strategy: token is appended as `__clerk_ticket` to the `/sign-in` URL hash. Clerk's `<SignIn>` component auto-completes the flow without the user seeing any input fields
- Landing page (`/`) now auth-checks via `auth()` and only redirects to `/dashboard` when the user is already signed in — unauthenticated users see the marketing page
- `TicketEmptyState` is a `<tr>` element (not a `<div>`) so it renders correctly inside the existing `<tbody>` without breaking table semantics

### Demo Flow (2-redirect, ~1s total)
```
User clicks "Try Demo"
  → GET /api/demo (public route)
    → clerkClient().signInTokens.createSignInToken({ userId: DEMO_CLERK_USER_ID })
    → NextResponse.redirect(/sign-in#/?__clerk_ticket={token})
  → Clerk <SignIn> on /sign-in auto-submits ticket
    → Clerk redirects to NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL (/dashboard)
  → Dashboard renders with Aura Logistics seed data
```

## Implementation

### Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| seed.ts | Script | prisma/seed.ts | Populates 3 tenants, 50 tickets, 14 customers | Complete |
| demo route | API Route | src/app/api/demo/route.ts | Generates Clerk sign-in token, redirects | Complete |
| middleware.ts | Middleware | src/middleware.ts | Adds /api/demo to public routes | Complete |
| TicketEmptyState | Component | src/components/tickets/empty-state.tsx | Empty state for zero-ticket workspaces | Complete |
| page.tsx | Page | src/app/page.tsx | Landing page with hero + demo CTAs | Complete |
| dashboard/page.tsx | Page | src/app/(dashboard)/dashboard/page.tsx | Uses TicketEmptyState instead of inline text | Complete |

### Seed Data Summary
| Tenant | Plan | Tickets | Demo Login |
|--------|------|---------|------------|
| Aura Logistics | PRO | 17 | Yes — uses DEMO_CLERK_USER_ID |
| Pixel Stream | STARTER | 15 | No (placeholder clerkId) |
| GreenLeaf Retail | ENTERPRISE | 18 | No (placeholder clerkId) |

### Business Rules
- Demo user must be pre-created in Clerk dashboard before seed runs with a real `DEMO_CLERK_USER_ID`
- Seed script does a full wipe (`deleteMany()`) before re-seeding — safe to re-run
- `/api/demo` returns 503 JSON if `DEMO_CLERK_USER_ID` is unset or is the placeholder string
- Placeholder clerkIds in seed (`seed_pixelstream_agent_001`, `seed_greenleaf_agent_001`) are intentionally non-functional for auth

## Testing
- Manual: run `pnpm db:seed`, verify Neon DB tables populated, click "Try Demo" on landing page, confirm dashboard loads as Aura Logistics
- Demo route error states: test with `DEMO_CLERK_USER_ID` unset → expect 503 JSON

## Setup (fully automated)
- [ ] Run `pnpm db:seed` — seed auto-creates the Clerk user via REST API
- [ ] Verify "Try Demo" on landing page drops into dashboard in < 2s

No manual Clerk dashboard step. No env var needed beyond what's already in `.env`.

## Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Initial implementation | HC-002 |
