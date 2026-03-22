# Learnings — Heiyo-Connect

<!-- Format: ## [YYYY-MM-DD] - Category -->
<!-- Max 50 entries. Promote stable patterns to steering docs. -->

## [2026-03-23] - Workflow

- Claude repeatedly skips ask-first gate, post-task commit, learnings/PRD/steering updates. Hard gates added to top of CLAUDE.md to force compliance — buried rules are ignored.
- `onboarding.ts` is a valid exception to the `requireUser()` rule — `requireUser()` throws "User not found" for pre-tenant users. `auth()` + `currentUser()` must be called directly in onboarding actions.
- Onboarding action uses `(prev, formData)` form-state signature (not standard `ActionResult<T>`) because it's designed for `useActionState`. This is intentional.

## [2026-03-23] - Setup

- `prisma/schema.prisma` was missing `url = env("DATABASE_URL")` in the datasource block — `db:push` would silently fail without it. Fixed at project init.
- `npm run dev:socket` requires `ts-node` as a dev dependency — not installed by default. Standard `npm run dev` works for everything except real-time Socket.io features.
