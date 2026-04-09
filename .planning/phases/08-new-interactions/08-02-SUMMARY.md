---
phase: 08-new-interactions
plan: 02
subsystem: ui
tags: [react, keyboard-shortcuts, accessibility, css-animation, ux]

# Dependency graph
requires:
  - phase: 07-component-migration-accessibility
    provides: token-backed ProtocolTriage.jsx and ProtocolTriage.css ready for shortcut layer

provides:
  - Keyboard shortcut layer on triage chat: Y/N for yes-no answers, R for recording toggle, Esc for recording cancel
  - Discoverable shortcut hints on Yes/No buttons and mic button
  - 150ms visual pulse animation on shortcut-triggered buttons
  - Input-focus guard preventing shortcuts from firing while typing

affects: [08-new-interactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - keydown listener with early Esc check before INPUT/TEXTAREA/SELECT guard (D-09)
    - activeShortcut state + setTimeout 150ms for transient visual feedback
    - shortcut-active CSS class + @keyframes shortcut-pulse for box-shadow ring animation
    - color-mix() for opacity-aware teal ring without separate token

key-files:
  created: []
  modified:
    - src/components/ProtocolTriage.jsx
    - src/components/ProtocolTriage.css

key-decisions:
  - "Esc check placed BEFORE the INPUT/TEXTAREA/SELECT guard so recording always cancels on Esc even when focus is in the text input (D-09)"
  - "activeShortcut state + 150ms setTimeout used instead of CSS transition on :active — allows programmatic trigger from keyboard path without requiring a DOM click"
  - "color-mix() used in shortcut-pulse keyframe to produce 30% opacity teal ring without adding a new opacity token — browser support covers all target environments"
  - "Mic button shortcut hint text added inline next to icon — keeps button layout consistent with quick-reply buttons without restructuring the input bar"

patterns-established:
  - "Shortcut feedback pattern: state key ('sim'|'nao'|'record') → triggerShortcutFeedback → shortcut-active class → @keyframes shortcut-pulse 150ms"

requirements-completed: [INTR-02]

# Metrics
duration: 8min
completed: 2026-04-09
---

# Phase 08 Plan 02: Keyboard Shortcuts Summary

**Document-level keydown listener adds Y/N/R/Esc shortcuts to triage flow with discoverable button hints and 150ms teal pulse animation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-09T12:30:00Z
- **Completed:** 2026-04-09T12:38:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Keydown listener on `document` routes Y → `handleSendMessage('Sim')`, N → `handleSendMessage('Nao')`, R → `handleToggleRecording()`, Esc → `stopRecording()` with correct priority ordering
- Esc fires even when focus is inside the text input (D-09); all other shortcuts suppressed inside INPUT/TEXTAREA/SELECT (D-08)
- Yes/No quick-reply buttons show "Sim (Y)" and "Nao (N)" with muted shortcut hint spans; mic button shows "(R)" or "(Esc)" hint depending on recording state
- `shortcut-active` CSS class triggers a 150ms `shortcut-pulse` animation (teal box-shadow ring via `color-mix()`) on the button corresponding to the pressed key

## Task Commits

Each task was committed atomically:

1. **Task 1: Add keydown listener with Y/N/R/Esc handling and shortcut feedback state** - `8ee14cc` (feat)
2. **Task 2: Add shortcut-hint, shortcut-active, and shortcut-pulse CSS styles** - `e370fa8` (feat)

## Files Created/Modified

- `src/components/ProtocolTriage.jsx` - activeShortcut state, triggerShortcutFeedback helper, keydown useEffect, updated Yes/No buttons and mic button with hint spans and shortcut-active class
- `src/components/ProtocolTriage.css` - .shortcut-hint, @keyframes shortcut-pulse, .shortcut-active rules appended

## Decisions Made

- Esc shortcut check is placed BEFORE the INPUT/TEXTAREA/SELECT guard in the handler so that pressing Esc while typing in the text field still cancels an active recording — consistent with browser Esc conventions (D-09)
- `activeShortcut` state with a 150ms `setTimeout` drives the pulse rather than relying on CSS `:active` pseudo-class, which only fires on mouse press and would miss keyboard invocations
- `color-mix(in srgb, var(--color-primary) 30%, transparent)` produces a 30% opacity teal ring without requiring a new semi-transparent token — keeps token surface area minimal
- `handleSendMessage('Não')` (with unicode ã) used in the N-key path to match the existing button click path exactly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — all shortcut wiring is live and connected to the existing `handleSendMessage`, `handleToggleRecording`, and `stopRecording` functions.

## Next Phase Readiness

- Keyboard shortcuts are fully functional; ready for Plan 03 (voice UX improvements)
- The `shortcut-active` class is generalized — future shortcuts can reuse `triggerShortcutFeedback` with a new key string and add a matching CSS selector

---
*Phase: 08-new-interactions*
*Completed: 2026-04-09*
