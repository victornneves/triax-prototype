---
phase: 09-patient-form-redesign
plan: 01
subsystem: ui
tags: [react, jsx, css, imask, patient-form, form-design]

# Dependency graph
requires:
  - phase: 07-component-migration-accessibility
    provides: react-imask integration, Tooltip component, token-backed CSS patterns
  - phase: 08-new-interactions
    provides: design token system with dark mode coverage
provides:
  - Standalone PatientForm.jsx with CPF-first layout, lookup stub, computed age, metadata section
  - PatientForm.css with refined input styling, CPF spinner, sticky submit, metadata card styles
affects: [09-02-PLAN, ProtocolTriage.jsx wiring plan]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Co-located PatientForm.jsx + PatientForm.css (extraction from ProtocolTriage.jsx)
    - CPF blur-triggered lookup stub pattern with async/await + isLookingUp spinner state
    - Computed age derived at render + inject at submit (not stored in formData)
    - Metadata section with semantic <section> + aria-label for administrative fields

key-files:
  created:
    - src/components/PatientForm.jsx
    - src/components/PatientForm.css
  modified: []

key-decisions:
  - "Age removed from formData state — computed via calcAgeFromDDMMYYYY at render and injected into onSubmit payload (not stored as state)"
  - "lookupPatientByCPF stub always returns null — interface contract established for future backend wiring"
  - "PatientForm.css is self-contained: @keyframes btn-spin redeclared locally so file does not depend on Button.css import order"
  - "patient-form-wrapper uses align-items:flex-start + overflow-y:auto to enable position:sticky on submit button"

patterns-established:
  - "CPF field first in DOM order for tab-order compliance (D-01, D-08)"
  - "Age label uses aria-live=polite for screen reader updates (D-10, D-11)"
  - "Metadata inputs styled with .patient-form__meta-input muted variant (D-19)"

requirements-completed: [FORM-05]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 9 Plan 01: PatientForm Component Summary

**Extracted PatientForm as standalone component with CPF-first flat layout, async lookup stub with spinner, computed age label (no age input), and metadata card section using existing react-imask + design token system**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T19:28:21Z
- **Completed:** 2026-04-09T19:30:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `src/components/PatientForm.jsx` extracted from ProtocolTriage.jsx with CPF as first field, async lookup stub, computed age (not stored in formData), metadata section grouped under "Dados Administrativos", sticky submit wrapper, and all existing ARIA/validation patterns preserved
- Created `src/components/PatientForm.css` with all `.patient-form*` classes migrated from ProtocolTriage.css and refined per Phase 9 design spec: subtle gray input backgrounds, lighter border at rest, teal focus ring, muted metadata inputs, CPF spinner animation, sticky submit with shadow

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PatientForm.jsx** - `95c9518` (feat)
2. **Task 2: Create PatientForm.css** - `bd2a3af` (feat)

## Files Created/Modified
- `src/components/PatientForm.jsx` - Extracted standalone PatientForm component with CPF-first layout, lookup stub, computed age, metadata section, full ARIA/validation
- `src/components/PatientForm.css` - Co-located CSS with refined input styling, CPF spinner, sticky submit, metadata card styles, responsive breakpoints

## Decisions Made
- Age removed from formData state entirely — computed at render for display label, re-computed and injected at submit time into the onSubmit payload. This matches the existing `handlePatientSubmit` contract (uses `data.age`).
- `lookupPatientByCPF` stub is a module-level async function returning `null` — establishes the interface contract (accepts CPF string, returns `{ name, sex, birth_date } | null`) for future backend wiring without any current behavior change.
- `PatientForm.css` is self-contained: `@keyframes btn-spin` redeclared locally so the file does not depend on Button.css import order (safe duplicate, same definition).
- `patient-form-wrapper` uses `align-items: flex-start` (changed from `center`) and `overflow-y: auto` — required for `position: sticky` on submit button (pitfall 2 from RESEARCH.md: sticky needs a scroll ancestor).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PatientForm.jsx and PatientForm.css are complete and standalone
- Plan 02 can now wire `<PatientForm>` into ProtocolTriage.jsx: import the component, remove the internal PatientForm definition + calcAgeFromDDMMYYYY helper, and remove `.patient-form*` CSS from ProtocolTriage.css
- No blockers

---
*Phase: 09-patient-form-redesign*
*Completed: 2026-04-09*
