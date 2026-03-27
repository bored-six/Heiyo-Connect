# PRD: HC-015 — Brand Identity (Favicon, Logo, SVG Empty States)

**Ticket:** HC-015
**Status:** Complete
**Created:** 2026-03-26
**Last Updated:** 2026-03-28

## Summary

Replace generic Lucide icons with custom SVG assets: an animated HC favicon, a geometric H wordmark in the nav, and bespoke SVG illustrations for the two empty state variants.

## Requirements

### Original Requirements

1. **Animated favicon** — `icon.svg` with HC lettermark and a 3s ease-in-out glow pulse animation
2. **Nav logo** — replace `SparklesIcon + "Heiyo Connect"` with geometric H SVG mark + "Heiyo" wordmark
3. **Empty state SVGs** — replace `InboxIcon` placeholders with proper illustrations for both the filtered and main empty states

### Discovered Requirements

- Next.js 16 automatically picks up `src/app/icon.svg` as the favicon — no `<link>` tag needed in layout
- Both empty state variants are in the same file (`src/components/tickets/empty-state.tsx`) — filtered state gets inbox + magnifying glass, main gets inbox + document illustration
- All SVG colours use Arctic Frost palette: Indigo `#6366F1`, Slate greys

## Architecture

### Design Decisions

- **SVG favicon with animation** — using `<animate>` element for the glow pulse; works in modern browsers without JS. Next.js 16 serves `app/icon.svg` as `/favicon.svg` automatically.
- **Inline SVG in JSX** — geometric H mark and empty state illustrations are inline SVG, not `<img>` tags, so they scale perfectly and inherit theme colours.
- **Wordmark shortened to "Heiyo"** — "Heiyo Connect" was too long for the nav bar at smaller widths.

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Favicon | SVG | `src/app/icon.svg` | Animated HC lettermark favicon | Complete |
| Dashboard Layout | Server Component | `src/app/(dashboard)/layout.tsx` | Geometric H + "Heiyo" wordmark in nav | Complete |
| TicketEmptyState | Client Component | `src/components/tickets/empty-state.tsx` | Custom SVG for filtered + main empty states | Complete |

## Testing

Manual verification:
- [ ] Browser tab shows animated HC favicon
- [ ] Nav bar shows geometric H mark + "Heiyo" wordmark (not Lucide SparklesIcon)
- [ ] Main empty state (no tickets at all) shows inbox + document illustration
- [ ] Filtered empty state shows inbox + magnifying glass illustration

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Complete implementation | HC-015 |
