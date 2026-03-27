# PRD: HC-025 — Profile Page

**Ticket:** HC-025
**Status:** Complete
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Summary

Adds a `/dashboard/profile` page where users can view their profile and edit their display name and avatar. The nav's logout button is replaced with an avatar/dropdown that links to the profile page and provides sign-out.

## Requirements

### Original Requirements
- View profile (name, email, role, workspace)
- Set display name
- Set avatar

### Design Decisions
- **Avatar as URL input** — no file upload infrastructure exists; URL input with live preview and initials fallback is the right pattern for now.
- **Display name saved to DB** — `User.name` field already exists and is nullable; no migration needed.
- **Nav dropdown** — logout button replaced with avatar dropdown containing "My Profile" link and "Sign out". Keeps the nav clean and adds discoverability.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| `profile.ts` | Server Action | `src/actions/profile.ts` | Update user name + avatarUrl in DB | Complete |
| `ProfileForm` | Client Component | `src/components/profile/profile-form.tsx` | Edit form with live avatar preview | Complete |
| `profile/page.tsx` | Server Page | `src/app/(dashboard)/dashboard/profile/page.tsx` | Profile route | Complete |
| `NavProfileButton` | Client Component | `src/components/dashboard/nav-profile-button.tsx` | Avatar dropdown in nav | Complete |

### Business Rules
- Only authenticated user can update their own profile (enforced via `requireUser()`)
- `avatarUrl` must be a valid URL or empty string; empty clears the field
- Empty `name` saves as `null` (falls back to initials display)
- `revalidatePath` called for both `/dashboard/profile` and the layout to keep nav avatar in sync

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | Initial implementation | HC-025 |
| 2026-03-28 | Updated CLAUDE.md GATE 1 | User asked to remove mandatory question-asking in favour of autonomous inference |
