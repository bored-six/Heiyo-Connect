# PRD: HC-017 — Team Invite Flow & Management

**Ticket:** HC-017
**Status:** Complete
**Created:** 2026-03-27
**Last Updated:** 2026-03-28

## Summary

Full team invite system: owners/admins generate a copyable invite link, invitees land on a `/join/[slug]` page, and existing or new Clerk users flow through onboarding to join the workspace. Settings shows team members with role management.

## Requirements

### Original Requirements

1. **Invite link** — OWNER/ADMIN can copy a workspace invite URL from Settings
2. **Team member list** — role-coloured avatar initials, role badge, remove/change role controls
3. **Onboarding branch** — if `?join=SLUG` param present, show "Join workspace" instead of "Create workspace"
4. **`joinTenant` action** — create user with AGENT role in existing tenant

### Discovered Requirements

- Invite URL initially pointed to `/sign-up?join=SLUG` — this broke for **existing Clerk users** who can't use `/sign-up`. Replaced with `/join/[slug]` neutral landing page that handles both new and existing users.
- `/join/[slug]` must be in middleware public routes
- Existing Clerk users with no DB record need to flow to `/onboarding?join=SLUG` (not `/dashboard`)
- `?join=` param must survive through Clerk's `/sign-in` redirect to `fallbackRedirectUrl`
- Dashboard layout must handle "logged in Clerk, no DB membership" gracefully (redirect to `/onboarding` instead of crashing)

## Architecture

### Design Decisions

- **`/join/[slug]` as the universal landing page** — decouples invite flow from Clerk's auth pages. Shows "Create account" + "Sign in" for unauthenticated users (both buttons preserve `?join=`), redirects to onboarding for authenticated users with no DB record, and redirects to dashboard for existing members.
- **RBAC enforcement in actions** — `updateMemberRole` and `removeMember` are gated: OWNER can do anything, ADMIN can manage AGENT/VIEWER only, lower roles are blocked server-side.
- **`CopyInviteLink` client component** — self-contained copy button inside Settings; avoids prop-drilling the invite URL through the settings page tree.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| /join/[slug] page | Server Component | `src/app/join/[slug]/page.tsx` | Neutral invite landing for new + existing users | Complete |
| Team actions | Server Actions | `src/actions/team.ts` | getTeamMembers, updateMemberRole, removeMember | Complete |
| Onboarding action | Server Action | `src/actions/onboarding.ts` | joinTenant — creates membership with AGENT role | Complete |
| TeamMembers | Client Component | `src/components/settings/team-members.tsx` | Role-coloured avatar list with role dropdown + remove | Complete |
| CopyInviteLink | Client Component | (inline in settings page) | Copyable invite URL in dashed border card | Complete |
| Settings page | Server Component | `src/app/(dashboard)/dashboard/settings/page.tsx` | Team section + invite section (owner/admin only) | Complete |
| Middleware | Config | `src/middleware.ts` | Add /join/(.*) to public routes; preserve ?join= on auth redirects | Complete |
| Sign-in page | Server Component | `src/app/sign-in/[[...sign-in]]/page.tsx` | Pass ?join= through fallbackRedirectUrl | Complete |
| Dashboard layout | Server Component | `src/app/(dashboard)/layout.tsx` | Redirect Clerk-authed / no DB membership → /onboarding | Complete |

### Business Rules

- OWNER role can manage all members including other admins
- ADMIN role can manage AGENT and VIEWER members only
- AGENT and VIEWER cannot access team management UI
- `removeMember` deletes the `TenantMembership` row — the `User` record is preserved
- Invite link is always `{origin}/join/{tenant.slug}` — no time-limited tokens (by design for HC-017 scope)
- `/join/[slug]` shows a 404-style message for invalid slugs

## Testing

Manual verification:
- [ ] OWNER copies invite link from Settings
- [ ] New user visits `/join/slug` → sees "Create account" button → signs up → lands on "Join workspace" onboarding branch → joins
- [ ] Existing Clerk user visits `/join/slug` → sees "Sign in" button → signs in → redirected to `/onboarding?join=slug` → joins
- [ ] Already-member visits `/join/slug` → redirected to `/dashboard`
- [ ] OWNER can change member roles and remove members
- [ ] AGENT cannot see team management controls

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-27 | Initial implementation: team management + onboarding branch | HC-017 |
| 2026-03-27 | Fix: /sign-up invite URL broken for existing Clerk users | Replaced with /join/[slug] neutral landing |
| 2026-03-28 | Fix: existing Clerk users with no DB record crash on dashboard load | Dashboard layout now redirects to /onboarding |
