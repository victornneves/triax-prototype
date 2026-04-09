---
phase: 11-triage-interaction-fixes
plan: 01
subsystem: ui
tags: [react, triage, textarea, sensor-panel, keyboard-shortcuts]

# Dependency graph
requires:
  - phase: 10-sensor-panel-refactor
    provides: SENSOR_CONFIG exported from SensorPanel.jsx with gcs key (not gcs_scale)
provides:
  - Yes/No quick-reply buttons visible during yes/no questions regardless of missingSensors state
  - GCS sensor correctly highlighted when API returns gcs_scale in missing_sensors
  - Auto-resizing textarea with Shift+Enter multiline support and Enter-to-submit
affects:
  - 14-discoverability
  - any phase touching ProtocolTriage chat input or sensor highlighting

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Key normalization at the point of setState (gcs_scale -> gcs) to keep downstream consumers clean
    - Auto-resize textarea via scrollHeight measurement on input event + useEffect height reset on clear

key-files:
  created: []
  modified:
    - src/components/ProtocolTriage.jsx
    - src/components/ProtocolTriage.css

key-decisions:
  - "Removed missingSensors.length === 0 guard from quick-reply render — sensors pending and yes/no question are independent concerns; blocking buttons was UX regression"
  - "Normalize gcs_scale to gcs at setMissingSensors call site, not at render time — single normalization point, all downstream use SENSOR_CONFIG keys"
  - "border-radius changed from radius-pill to radius-md on textarea — pill shape looks odd when textarea expands to multiple lines"
  - "Do NOT normalize blood_pressure -> bp_systolic; SENSOR_CONFIG already uses blood_pressure so D-06 from research was incorrect"

patterns-established:
  - "Auto-resize textarea: onInput sets height to auto then scrollHeight; useEffect resets to auto when value clears"
  - "Shift+Enter textarea: handleTextareaKeyDown intercepts Enter without shiftKey, calls handleSendMessage(); Shift+Enter falls through to browser default newline"

requirements-completed: [TRIAGE-01, TRIAGE-02, TRIAGE-03, TRIAGE-04]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 11 Plan 01: Triage Interaction Fixes Summary

**Removed missingSensors guard from yes/no buttons, normalized gcs_scale key, and replaced chat input with auto-resizing textarea supporting Shift+Enter multiline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T21:55:22Z
- **Completed:** 2026-04-09T21:57:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Yes/No quick-reply buttons now appear whenever `currentNode.yesNo` is true and loading is false, regardless of pending sensors — unblocks the most common pilot usability issue
- GCS sensor field now correctly highlights as missing when API returns `gcs_scale` in `missing_sensors` — normalization applied at the `setMissingSensors` call site to match SENSOR_CONFIG's `gcs` key
- Chat input replaced with auto-resizing textarea: Enter submits, Shift+Enter inserts newline, textarea grows up to ~4 lines then scrolls, height resets after message is sent

## Task Commits

1. **Task 1: Fix yes/no button visibility and GCS highlight mismatch** - `fcd7083` (fix)
2. **Task 2: Replace chat input with auto-resizing textarea** - `7d99482` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/ProtocolTriage.jsx` - Removed `missingSensors.length === 0` from quick-reply condition; normalized `gcs_scale` to `gcs` in `setMissingSensors`; added `textareaRef`, `handleTextareaInput`, `handleTextareaKeyDown`, height-reset `useEffect`; replaced `<input type="text">` with `<textarea rows={1}>`
- `src/components/ProtocolTriage.css` - Updated `.chat-text-input` with `resize:none`, `overflow-y:auto`, `min-height:44px`, `max-height:108px`, `line-height:1.5`, `font-family:inherit`, `border-radius:var(--radius-md)`

## Decisions Made

- Removed only the `missingSensors.length === 0 &&` portion of the quick-reply guard; the render condition now matches the keyboard shortcut condition at line 176 (`currentNode?.yesNo && !loading`)
- Normalization of `gcs_scale` to `gcs` is applied at `setMissingSensors` call site — the same pattern already used in the `translatedSensors` map above it on line 602
- Research decision D-06 (normalize `blood_pressure` to `bp_systolic`) was found to be incorrect; `SENSOR_CONFIG` uses `blood_pressure` as its key so no normalization needed there

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 14 (Discoverability) unblocked: Y/N keyboard shortcuts are now confirmed working end-to-end (buttons visible, shortcuts suppressed in textarea focus via existing `tag === 'TEXTAREA'` guard)
- Phase 12 (Vital Signs UX / abnormal indicators) unblocked: GCS highlighting now works correctly, no missingSensors key mismatch

---
*Phase: 11-triage-interaction-fixes*
*Completed: 2026-04-09*
