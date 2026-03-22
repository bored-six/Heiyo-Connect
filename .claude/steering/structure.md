# Structure & Patterns — Heiyo-Connect

## Directory Layout

```
src/
├── app/
│   ├── layout.tsx                      root layout (fonts, metadata, ClerkProvider)
│   ├── page.tsx                        landing page
│   ├── (dashboard)/                    route group — all routes require auth
│   │   ├── layout.tsx                  auth check + nav bar
│   │   └── dashboard/page.tsx          ticket stats + table
│   └── api/
│       ├── ai/analyze/route.ts         POST — AI analysis with customer context
│       └── socket/route.ts             doc only; actual server in server.ts
├── actions/
│   ├── tickets.ts                      server actions: CRUD + AI trigger
│   └── messages.ts                     server actions: send message, AI reply
├── hooks/
│   └── useTicketSocket.ts              React hook for Socket.io subscriptions
├── lib/
│   ├── tenant.ts                       getCurrentTenant(), requireUser() (cached)
│   ├── prisma.ts                       Prisma client singleton
│   ├── gemini.ts                       AI functions
│   ├── socket-server.ts                Socket.io server setup + emitters
│   ├── socket-client.ts                Socket.io client singleton
│   └── utils.ts                        cn() className merger
└── components/
    └── ui/                             shadcn-based UI primitives
        badge, button, card, dialog, input, label, select, table, tabs, textarea

server.ts                               custom HTTP server (Socket.io + Next.js)
middleware.ts                           Clerk auth middleware
prisma/schema.prisma                    Prisma schema
```

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `socket-server.ts`, `use-ticket-socket.ts` |
| Components | PascalCase | `TicketTable`, `StatusBadge` |
| Functions | camelCase | `getCurrentTenant`, `analyzeTicket` |
| Prisma models | PascalCase | `Tenant`, `Ticket`, `Message` |
| Enums | PascalCase | `TicketStatus`, `Priority`, `Role` |
| Zod schemas | PascalCase + Schema suffix | `CreateTicketSchema`, `SendMessageSchema` |
| Socket events | colon-scoped kebab | `join:tenant`, `ticket:created` |
| Return types | PascalCase + type suffix | `ActionResult<T>` |

## Server Actions Pattern (`src/actions/`)

```typescript
"use server"

// 1. Define Zod schema
const CreateTicketSchema = z.object({ ... })

// 2. Consistent return type
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// 3. Every action:
export async function createTicket(formData: unknown): Promise<ActionResult<Ticket>> {
  const user = await requireUser()          // auth + tenant
  const data = CreateTicketSchema.parse(formData)  // validate
  const result = await prisma.ticket.create({
    data: { ...data, tenantId: user.tenantId }  // always scope
  })
  revalidatePath("/dashboard")              // invalidate cache
  return { success: true, data: result }
}
```

## API Route Pattern (`src/app/api/`)

```typescript
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data = Schema.parse(body)  // validate

  try {
    const result = await doWork(data)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "..." }, { status: 500 })
  }
}
```

## Onboarding Exception

`requireUser()` **cannot** be used in `src/actions/onboarding.ts` — it throws "User not found" because the user doesn't exist in the DB yet (onboarding creates them). Use `auth()` + `currentUser()` directly there only.

The onboarding action also uses a `(prev, formData)` form-state signature instead of `ActionResult<T>` — this is intentional for use with `useActionState`.

## Tenant Isolation Pattern

```typescript
// ALWAYS include tenantId in queries
await prisma.ticket.findMany({
  where: {
    tenantId: user.tenantId,   // REQUIRED
    status: filters?.status,   // optional
  }
})

// NEVER query without tenant scope
await prisma.ticket.findMany()  // WRONG
```

## Prisma Queries

- Always include `tenantId` in `where` clause
- Use `include` for relations (no separate queries)
- Use `orderBy` explicitly (don't rely on insertion order)
- For upsert: use composite unique key `where: { tenantId_email: { tenantId, email } }`

## Caching Pattern (tenant.ts)

```typescript
import { cache } from "react"

// Deduplicated per request — safe to call multiple times in same render
export const requireUser = cache(async () => {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/sign-in")
  return user
})
```

## Real-time Hook Pattern

```typescript
useTicketSocket({
  tenantId: user.tenantId,
  ticketId: ticket.id,     // optional
  onTicketCreated: (ticket) => { /* update state */ },
  onNewMessage: (msg) => { /* append */ },
  onTicketUpdated: (ticket) => { /* merge */ },
})
```

## Styling

- Use `cn()` from `src/lib/utils.ts` for conditional classes
- Tailwind CSS 4 — use PostCSS plugin, NOT `@tailwind` directives
- Color tokens: `bg-card`, `text-muted-foreground`, `text-primary`, `border`
- Responsive: `grid-cols-2 sm:grid-cols-4` pattern
- Status badges: emerald (open/resolved), blue (in-progress), orange (waiting), red (closed)
- Priority badges: gray (low), yellow (medium), orange (high), red (critical)

## UI Components

All UI primitives are in `src/components/ui/` — import from there:
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// etc.
```

## Error Handling

- Server actions: catch DB errors, return `{ success: false, error: "message" }`
- API routes: try/catch + `NextResponse.json({ error }, { status: 500 })`
- AI failures: `console.error` + return default values (never throw to caller)
- Auth failures: `redirect("/sign-in")`
- Zod parse failures: extract `error.errors[0].message`

## Data Fetching

- Server Components: `async/await` directly (no hooks, no useEffect)
- Client Components: call server actions via form actions or event handlers
- After mutations: always call `revalidatePath()` to invalidate Next.js cache
- Avoid prop-drilling data through many levels — fetch in the Server Component that needs it
