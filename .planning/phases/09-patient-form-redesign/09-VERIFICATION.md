---
phase: 09-patient-form-redesign
verified: 2026-04-09T20:00:00Z
status: human_needed
score: 6/8 must-haves verified (2 require human judgment)
gaps: []
human_verification:
  - test: "Confirm SC1 (CPF lookup stub) is intentional deferral, not a blocker"
    expected: "CPF blur triggers spinner and lookup call; if a real patient exists, auto-fill populates Name, Sex, Birth Date. For now stub always returns null."
    why_human: "lookupPatientByCPF always returns null — auto-fill control flow is wired but will never populate fields until a real endpoint is connected. Phase design explicitly deferred this (D-06). Accept or flag for follow-up."
  - test: "Confirm SC3 (metadata card editability) matches intent"
    expected: "SAME, Visit ID, Patient Code, Ticket, Insurance render as visually distinct muted inputs in a secondary section. They ARE editable."
    why_human: "ROADMAP says 'non-editable metadata cards' but design spec D-14 explicitly states 'All metadata fields are editable inputs (not read-only) since lookup is deferred.' Verify the editable treatment satisfies the stakeholder intent."
  - test: "Confirm SC6 (inline validation error display) matches intent"
    expected: "Invalid field gets red border AND a small error message appears directly below the field (same card). No alert() popups, no top-of-form error list."
    why_human: "ROADMAP says 'no detached red text' but the UI spec explicitly includes a .patient-form__error span below each field. Verify the nearby inline message is acceptable vs the old alert() pattern."
---

# Phase 9: Patient Form Redesign — Verification Report

**Phase Goal:** Redesign PatientForm for clarity and efficiency — CPF-first progressive flow with API lookup and auto-fill, computed age from birth date only (remove redundant age field), read-only metadata cards for system IDs (SAME, Visit ID, Patient Code), Material-style inputs with subtle borders and inline error states, input masks for CPF and date fields, logical tab order, and sticky submit button.
**Verified:** 2026-04-09T20:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Entering a valid CPF triggers lookup; if patient exists, Name/Sex/BirthDate auto-fill | ? HUMAN | Control flow wired — `handleCpfBlur` → `lookupPatientByCPF` → auto-fill logic exists. But stub always returns `null`; auto-fill will never fire in current state. Intentional per D-06. |
| SC2 | Age computed from Birth Date, displayed as read-only label — no age input field | ✓ VERIFIED | `computedAge` renders in `<p className="patient-form__age-display" aria-live="polite">`. No `<input name="age">` in component. Age injected at submit via `calcAgeFromDDMMYYYY`. |
| SC3 | System IDs render as non-editable metadata cards, not form inputs | ? HUMAN | Fields are in a visually distinct `<section>` with muted `.patient-form__meta-input` styling. However they are standard editable `<input>` elements — no `readOnly` attribute. D-14 explicitly kept them editable; ROADMAP says "non-editable." |
| SC4 | All text inputs use Material-style: subtle borders, gray background, focus highlight | ✓ VERIFIED | `.patient-form__input`: `background-color: var(--color-surface-muted)`, `border: 1px solid var(--color-border)`, focus sets `border-color: var(--color-primary)` + teal box-shadow. Design token system throughout. |
| SC5 | CPF and date fields auto-format with masks | ✓ VERIFIED | `<IMaskInput mask="000.000.000-00">` for CPF, `<IMaskInput mask="00/00/0000">` for birth date. react-imask 7 in use. |
| SC6 | Inline validation errors change field border color | ✓ VERIFIED (with note) | `.patient-form__input--error` sets `border-color: var(--color-feedback-error-text); border-width: 2px`. A small `.patient-form__error` span also appears directly below the field. UI spec explicitly includes this span. No `alert()` calls. |
| SC7 | Tab order: CPF → Name → Birth Date → Sex → Submit | ✓ VERIFIED | DOM order matches: CPF (`IMaskInput` first), Name (`input`), Birth Date (`IMaskInput`), Age display (`<p>` — non-focusable), Sex (`<select>`), metadata inputs, submit button. No `tabIndex` overrides that would break natural order. |
| SC8 | Submit button sticky at bottom when form overflows | ✓ VERIFIED | `.patient-form__submit-wrapper { position: sticky; bottom: 0; }`. Parent `.patient-form-wrapper` has `overflow-y: auto` — required scroll ancestor for sticky. Build passes. |

