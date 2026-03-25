# PRD: HC-011 — The Public Presence & Onboarding Suite

**Ticket:** HC-011
**Status:** In Progress
**Created:** 2026-03-26
**Last Updated:** 2026-03-26

## Summary

Three coordinated features that complete the public-facing story of Heiyo Connect for portfolio/recruiting demos: a high-impact landing page with a live dashboard mockup, a public customer-facing support portal at `/p/[slug]`, and a polished one-click demo seeding flow.

## Sub-features

| Sub-ticket | Feature | PRD |
|-----------|---------|-----|
| HC-011.1 | "Midnight" Landing Page | this file |
| HC-011.2 | Public Support Portal `/p/[slug]` | this file |
| HC-011.3 | One-Click Demo Seeding (enhanced UI) | this file |

---

## Requirements

### HC-011.1 — Landing Page

**Original requirements:**
- Dark-themed hero with "Glow" effect behind a dashboard mockup
- Copy: "Support at the speed of AI. Multi-tenant, Real-time, Orchestrated."
- Tech stack marquee: Next.js 16, React 19, Pusher, Gemini

**Discovered requirements:**
- Landing page already exists with solid structure; hero section needs dashboard mockup added above fold
- "Socket.io" references in feature cards and footer are stale tech debt — replace with "Pusher"
- Inline styles used throughout (not Tailwind tokens) — intentional, keeps page always-dark regardless of OS theme (see HC-007 learning)

### HC-011.2 — Public Support Portal

**Original requirements:**
- Unauthenticated route `/p/[slug]` — customer enters Name, Email, Subject, Issue
- Slug maps to a tenant (`Tenant.slug` — already exists in schema)
- Submission triggers full AI triage + Pusher toast on the agent dashboard

**Discovered requirements:**
- `analyzeTicketAsync` in `src/actions/tickets.ts` is a private unexported function — public API route reimplements the same logic inline (import `analyzeTicketWithProvider` + `emitTicketCreated` directly)
- `Tenant.slug` already exists as `@unique` in schema — no migration needed
- Middleware already has `/` and `/api/demo(.*)` as public — add `/p/(.*)`

### HC-011.3 — One-Click Demo Seeding

**Original requirements:**
- If user has 0 tickets, show beautiful empty state with "Seed Demo Data" button

**Discovered requirements:**
- `seedDemoData` action already exists in `src/actions/seed.ts` — 15 tickets with realistic AI fields, spread over 7 days ✅
- `TicketEmptyState` component already exists with seed button ✅
- Enhancement: improve visual design for portfolio impact (gradient background, better layout)

---

## Architecture

### Design Decisions

1. **Public ticket API as route handler, not server action** — server actions require Clerk auth context (`requireUser()`); unauthenticated submission must go through an API route handler that bypasses auth.

2. **Inline AI pipeline in public API route** — rather than refactoring `analyzeTicketAsync` to a shared lib (which would require touching tested code), the public route imports `analyzeTicketWithProvider` + `emitTicketCreated` directly. Identical behavior, zero risk to existing flow.

3. **Slug lookup in server component, form in client component** — `page.tsx` is async server component that fetches the tenant by slug (shows 404 if not found). The actual form is a `'use client'` component that POSTs to the API route.

4. **Landing page uses inline styles** — intentional per HC-007 learning: semantic Tailwind tokens follow OS theme; a fixed-dark marketing page uses literal hex/rgba.

---

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Landing page | Server Component | `src/app/page.tsx` | Enhanced hero + mockup + marquee | Complete |
| Middleware | Config | `src/middleware.ts` | Add `/p/(.*)` as public route | Complete |
| Public ticket API | Route Handler | `src/app/api/public-ticket/route.ts` | Unauthenticated ticket creation | Complete |
| Public portal page | Server Component | `src/app/p/[slug]/page.tsx` | Slug lookup + render form | Complete |
| Public ticket form | Client Component | `src/app/p/[slug]/public-ticket-form.tsx` | Customer submission form | Complete |
| TicketEmptyState | Client Component | `src/components/tickets/empty-state.tsx` | Enhanced seed/onboarding UI | Complete |

### Data Model

No schema changes — `Tenant.slug String @unique` already exists.

### Business Rules

- Public portal shows 404-style message if slug doesn't match any tenant
- Public tickets are created with `channel: CHAT` (web form) and `priority: MEDIUM` (default, AI overrides)
- AI analysis fires in background (fire-and-forget) — form success is not blocked by AI
- Pusher emit fires AFTER AI sets priority (same pattern as internal `createTicket`)
- Slug is read-only from DB — cannot be supplied by form submitter

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Created PRD | HC-011 kickoff |
| 2026-03-26 | Discovered slug already in schema | No migration needed |
| 2026-03-26 | Discovered seed action + empty state already exist | HC-011.3 = enhancement only |
