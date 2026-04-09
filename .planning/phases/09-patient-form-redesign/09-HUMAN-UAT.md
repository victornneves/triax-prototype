---
status: partial
phase: 09-patient-form-redesign
source: [09-VERIFICATION.md]
started: 2026-04-09
updated: 2026-04-09
---

## Current Test

[awaiting human testing]

## Tests

### 1. SC1 — CPF auto-fill stub behavior
expected: Entering a valid CPF triggers an API lookup; if the patient exists, Name, Sex, and Birth Date auto-fill without manual entry. Currently `lookupPatientByCPF` always returns null (stub per D-06). Spinner fires, auto-fill code path exists but no real endpoint wired.
result: [pending]

### 2. SC3 — Metadata field editability
expected: System IDs (SAME, Patient Code, Visit ID, Ticket) render as non-editable metadata cards, not form inputs. Currently fields are editable `<input>` elements with muted styling per D-14 (patient lookup deferred). Confirm muted-but-editable is acceptable.
result: [pending]

### 3. SC6 — Inline error text presentation
expected: Inline validation errors change the field's border color — no detached red text. Implementation has both red border AND a small `.patient-form__error` span below each invalid field (per UI spec). Replaces previous `alert()` popups. Confirm inline span is acceptable.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
