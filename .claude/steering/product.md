# Product Steering — Heiyo-Connect

## What It Is
Multi-tenant AI-powered customer support ticketing dashboard. Support agents manage tickets from customers with real-time collaboration and AI-assisted prioritization/responses.

## Core Business Rules

### Multi-Tenant Isolation (CRITICAL)
- **Every** query must include `tenantId: user.tenantId` — no exceptions
- Customer emails are unique **per tenant**, not globally (`@@unique([tenantId, email])`)
- Cross-tenant data access is impossible by design
- Tenant isolation enforced at: middleware → requireUser() → every Prisma query

### Ticket Lifecycle
- Default priority on creation: `MEDIUM`
- Default status: `OPEN`
- Ticket is auto-assigned to the creating agent
- AI analysis runs **async** after creation — never block the response
- Status flow: `OPEN → IN_PROGRESS → WAITING_ON_CUSTOMER | RESOLVED → CLOSED`
- When status → `RESOLVED`, set `resolvedAt` timestamp

### AI Priority Logic
- AI can suggest a priority; if AI priority > manual priority → auto-upgrade
- CRITICAL: system down, data loss, security breach, payment failure
- HIGH: core feature broken, significant impact, deadline risk
- MEDIUM: feature degraded, workaround exists
- LOW: question, cosmetic, feature request, minor

### Roles
- `OWNER` / `ADMIN` / `AGENT` / `VIEWER`
- Role checked via User.role in DB (not Clerk metadata)

### Channels
- `EMAIL`, `CHAT`, `PHONE`, `SOCIAL`, `API`

### Plans
- `FREE`, `STARTER`, `PRO`, `ENTERPRISE` on Tenant

## Key User Flows

### Ticket Creation
1. Agent submits form (subject, description, customer email/name, channel)
2. Customer upserted per `(tenantId, email)` composite key
3. Ticket created, auto-assigned to agent
4. AI analysis triggered async — updates ticket with suggestedResponse, aiPriority, tags
5. Dashboard revalidated via `revalidatePath()`

### Message / Reply
- Agents send messages on tickets (threaded)
- AI can generate reply suggestions (last 6 messages as context)
- `isFromAgent: false` = customer message; `true` = agent or AI
- `isAiGenerated: true` marks AI-authored messages

### Real-Time
- Agents join a tenant-scoped room on load
- Agents join a ticket-scoped room when viewing a ticket
- Typing indicators broadcast to ticket room only
- New messages + ticket updates broadcast to appropriate room

## What NOT to Do
- Never query without `tenantId` scope
- Never run AI analysis synchronously (it blocks)
- Never allow cross-tenant data reads
- Never expose raw ApiKey — only store hashed version (`keyHash`)
