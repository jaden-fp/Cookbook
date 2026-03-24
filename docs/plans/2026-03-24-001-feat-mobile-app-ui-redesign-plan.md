---
title: Mobile App UI Redesign — Bottom Nav, Bottom Sheets, App-Feel
type: feat
status: active
date: 2026-03-24
---

# Mobile App UI Redesign

## Overview

Transform the recipe app's mobile experience from a responsive website into something that feels like a native iOS app — bottom tab navigation, bottom sheets replacing centered modals, a floating action button for primary actions, and touch-friendly interaction patterns throughout. Desktop experience stays entirely unchanged.

The app already has a strong visual identity (warm pink, clean typography, solid design tokens). This plan layers native mobile UX conventions on top of that existing aesthetic.

---

## Problem Statement

On mobile the app currently:
- Has a 72px sticky top nav that eats vertical space and has a logo that bleeds into page content
- Uses hover-only button visibility (`sm:opacity-0 sm:group-hover:opacity-100`) — invisible on touch devices
- Shows centered floating modals that feel wrong on mobile (obscure context, hard to dismiss)
- Has no FAB or easy one-tap path to the primary action (import recipe / add pantry item)
- Has interactive states driven entirely by `onMouseEnter`/`onMouseLeave` which don't fire on touch

---

## Design Direction

Think: **Whisk meets Linear mobile** — warm and food-forward aesthetic, but with the crisp navigation and sheet-based interactions of a modern productivity app.

### Core Principles
1. **Thumb zone first** — all primary actions live in the bottom 40% of the screen
2. **Sheets not modals** — everything that pops up slides from the bottom
3. **Desktop untouched** — every change is wrapped in `sm:hidden` / `hidden sm:block`
4. **Existing tokens preserved** — colors, typography, radii all stay the same

---

## Proposed Solution

### 1. Bottom Tab Bar (`BottomNav.tsx`)

Replace top nav on mobile with a fixed bottom tab bar showing three tabs: **Cookbooks**, **Recipes**, **Pantry**.

```
[ 📚 Cookbooks ]  [ 🍳 Recipes ]  [ 🥄 Pantry ]
```

- Fixed at `bottom: 0`, full width, `z-50`
- Height: `56px` + `env(safe-area-inset-bottom)` for iPhone notch
- Background: `var(--surface)` with top border
- Active tab: accent pink, bold label + filled icon
- Inactive tabs: `var(--text-muted)`, light icon
- Subtle top shadow to lift off content
- All pages get `pb-20 sm:pb-16` to clear the bar

Top `<NavBar>` becomes `hidden sm:flex` (desktop only).

**File:** `frontend/src/components/BottomNav.tsx`

---

### 2. Bottom Sheet Component (`BottomSheet.tsx`)

A reusable primitive that replaces centered modals on mobile. On desktop it renders as the existing centered modal.

**Anatomy:**
```
┌──────────────────────────────┐  ← backdrop (full screen)
│                              │
│                              │
│  ╭──────────────────────╮    │
│  │  ▬▬▬  drag handle   │    │  ← top-rounded corners only
│  │  Title          [X]  │    │
│  ├──────────────────────┤    │
│  │  content             │    │
│  │                      │    │
│  ╰──────────────────────╯    │
└──────────────────────────────┘
```

**Animation:**
- Mobile: `translateY(100%) → translateY(0)` slide-up (300ms ease-out)
- Desktop: existing `scale(0.95) → scale(1)` from center

**Props:**
```tsx
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapHeight?: 'auto' | 'half' | 'full'; // default: auto
}
```

**Styling:**
- Mobile: `position: fixed; bottom: 0; left: 0; right: 0;` with `border-top-left-radius: 20px; border-top-right-radius: 20px`
- Desktop: centered, `max-width: 28rem`, all corners rounded

**File:** `frontend/src/components/BottomSheet.tsx`

---

### 3. Floating Action Button (`FAB`)

A context-aware pink `+` button pinned above the bottom nav, triggering the primary action for the current page.

| Page | FAB Action |
|---|---|
| Cookbooks | Opens "New Cookbook" bottom sheet |
| Recipes | Opens "Import Recipe" bottom sheet (ImportBar inside) |
| Pantry | Opens "Add Ingredient" bottom sheet |
| CookbookDetail | Opens "Add Recipes" bottom sheet |

