# Learnings — Heiyo-Connect

<!-- Format: ## [YYYY-MM-DD] - Category -->
<!-- Max 50 entries. Promote stable patterns to steering docs. -->

## [2026-03-23] - Setup

- `prisma/schema.prisma` was missing `url = env("DATABASE_URL")` in the datasource block — `db:push` would silently fail without it. Fixed at project init.
- `npm run dev:socket` requires `ts-node` as a dev dependency — not installed by default. Standard `npm run dev` works for everything except real-time Socket.io features.
