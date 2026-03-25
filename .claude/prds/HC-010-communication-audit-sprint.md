# PRD: HC-010 — Communication & Audit Sprint

**Ticket:** HC-010
**Status:** In Progress
**Created:** 2026-03-26
**Last Updated:** 2026-03-26

## Summary

Makes the ticket support thread interactive and auditable. Agents can reply directly in the ticket detail page, see AI suggestions pre-populated into a textarea for editing, and every state transition is recorded as a SYSTEM message in the chronological thread.

## Requirements

### Original Requirements
- ReplyBox at the bottom of the ticket detail thread (plain text)
- "Insert AI Suggestion" button replaces textarea content with `aiSuggestedResponse`
- Agent must be able to edit the suggestion before sending
- SYSTEM messages for: ticket created, AI analysis complete, status changed, assignee changed
- SYSTEM messages stored in the existing `Message` table with `senderRole: SYSTEM`
- `sendReply` server action: saves message as AGENT, auto-flips OPEN → IN_PROGRESS, creates SYSTEM audit log
- `useOptimistic` — agent message appears instantly, removed on failure with `toast.error`
- SYSTEM messages rendered as centered muted text (no bubble/card)
- USER vs AGENT messages visually distinct (alignment + background)
- `tenantId` security boundary enforced on all queries

### Discovered Requirements
<!-- Filled in during implementation -->

## Architecture

### Design Decisions
- `SenderRole` enum (USER | AGENT | SYSTEM) added to `Message` model — replaces boolean `isFromAgent` for new code, `isFromAgent` kept for backward compatibility
- `page.tsx` stays Server Component; `ReplySection` is a Client Component that owns `useOptimistic` + textarea state
- SYSTEM messages stored in same `Message` table (no separate table) — simplifies chronological ordering and `useOptimistic` array management
- Auto-status update (OPEN → IN_PROGRESS) fires inside `sendReply` action, not a separate action call
- Pusher `message:new` event emitted after successful DB write — fire-and-forget pattern consistent with existing code

### Architecture Diagram
```
page.tsx (Server Component)
  └── fetches ticket via getTicketById()
  └── renders <ReplySection messages={...} ticketId={...} aiSuggestedResponse={...} />

ReplySection (Client Component)
  ├── useOptimistic(messages) — instant message rendering
  ├── message thread (USER | AGENT | SYSTEM styled differently)
  └── ReplyBox
      ├── Textarea (plain text)
      ├── "Insert AI Suggestion" button → replaces textarea content
      └── Send button → calls sendReply() action
```

## Implementation

### Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| SenderRole enum | Schema | prisma/schema.prisma | USER/AGENT/SYSTEM role on messages | Complete |
| sendReply | Server Action | src/actions/messages.ts | Send agent reply + status update + audit log | Complete |
| emitNewMessage | Pusher emitter | src/lib/pusher-server.ts | Broadcast message:new to ticket channel | Complete |
| ReplySection | Client Component | src/components/tickets/reply-section.tsx | Thread + ReplyBox + useOptimistic | Complete |
| TicketDetailPage | Server Component | src/app/(dashboard)/dashboard/tickets/[id]/page.tsx | Data fetch + ReplySection render | Complete |

### Data Model

**New enum:**
```prisma
enum SenderRole {
  USER    // Customer message
  AGENT   // Agent reply
  SYSTEM  // Audit/system event
}
```

**Updated Message model:**
- Added `senderRole SenderRole @default(USER)`
- Kept `isFromAgent Boolean` for backward compat

### Key Methods

```typescript
// Server Action
sendReply({ ticketId, body }) → ActionResult<{ messageId }>
  - Creates Message(senderRole: AGENT)
  - If ticket.status === OPEN: updates → IN_PROGRESS + creates SYSTEM message
  - Emits Pusher message:new
  - revalidatePath

// Pusher
emitNewMessage(ticketId, payload) → void
  - Triggers ticket-{ticketId} channel, message:new event
```

### Business Rules
- Only agents of the ticket's tenant can send replies
- Auto-status update (OPEN → IN_PROGRESS) only fires on first reply (when status is still OPEN)
- Every status change generates a SYSTEM message for audit trail
- `aiSuggestedResponse` button replaces (not appends) textarea content
- On send failure: toast.error fires, optimistic message removed, textarea text restored

## Testing
- Manual: Open ticket → Insert AI Suggestion → edit → Send → verify instant thread update + status change
- Verify SYSTEM message appears after first reply
- Verify second reply does NOT flip status again

## Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Created PRD | HC-010 sprint start |
