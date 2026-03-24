# Learnings — Heiyo-Connect

<!-- Format: ## [YYYY-MM-DD] - Category -->
<!-- Max 50 entries. Promote stable patterns to steering docs. -->

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
