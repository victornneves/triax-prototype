# Phase 9: Patient Form Redesign - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign PatientForm for clarity and efficiency — CPF-first flat form with API lookup stub and auto-fill, computed age from birth date only (remove redundant age field), read-only-styled metadata cards for system IDs (SAME, Visit ID, Patient Code, Ticket, Insurance), refined input styling consistent with existing design token system, input masks for CPF and date fields, logical tab order, and sticky submit button.

**Requirements:** FORM-05

</domain>

<decisions>
## Implementation Decisions

### CPF-first flow
- **D-01:** CPF field moves to the top of the form — first field the clinician sees and interacts with.
- **D-02:** CPF lookup triggers on field blur (when clinician tabs or clicks away) after 11 valid digits are entered. No explicit search button.
- **D-03:** During lookup, a small spinner renders inside/next to the CPF input. Other fields remain visible and empty.
- **D-04:** If CPF matches, auto-fill Name, Sex, and Birth Date. Auto-filled fields remain editable (clinician can override).
- **D-05:** If CPF has no match (new patient), all fields stay empty — clinician fills manually. No toast or special message.
- **D-06:** CPF lookup API endpoint is **deferred** — the frontend should call a patient lookup function that can be wired to a real endpoint later. For now, stub it (return no match). The interface contract should accept a CPF string and return `{ name, sex, birth_date }` or null.

### Form layout
- **D-07:** Flat form — all fields visible at once with CPF repositioned to the top. No progressive disclosure, no collapsible sections for clinical fields.
- **D-08:** Tab order follows: CPF → Name → Birth Date → Sex → Submit. Metadata fields are after the main form section but before the submit button.
- **D-09:** Submit button is sticky at the bottom of the viewport when the form overflows. Uses `position: sticky; bottom: 0` with surface background.

### Age field
- **D-10:** Remove the separate age input field entirely. Age is computed from Birth Date and displayed as a read-only label (e.g., "Idade: 58 anos") next to or below the Birth Date field.
- **D-11:** If no birth date is entered, age label shows "—" placeholder.
- **D-12:** Age calculation reuses the existing `calcAgeFromDDMMYYYY` helper already in ProtocolTriage.jsx.

### Metadata cards
- **D-13:** SAME, Visit ID, Patient Code, Ticket, and Insurance are styled as secondary metadata cards — visually distinct from primary clinical fields (muted background, compact layout, grouped together).
- **D-14:** All metadata fields are editable inputs (not read-only) since the lookup system is deferred. They will eventually auto-fill from the lookup response.
- **D-15:** Metadata cards are always visible with "—" or empty placeholders. They don't hide/show dynamically.
- **D-16:** Metadata section is visually separated from the clinical fields (Name, Birth Date, Sex) with a subtle divider or group label ("Dados Administrativos").

### Input styling
- **D-17:** Follow existing design patterns — refined version of current `.patient-form__input` style. Fixed labels above inputs (no floating labels).
- **D-18:** Refinement: add subtle gray background (`var(--color-bg-secondary)` or similar), keep full border with lighter color at rest, teal primary border + box-shadow on focus (current pattern).
- **D-19:** Metadata card inputs use a more muted variant — lighter border or no border, gray background, smaller text to visually separate from primary fields.
- **D-20:** No new UI library or Material Design dependency. Pure CSS using existing design token system.

### Claude's Discretion
- Exact grid layout for metadata cards (2-col, 3-col, or flexible)
- Spinner implementation detail (CSS animation, inline SVG, or emoji)
- Exact token values for metadata card muted styling
- Whether to extract PatientForm into its own file or keep inside ProtocolTriage.jsx
- How to structure the lookup stub (inline async function, separate module, or hook)
- Sticky submit button z-index and fade/shadow treatment

</decisions>

<specifics>
## Specific Ideas

