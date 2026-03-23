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

## [2026-03-23] - Setup

- `prisma/schema.prisma` was missing `url = env("DATABASE_URL")` in the datasource block — `db:push` would silently fail without it. Fixed at project init.
- `npm run dev:socket` requires `ts-node` as a dev dependency — not installed by default. Standard `npm run dev` works for everything except real-time Socket.io features.
