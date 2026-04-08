---
phase: 07-component-migration-accessibility
plan: 03
subsystem: ui
tags: [react, css, accessibility, aria, focus-trap, design-tokens, modal, wcag]

# Dependency graph
requires:
  - phase: 07-01
    provides: tokens.css with radius/shadow/transition primitives established

provides:
  - TriageDetailsModal.css: 540-line token-backed CSS with BEM modal-* classes
  - TriageDetailsModal.jsx: zero inline styles, full ARIA dialog + focus trap
  - MTS priority tint tokens in tokens.css (--mts-*-tint, --mts-*-text)
  - data-priority attribute CSS pattern for runtime color keying

affects:
  - 07-05 (ProtocolTriage migration — similar complex modal patterns)
  - 07-06 (accessibility audit — modal ARIA established here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-priority attribute pattern: runtime color keying via CSS attribute selectors instead of inline styles"
    - "Focus trap: useRef + useEffect with keydown handler, saves/restores previousFocus"
    - "Visually hidden title via .sr-only: role=dialog requires labelledby pointing to DOM element"

key-files:
  created:
    - src/components/TriageDetailsModal.css
  modified:
    - src/components/TriageDetailsModal.jsx
    - src/styles/tokens.css

key-decisions:
  - "data-priority CSS attribute selectors replace JS getPriorityBg/getPriorityColor/getPriorityTextColor functions — eliminates last 2 inline styles without violating MTS immutability constraint"
  - "MTS priority tint tokens added to tokens.css — light background tints derived from MTS colors belong in the token system, not hardcoded in component CSS"
  - "sr-only class defined locally in TriageDetailsModal.css — no global utility class file exists yet, scoped definition avoids premature abstraction"
  - "Visually hidden h2 as modal title — role=dialog+aria-labelledby requires a DOM element with the title text; patient name used as title text"

patterns-established:
  - "data-priority attribute pattern: for runtime MTS-color keying, use data-priority=[key] + CSS [data-priority='key'] selectors instead of inline styles"
  - "Focus trap implementation: useEffect runs once on mount, saves document.activeElement, re-queries focusable elements on each Tab keydown for dynamic content"

requirements-completed: [A11Y-01, A11Y-02]

# Metrics
duration: 12min
completed: 2026-04-08
---

# Phase 07 Plan 03: TriageDetailsModal CSS Migration + ARIA + Focus Trap Summary

**TriageDetailsModal migrated from 71 inline styles to token-backed CSS with role="dialog", aria-modal, aria-labelledby, and native DOM focus trapping — the most complex single-component migration in phase 07**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-08T22:00:00Z
- **Completed:** 2026-04-08T22:12:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created 540-line TriageDetailsModal.css with BEM-prefixed modal-* classes, zero raw hex values, all colors via design tokens
- Eliminated 71 inline styles from TriageDetailsModal.jsx (507-line component), replaced with className references
- Added full ARIA dialog accessibility: role="dialog", aria-modal="true", aria-labelledby="modal-title"
- Implemented native DOM focus trap (useRef + useEffect pattern from 07-RESEARCH.md Pattern 7): traps Tab/Shift+Tab, restores focus on close
- Escape key closes modal (keydown handler)
- Removed all JS hover handlers (onMouseOver/onMouseOut) — CSS :hover handles all hover state
- Fixed WCAG AA contrast failures: #adb5bd (2.07:1) and #868e96 (3.32:1) replaced with --color-text-secondary (7.63:1)
- Added MTS priority tint tokens to tokens.css — 10 new tokens for priority result box data visualization

## Task Commits

1. **Task 1: Create TriageDetailsModal.css** - `d6a5926` (feat)
2. **Task 2: Migrate TriageDetailsModal.jsx + ARIA + focus trap** - `2fcf7be` (feat)

## Files Created/Modified

- `src/components/TriageDetailsModal.css` - 540-line token-backed modal CSS with BEM classes covering overlay, header, tabs, actions, body, patient card, result box, vitals grid, reasoning box, stats grid
- `src/components/TriageDetailsModal.jsx` - Fully migrated: zero inline styles, ARIA dialog, focus trap, tab roles, sr-only title
- `src/styles/tokens.css` - Added 10 MTS priority tint tokens (--mts-*-tint, --mts-*-text) for data-priority CSS pattern

## Decisions Made

- **data-priority attribute pattern**: The priority result box requires runtime color keying (5 MTS clinical colors). Instead of inline `style={{ background: getPriorityBg(v) }}`, use `data-priority={priorityKey}` on the element and CSS `[data-priority="red"] { background-color: var(--mts-red-tint) }` attribute selectors. Achieves zero inline styles without violating MTS immutability.
- **MTS tint tokens added to tokens.css**: The light background tints (#ffeaea, #fff5e6 etc.) were hardcoded in JS helper functions. These belong in the token system as semantic values derived from MTS colors. Added 10 new tokens.
- **sr-only locally in TriageDetailsModal.css**: No global utility class file exists. Scoped definition avoids premature abstraction; can be moved to a utilities.css when needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added MTS priority tint tokens to tokens.css**
- **Found during:** Task 2 (CSS migration)
- **Issue:** Plan required zero raw hex in CSS, but the priority result box background tints and text colors were not in the token system. Moving them from JS `getPriorityBg()` / `getPriorityTextColor()` functions to CSS classes required defining them as tokens.
- **Fix:** Added 10 new tokens to tokens.css (`--mts-red-tint`, `--mts-red-text`, etc.) and updated TriageDetailsModal.css to reference them.
- **Files modified:** src/styles/tokens.css, src/components/TriageDetailsModal.css
- **Verification:** `grep -P '#[0-9a-fA-F]{3,8}' TriageDetailsModal.css` returns empty
- **Committed in:** 2fcf7be (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added .sr-only class for visually hidden modal title**
- **Found during:** Task 2 (ARIA implementation)
- **Issue:** role="dialog" with aria-labelledby requires a DOM element with the title text. The modal had no visible title element. A visually hidden h2 with the patient name provides the label without visual disruption.
- **Fix:** Added `<h2 id="modal-title" className="sr-only">{patientName}</h2>` and `.sr-only` CSS class to TriageDetailsModal.css.
- **Files modified:** src/components/TriageDetailsModal.jsx, src/components/TriageDetailsModal.css
- **Verification:** grep confirms aria-labelledby="modal-title" and id="modal-title" present
- **Committed in:** 2fcf7be (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 — missing critical functionality for correctness/accessibility)
**Impact on plan:** Both fixes required to meet acceptance criteria. No scope creep.

## Issues Encountered

None — plan executed cleanly. The data-priority attribute CSS pattern was adopted to satisfy both "zero inline styles" and "MTS colors immutable" constraints simultaneously.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Modal accessibility pattern established (role=dialog, aria-modal, focus trap, sr-only title) — ready for reuse in any new modal
- data-priority attribute CSS pattern documented and available for ProtocolTriage priority display
- MTS tint tokens in tokens.css available for any future priority color display components
- Phase 07-04 (Tooltip + StatusBar primitives) and 07-05 (ProtocolTriage migration) can proceed

---
*Phase: 07-component-migration-accessibility*
*Completed: 2026-04-08*