- Primary motivation for metadata cards: reduce friction during testing — clinician shouldn't need to fill system IDs manually to start a triage
- The lookup system will be built later — this phase creates the interface contract and UI flow, wired to a stub that returns null
- Current form already has CPF with IMask, birth date with IMask, validation on blur, tooltips — this phase restructures the layout and flow, not the individual field mechanics

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current form implementation
- `src/components/ProtocolTriage.jsx` lines 136-385 — `calcAgeFromDDMMYYYY` helper + `PatientForm` component with all field definitions, validation, IMask integration
- `src/components/ProtocolTriage.jsx` lines 600-620 — `handlePatientSubmit` that calls `POST /patient-info`
- `src/components/ProtocolTriage.css` lines 38-138 — All `.patient-form*` CSS classes (wrapper, grids, inputs, submit, labels)
- `src/components/ProtocolTriage.css` lines 899-911 — Error state CSS (`.patient-form__input--error`, `.patient-form__error`, `.patient-form__required`)

### API contract
- `openapi.yaml` lines 400-440 — `POST /patient-info` endpoint: writes patient data to session, all fields optional except session_id
- `openapi.yaml` lines 846-876 — `PatientInfoRequest` schema: name, age, sex, patient_code, birth_date, ticket_number, insurance, visit_id, same

### Design token system
- `src/styles/tokens.css` — All design tokens: colors, spacing, typography, radius, shadows. Input styling must use these tokens.
- `src/components/ui/Button.jsx` + `Button.css` — Reference component for token-backed focus states
- `src/components/ProtocolTriage.css` lines 100-115 — Current input styling to refine (border, focus ring, background)

### Existing form infrastructure (Phase 7 outputs)
- `react-imask` 7 — Already installed, used for CPF (`000.000.000-00`) and birth_date (`00/00/0000`) masks
- `src/components/ui/Tooltip.jsx` — Shared tooltip component, already wired to all form fields
- Validation pattern: `validateField()` switch/case, `handleBlur`, `validateAll()` on submit, `aria-invalid` + `aria-describedby`

### Prior decisions
- `.planning/STATE.md` §Accumulated Context > Decisions — `react-imask` 7 decision, atomic migration, form validation patterns
- `.planning/phases/07-component-migration-accessibility/07-CONTEXT.md` — D-23..D-34: validation, age auto-calc, tooltips, masking decisions (all still apply)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calcAgeFromDDMMYYYY()` (ProtocolTriage.jsx line 136): Age calculation from DD/MM/YYYY string — reuse for computed age label
- `PatientForm` component (ProtocolTriage.jsx lines 156-385): Already extracted as internal component with props `{ onSubmit, loading }` — can be moved to own file
- `IMaskInput` from `react-imask`: Already imported and used for CPF and birth_date fields
- `Tooltip` from `src/components/ui/Tooltip.jsx`: Already wired to all form fields
- Validation logic (ProtocolTriage.jsx lines 172-216): Field-level and form-level validation — keep and extend
- `.patient-form*` CSS classes: Full token-backed styling — refine in place

### Established Patterns
- Co-located CSS: `Component.jsx` + `Component.css` — if PatientForm extracts to own file, it gets its own CSS file
- `[data-app-theme]` scoping: All semantic tokens scoped here; new CSS must use semantic tokens only
- Blur-based validation: `handleBlur` → `validateField` → `setErrors` — CPF lookup follows same trigger pattern
- IMask `onAccept` callback for masked fields (not `onChange`) — established in Phase 7

### Integration Points
- `ProtocolTriage.jsx`: PatientForm renders in the `step === 'patient'` phase; `handlePatientSubmit` receives formData and calls API
- `POST /patient-info`: Receives `session_id` + patient fields. Age field may need adjustment if removed from form (compute server-side or send computed value)
- `tokens.css`: May need new tokens for metadata card muted styling (or reuse `--color-bg-secondary`)

</code_context>

<deferred>
## Deferred Ideas

- CPF lookup API endpoint — backend work needed; frontend stubs the interface contract for now
- Auto-fill of metadata fields (SAME, Visit ID, etc.) from lookup — deferred until lookup endpoint exists
- Patient search by name (fuzzy match) — separate feature, not part of CPF-first flow
- Form field grouping with animated expand/collapse — over-engineered for pilot phase

</deferred>

---

*Phase: 09-patient-form-redesign*
*Context gathered: 2026-04-09*
