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
| Real-time | Socket.io | 4.8.3 |
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
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`
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

## Real-time (Socket.io)
- **Standard `npm run dev` does NOT include Socket.io**
- Must use `npm run dev:socket` (`ts-node server.ts`) for real-time
- Socket.io attaches to the HTTP server in `server.ts`
- Path: `/api/socket`; transports: websocket + polling fallback
- CORS: `NEXT_PUBLIC_APP_URL`
- Client singleton: `src/lib/socket-client.ts` → `getSocket()`
- Rooms: `tenant:{tenantId}` and `ticket:{ticketId}`
- Server emitters in `src/lib/socket-server.ts`:
  - `emitTicketCreated(tenantId, payload)`
  - `emitTicketUpdated(tenantId, ticket)`
  - `emitNewMessage(ticketId, payload)`
- Client events from server: `ticket:created`, `ticket:updated`, `message:new`, `ticket:assigned`
- Client → server: `join:tenant`, `join:ticket`, `leave:ticket`, `typing:start`, `typing:stop`

## Dev Scripts
```bash
npm run dev          # Next.js only (no Socket.io)
npm run dev:socket   # Custom server with Socket.io (requires ts-node)
npm run build        # Production build
npm run db:push      # Push schema to DB
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## API Routes
- `POST /api/ai/analyze` — AI ticket analysis (auth required)
- `/api/socket` — Socket.io endpoint (handled by custom server, not Next.js route handler)
- `/api/webhooks/*` — Public (Clerk webhooks)