```
Position: fixed, bottom: calc(56px + env(safe-area-inset-bottom) + 16px), right: 20px
Size: 52px × 52px circle
Color: var(--accent) background, white icon
Shadow: var(--shadow-lg)
```

On desktop: `hidden` — pages keep their existing inline ImportBar / buttons.

The FAB listens to the current route and triggers the appropriate action. Can be implemented in `App.tsx` passing a callback down, or using a simple context/atom.

**File:** `frontend/src/components/FAB.tsx`

---

### 4. Convert All Modals to BottomSheet

Swap every `createPortal` modal for `<BottomSheet>`:

| Current Modal | Location | Sheet Content |
|---|---|---|
| Create Cookbook | `CookbooksPage.tsx` | Name input + Create button |
| Import Recipe | `ImportBar.tsx` (triggered by FAB) | URL input + progress states |
| Rate/Review (Baked) | `BakedModal.tsx` | Star picker + review textarea |
| Add Recipes to Cookbook | `CookbookDetailPage.tsx` | Recipe multi-select list |
| Edit Pantry Item | `PantryPage.tsx` | Name/qty/unit fields + delete |
| Quick Add Pantry | `PantryPage.tsx` | Common ingredients list |

The shared `Modal.tsx` component gets a `variant` prop: `'modal' | 'sheet'` (defaulting based on screen size via a `useIsMobile()` hook).

---

### 5. Touch-Friendly Interaction Fixes

Every `sm:opacity-0 sm:group-hover:opacity-100` pattern needs fixing — these buttons are completely invisible on mobile. The plan is:

- **On mobile:** action buttons are always visible
- **On desktop:** keep the hover-reveal behaviour

Pattern:
```tsx
// Before
className="sm:opacity-0 sm:group-hover:opacity-100"

// After
className="sm:opacity-0 sm:group-hover:opacity-100"  // already fixed in pantry
```

Also replace `onMouseEnter`/`onMouseLeave` interactive states with CSS:
- Move hover colors to a `.hover-accent:hover` utility class in `index.css`
- Or use Tailwind `hover:` classes for simple cases
- `active:` states for touch feedback (slight scale-down or background flash)

---

### 6. Page Layout Adjustments (Mobile)

| Change | Details |
|---|---|
| Remove top padding | `pt-12 sm:pt-24` → `pt-4 sm:pt-24` (nav no longer overhead) |
| Add bottom padding | All pages get `pb-24 sm:pb-16` to clear FAB + bottom nav |
| Safe area padding | Bottom nav uses `padding-bottom: env(safe-area-inset-bottom)` |
| Page headers | Keep eyebrow + h1 + accent bar pattern — works well on mobile |

---

### 7. Recipe Detail Mobile Polish

- **Sticky ingredient/instruction tab bar** — already exists; verify 44px+ tap targets
- **Edit button** — currently floats top-right over hero; keep as-is (works on mobile)
- **Action sheet** — "..." button in hero that opens a bottom sheet with: Rate, Edit, Delete, Share

---

## Implementation Phases

### Phase 1 — Navigation Shell (Foundation)
**Goal:** Bottom nav live, desktop nav unchanged

Tasks:
- [x] Create `frontend/src/components/BottomNav.tsx` with 3 tabs + icons + active state
- [x] Create `frontend/src/hooks/useIsMobile.ts` (`window.matchMedia('(max-width: 639px)')` with resize listener)
- [x] Update `frontend/src/App.tsx`: render `<BottomNav>` below routes (mobile only via CSS)
- [x] Make `<NavBar>` `hidden sm:flex` (desktop only)
- [x] Update all page containers: `pb-24 sm:pb-16`, `pt-4 sm:pt-24`
- [x] Add `safe-area-inset-bottom` CSS variable usage in `index.css`

### Phase 2 — Bottom Sheet Component
**Goal:** Reusable sheet primitive, converted create-cookbook modal

Tasks:
- [x] Create `frontend/src/components/BottomSheet.tsx` with mobile slide-up / desktop center variants
- [x] Add `slideUp` keyframe to `index.css`
- [x] Convert `CookbooksPage` create dialog to use `<BottomSheet>`
- [x] Convert `PantryPage` edit item modal to use `<BottomSheet>`
- [x] Update `Modal.tsx` to support sheet variant (or keep separate)

### Phase 3 — FAB + Import Sheet
**Goal:** Primary actions accessible via thumb

