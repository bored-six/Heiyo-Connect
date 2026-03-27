# PRD: HC-023 — Join Request Flow with Owner Approval

**Ticket:** HC-023
**Status:** Complete
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Summary

Replace auto-join on invite link with a pending request flow. Users visiting a workspace invite link submit a join request; owners and admins review, assign a role, and approve or deny from Settings > Join Requests tab.

## Requirements

### Original Requirements

1. **`JoinRequest` model** — pending request with `userId`, `tenantId`, `status` (PENDING/APPROVED/DENIED), and `message`
2. **Join request actions** — create, list (for owner/admin), approve (with role assignment), deny
3. **`/join/[slug]` update** — show `JoinRequestForm` instead of auto-calling `joinTenant`
4. **Settings > Join Requests tab** — list pending requests with approve (role picker) / deny inline

### Discovered Requirements

- `onboarding.ts` `joinTenant` needed to be guarded so it cannot be called directly after HC-023 — `/join/[slug]` must go through `JoinRequest` instead
- Approving a request calls `joinTenant` server-side (same action, different caller)

## Architecture

### Design Decisions

- **Pending state, not auto-join** — reduces spam/abuse on shared invite links. Owner always retains control over who enters the workspace.
- **Role picker at approval time** — owner/admin assigns the role when approving (not at invite time). Allows assigning higher roles to trusted invitees.
- **`JoinRequestForm` client component** — self-contained form that POSTs to `createJoinRequest` action. Shows success state after submission ("Request sent — wait for owner approval").
- **Approval calls `joinTenant`** — reuses the same membership creation logic; no duplication.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Schema | Prisma | `prisma/schema.prisma` | Add JoinRequest model | Complete |
| join-requests action | Server Actions | `src/actions/join-requests.ts` | createJoinRequest, listJoinRequests, approveJoinRequest, denyJoinRequest | Complete |
| onboarding action | Server Action | `src/actions/onboarding.ts` | Guard joinTenant; used internally by approveJoinRequest | Complete |
| /join/[slug] page | Server Component | `src/app/join/[slug]/page.tsx` | Show JoinRequestForm for authenticated users | Complete |
| JoinRequestForm | Client Component | `src/components/join/join-request-form.tsx` | Form: optional message + submit; success state | Complete |

### Schema Addition

```prisma
model JoinRequest {
  id        String            @id @default(cuid())
  userId    String
  tenantId  String
  status    JoinRequestStatus @default(PENDING)
  message   String?
  createdAt DateTime          @default(now())
  user      User              @relation(fields: [userId], references: [id])
  tenant    Tenant            @relation(fields: [tenantId], references: [id])
  @@unique([userId, tenantId])
}

enum JoinRequestStatus { PENDING APPROVED DENIED }
```

### Business Rules

- A user can only have one pending request per tenant (unique constraint)
- Only OWNER and ADMIN roles can list, approve, or deny requests
- Denying a request does not prevent re-request (status is set to DENIED, not a permanent block)
- Approving a request creates a `TenantMembership` with the selected role, then marks the request APPROVED
- `/join/[slug]` shows the form for authenticated users with no existing membership and no pending request; shows "request pending" state if they already submitted

## Testing

Manual verification:
- [ ] Authenticated user visiting `/join/slug` sees JoinRequestForm
- [ ] Submitting form creates a PENDING JoinRequest in DB
- [ ] OWNER sees pending requests in Settings > Join Requests tab
- [ ] Approving with role picker creates TenantMembership + marks request APPROVED
- [ ] Denying marks request DENIED
- [ ] Approved user can now access the workspace

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | Complete implementation | HC-023 |
