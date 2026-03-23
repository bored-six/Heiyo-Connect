# PRD: HC-001 — Multi-Tenant SaaS Scaffold

**Ticket:** HC-001
**Status:** Complete
**Created:** 2026-03-23
**Last Updated:** 2026-03-23

---

## Summary

Full multi-tenant SaaS foundation for Heiyo Connect — an AI-powered support dashboard. Includes database schema, auth, onboarding, real-time infrastructure, AI integration, and a basic dashboard UI. Every layer enforces tenant isolation.

---

## Requirements

### Original Requirements
- Multi-tenant architecture with strict data isolation
- Clerk authentication (sign-in, sign-up, middleware)
- Tenant onboarding flow (company name → tenant + user creation)
- PostgreSQL database via Prisma v7 with driver adapter
- Gemini AI for ticket analysis and reply generation
- Socket.io for real-time updates (tickets, messages, typing)
- Dashboard with ticket overview and stats
- shadcn UI primitives

### Discovered Requirements
- Next.js 16.2.1 uses different APIs from training data — AGENTS.md added as guard
- Tailwind v4 requires `@tailwindcss/postcss` plugin, no directives in CSS
- Clerk v7 `auth()` is async; `clerkMiddleware` replaces `authMiddleware`
- Prisma v7 requires `@prisma/adapter-pg` driver adapter — cannot use default PrismaClient
- Zod v4 has API differences from v3
- Socket.io requires a custom Node HTTP server (`server.ts`) — Next.js default server doesn't support it
- AI calls must be fire-and-forget (never awaited in request path) to avoid blocking

---

## Architecture

### Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Auth provider | Clerk v7 | Managed auth, built-in user management |
| Multi-tenancy model | Shared DB, tenantId column | Simpler than schema-per-tenant for early stage |
| AI provider | Google Gemini 1.5 Flash | Cost-effective, fast for ticket triage |
| Real-time | Socket.io | Rooms-based model fits tenant + ticket isolation naturally |
| ORM | Prisma v7 + pg adapter | Type-safe, supports Neon serverless Postgres |
| UI primitives | shadcn | Copy-paste, no runtime dependency |

### Tenant Isolation Layers

1. **Database** — All models have `tenantId`; all queries filter by `tenantId` from `requireUser()`
2. **Auth** — Clerk middleware protects all routes; `/onboarding` bootstraps Tenant + User on first login
3. **Socket.io** — Rooms: `tenant:{tenantId}` (org-wide) and `ticket:{ticketId}` (per-ticket)
4. **Server Actions** — All actions call `requireUser()` first; tenantId never trusted from request body

### Architecture Diagram

```
Browser
  └─ Clerk (auth) → middleware.ts (route protection)
       └─ /onboarding → createTenantAndUser() → Tenant + User in DB
       └─ /dashboard  → requireUser() → DashboardPage (server component)
                          └─ getTickets() → Prisma (tenantId scoped)
                          └─ Socket.io (tenant room)
                               └─ useTicketSocket (client hook)

AI Path (async):
  createTicket() → fire-and-forget → analyzeTicketAsync()
                                       └─ Gemini API → update ticket (aiSuggestedResponse, aiPriority)
```

