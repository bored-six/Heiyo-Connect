# Heiyo Connect

An AI-powered multi-tenant SaaS support dashboard. Teams use it to receive, triage, and resolve customer support tickets — with AI handling priority classification and response suggestions automatically.

**[Live Demo →](https://heiyo-connect.vercel.app)** · [Demo credentials below](#demo)

---

## Features

- **Multi-tenant** — full data isolation per workspace, invite-based team management
- **AI triage** — tickets auto-classified by priority (Gemini, Groq, or Mistral)
- **Real-time** — Socket.io + Pusher notifications when tickets arrive
- **Public portal** — customers submit tickets at `/p/[your-slug]` without logging in
- **Analytics** — charts for ticket volume, resolution time, priority breakdown
- **Command palette** — `Cmd+K` global search and quick actions
- **Switchable AI providers** — admins pick Gemini / Groq / Mistral per workspace

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, React 19) |
| Styling | Tailwind CSS v4 + Shadcn UI |
| Auth | Clerk v7 |
| Database | PostgreSQL + Prisma v7 (adapter-pg) |
| AI | Gemini 1.5 Flash / Groq / Mistral |
| Real-time | Socket.io + Pusher |
| Animations | Framer Motion |
| Charts | Recharts |

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/heiyo-connect.git
cd heiyo-connect
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` — the required keys are:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Local Postgres or [Neon](https://neon.tech) free tier |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk dashboard](https://clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → Get API key |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

Pusher, Groq, and Mistral keys are optional.

### 3. Set up the database

```bash
pnpm db:push    # creates schema
pnpm db:seed    # seeds 3 demo tenants + 50 tickets
```

### 4. Run

```bash
pnpm dev               # standard Next.js dev server
pnpm dev:socket        # with Socket.io real-time (requires ts-node)
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo

After seeding, use the **Demo Login** button on the homepage. Three pre-built workspaces are included:

| Workspace | Tickets | Notes |
|-----------|---------|-------|
| Acme Corp | 20 | Mix of priorities and statuses |
| ByteForge | 18 | Mostly technical tickets |
| NovaSpark | 15 | Billing and onboarding tickets |

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # Protected routes (auth required)
│   ├── api/                # API routes (public ticket, Socket.io, AI)
│   ├── p/[slug]/           # Public support portal (no auth)
│   └── join/[slug]/        # Workspace invite landing
├── actions/                # Server Actions — all mutations live here
├── components/
│   ├── ui/                 # Shadcn UI primitives
│   ├── dashboard/          # Dashboard-specific components
│   └── settings/           # Settings tab components
├── lib/
│   ├── tenant.ts           # requireUser() — auth + tenant isolation
│   ├── ai-gateway.ts       # AI provider abstraction
│   └── prisma.ts           # Prisma client singleton
└── hooks/                  # Custom React hooks (socket, optimistic UI)
```

---

## Key Architecture Decisions

**Multi-tenancy** — every Prisma query is scoped to `tenantId`. `requireUser()` in `src/lib/tenant.ts` is the single auth boundary — it returns the authenticated user + their workspace ID. Client-supplied tenantId is never trusted.

**Server Actions** — all mutations use Next.js Server Actions with Zod validation, returning `{ success: true, data }` or `{ success: false, error }` — never throwing. `revalidatePath()` handles cache invalidation.

**AI as background task** — `analyzeTicketWithProvider()` is always fire-and-forget. The ticket is created immediately; AI triage updates it asynchronously so the UI never blocks on AI latency.

**Real-time** — Socket.io rooms are scoped per tenant (`tenant:{id}`) and per ticket (`ticket:{id}`). Pusher handles toast notifications for cross-device events.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js dev server |
| `pnpm dev:socket` | Dev server with Socket.io |
| `pnpm build` | Production build |
| `pnpm db:push` | Sync Prisma schema to database |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm lint` | Run ESLint |
