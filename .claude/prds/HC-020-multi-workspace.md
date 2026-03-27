# PRD: HC-020 — Multi-Workspace Support (TenantMembership)

**Ticket:** HC-020
**Status:** Complete
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Summary

Decouple users from a single tenant by introducing a `TenantMembership` join table. A single Clerk user can belong to multiple workspaces and switch between them via the nav. `requireUser()` resolves the active workspace from a cookie.

## Requirements

### Original Requirements

1. **`TenantMembership` join table** — `(userId, tenantId, role)` replaces `User.tenantId` and `User.role`
2. **`requireUser()` updated** — reads `hw_workspace` cookie to resolve active workspace; returns same shape (`tenantId`, `tenant`, `role`) so existing actions/pages have zero blast radius
3. **WorkspaceSwitcher** — nav dropdown to switch between user's workspaces
4. **Onboarding update** — workspace picker when user has existing memberships; create/join actions write to `TenantMembership`
5. **Page titles** — add `<title>` meta to key pages
6. **Tickets list page** — full-screen bulk ticket management at `/dashboard/tickets`

### Discovered Requirements

- `src/app/api/ai/analyze/route.ts` accessed `User.tenantId` directly — had to be updated to resolve via `TenantMembership`
- One-time `backfill-memberships.ts` script needed to migrate existing users → deleted after use
- `prisma/seed.ts` referenced removed `User.role` field — deleted (stale)
- `joinTenant` in `onboarding.ts` needed to accept full invite URL OR bare slug (users copy-paste the full URL)

## Architecture

### Design Decisions

- **`hw_workspace` cookie for active workspace** — avoids a DB query on every request just to discover the active workspace. Cookie is set by `setActiveWorkspace()` server action. Falls back to user's first membership if cookie is absent or stale.
- **`requireUser()` shape unchanged** — returns `{ user, tenantId, tenant, role }` exactly as before. All 50+ call sites continue to work without changes.
- **`WorkspaceSwitcher` in nav** — server-fetches memberships, client component handles the switch (calls `setActiveWorkspace` + `router.refresh()`).
- **Workspace picker in onboarding** — `WorkspaceChoice` client component shown when user already has memberships on login; routes to create/join/select flows.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Schema | Prisma | `prisma/schema.prisma` | Add TenantMembership; remove User.tenantId/role | Complete |
| tenant.ts | Lib | `src/lib/tenant.ts` | requireUser() reads hw_workspace cookie | Complete |
| workspace action | Server Action | `src/actions/workspace.ts` | setActiveWorkspace() — sets hw_workspace cookie | Complete |
| onboarding action | Server Action | `src/actions/onboarding.ts` | create/join write TenantMembership; accept URL or slug | Complete |
| team action | Server Actions | `src/actions/team.ts` | updateMemberRole/removeMember on TenantMembership | Complete |
| WorkspaceSwitcher | Client Component | `src/components/dashboard/workspace-switcher.tsx` | Nav dropdown to switch workspaces | Complete |
| WorkspaceChoice | Client Component | `src/components/onboarding/workspace-choice.tsx` | Picker shown in onboarding for existing members | Complete |
| Dashboard layout | Server Component | `src/app/(dashboard)/layout.tsx` | Fetch memberships, render WorkspaceSwitcher, redirect if no membership | Complete |
| Onboarding page | Server Component | `src/app/onboarding/page.tsx` | Branch: existing memberships → WorkspaceChoice | Complete |
| AI analyze route | Route Handler | `src/app/api/ai/analyze/route.ts` | Resolve tenantId via TenantMembership | Complete |

### Schema Change

```prisma
model TenantMembership {
  id       String   @id @default(cuid())
  userId   String
  tenantId String
  role     Role     @default(AGENT)
  user     User     @relation(fields: [userId], references: [id])
  tenant   Tenant   @relation(fields: [tenantId], references: [id])
  @@unique([userId, tenantId])
}
```

`User.tenantId` and `User.role` removed.

### Business Rules

- A user can be a member of multiple workspaces with different roles in each
- Active workspace is determined by `hw_workspace` cookie (cuid of tenantId)
- If cookie is absent/invalid, first membership alphabetically is used
- `removeMember` deletes the `TenantMembership` row — the `User` record is preserved
- `joinTenant` accepts both `https://app.domain/join/slug` and bare `slug`

## Testing

Manual verification:
- [ ] Existing user (migrated via backfill) can log in and land on dashboard
- [ ] WorkspaceSwitcher appears in nav when user has > 1 workspace
- [ ] Switching workspace changes tenantId in `requireUser()` for subsequent requests
- [ ] Creating a new workspace from onboarding creates TenantMembership
- [ ] Joining a workspace via invite link creates TenantMembership with AGENT role

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | Complete implementation + schema migration | HC-020 |
| 2026-03-28 | Fix TypeScript errors in AI analyze route | HC-020 follow-up — User.tenantId removed |
| 2026-03-28 | Delete backfill script + stale seed.ts | One-time migration complete |
