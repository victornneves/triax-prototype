---
phase: 06-ui-primitives-toast
plan: "01"
subsystem: ui
tags: [react, css-tokens, design-system, button, toast, wcag]

# Dependency graph
requires:
  - phase: 05-design-token-foundation
    provides: tokens.css with semantic layers, feedback color primitives, spacing/typography scale

provides:
  - src/components/ui/Button.jsx — shared button primitive with variant/size/loading API
  - src/components/ui/Button.css — token-backed BEM button styles
  - src/styles/tokens.css — 12 new toast semantic color tokens (6 light + 6 dark) + error dark overrides

affects:
  - 06-02 (Toast component CSS references --color-toast-* tokens from this plan)
  - 06-03 (alert() replacements use both Button and Toast from plans 01+02)
  - phase-07 (Button component adoption across all existing button elements)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Co-located component CSS (Button.jsx + Button.css) following Header.jsx pattern from Phase 5"
    - "BEM naming: .btn / .btn--{variant} / .btn--{size} / .btn__spinner"
    - "CSS-only spinner via border-spin @keyframes (no JS, no library)"
    - "Semantic token chain: primitive (:root) → semantic ([data-app-theme]) → component CSS"

key-files:
  created:
    - src/components/ui/Button.jsx
    - src/components/ui/Button.css
  modified:
    - src/styles/tokens.css

key-decisions:
  - "Spinner implemented as child <span> (not ::after pseudo-element) for cross-browser compatibility in flex context"
  - "color: transparent on .btn--loading hides text while explicit border-color on .btn__spinner maintains variant visibility"
  - "Dark error-bg/text overrides added in same commit as toast tokens — danger variant needs them and had no dark coverage"

patterns-established:
  - "Button.css: all color properties use var(--color-*) only — zero hardcoded hex permitted in component CSS"
  - "Loading state: pointer-events: none + disabled attr (belt-and-suspenders) prevents double-submit"
  - "Focus ring: outline: 2px solid var(--color-primary); outline-offset: 2px — WCAG 2.1 AA pattern for all interactive elements"

requirements-completed: [DSGN-04]

# Metrics
duration: 2min
completed: 2026-04-08
---

# Phase 6 Plan 01: Button Component + Toast Color Tokens Summary

**Shared Button primitive (primary/secondary/danger, sm/md sizes, CSS spinner) and 12 toast semantic color tokens with full light/dark coverage added to the design token system**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-08T12:43:10Z
- **Completed:** 2026-04-08T12:44:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added 12 `--color-toast-*` tokens to `tokens.css` (6 light + 6 dark) satisfying D-07 contrast requirement for both theme environments
- Added `--color-error-bg`/`--color-error-text` dark overrides — required for Button danger variant dark mode correctness
- Created `src/components/ui/Button.jsx` with named export, eight props (variant/size/disabled/loading/onClick/children/type/className), and CSS spinner for loading state
- Created `src/components/ui/Button.css` with zero hardcoded hex values — all colors via semantic tokens; includes WCAG 2.1 AA focus ring and `@keyframes btn-spin`
- Vite production build passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add toast semantic color tokens** — `bc32fac` (feat)
2. **Task 2: Create Button component and CSS** — `bca9b11` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/styles/tokens.css` — 12 toast color tokens (light + dark) + error dark overrides
- `src/components/ui/Button.jsx` — Shared button primitive, named export `Button`
- `src/components/ui/Button.css` — Token-backed BEM styles, three variants, two sizes, spinner animation, focus ring

## Decisions Made

- Spinner implemented as a child `<span className="btn__spinner">` rather than a `::after` pseudo-element. `::after` in a flex container requires `content: ''` and `position: absolute`, which works but the explicit child element is clearer for future maintainers and avoids pseudo-element z-index edge cases.
- `color: transparent` on `.btn--loading` hides the button text; each variant's spinner rule explicitly sets `border-color` so the spinner inherits the correct color regardless of the transparent text trick.
- Dark overrides for `--color-error-bg` and `--color-error-text` were added in the same Task 1 commit as the toast tokens because the Button danger variant depends on these tokens and they had no dark coverage — the plan anticipated this in its action description.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `--color-toast-*` tokens are ready for Plan 02 (`Toast.css`) to reference
- `Button` component is importable from `src/components/ui/Button.jsx` — Plan 03 (alert replacements) and Phase 7 (full button migration) can adopt it
- No blockers for Plan 02 or Plan 03

---
*Phase: 06-ui-primitives-toast*
*Completed: 2026-04-08*
