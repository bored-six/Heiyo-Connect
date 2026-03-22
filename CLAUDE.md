@AGENTS.md

# Heiyo-Connect — Claude Instructions

## Before Starting Any Task — Ask First

Before writing a single line of code, ask the user:

1. **Ticket ID** — "What's the HC ticket number for this? (e.g. HC-001)" — needed for commits and PRD naming. If truly ad-hoc, confirm explicitly.
2. **Scope** — Is this a bug fix, new feature, or enhancement?
3. **Affected areas** — Which files/routes/components are in scope? Are there areas to avoid?
4. **Acceptance criteria** — How will we know it's done?

Only proceed once you have clear answers. Do not assume scope — ask.

---

## Context Files (Read Before Any Task)

Before writing code, check these files:
- `.claude/steering/product.md` — business rules, multi-tenant logic, ticket lifecycle
- `.claude/steering/tech.md` — stack versions, env vars, service setup
- `.claude/steering/structure.md` — file layout, naming conventions, code patterns
- `.claude/learnings.md` — discovered gotchas and patterns

For active tickets: `.claude/prds/HC-000-*.md`

---

## ABSOLUTE RULE: Multi-Tenant Isolation

**Every Prisma query must include `tenantId: user.tenantId`. No exceptions.**

```typescript
// CORRECT
await prisma.ticket.findMany({ where: { tenantId: user.tenantId, ...filters } })

// WRONG — never do this
await prisma.ticket.findMany({ where: { id: ticketId } })
```

Always use `requireUser()` from `src/lib/tenant.ts` to get the authenticated user + tenantId. Never trust user-supplied tenantId from request bodies.

---

## Version Gotchas

This project uses several packages with **breaking changes from Claude's training data**. Check `node_modules/next/dist/docs/` before writing any Next.js code.

### Next.js 16.2.1 + React 19
- Default to **Server Components** (async functions, no hooks). Only add `'use client'` when you need interactivity, browser APIs, or React hooks.
- Data fetching belongs in Server Components — no `useEffect` for fetching.
- Use `cache()` from React for deduplication (see `src/lib/tenant.ts`).
- `revalidatePath()` / `revalidateTag()` for cache invalidation after mutations.

### Tailwind CSS v4
- **No `@tailwind base/components/utilities` directives** — they don't exist in v4.
- Configured via `postcss.config.mjs` with `@tailwindcss/postcss`.
- Use `cn()` from `src/lib/utils.ts` for conditional classes.

### Clerk v7
- `auth()` is **async**: `const { userId } = await auth()`
- Use `clerkMiddleware` (not the old `authMiddleware`)
- User lookup: `requireUser()` in `src/lib/tenant.ts` — use this, don't call Clerk APIs directly in actions

### Prisma v7 (driver adapter)
- Client uses `@prisma/adapter-pg` — always instantiate via `src/lib/prisma.ts`, never create a new `PrismaClient` directly.
- Schema requires `url = env("DATABASE_URL")` in datasource block.
- After schema changes: `pnpm db:generate` then `pnpm db:push`.

### Zod v4
- API differs from v3. Check actual Zod v4 docs — `.safeParse()`, `.parse()`, error shapes may differ from training data.

---

## Server Actions (`src/actions/`)

Follow this pattern exactly:

```typescript
"use server"
import { z } from "zod"
import { requireUser } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const MySchema = z.object({ ... })
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function myAction(input: unknown): Promise<ActionResult<MyType>> {
  const user = await requireUser()
  const data = MySchema.parse(input)

  try {
    const result = await prisma.myModel.create({
      data: { ...data, tenantId: user.tenantId }
    })
    revalidatePath("/dashboard")
    return { success: true, data: result }
  } catch {
    return { success: false, error: "Something went wrong" }
  }
}
```

Rules:
- Always `"use server"` at the top
- Always validate with Zod before any DB call
- Always return `ActionResult<T>` — never throw
- Always call `revalidatePath()` after mutations
- Always scope DB queries to `tenantId: user.tenantId`

---

## API Routes (`src/app/api/`)

```typescript
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // validate, try/catch, return NextResponse.json(...)
}
```

---

## AI Calls Are Always Async (Non-Blocking)

Never await `analyzeTicket()` or any Gemini call in the main request path. Always fire-and-forget:

```typescript
// CORRECT — fire and forget
analyzeTicketAsync(ticketId, subject, description, tenantId)

// WRONG — blocks the response
await analyzeTicket(subject, description)
```

---

## Real-Time (Socket.io)

- `pnpm dev` — **no Socket.io** (standard Next.js server)
- `pnpm dev:socket` — Socket.io enabled (requires `ts-node` installed)
- Server emitters: `src/lib/socket-server.ts`
- Client hook: `src/hooks/useTicketSocket.ts`
- Rooms: `tenant:{tenantId}` (org-wide) and `ticket:{ticketId}` (specific ticket)

---

## UI Components

All primitives are in `src/components/ui/` — import from there, don't recreate them.

```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
```

---

## Commit After Every Task (Mandatory)

After every completed task, commit immediately. Do not batch multiple tasks into one commit.

### Commit Format

```
{type}(HC-000): short description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types:** `feat` | `fix` | `refactor` | `test` | `docs` | `chore`

**Examples:**
```
feat(HC-012): add ticket filter by priority
fix(HC-015): scope customer query to tenantId
chore(HC-019): add missing db index on tickets.status
```

**No ticket?** Use `fix(hotfix):` or `chore(ad-hoc):` and note it in the commit body.

### Push Policy

**Commit automatically. Push only when the user explicitly asks.**

Pushing affects the remote and is harder to undo — always confirm first:
> "Task complete and committed as `abc1234`. Ready to push to origin — shall I?"

---

## PRD Naming Convention

All PRDs use the `HC-000` ticket format:

```
.claude/prds/HC-012-ticket-filter.md         main feature
.claude/prds/HC-012.1-priority-badge-ui.md   sub-feature
```

PRD header must include:
```markdown
**Ticket:** HC-012
**Status:** Planning | In Progress | Complete
**Created:** YYYY-MM-DD
```

Sub-feature PRDs additionally need:
```markdown
**Parent:** HC-012-ticket-filter.md
```

---

## Post-Task Checklist

Before reporting a task as complete:

- [ ] Code works as described in acceptance criteria
- [ ] No Prisma query missing `tenantId` scope
- [ ] `revalidatePath()` called after any mutation
- [ ] Committed with correct format: `{type}(HC-000): description`
- [ ] `.claude/learnings.md` updated with any non-obvious discoveries
- [ ] PRD created or updated if this was feature work
- [ ] Ask user if they want to push

---

## Knowledge Capture

After completing any non-trivial task:
- Add discoveries to `.claude/learnings.md`
- Create/update a PRD in `.claude/prds/HC-000-description.md`
