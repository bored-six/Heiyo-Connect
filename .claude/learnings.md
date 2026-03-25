# Learnings — Heiyo-Connect

<!-- Format: ## [YYYY-MM-DD] - Category -->
<!-- Max 50 entries. Promote stable patterns to steering docs. -->

## [2026-03-26] - HC-009 Patterns

- **Filter pills follow the same URL-param pattern as sort**: clone existing `searchParams` with `new URLSearchParams(searchParams.toString())`, then `params.set` / `params.delete` before pushing. This preserves sort params when filters change and vice versa.
- **Lifting card wrapper out of client components**: when a Server Component needs to inject UI (filters, headings) inside a card that was previously owned by a client component, move the card wrapper to the Server Component and strip it from the client component. Keeps visual grouping without prop-drilling render output.
- **Contextual empty states need a `filtered` boolean prop**: `TicketEmptyState` now accepts `filtered?: boolean` — when true it shows "No tickets match your filters" without the seed/create CTAs. This avoids showing "seed 15 tickets" when tickets exist but none match the active filter.
- **Server-side filter validation pattern**: use `Object.values(SomeEnum).includes(param as SomeEnum)` to validate URL params against Prisma enum allowlists before passing to actions. Invalid values become `undefined` (treated as "no filter") — never throw or redirect.

## [2026-03-26] - HC-008 Patterns

- **URL-based sort in Server Components**: pass `searchParams` (a Promise in Next.js 16 App Router) to the page, `await` it, validate sort field against an allowlist, then pass to both the server action and the table component as props. This keeps sort state bookmarkable and avoids client-side state.
- **`useSearchParams()` in sort headers**: use `new URLSearchParams(searchParams.toString())` to clone existing params before setting `sort` and `dir`, so other query params (filters, etc.) are preserved on sort navigation.
- **Prisma `_count` relation sort**: to sort by message count use `orderBy: { messages: { _count: "asc" | "desc" } }` — NOT `_count: { messages: ... }`. The field name is the relation name, not `_count`.
- **`TicketEmptyState` colSpan must be updated** when adding columns — HC-008 added a `#` column, bringing total to 8. The empty state `colSpan` was not updated in this ticket; check it if blank-state row layout looks broken.
- **`autoincrement()` fields in Postgres** start at 1 for new records; existing rows get NULL unless backfilled. For fresh dev databases this is fine; production migrations need a default or backfill script.

## [2026-03-26] - HC-007 Patterns

- **Landing page uses inline styles for the Midnight theme** — semantic Tailwind CSS variable tokens (`bg-background`, `text-foreground`) follow the app's light/dark theme. For a fixed-dark marketing page, use literal hex/rgba inline styles so the page is always dark regardless of the user's OS theme.
- **Prisma `@default(now())` fields can be overridden** — providing `createdAt` explicitly in `prisma.create()` works even when the field has `@default(now())`. The default only applies when the field is omitted.
- **`TicketEmptyState` `colSpan` was wrong (6 vs 7 columns)** — the table has 7 columns (Subject, Customer, Status, Priority, Messages, Created, Actions). Always count columns before hardcoding colSpan.
- **Client components CAN import server actions** — `"use client"` + `import { myAction } from "@/actions/foo"` is valid. Use `useTransition` to show pending state while the action runs.
- **CommandPalette keyboard-only UX** — previously opened only via Cmd+K, invisible to touch users. Fix: render a visible trigger button inside the component and co-locate open state there. Move the component into the dashboard header so the button appears naturally in the UI chrome.

## [2026-03-23] - Workflow

- Claude repeatedly skips ask-first gate, post-task commit, learnings/PRD/steering updates. Hard gates added to top of CLAUDE.md to force compliance — buried rules are ignored.
- `onboarding.ts` is a valid exception to the `requireUser()` rule — `requireUser()` throws "User not found" for pre-tenant users. `auth()` + `currentUser()` must be called directly in onboarding actions.
- Onboarding action uses `(prev, formData)` form-state signature (not standard `ActionResult<T>`) because it's designed for `useActionState`. This is intentional.

## [2026-03-23] - Demo / Seed (HC-002)

