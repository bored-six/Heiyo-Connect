# Technical Steering — Heiyo-Connect

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript | 5 |
| Runtime | React | 19.2.4 |
| Styling | Tailwind CSS | 4 |
| ORM | Prisma | 7.5.0 |
| DB Driver | @prisma/adapter-pg (PrismaPg) | 7.5.0 |
| Database | PostgreSQL | any |
| Auth | Clerk (@clerk/nextjs) | 7.0.6 |
| AI | Google Gemini (@google/generative-ai) | 0.24.1 |
| Real-time | Pusher Channels | latest |
| Validation | Zod | 4.3.6 |
| Forms | React Hook Form | 7.72.0 |
| Icons | Lucide React | 0.577.0 |
| UI | Shadcn (custom components) | 4.1.0 |

## Environment Variables

```
DATABASE_URL          PostgreSQL connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
GEMINI_API_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Prisma Setup
- Uses `@prisma/adapter-pg` (driver adapter) — Prisma v7 requirement
- Client is a singleton in `src/lib/prisma.ts`
- Schema at `prisma/schema.prisma` — has `url = env("DATABASE_URL")` in datasource
- Commands: `npm run db:generate` → `npm run db:push` → `npm run db:studio`

## Auth (Clerk)
- Middleware at `src/middleware.ts` — uses `clerkMiddleware` + `createRouteMatcher`
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/onboarding(.*)`, `/api/webhooks(.*)`, `/api/demo(.*)`, `/api/public-ticket(.*)`, `/p/(.*)`
- All other routes protected by `auth.protect()`
- `requireUser()` in `src/lib/tenant.ts` — throws if unauthenticated
- User's `clerkId` stored in DB `User.clerkId`; `tenantId` derived from User record

## AI (Gemini)
- Model: `gemini-1.5-flash`
- Lib: `src/lib/gemini.ts`
- `analyzeTicket(subject, description, customerHistory?)` → AITicketAnalysis (Zod-validated)
- `generateReply(ticketSubject, messageHistory, latestMessage)` → string
- Returns sensible defaults on failure — never throws to caller
- Reply generation uses last 6 messages as context

## Real-time (Pusher Channels)
- Migrated from Socket.io in HC-004.1 — Pusher is the only real-time layer
- Server client: `src/lib/pusher-server.ts` → `pusherServer` singleton (Pusher SDK)
- Client hook: `src/hooks/useTicketSocket.ts` → `useTicketSocket()` (Pusher JS)
- Channels: `tenant-{tenantId}` (org-wide), `ticket-{ticketId}` (specific ticket)
- Server emitters in `src/lib/pusher-server.ts`:
  - `emitTicketCreated(tenantId, payload)` — fires AFTER AI sets priority
  - `emitNewMessage(ticketId, payload)`
- Client events: `ticket:created`, `message:new`
- Required env vars: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
- Public env: `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`
- Any reference to Socket.io in source comments is stale tech debt — ignore

## Dev Scripts
```bash
npm run dev          # Next.js dev server (Pusher works — no custom server needed)
npm run build        # Production build
npm run db:push      # Push schema to DB
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## API Routes
- `POST /api/ai/analyze` — AI ticket analysis (auth required)
- `POST /api/public-ticket` — Unauthenticated public ticket creation; slug+form → tenant lookup → ticket create → AI + Pusher (fire-and-forget)
- `GET /api/demo` — Demo account auto-login redirect
- `/api/webhooks/*` — Public (Clerk webhooks)
