---
phase: 07-component-migration-accessibility
plan: 04
subsystem: ui
tags: [react, css-tokens, accessibility, aria, tooltip, status-bar]

# Dependency graph
requires:
  - phase: 07-01
    provides: design tokens (tokens.css) and Button/Toast primitive pattern
provides:
  - Tooltip shared primitive with hover/focus show, leave/blur hide, role=tooltip, aria-describedby (FORM-03 ready)
  - StatusBar shared primitive with session ID, protocol name, reactive connection indicator (LAYT-02 ready)
affects: [07-06, any plan wiring form tooltips or triage layout status bar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useId() for stable ARIA associations across React renders"
    - "Dynamic position via getBoundingClientRect in style attr; all visual design in CSS"
    - "navigator.onLine + addEventListener('online'/'offline') pattern for reactive network status"

key-files:
  created:
    - src/components/ui/Tooltip.jsx
    - src/components/ui/Tooltip.css
    - src/components/ui/StatusBar.jsx
    - src/components/ui/StatusBar.css
  modified: []

key-decisions:
  - "Tooltip position (top/left) stays as inline style — dynamic values from getBoundingClientRect, not design properties; all visual styling in CSS"
  - "StatusBar uses var(--color-feedback-ok-text) / var(--color-feedback-error-text) for dot colors — avoids new tokens, reuses existing feedback primitive tokens"

patterns-established:
  - "Tooltip trigger pattern: aria-label='Informacoes sobre {label}', aria-describedby only set when visible"
  - "Connection status pattern: navigator.onLine for initial state + addEventListener cleanup in useEffect"

requirements-completed: [LAYT-02, FORM-03]

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 07 Plan 04: Tooltip and StatusBar Shared UI Primitives Summary

**Tooltip with hover/focus ARIA tooltip portal and StatusBar with reactive navigator.onLine connection indicator — both token-backed, zero inline colors**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-08T21:39:18Z
- **Completed:** 2026-04-08T21:43:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Tooltip primitive ready for Plan 06 form field help tooltips (FORM-03): shows on hover/focus, hides on leave/blur, role="tooltip" + aria-describedby, auto-flips below trigger when near viewport top
- StatusBar primitive ready for triage layout (LAYT-02): session ID (8-char truncated), protocol name (24-char truncated), reactive online/offline dot indicator
- Both components follow established Button/Toast pattern: named export, co-located CSS, zero raw hex values

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Tooltip.jsx and Tooltip.css shared component** - `e2a54dc` (feat)
2. **Task 2: Create StatusBar.jsx and StatusBar.css component** - `6363af4` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/components/ui/Tooltip.jsx` - Tooltip primitive with hover/focus ARIA portal, auto-flip positioning
- `src/components/ui/Tooltip.css` - Token-backed tooltip styles (.tooltip-trigger, .tooltip-portal, .tooltip-arrow)
- `src/components/ui/StatusBar.jsx` - Session/protocol/connection status bar with reactive online indicator
- `src/components/ui/StatusBar.css` - Token-backed status bar styles (.status-bar, .status-bar__dot with online/offline states)

## Decisions Made
- Tooltip `top`/`left` remain as inline style props — they are dynamic computed values from `getBoundingClientRect`, not design properties. All colors, fonts, shadows, padding live in CSS only.
- StatusBar dot colors use `var(--color-feedback-ok-text)` and `var(--color-feedback-error-text)` directly (these tokens exist in the primitive layer of tokens.css), avoiding the need for new semantic tokens.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - both components are self-contained; they accept props and render. No hardcoded empty values or placeholder data.

## Next Phase Readiness
- Tooltip is ready to be imported in Plan 06 (PatientForm field help tooltips — FORM-03)
- StatusBar is ready to be wired into ProtocolTriage or layout wrapper (LAYT-02)
- Both components are build-verified and follow established token/pattern conventions

---
*Phase: 07-component-migration-accessibility*
*Completed: 2026-04-08*
