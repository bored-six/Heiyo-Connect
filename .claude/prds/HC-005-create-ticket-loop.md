# PRD: HC-005 — Closing the Full Loop

**Ticket:** HC-005
**Status:** In Progress
**Created:** 2026-03-25

## Summary
Connect the Create Ticket UI to the AI Gateway and Pusher notifications. Agents can create tickets from a dialog, watch them appear in the table with AI-calculated priority, see the Pusher toast pop up after AI analysis, and see the AI usage bar move.

## Requirements

### Original Requirements
1. `CreateTicketDialog` — Shadcn Dialog with customerEmail, customerName, subject, description fields. Wired to "New Ticket" in CommandPalette and Dashboard CTA.
2. Server action hookup — `createTicket` calls `analyzeTicketWithProvider`. AI priority/summary/suggestedResponse saved to ticket. `emitTicketCreated` (Pusher) fires AFTER AI analysis so toast contains AI-assigned priority.
3. Usage tracking — `dailyAiUsage` increments on Tenant only on successful AI analysis (already implemented in ai-gateway.ts).
4. Ticket Detail view — route at `/dashboard/tickets/[id]`. Shows AI Suggested Response prominently with "Copy to Reply" button.

## Architecture

### Design Decisions
- Pusher emit moved from `createTicket()` to inside `analyzeTicketAsync()` — fires after AI saves result so toast shows AI priority (2-5s delay is acceptable)
- `CreateTicketDialog` is a controlled component with `open`/`onOpenChange` — instantiated separately in `CommandPalette` and `CreateTicketButton`
- `TicketTable` gains `tenantId` prop + `useTicketSocket` + `router.refresh()` on `onTicketCreated` for live table update
- Ticket detail is a Server Component route (not a Sheet) — cleaner, bookmarkable
- Copy button is a small Client Component (needs browser clipboard API)

## Implementation

### Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| CreateTicketDialog | Client | src/components/dashboard/create-ticket-dialog.tsx | Dialog form for new tickets | Complete |
| CreateTicketButton | Client | src/components/dashboard/create-ticket-button.tsx | CTA button that opens dialog | Complete |
| CopyButton | Client | src/components/tickets/copy-button.tsx | Clipboard copy for AI response | Complete |
| Ticket Detail Page | Server | src/app/(dashboard)/dashboard/tickets/[id]/page.tsx | Full ticket view with AI response | Complete |

### Modified Files
| File | Change |
|------|--------|
| src/actions/tickets.ts | Move emitTicketCreated to analyzeTicketAsync |
| src/app/(dashboard)/dashboard/page.tsx | Use CreateTicketButton + pass tenantId to TicketTable |
| src/components/dashboard/command-palette.tsx | Open CreateTicketDialog from "New Ticket" action |
| src/components/dashboard/ticket-table.tsx | Add tenantId prop + useTicketSocket + router.refresh() |

## Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial implementation | HC-005 |