- Clerk users CAN be created programmatically from a seed script via the Clerk REST API (`POST https://api.clerk.com/v1/users`, `Authorization: Bearer CLERK_SECRET_KEY`). No SDK needed — `fetch` works. Returns the `id` field to use as `clerkId` in DB. Use GET `/v1/users?email_address=` to check for existing users before creating.
- `User.clerkId` is `@unique` across all tenants — seed scripts seeding multiple tenants must use distinct placeholder clerkIds per tenant. Only the demo tenant should use a real `DEMO_CLERK_USER_ID`.
- Demo API routes must be API routes (`/app/api/.../route.ts`), not Server Actions — Server Actions can't issue arbitrary `NextResponse.redirect` before Clerk auth completes. Use `GET` route handler + `NextResponse.redirect`.
- `TicketEmptyState` must be a `<tr>` (not a `<div>`) to avoid invalid HTML nesting inside `<tbody>`.
- Prisma v7 with `@prisma/adapter-pg` takes `PrismaPg({ connectionString })` directly — the adapter owns the connection, not `schema.prisma`'s datasource `url` field. Seed scripts must construct their own `PrismaPg` instance (can't import the Next.js singleton which uses `globalThis`).
- Seed script full wipe + re-seed pattern (`deleteMany()` in FK-safe reverse order) is safe for dev/demo use and avoids unique constraint errors on re-runs.

## [2026-03-25] - Known Bugs (Fix Queue)

- **White page after sign-in** — after Clerk login completes, the app shows a blank white page instead of redirecting to `/dashboard`. Requires a manual browser refresh to land on the dashboard. Likely a Clerk redirect timing issue with Next.js App Router. **TODO: investigate and fix.**

## [2026-03-25] - Pre-deployment Checklist

- **Clerk Client Trust must be turned ON before deploying to Vercel/production.** It was disabled during local dev to allow demo account login without email verification. Configure → User & Authentication → Password → Client Trust toggle.

## [2026-03-25] - HC-005 Patterns

- Pusher toast with AI priority: move `emitTicketCreated` from `createTicket` into `analyzeTicketAsync` (fire after `prisma.ticket.update`). Use `select: { priority, status }` on the update to get the final AI priority without a second query.
- `CommandPalette` returns `null` early when closed — to keep a child dialog alive across open/close cycles, remove the early return and use `{open && (...)}` conditional rendering instead. The dialog lives outside the `{open && ...}` block.
- `@base-ui/react` Dialog controlled mode: `open` + `onOpenChange` props work the same as Radix UI.
- Next.js 16 dynamic route params must be `await`-ed: `const { id } = await params` (params is a Promise in App Router).

## [2026-03-25] - HC-004 Known Issues / Follow-ups

- `loading.tsx` skeleton is invisible in practice — Next.js App Router caches the dashboard page after first visit and skips the Suspense boundary on subsequent navigations. Fix: add `export const dynamic = 'force-dynamic'` to `dashboard/page.tsx` to force a fresh fetch on every navigation. **TODO: apply this fix.**
- Demo seed auto-assigns all tickets to the demo agent — "Assign to Me" shows as "Assigned" (disabled) when testing with the demo account. Optimistic UI works correctly; test with personal account against fresh seed data instead.
- Create ticket form does not exist yet — Pusher real-time toast cannot be tested until HC-005 builds the form.

## [2026-03-24] - HC-004 UX / Client Patterns

- `useOptimistic` (React 19) must be called at the Client Component level. The reducer receives the full tickets array + an action — return a new array with the optimistic change applied. Pass the same action type to `addOptimistic` inside `React.startTransition()` before awaiting the server action.
- Socket.io `socket.off(event, handler)` requires the exact same function reference used in `socket.on`. Wrapping the handler in an anonymous function breaks cleanup. Always capture the handler in a `const` before passing to `socket.on`, then use the same ref in `socket.off`.
- Shadcn Command component is built on `cmdk`. Set `shouldFilter={false}` when you control filtering server-side (e.g., debounced search via server action) — otherwise cmdk filters results client-side a second time and hides valid items.
- `sonner` `<Toaster />` must be in the root layout (not a dashboard layout) to survive page navigations. `richColors` automatically styles toast by type (info/success/error).
- `loading.tsx` in Next.js App Router automatically wraps the route segment in a `<Suspense>` boundary — it shows during the initial data fetch. Match the layout structure exactly (same grid columns, same card shapes) for a seamless skeleton-to-content transition.

## [2026-03-23] - Setup

- `prisma/schema.prisma` was missing `url = env("DATABASE_URL")` in the datasource block — `db:push` would silently fail without it. Fixed at project init.
- `npm run dev:socket` requires `ts-node` as a dev dependency — not installed by default. Standard `npm run dev` works for everything except real-time Socket.io features.