---

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Prisma Schema | Schema | `prisma/schema.prisma` | 6 models + 5 enums, full multi-tenant data model | ✅ |
| Prisma Client | Lib | `src/lib/prisma.ts` | Singleton with pg adapter | ✅ |
| Tenant Helpers | Lib | `src/lib/tenant.ts` | `requireUser()`, `getCurrentTenant()` with React cache | ✅ |
| Utils | Lib | `src/lib/utils.ts` | `cn()` Tailwind class merger | ✅ |
| Gemini Service | Lib | `src/lib/gemini.ts` | `analyzeTicket()`, `generateReply()` | ✅ |
| Socket Server | Lib | `src/lib/socket-server.ts` | `attachSocketServer()`, emit helpers | ✅ |
| Socket Client | Lib | `src/lib/socket-client.ts` | Singleton socket client for browser | ✅ |
| Onboarding Action | Action | `src/actions/onboarding.ts` | `createTenantAndUser()` server action | ✅ |
| Ticket Actions | Action | `src/actions/tickets.ts` | CRUD + AI analysis for tickets | ✅ |
| Message Actions | Action | `src/actions/messages.ts` | `sendMessage()`, `generateAiReply()` | ✅ |
| Root Layout | App | `src/app/layout.tsx` | ClerkProvider + font setup | ✅ |
| Root Page | App | `src/app/page.tsx` | Redirects to /dashboard | ✅ |
| Sign-In | App | `src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk SignIn component | ✅ |
| Sign-Up | App | `src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk SignUp component | ✅ |
| Onboarding Page | App | `src/app/onboarding/page.tsx` | Company name form → tenant creation | ✅ |
| Dashboard Layout | App | `src/app/(dashboard)/layout.tsx` | Protected nav shell | ✅ |
| Dashboard Page | App | `src/app/(dashboard)/dashboard/page.tsx` | Stats + ticket table | ✅ |
| AI Analyze Route | API | `src/app/api/ai/analyze/route.ts` | POST endpoint for ticket analysis | ✅ |
| Socket Route | API | `src/app/api/socket/route.ts` | Documents Socket.io setup | ✅ |
| Socket Hook | Hook | `src/hooks/useTicketSocket.ts` | Real-time subscription hook | ✅ |
| Middleware | Config | `src/middleware.ts` | Clerk route protection | ✅ |
| Custom Server | Config | `server.ts` | HTTP server + Socket.io attachment | ✅ |
| shadcn UI | Components | `src/components/ui/` | 10 primitives (button, card, badge, dialog, input, label, select, table, tabs, textarea) | ✅ |

### Data Model

**Tenant** — root; name, slug, plan (FREE/STARTER/PRO/ENTERPRISE)
**User** — Clerk userId, role (OWNER/ADMIN/AGENT/VIEWER), linked to Tenant
**Customer** — unique per tenant+email, linked to Tickets
**Ticket** — subject, description, status, priority, channel, AI fields, linked to Tenant + Customer + User
**Message** — body, authorId, linked to Ticket + Tenant
**ApiKey** — hashed key, linked to Tenant (future use)

### Key Methods

```typescript
requireUser()                          // src/lib/tenant.ts — auth + tenant lookup, throws if unauthed
createTenantAndUser(prev, formData)    // src/actions/onboarding.ts — signup flow
createTicket(formData)                 // src/actions/tickets.ts — creates + triggers AI async
analyzeTicketAsync(...)                // src/actions/tickets.ts — background Gemini analysis
getTickets(filters?)                   // src/actions/tickets.ts — tenant-scoped list
sendMessage(data)                      // src/actions/messages.ts — agent message
generateAiReply(ticketId)             // src/actions/messages.ts — AI reply suggestion
attachSocketServer(httpServer)         // src/lib/socket-server.ts — Socket.io setup
useTicketSocket(options)              // src/hooks/useTicketSocket.ts — real-time hook
```

### Business Rules

- Every Prisma query must include `tenantId: user.tenantId`
- Never trust tenantId from request body — always derive from `requireUser()`
- AI calls are always fire-and-forget — never awaited in request path
- `server.ts` must be used (`pnpm dev:socket`) for Socket.io to work; `pnpm dev` disables real-time
- Onboarding is the only path to create a Tenant — no tenant = redirect to /onboarding

---

## Missing Pages (Not Yet Built)

These routes are planned but not implemented:

- `/dashboard/tickets` — ticket list view
- `/dashboard/tickets/new` — ticket creation form
- `/dashboard/tickets/[id]` — ticket detail + messaging UI
- `/dashboard/settings` — tenant settings

---

## Testing

No test suite established yet. Manual testing via `pnpm dev` and Prisma Studio.

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Initial scaffold built | HC-001 kickoff |
| 2026-03-23 | PRD created retroactively | GATE 2 compliance — missed on initial commit |
