---
phase: 12-vital-signs-ux
plan: 01
subsystem: ui
tags: [react, css-custom-properties, clinical-ux, dark-mode, responsive]

# Dependency graph
requires:
  - phase: 10-sensor-panel-refactor
    provides: SensorPanel component with getFieldStatus optional prop and data-field-status attribute wiring already in place
provides:
  - getFieldStatus callback in ProtocolTriage with clinical thresholds for 8 vital sign types
  - CSS attribute selectors for warning (amber) and critical (red) indicators on sensor items
  - Dark mode token overrides for feedback-warn and feedback-error primitives
  - Responsive BP markup with SIS/DIA labels stacked on mobile, side-by-side on desktop
affects: [phase-13, phase-14, session-history, future-sensor-extensions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useCallback with sensorInputs dependency for clinical threshold computation"
    - "data-field-status CSS attribute selector pattern for status-driven styling without extra class churn"
    - "Worst-case wins composite field evaluation (blood_pressure: sys+dia, worst status propagates to wrapper)"
    - "align-items: flex-end on flex row so input labels sit above without misaligning separator"

key-files:
  created: []
  modified:
    - src/components/ProtocolTriage.jsx
    - src/components/SensorPanel.jsx
    - src/components/SensorPanel.css
    - src/styles/tokens.css

key-decisions:
  - "warning uses --color-feedback-warn-* tokens; critical uses --color-feedback-error-* tokens — distinct visual severity without touching MTS clinical colors"
  - "blood_pressure composite evaluated via bp_systolic/bp_diastolic sub-fields in sensorInputs; worst-case status wins"
  - "Mobile BP separator hidden via display:none at max-width 767px — labels (SIS/DIA) remain visible on both breakpoints"
  - "Dark mode warn tokens added to [data-app-theme=dark] block to match existing error dark pattern (#422006 bg, #fbbf24 text)"

patterns-established:
  - "data-field-status attribute on .triage-sensors__item drives background + border-color + border-left-width via CSS attribute selectors"
  - "getFieldStatus is null-safe — returns null for empty/undefined values; caller uses conditional spread"

requirements-completed: [VITALS-01, VITALS-02]

# Metrics
duration: 12min
completed: 2026-04-10
---

# Phase 12 Plan 01: Vital Signs UX Summary

**Clinical abnormal/critical value indicators on sensor panel items via CSS attribute selectors, plus responsive BP input with stacked mobile layout and visible SIS/DIA labels**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-10T00:00:00Z
- **Completed:** 2026-04-10T00:12:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `getFieldStatus` callback defined in ProtocolTriage with clinical thresholds for all 8 vital sign types (temperature, heart_rate, oxygen_saturation, respiratory_rate, blood_glucose, gcs, pain_scale, blood_pressure composite)
- Warning (amber) and critical (red) CSS attribute selector rules wired to `data-field-status` on `.triage-sensors__item` — 4px left border + background tint distinguishes severity
- Dark mode overrides for `--color-feedback-warn-bg/text` and `--color-feedback-error-bg/text` added to `[data-app-theme="dark"]` block
- BP inputs restructured with `.triage-sensors__bp-field` wrappers and visible `SIS`/`DIA` labels; responsive CSS stacks vertically on mobile (max-width 767px) and hides separator

## Task Commits

1. **Task 1: Define getFieldStatus callback with clinical thresholds and add indicator CSS** - `fecc0ec` (feat)
2. **Task 2: Restructure BP input markup for stacked mobile layout with visible labels** - `ac0f27c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/ProtocolTriage.jsx` - Added `useCallback` import, `getFieldStatus` function, and `getFieldStatus={getFieldStatus}` prop on both SensorPanel instances
- `src/components/SensorPanel.jsx` - BP composite branch restructured with `.triage-sensors__bp-field` wrappers and accessible label+id associations
- `src/components/SensorPanel.css` - Added `data-field-status` warning/critical indicator rules; replaced BP CSS with responsive layout including mobile media query
- `src/styles/tokens.css` - Added dark mode overrides for `--color-feedback-warn-bg`, `--color-feedback-warn-text`, `--color-feedback-error-bg`, `--color-feedback-error-text`

## Decisions Made
- Warning uses `--color-feedback-warn-*` tokens (amber), critical uses `--color-feedback-error-*` tokens (red) — distinct visual severity without touching MTS clinical color namespace
- `blood_pressure` composite: evaluates `sensorInputs.bp_systolic` and `sensorInputs.bp_diastolic` independently; worst status (critical > warning > null) propagates to the wrapper item
- Mobile BP separator hidden via `display: none` at `max-width: 767px` — labels (SIS/DIA) remain visible on both breakpoints per D-13
- Dark warn tokens follow same pattern as existing dark error tokens (`#422006` dark amber bg, `#fbbf24` light amber text)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- VITALS-01 and VITALS-02 requirements fulfilled
- `getFieldStatus` prop pattern is in place; any future vital sign threshold changes only need updating in ProtocolTriage.jsx
- Phase 13 (session history enrichment) can proceed independently
- Phase 14 (keyboard shortcut discoverability) can proceed independently

## Self-Check: PASSED

- FOUND: src/components/ProtocolTriage.jsx
- FOUND: src/components/SensorPanel.jsx
- FOUND: src/components/SensorPanel.css
- FOUND: src/styles/tokens.css
- FOUND: .planning/phases/12-vital-signs-ux/12-01-SUMMARY.md
- FOUND: commit fecc0ec (Task 1)
- FOUND: commit ac0f27c (Task 2)

---
*Phase: 12-vital-signs-ux*
*Completed: 2026-04-10*
