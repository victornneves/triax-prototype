---
phase: 14-discoverability
plan: 01
subsystem: ui
tags: [react, keyboard-shortcuts, accessibility, css-tokens]

requires:
  - phase: 11-triage-interaction-fixes
    provides: working Y/N/R/Esc keyboard shortcuts in ProtocolTriage
provides:
  - ShortcutLegend component with hover/focus-accessible shortcut popover
  - Keyboard shortcut discoverability during active triage
affects: [triage, any future keyboard shortcut additions]

tech-stack:
  added: []
  patterns: [self-contained-ui-component, fixed-position-popover, kbd-semantic-element]

key-files:
  created:
    - src/components/ui/ShortcutLegend.jsx
    - src/components/ui/ShortcutLegend.css
  modified:
    - src/components/ProtocolTriage.jsx

key-decisions:
  - "Dedicated ShortcutLegend component — did not reuse Tooltip (D-03)"
  - "Used <kbd> elements for semantic keyboard key representation"
  - "Right-aligned fixed positioning to avoid overflow clipping from triage-chat-column"
  - "z-index 500 — above triage overlays (201) but below modals (1000)"

patterns-established:
  - "Self-contained UI component: all state internal, parent only renders the element"
  - "Fixed popover positioning with getBoundingClientRect — same pattern as Tooltip"

requirements-completed: [DISC-01]

duration: 3min
completed: 2026-04-10
---

# Phase 14: Discoverability — Plan 01 Summary

**Keyboard shortcut legend with ? trigger in chat input bar — hover/focus reveals Y/N/R/Esc/Shift+Enter bindings with PT-BR labels**

## Performance

- **Duration:** ~3 min
- **Completed:** 2026-04-10
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created self-contained `ShortcutLegend` component with `?` trigger button and fixed-position popover
- Five shortcut rows with `<kbd>` key badges and PT-BR action labels (Sim, Nao, Gravar audio, Parar gravacao, Nova linha)
- Hover and keyboard focus reveal — accessible without mouse
- Token-backed styling — dark mode works automatically via semantic tokens
- Wired into `chat-input-bar` between mic and send buttons — auto-hides during recording mode

## Task Commits

1. **Task 1: Create ShortcutLegend component and CSS** - `0c7fd42` (feat)
2. **Task 2: Wire ShortcutLegend into ProtocolTriage chat-input-bar** - `5656b70` (feat)

## Files Created/Modified
- `src/components/ui/ShortcutLegend.jsx` - Self-contained legend component with hover/focus reveal
- `src/components/ui/ShortcutLegend.css` - Token-backed trigger, popover, row, and key badge styles
- `src/components/ProtocolTriage.jsx` - Import + render ShortcutLegend in chat-input-bar

## Decisions Made
- Used `<kbd>` elements over styled `<span>` for semantic HTML (screen readers announce as keyboard input)
- Right-aligned popover via `window.innerWidth - rect.right` to avoid right-edge clipping
- z-index: 500 (above triage overlays at 201, below modals at 1000)
- No animation on show/hide — instant reveal matches Tooltip behavior

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ShortcutLegend component available for future shortcut additions
- Phase 14 is the last phase in v2.1.0 milestone

---
*Phase: 14-discoverability*
*Completed: 2026-04-10*