Tasks:
- [x] Create `frontend/src/components/FAB.tsx`
- [x] Create `frontend/src/context/FABContext.tsx` (or use route-based callback pattern)
- [x] Wrap `<ImportBar>` content in a bottom sheet triggered by FAB on `/recipes` and `/cookbooks`
- [x] Wrap "Add Ingredient" form in a bottom sheet triggered by FAB on `/pantry`
- [x] Hide existing inline `<ImportBar>` on mobile (`hidden sm:block`)

### Phase 4 — Remaining Modal Conversions + Polish
**Goal:** All modals feel native

Tasks:
- [ ] Convert `BakedModal` / rating flow to bottom sheet
- [ ] Convert "Add Recipes to Cookbook" modal to bottom sheet
- [ ] Convert Quick Add Pantry to bottom sheet
- [ ] Fix `onMouseEnter`/`onMouseLeave` patterns → CSS-based hover + `active:` touch states
- [ ] Verify all tap targets ≥ 44px
- [ ] Test safe area insets on simulated iPhone notch

---

## Files to Create

```
frontend/src/components/BottomNav.tsx       — bottom tab bar
frontend/src/components/BottomSheet.tsx     — sheet/modal hybrid
frontend/src/components/FAB.tsx             — floating action button
frontend/src/hooks/useIsMobile.ts           — breakpoint hook
frontend/src/context/FABContext.tsx         — optional FAB action registry
```

## Files to Modify

```
frontend/src/App.tsx                        — add BottomNav, FAB
frontend/src/components/NavBar.tsx          — add hidden sm:flex
frontend/src/index.css                      — slideUp keyframe, safe-area vars
frontend/src/pages/CookbooksPage.tsx        — modal → sheet, hide ImportBar mobile
frontend/src/pages/AllRecipesPage.tsx       — hide ImportBar mobile
frontend/src/pages/PantryPage.tsx           — modals → sheets
frontend/src/pages/RecipeDetailPage.tsx     — tab touch targets
frontend/src/pages/CookbookDetailPage.tsx   — add-recipes modal → sheet
frontend/src/components/Modal.tsx           — sheet variant
frontend/src/components/BakedModal.tsx      — use BottomSheet
```

---

## Technical Considerations

### Safe Area Insets
iPhones with home indicator need `padding-bottom: env(safe-area-inset-bottom)` on the bottom nav. The `viewport-fit=cover` meta tag may need adding to `index.html`.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Animation Performance
Slide-up animations must use `transform: translateY()` (GPU-composited), not `bottom` or `top` position changes (causes layout reflow).

### Scroll Lock
When a bottom sheet is open, `document.body.style.overflow = 'hidden'` already set in several places — standardise this in `BottomSheet.tsx`.

### Desktop Parity
Every new component must be invisible (`hidden`) or fall back gracefully on desktop. The existing desktop layout should be pixel-identical before and after this change.

### No New Dependencies
All animation via CSS keyframes (already established pattern). No framer-motion, no react-spring. Keep the bundle lean.

---

## Acceptance Criteria

- [ ] On mobile (`< 640px`): top nav is hidden, bottom tab bar is visible and navigates correctly
- [ ] On desktop (`≥ 640px`): top nav is visible, bottom tab bar is hidden, layout unchanged
- [ ] All modals on mobile slide up from the bottom with a drag handle visual
- [ ] FAB is visible on mobile, triggers correct action per page
- [ ] All interactive buttons are visible and tappable on mobile (no hover-only states)
- [ ] Safe area insets respected on iPhone (no content behind home indicator)
- [ ] No visual regressions on desktop
- [ ] All tap targets are ≥ 44px tall

---

## Success Metrics

- Mobile feels like a native app (not a scaled-down website)
- Primary actions (import recipe, add pantry item) reachable with one thumb tap
- Zero hover-only UI elements remaining on mobile
- Desktop layout visually identical to before

---

## Sources & References

- Existing nav: `frontend/src/components/NavBar.tsx`
- Existing modal: `frontend/src/components/Modal.tsx`
- Design tokens: `frontend/src/index.css:3-80`
- App routing: `frontend/src/App.tsx`
- Pantry modals (inline pattern): `frontend/src/pages/PantryPage.tsx`
- iOS Human Interface Guidelines — bottom tab bar patterns
- `env(safe-area-inset-bottom)` — CSS environment variables for notched iPhones
