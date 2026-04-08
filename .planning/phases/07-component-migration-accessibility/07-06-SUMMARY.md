---
phase: 07-component-migration-accessibility
plan: 06
subsystem: ui
tags: [react, form-validation, react-imask, tooltip, statusbar, accessibility, aria]

# Dependency graph
requires:
  - phase: 07-component-migration-accessibility plan 04
    provides: Tooltip and StatusBar UI primitives
  - phase: 07-component-migration-accessibility plan 05
    provides: ProtocolTriage CSS migration (token-backed classes, no inline styles)
provides:
  - Form validation with inline errors and on-submit validation (FORM-01)
  - Age auto-calculation from DD/MM/AAAA birth date (FORM-02)
  - Tooltip help text on every PatientForm field and every SensorLabel (FORM-03)
  - IMaskInput masking for birth date and CPF fields (FORM-04)
  - StatusBar wired into ProtocolTriage during active triage session (LAYT-02)
affects:
  - Phase 08 (keyboard shortcuts, accessibility follow-up)
  - Any future form work in PatientForm

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Form validation via validateField/validateAll pattern with per-field blur + submit
    - calcAgeFromDDMMYYYY pure function for age auto-calculation from masked date
    - IMaskInput with onAccept (not onChange) for controlled masked inputs
    - Tooltip on form labels: <label>Text <span aria-hidden>*</span><Tooltip/></label>

key-files:
  created: []
  modified:
    - src/components/ProtocolTriage.jsx
    - src/components/ProtocolTriage.css

key-decisions:
  - "CPF field added to PatientForm (was missing) — included in formData initial state and form grid alongside patient_code"
  - "Both Task 1 and Task 2 changes committed together in one atomic commit — all changes touch only ProtocolTriage.jsx/css and are inseparable"
  - "SensorLabel tooltip uses config.desc + config.range concatenated as tooltip content — reuses existing SENSOR_CONFIG metadata"
  - "StatusBar renders outside the triage-layout div inside a React fragment — avoids layout grid disruption"

patterns-established:
  - "Masked input pattern: IMaskInput with onAccept for controlled value, name attribute for onBlur handleBlur compatibility"
  - "Validation error span pattern: id={fieldName-error}, className=patient-form__error, role=alert"
  - "Required field label pattern: text + <span className=patient-form__required aria-hidden=true>*</span> + <Tooltip/>"

requirements-completed:
  - FORM-01
  - FORM-02
  - FORM-03
  - FORM-04
  - LAYT-02

# Metrics
duration: 2min
completed: 2026-04-08
---

# Phase 07 Plan 06: Form Validation + StatusBar Wiring Summary

**IMaskInput masking (birth date + CPF), calcAgeFromDDMMYYYY auto-calc, validateField/blur/submit validation with ARIA, Tooltip on all PatientForm labels, SensorLabel migrated to shared Tooltip, StatusBar wired into active triage session**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-08T21:49:51Z
- **Completed:** 2026-04-08T21:52:40Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- PatientForm now has full form validation: blur-on-field + all-on-submit, ARIA attributes (aria-invalid, aria-describedby), inline error messages
- Birth date input uses IMaskInput with DD/MM/AAAA mask; entering a complete valid date auto-populates age via calcAgeFromDDMMYYYY; age remains editable
- CPF field added to form (was missing in previous implementation) with 000.000.000-00 mask and 11-digit validation
- Every form label now has a Tooltip component with PT-BR help text from UI-SPEC copywriting contract
- SensorLabel refactored to use shared Tooltip component with config.desc + config.range content
- StatusBar renders below Header above triage-layout during active session, showing session ID, protocol name, and connection status

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Form validation, masking, tooltips, StatusBar, SensorLabel** - `c5d1393` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified
- `src/components/ProtocolTriage.jsx` - Added IMaskInput, Tooltip, StatusBar imports; calcAgeFromDDMMYYYY function; validateField/validateAll/handleBlur validation; CPF field; Tooltip on all labels; SensorLabel using shared Tooltip; StatusBar in triage view
- `src/components/ProtocolTriage.css` - Added patient-form__input--error, patient-form__error, patient-form__required, triage-sensors__label, triage-sensors__label-text, triage-sensors__hint CSS classes

## Decisions Made
- CPF field was missing from PatientForm — added it to formData initial state and form grid (alongside patient_code) per FORM-04 requirement
- Both tasks edited only ProtocolTriage.jsx/css, so they were committed in one atomic commit
- StatusBar placed in React fragment outside triage-layout div to avoid disrupting the CSS grid layout
- SensorLabel tooltip uses `${config.desc} ${config.range}` as content — leverages existing SENSOR_CONFIG data without new config fields

## Deviations from Plan

None - plan executed exactly as written, with one clarification: CPF field was expected to be missing (plan said "check if exists, add if not") — it was indeed missing, so it was added per plan instructions.

## Issues Encountered
None - build passed first attempt, all acceptance criteria met.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 07 complete — all 6 plans executed
- ProtocolTriage now has full form UX: validation, masking, age auto-calc, tooltips, StatusBar
- Ready for Phase 08 (keyboard shortcuts, dark mode toggle, accessibility follow-up)

---
*Phase: 07-component-migration-accessibility*
*Completed: 2026-04-08*
