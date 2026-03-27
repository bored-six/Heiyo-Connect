# PRD: HC-016 — Fix White Page After Sign-In

**Ticket:** HC-016
**Status:** Complete
**Created:** 2026-03-27
**Last Updated:** 2026-03-28

## Summary

Fix the blank white page shown after Clerk login completes. Root cause: client-side navigation after auth + redirect loop between `/dashboard` → `/onboarding` → `/dashboard` when Clerk auth state wasn't yet propagated.

## Requirements

### Original Requirements

- After Clerk login, user lands on `/dashboard` immediately — no blank page, no manual refresh required

### Discovered Requirements

- Two distinct bugs:
  1. `<SignIn>` missing `fallbackRedirectUrl="/dashboard"` — Clerk was doing a client-side navigation which didn't trigger Next.js middleware re-evaluation
  2. Middleware was redirecting authenticated users from `/sign-in`/`/sign-up` to `/onboarding` but the dashboard layout was then redirecting back — creating a loop that resulted in a blank white page

## Architecture

### Root Cause Analysis

**Bug 1:** `<SignIn>` without `fallbackRedirectUrl` → Clerk completes auth and does a client-side push to the last visited URL. If that URL is `/dashboard`, the Next.js server never re-runs middleware with the new auth state, so the page renders without the user session, appearing blank.

**Fix:** Pass `fallbackRedirectUrl="/dashboard"` to `<SignIn>`. This forces a hard redirect (full HTTP request) which causes middleware to re-evaluate with the fresh Clerk session cookie.

**Bug 2:** Middleware was redirecting authenticated users away from `/sign-in`/`/sign-up` without checking if the `?join=` param was present. When both `/dashboard` layout and middleware both redirected to `/onboarding`, the browser looped.

**Fix:** Middleware reads `?join=` and forwards it to `/onboarding?join=SLUG` when redirecting authenticated users away from auth pages.

## Implementation

### Component Inventory

| Component | Type | Path | Change | Status |
|-----------|------|------|--------|--------|
| Sign-in page | Server Component | `src/app/sign-in/[[...sign-in]]/page.tsx` | Add `fallbackRedirectUrl="/dashboard"` | Complete |
| Middleware | Config | `src/middleware.ts` | Redirect auth'd users from /sign-in /sign-up with join param preservation | Complete |

## Business Rules

- Authenticated users visiting `/sign-in` or `/sign-up` are redirected to `/dashboard` (or `/onboarding?join=SLUG` if `?join=` param present)
- Hard redirect (not client-side navigation) is used after auth to ensure middleware re-runs

## Testing

Manual verification:
- [ ] Sign in with valid credentials → lands on `/dashboard` immediately (no blank page)
- [ ] Visiting `/sign-in` while authenticated → redirected to `/dashboard`
- [ ] Visiting `/sign-in?join=slug` while authenticated → redirected to `/onboarding?join=slug`

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-27 | Fix implemented | HC-016 — white page bug logged in learnings.md HC-025 |