**Score:** 6/8 truths automated-verified, 2 require human judgment

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/PatientForm.jsx` | Extracted PatientForm: CPF-first, lookup stub, computed age, metadata section, default export | ✓ VERIFIED | 248 lines. Exports `default PatientForm`. All sections present. |
| `src/components/PatientForm.css` | Co-located CSS: Material-style inputs, sticky submit, metadata styles, spinner | ✓ VERIFIED | 228 lines. All required classes present. Uses design tokens exclusively. |
| `src/components/ProtocolTriage.jsx` | Imports PatientForm; no inline PatientForm definition; no calcAgeFromDDMMYYYY | ✓ VERIFIED | Line 8: `import PatientForm from './PatientForm'`. No `const PatientForm` definition. No `calcAgeFromDDMMYYYY`. Line 936: `<PatientForm onSubmit={handlePatientSubmit} loading={loading} />`. |
| `src/components/ProtocolTriage.css` | No `.patient-form*` CSS blocks | ✓ VERIFIED | `grep -r "patient-form" ProtocolTriage.css` returns no matches. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ProtocolTriage.jsx` | `PatientForm.jsx` | `import PatientForm from './PatientForm'` | ✓ WIRED | Line 8 confirmed. Render site at line 936. |
| `PatientForm.jsx` | `calcAgeFromDDMMYYYY` | Local function definition | ✓ WIRED | Lines 6-15. Called at render (line 111) and in `handleSubmit` (line 116). |
| `PatientForm.jsx` | `react-imask` | `import { IMaskInput } from 'react-imask'` | ✓ WIRED | Line 2. Used for CPF (line 131) and birth_date (line 177). |
| `PatientForm.jsx` | `./ui/Tooltip` | `import { Tooltip } from './ui/Tooltip'` | ✓ WIRED | Line 3. Used on CPF, Name, and Birth Date labels. |
| `PatientForm.jsx handleSubmit` | age computation | `calcAgeFromDDMMYYYY` at submit time | ✓ WIRED | Line 116-117: `const age = calcAgeFromDDMMYYYY(formData.birth_date); onSubmit({ ...formData, age: age !== null ? age : undefined })`. |
| `ProtocolTriage.jsx handlePatientSubmit` | null-safe age | `data.age ?? 'nao informada'` | ✓ WIRED | Line 389: `IDADE: ${data.age ?? 'nao informada'}` confirmed. |
| `PatientForm.jsx handleCpfBlur` | lookupPatientByCPF | Async call + auto-fill | STUB (intentional) | Call wired at line 75. `lookupPatientByCPF` always returns `null` per D-06 deferral. Auto-fill logic (lines 77-83) exists but never executes. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FORM-05 | 09-01-PLAN.md, 09-02-PLAN.md | CPF-first progressive form with API lookup and auto-fill, computed age, read-only metadata cards, Material-style inputs, input masks, inline validation errors, logical tab order, sticky submit button | ORPHANED — not in REQUIREMENTS.md | FORM-05 appears in ROADMAP.md (Phase 9 section) and all plan/summary frontmatter but does NOT exist in `.planning/REQUIREMENTS.md`. REQUIREMENTS.md only defines FORM-01 through FORM-04, all mapped to Phase 7. No traceability entry for FORM-05. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/PatientForm.jsx` | 19-21 | `lookupPatientByCPF` always returns `null` (stub) | Info | CPF auto-fill never fires. Intentional per D-06. Does not block form submission. Spinner renders briefly on valid CPF blur. |

No other anti-patterns found. No TODOs, no alert() calls, no hardcoded static returns in render paths, no empty handlers blocking form submission.

### Human Verification Required

#### 1. CPF Lookup Auto-Fill (SC1)

**Test:** Register a patient by typing 11 valid CPF digits and tabbing away. Verify spinner appears briefly.
**Expected:** Spinner (`patient-form__cpf-spinner`) appears while lookup runs, then disappears. No fields auto-fill (stub always returns null). No error message shown on no-match (D-05).
**Why human:** The auto-fill WILL work if `lookupPatientByCPF` is wired to a real endpoint. Determine whether the stub satisfies the acceptance criterion for this phase, or whether a real endpoint must be wired before phase passes.

#### 2. Metadata Card Editability (SC3)

**Test:** Load the patient form and click each metadata field (SAME, Patient Code, Visit ID, Ticket, Insurance).
**Expected:** Fields accept keyboard input — they are editable. Visual treatment is muted/secondary compared to the primary clinical fields above.
**Why human:** ROADMAP says "non-editable" but design spec D-14 explicitly kept them editable since patient lookup is deferred. Confirm whether muted-but-editable satisfies the stakeholder intent for this phase, or whether `readOnly` should be added now.

#### 3. Inline Validation Error Display (SC6)

**Test:** Focus the Name field, then blur without entering a value. Observe the error state.
**Expected:** The Name input border turns red. A small error message "Nome e obrigatorio" appears directly below the field within the same card area. No alert(), no top-of-form error banner.
**Why human:** ROADMAP says "no detached red text" but the UI spec explicitly includes `.patient-form__error` span below the field. Verify the small inline message below the field is acceptable — it is co-located with the invalid input, not "detached."

### Gaps Summary

No automated blockers found. The two ambiguities (lookup stub, metadata editability) were intentional design decisions documented in the phase research (D-06, D-14) and should be confirmed by a human against stakeholder expectations. The build passes cleanly.

One administrative gap: FORM-05 is the phase requirement but does not appear in `.planning/REQUIREMENTS.md`. The requirements file lists FORM-01 through FORM-04 (all Phase 7). FORM-05 was added to the ROADMAP but not backfilled into REQUIREMENTS.md. This does not affect the implementation but breaks traceability.

---

_Verified: 2026-04-09T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
