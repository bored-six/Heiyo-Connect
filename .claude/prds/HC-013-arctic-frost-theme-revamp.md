# PRD: HC-013 — Arctic Frost Theme Revamp

**Ticket:** HC-013
**Status:** Complete
**Created:** 2026-03-26
**Last Updated:** 2026-03-26

## Summary

Move the entire app from the "Midnight" forced-dark theme to a professional light-pastel "Arctic Frost" aesthetic. The transition from Landing → Auth (Clerk) → Dashboard should be visually seamless — white backgrounds, Indigo-500 accents, and Slate-200 borders everywhere.

## Requirements

### Original Requirements

1. **Global CSS Variables** — update `:root` to Arctic Frost tokens; remove dark mode forcing
2. **Dashboard Nav** — replace dark inline styles with Slate-50/Indigo palette
3. **Charts** — update `reports-charts.tsx` to Indigo + Sky Blue + Soft Teal; remove `MidnightTooltip`
4. **Clerk Auth Fix** — `ClerkProvider` with `baseTheme: undefined` + light `variables`
5. **Landing Page** — full light overhaul; replace glow blobs with pale-blue radial gradients; text from white → Deep Slate

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F8FAFC` (Slate-50) | Page backgrounds |
| Surface/Card | `#FFFFFF` | Cards, modals |
| Primary | `#6366F1` (Indigo-500) | Buttons, accents |
| Ghost bg | `#EEF2FF` (Indigo-50) | Badges, CTA strip |
| Border | `#E2E8F0` (Slate-200) | All borders |
| Text/Header | `#1E293B` (Deep Slate) | Headings |
| Text/Body | `#64748B` (Slate-500) | Body copy, labels |
| Text/Muted | `#94A3B8` (Slate-400) | Placeholders, captions |

## Architecture

### Design Decisions

- **Single toggle: remove `dark` class from `<html>`** — This was the root cause. The app had `className="... dark"` on the html element which triggered all Shadcn dark mode overrides. Removing it + updating `:root` vars was sufficient for all Shadcn components.
- **Landing page uses light inline hex** — Prior to HC-013, HC-007 established "always use inline styles for fixed-dark landing." HC-013 updates that pattern: landing page now uses inline hex for the Arctic Frost light palette.
- **ClerkProvider `baseTheme: undefined`** — Forces Clerk to render in light mode regardless of OS preference. `variables.colorPrimary` + `variables.colorBackground` align the Clerk modal to the app palette.
- **Chart tooltip was already theme-aware** — `MidnightTooltip` used CSS variable classes (`bg-card`, `border-border`) so it automatically flipped to light once `:root` vars were updated. Renamed to `ChartTooltip` for clarity.

## Implementation

### Component Inventory

| Component | Type | Path | Change |
|-----------|------|------|--------|
| CSS Variables | CSS | `src/app/globals.css` | Full :root rewrite — Midnight → Arctic Frost |
| Root Layout | Server Component | `src/app/layout.tsx` | Remove `dark` class; add ClerkProvider appearance |
| Dashboard Layout | Server Component | `src/app/(dashboard)/layout.tsx` | Dark inline styles → Arctic Frost |
| Reports Charts | Client Component | `src/components/dashboard/reports-charts.tsx` | MidnightTooltip → ChartTooltip; Resolved = Sky Blue; Manual = Soft Teal |
| Landing Page | Server Component | `src/app/page.tsx` | Full rewrite — all dark hex → Arctic Frost light palette |

### CSS Variable Mapping (Before → After)

| Variable | Before (Midnight) | After (Arctic Frost) |
|----------|-------------------|----------------------|
| `--background` | `oklch(0.072...)` `#09090F` | `oklch(0.984...)` `#F8FAFC` |
| `--card` | `oklch(0.11...)` dark | `oklch(1 0 0)` `#FFFFFF` |
| `--foreground` | `oklch(0.965...)` light on dark | `oklch(0.19...)` `#1E293B` |
| `--border` | `oklch(1 0 0 / 8%)` barely visible | `oklch(0.882...)` `#E2E8F0` |
| `--muted-foreground` | `oklch(0.625...)` `#94A3B8` | `oklch(0.554...)` `#64748B` |
| `--chart-2` | `oklch(0.6 0.18 230)` | `oklch(0.622 0.182 234)` Sky Blue |
| `--chart-3` | `oklch(0.75 0.16 85)` | `oklch(0.69 0.135 179)` Soft Teal |
| `--sidebar` | dark | matches `--background` |

### Chart Palette

| Series | Color | Hex |
|--------|-------|-----|
| Created / AI Success | Indigo | `#6366F1` |
| Resolved | Sky Blue | `#0EA5E9` |
| Manual | Soft Teal | `#14B8A6` |
| CRITICAL priority | Red | `#EF4444` |
| HIGH priority | Orange | `#F97316` |
| MEDIUM priority | Yellow | `#EAB308` |
| LOW priority | Slate | `#64748B` |

## Testing

Manual verification:
- [ ] Landing page renders Slate-50 background, `#1E293B` text, no dark sections
- [ ] Dashboard nav: white/slate bg, `#E2E8F0` bottom border, Indigo sparkles icon
- [ ] Clerk sign-in modal: white background, Indigo primary button
- [ ] Reports page: area chart — Indigo + Sky Blue lines; bar chart — Indigo + Teal bars
- [ ] Stat cards: white `bg-card` with Slate-200 borders
- [ ] Transition Landing → Sign-in → Dashboard: seamless (no dark flash)

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Complete implementation | HC-013 |
