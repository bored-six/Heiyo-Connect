# PRD: HC-024 — Settings Tabs & Notification Bell

**Ticket:** HC-024
**Status:** Complete
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Summary

Two coordinated features: (1) overhaul the Settings page into a tab-based layout with Members, Join Requests, Permissions, AI Provider, and Account tabs; (2) add a notification bell to the navbar for owners/admins showing pending join request count with inline approve/deny.

## Requirements

### Original Requirements

1. **Settings tabs** — Members, Join Requests, Permissions, AI Provider, Account
2. **Join Requests tab** — list pending requests with role picker + approve/deny inline
3. **Permissions tab** — read-only role matrix (what each role can do)
4. **Account tab** — profile info + sign out button
5. **Notification bell** — red badge with pending count; opens dropdown with approve/deny; links to Settings > Join Requests for full view

### Discovered Requirements

- Account tab needed sign-out — Clerk's `<SignOutButton>` needs `'use client'`; extracted to `account-tab.tsx`
- Bell should only render for OWNER and ADMIN — AGENT/VIEWER do not manage requests

## Architecture

### Design Decisions

- **`SettingsTabs` client component** — wraps all tabs in a single client component using `useState` for active tab. Each tab's content is a separate file to keep the settings page manageable.
- **`NavNotificationBell` client component** — fetches pending count via server action on mount + after any approve/deny. Bell is rendered in the dashboard layout, hidden for AGENT/VIEWER via role check server-side.
- **Inline approve/deny in bell dropdown** — for speed; links to full Settings > Join Requests tab for bulk management.
- **Permissions tab is static** — the role matrix is hardcoded as a table (not DB-driven). Role permissions are enforced in server actions; the table is documentation for users.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Settings page | Server Component | `src/app/(dashboard)/dashboard/settings/page.tsx` | Tab layout + data fetching | Complete |
| SettingsTabs | Client Component | `src/components/settings/settings-tabs.tsx` | Tab switcher (useState) | Complete |
| JoinRequestsTab | Client Component | `src/components/settings/join-requests-tab.tsx` | Pending requests with role picker + approve/deny | Complete |
| PermissionsTab | Client Component | `src/components/settings/permissions-tab.tsx` | Static role matrix table | Complete |
| AccountTab | Client Component | `src/components/settings/account-tab.tsx` | Profile info + Clerk SignOutButton | Complete |
| NavNotificationBell | Client Component | `src/components/dashboard/nav-notification-bell.tsx` | Bell icon + badge + dropdown | Complete |
| Dashboard layout | Server Component | `src/app/(dashboard)/layout.tsx` | Render NavNotificationBell for OWNER/ADMIN only | Complete |

### Business Rules

- Notification bell only shown to users with OWNER or ADMIN role
- Bell badge count = number of PENDING JoinRequests for the active tenant
- Approving from the bell dropdown uses the same `approveJoinRequest` action as the Settings tab
- Permissions tab shows: OWNER (all), ADMIN (all except delete tenant), AGENT (tickets + customers), VIEWER (read-only)
- Account tab sign-out is a Clerk sign-out (clears session) — user is redirected to landing page

## Testing

Manual verification:
- [ ] Settings page loads with 5 tabs
- [ ] Join Requests tab shows pending requests with role picker
- [ ] Approving/denying from Join Requests tab works and updates list
- [ ] Permissions tab shows correct role matrix
- [ ] Account tab shows profile info + sign out button
- [ ] Bell icon appears in nav for OWNER/ADMIN
- [ ] Bell badge shows correct pending count
- [ ] Bell dropdown shows pending requests with inline approve/deny
- [ ] Bell is hidden for AGENT and VIEWER

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | Settings tab overhaul | HC-024 |
| 2026-03-28 | Notification bell added | HC-024 follow-up |
