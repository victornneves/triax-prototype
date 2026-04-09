# Phase 9: Patient Form Redesign - Research

**Researched:** 2026-04-09
**Domain:** React form UX — layout restructure, IMask integration, CSS-only styling, API stub pattern
**Confidence:** HIGH

## Summary

This phase is a surgical restructure of an already-functional form. The technical ingredients (IMask 7, validation on blur, Tooltip, token-backed CSS) are all in place from Phase 7. No new libraries are needed. The work is: reorder fields (CPF first), remove the age input (replace with computed label), group metadata fields into a visually distinct section, add a CPF lookup stub, and make the submit button sticky.

The key risk is `handlePatientSubmit` in ProtocolTriage.jsx at line 604, which reads `data.age` both for the POST body and for the transcription string. When the age input is removed, the form will no longer produce `formData.age` as a user-entered value — instead the PatientForm must compute age from birth_date and include it in the submitted data object. The `handlePatientSubmit` caller does not need to change; the fix lives entirely inside PatientForm.

PatientForm is currently an internal component of ProtocolTriage.jsx (lines 156-385). It renders at line 1177 via `<PatientForm onSubmit={handlePatientSubmit} loading={loading} />`. Extraction to its own file is left to Claude's discretion but is low-risk since the interface is clean (`onSubmit`, `loading` props only).

**Primary recommendation:** Restructure PatientForm in-place (or extracted file), using only existing tokens and IMask — zero new dependencies. Wire CPF lookup as an inline async stub that returns `null`. Ship computed age as part of the `onSubmit` data payload so `handlePatientSubmit` requires no changes.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** CPF field moves to the top of the form — first field the clinician sees.
- **D-02:** CPF lookup triggers on field blur after 11 valid digits are entered. No explicit search button.
- **D-03:** During lookup, a small spinner renders inside/next to the CPF input. Other fields remain visible and empty.
- **D-04:** If CPF matches, auto-fill Name, Sex, and Birth Date. Auto-filled fields remain editable.
- **D-05:** If CPF has no match (new patient), all fields stay empty — clinician fills manually. No toast or special message.
- **D-06:** CPF lookup API endpoint is **deferred** — stub it (return no match). Interface contract: accepts CPF string, returns `{ name, sex, birth_date }` or `null`.
- **D-07:** Flat form — all fields visible at once with CPF repositioned to top. No progressive disclosure.
- **D-08:** Tab order: CPF → Name → Birth Date → Sex → Submit. Metadata fields are after main section but before submit.
- **D-09:** Submit button is sticky at the bottom of the viewport. Uses `position: sticky; bottom: 0` with surface background.
- **D-10:** Remove the separate age input field entirely. Age is computed from Birth Date and displayed as a read-only label (e.g., "Idade: 58 anos").
- **D-11:** If no birth date, age label shows "—" placeholder.
- **D-12:** Age calculation reuses `calcAgeFromDDMMYYYY` helper already in ProtocolTriage.jsx line 145.
- **D-13:** SAME, Visit ID, Patient Code, Ticket, and Insurance are styled as secondary metadata cards — muted background, compact, grouped.
- **D-14:** All metadata fields are editable inputs (not read-only) since lookup is deferred.
- **D-15:** Metadata cards always visible with "—" or empty placeholders. No dynamic show/hide.
- **D-16:** Metadata section separated from clinical fields with subtle divider or group label ("Dados Administrativos").
- **D-17:** Fixed labels above inputs (no floating labels). Refined version of current `.patient-form__input` style.
- **D-18:** Refined input: subtle gray background (`var(--color-bg-secondary)` or similar), full border at rest with lighter color, teal primary border + box-shadow on focus.
- **D-19:** Metadata card inputs: more muted variant — lighter border or no border, gray background, smaller text.
- **D-20:** No new UI library or Material Design dependency. Pure CSS using existing design token system.

### Claude's Discretion

- Exact grid layout for metadata cards (2-col, 3-col, or flexible)
- Spinner implementation detail (CSS animation, inline SVG, or emoji)
- Exact token values for metadata card muted styling
- Whether to extract PatientForm into its own file or keep inside ProtocolTriage.jsx
- How to structure the lookup stub (inline async function, separate module, or hook)
- Sticky submit button z-index and fade/shadow treatment

### Deferred Ideas (OUT OF SCOPE)

- CPF lookup API endpoint — backend work needed; frontend stubs the interface contract for now
- Auto-fill of metadata fields (SAME, Visit ID, etc.) from lookup
- Patient search by name (fuzzy match)
- Form field grouping with animated expand/collapse
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FORM-05 | CPF-first progressive form with API lookup and auto-fill, computed age, read-only metadata cards, Material-style inputs, input masks, inline validation errors, logical tab order, sticky submit button | Covered by: existing IMask 7 integration, `calcAgeFromDDMMYYYY` helper, token system, blur-based validation pattern, CSS `position: sticky` |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-imask` | 7.6.1 (installed) | CPF mask `000.000.000-00` and date mask `00/00/0000` | Already in use for these exact fields in Phase 7 |
| CSS custom properties (tokens.css) | N/A | All input/card styling | Established token system; no new library |
| React `useState` / `useEffect` | React 19.2.0 | CPF lookup state, spinner state, computed age | Native React, no external state needed |

### Supporting (already in codebase)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Tooltip` component | `src/components/ui/Tooltip.jsx` | Field help text | All primary clinical fields |
| `Button` component | `src/components/ui/Button.jsx` | Submit button (optional) | If submit needs loading spinner via shared primitive |
| `calcAgeFromDDMMYYYY` | ProtocolTriage.jsx line 145 | Compute age from DD/MM/YYYY | Called on every `birth_date` IMask `onAccept` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline async lookup stub | Separate `patientLookup.js` module | Module is cleaner for future real endpoint wiring, but inline stub is simpler for this phase |
| CSS `position: sticky` for submit | `position: fixed` | Sticky is contained within scrollable ancestor; fixed is viewport-wide and requires z-index management |
| CSS animation spinner | `btn__spinner` from Button.css | Button.css spinner is already proven; reusing it avoids duplicating the `@keyframes` |

**Installation:** None required. All dependencies are already in `package-lock.json`.

---

## Architecture Patterns

### Recommended Project Structure

If PatientForm is extracted (Claude's discretion):

```
src/components/
├── PatientForm.jsx          # Extracted component (was ProtocolTriage.jsx lines 156-385)
├── PatientForm.css          # Co-located CSS (was relevant blocks in ProtocolTriage.css)
├── ProtocolTriage.jsx       # Import PatientForm from ./PatientForm
└── ProtocolTriage.css       # Remove extracted .patient-form* blocks
```

If PatientForm stays inline (also acceptable):

```
src/components/
├── ProtocolTriage.jsx       # PatientForm stays as internal component, restructured in-place
└── ProtocolTriage.css       # patient-form* CSS blocks restructured in-place
```

### Pattern 1: CPF Blur Lookup with Spinner

**What:** On CPF field blur, if 11 digits are present, set `isLookingUp = true`, call the stub, await result, auto-fill or leave empty, then set `isLookingUp = false`.

**When to use:** D-02 — blur trigger after full 11-digit CPF input.

```jsx
// Source: derived from existing handleBlur + IMask onAccept pattern in ProtocolTriage.jsx
const [isLookingUp, setIsLookingUp] = useState(false);

// Lookup stub — wire to real endpoint later
async function lookupPatientByCPF(cpf) {
  // cpf: raw 11-digit string (unmask=true on IMask)
  return null; // stub: always "no match"
}

const handleCpfBlur = async () => {
  const cpfDigits = formData.cpf; // already unmasked (11 digits) via onAccept unmask=true
  const error = validateField('cpf', cpfDigits);
  setErrors(prev => ({ ...prev, cpf: error }));
  if (!error && cpfDigits && cpfDigits.length === 11) {
    setIsLookingUp(true);
    try {
      const result = await lookupPatientByCPF(cpfDigits);
      if (result) {
        setFormData(prev => ({
          ...prev,
          name: result.name,
          sex: result.sex,
          birth_date: result.birth_date,
        }));
      }
      // D-05: no message on no-match
    } finally {
      setIsLookingUp(false);
    }
  }
};
```

**Note on IMask + blur:** IMask's `onBlur` event works identically to native `onBlur`. The existing CPF field already uses `onBlur={handleBlur}` — replace with `onBlur={handleCpfBlur}`.

### Pattern 2: Computed Age Read-Only Label

**What:** Replace the age `<input>` with a `<p>` or `<span>` that shows computed age or "—".

**When to use:** D-10, D-11, D-12.

```jsx
// Source: existing calcAgeFromDDMMYYYY (ProtocolTriage.jsx line 145)
const computedAge = calcAgeFromDDMMYYYY(formData.birth_date);

// In JSX (replaces age input):
<div>
  <label className="patient-form__label">Idade</label>
  <p className="patient-form__age-display">
    {computedAge !== null ? `${computedAge} anos` : '—'}
  </p>
</div>
```

**Critical — age in submit payload:** `handlePatientSubmit` in ProtocolTriage.jsx reads `data.age` at lines 615 and 630. PatientForm's `onSubmit(formData)` must include `age: computedAge`. Compute at submit time:

```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateAll()) return;
  const age = calcAgeFromDDMMYYYY(formData.birth_date);
  onSubmit({ ...formData, age: age !== null ? age : undefined });
};
```

### Pattern 3: Metadata Card Section

**What:** Group SAME, Visit ID, Patient Code, Ticket, Insurance in a visually distinct section with a group label and muted input variant.

**When to use:** D-13, D-14, D-15, D-16.

```jsx
// Source: established pattern in ProtocolTriage.css
<section className="patient-form__metadata" aria-label="Dados Administrativos">
  <h4 className="patient-form__section-label">Dados Administrativos</h4>
  <div className="patient-form__metadata-grid">
    {/* Patient Code, Ticket, Insurance, Visit ID, SAME inputs */}
    {/* Each uses patient-form__meta-input class (muted variant) */}
  </div>
</section>
```

### Pattern 4: Sticky Submit Button

**What:** Button stays at bottom of viewport when form overflows scroll container.

**When to use:** D-09.

```css
/* Source: CSS spec position:sticky — confirmed behavior */
.patient-form__submit-wrapper {
  position: sticky;
  bottom: 0;
  background-color: var(--color-surface);
  padding: var(--spacing-md) 0 0;
  /* Optional: subtle top shadow to separate from scrolled content */
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  z-index: 1;
}
```

**Critical constraint:** `position: sticky` only works if the form's scroll ancestor has `overflow: auto` or `overflow: scroll` (not `overflow: hidden`). The current `.patient-form-wrapper` uses `align-items: center` on a flex container — verify this doesn't clip sticky. If the form is taller than viewport and wraps in a scrollable ancestor, sticky works. If the wrapper clips, use `position: fixed` + bottom padding on form.

### Pattern 5: CPF Spinner in Input

**What:** Small spinner overlaid inside/beside CPF input during lookup.

**When to use:** D-03, `isLookingUp === true`.

```jsx
// Source: btn__spinner pattern from Button.css — reuse same @keyframes
<div className="patient-form__cpf-wrapper">
  <IMaskInput ... />
  {isLookingUp && <span className="patient-form__cpf-spinner" aria-label="Buscando paciente..." />}
</div>
```

```css
/* Reuse btn-spin keyframes from Button.css, or redeclare locally */
.patient-form__cpf-wrapper {
  position: relative;
}
.patient-form__cpf-spinner {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 1em;
  height: 1em;
  border: 2px solid var(--color-border-strong);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}
```

### Pattern 6: Tab Order

**What:** HTML DOM order drives natural tab flow. Use `tabIndex` only if DOM order cannot match logical order.

**When to use:** D-08. Logical order: CPF → Name → Birth Date → Sex → metadata fields → Submit.

Since CPF moves to top (DOM order position 1) and Name follows (position 2), natural DOM order should match the desired tab order. No `tabIndex` needed if JSX order matches.

**Note:** The metadata inputs come after the primary clinical fields in DOM order. Since metadata is a separate `<section>` after the clinical block, tab naturally flows there before the sticky submit wrapper.

### Anti-Patterns to Avoid

- **Floating labels:** D-17 locks fixed labels above inputs — do not implement floating label pattern.
- **Progressive disclosure:** D-07 locks flat form — all fields visible at once.
- **Toast on CPF no-match:** D-05 explicitly says no message on no match. Clinician just fills fields manually.
- **Making metadata fields read-only:** D-14 keeps them editable (lookup deferred).
- **Removing `age` from submit payload:** `handlePatientSubmit` at line 615 and 630 reads `data.age` — PatientForm must compute and include it even though the input is gone.
- **Using `position: fixed` for submit:** `position: sticky` is the spec-correct choice (D-09); fixed breaks within scroll containers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CPF input mask `000.000.000-00` | Custom regex replace | `IMaskInput` from `react-imask` (already installed) | Already proven in the form; edge cases with cursor position, paste, deletion all handled |
| Date mask `00/00/0000` | Custom `onChange` formatter | `IMaskInput` from `react-imask` (already installed) | Same rationale; `onAccept` fires only on valid input |
| CSS spinner animation | Custom SVG icon or emoji | Reuse `.btn__spinner` pattern + `@keyframes btn-spin` from Button.css | Zero new code; same visual language as loading buttons |
| Age computation | Duplicate logic | `calcAgeFromDDMMYYYY` at ProtocolTriage.jsx line 145 | Already handles edge cases (partial dates, future dates, age bounds 1-150) |

**Key insight:** This phase is entirely a restructure of existing building blocks. The only genuinely new code is the CPF lookup stub, the metadata section CSS, the sticky submit wrapper CSS, and the computed age label. Everything else is rearranging and refining existing patterns.

---

## Common Pitfalls

### Pitfall 1: Age Lost from Submit Payload

**What goes wrong:** Remove the age `<input>`, forget to compute and pass `age` in `onSubmit(formData)`. `handlePatientSubmit` sends `age: undefined` to the API and builds the transcription string as `IDADE: undefined`.

**Why it happens:** `formData.age` previously held the user-typed value; once the input is gone, nothing populates it.

**How to avoid:** In `handleSubmit` inside PatientForm, compute age from `formData.birth_date` using `calcAgeFromDDMMYYYY` and merge it into the submitted object:
```js
onSubmit({ ...formData, age: calcAgeFromDDMMYYYY(formData.birth_date) ?? undefined });
```
Remove `age` from `formData` initial state to avoid confusion.

**Warning signs:** Console shows `IDADE: undefined` in transcription string after submit.

### Pitfall 2: Sticky Submit Blocked by Ancestor `overflow: hidden`

**What goes wrong:** The `.patient-form-wrapper` (currently `display: flex; align-items: center`) wraps the form. If the viewport is short and the form overflows, the sticky behavior may not activate.

**Why it happens:** `position: sticky` requires the element to be inside a scroll container. If no ancestor has `overflow: auto/scroll`, the sticky element either doesn't stick or the form gets clipped.

**How to avoid:** Wrap the form in a container with `overflow-y: auto; max-height: 100vh` (or `100dvh`). The sticky submit wrapper inside will then stick to the bottom of that scroll container. Check that `.patient-form-wrapper` doesn't set `overflow: hidden`.

**Warning signs:** Submit button scrolls out of view on a short screen; or button never leaves bottom of form even when form is short.

### Pitfall 3: IMask `onAccept` vs `onBlur` for CPF Lookup Trigger

**What goes wrong:** Triggering CPF lookup in `onAccept` (fires on every keystroke) rather than `onBlur` (fires once on blur). This causes a lookup attempt on every digit typed.

**Why it happens:** `onAccept` is the IMask-equivalent of `onChange` — it fires whenever the value changes. D-02 specifies blur as the trigger.

**How to avoid:** Keep lookup logic exclusively in `onBlur` / `handleCpfBlur`. `onAccept` only updates `formData.cpf`.

**Warning signs:** Lookup spinner appears while typing CPF digits.

### Pitfall 4: Metadata Section Disrupts Tab Order

**What goes wrong:** Metadata fields appear before primary clinical fields in DOM order, pulling tab focus to SAME/Visit ID before Name/Birth Date.

**Why it happens:** If metadata section is placed between CPF and Name in JSX.

**How to avoid:** JSX order must be: CPF → Name → Birth Date → Sex → (metadata section) → submit wrapper. Metadata section comes after Sex in DOM order.

**Warning signs:** Pressing Tab from CPF jumps to SAME/Patient Code instead of Name.

### Pitfall 5: Dark Mode Regression on New CSS Classes

**What goes wrong:** New CSS classes for metadata cards, age label, or submit wrapper use raw hex colors or `--color-surface` in ways that don't invert correctly in dark mode.

**Why it happens:** Adding new styles without checking dark mode token coverage.

**How to avoid:** Use only semantic tokens from `tokens.css` — `--color-surface-muted`, `--color-border`, `--color-text-secondary`, `--color-text-muted`. These already have dark mode overrides in `[data-app-theme="dark"]`. Never use `--color-gray-*` primitives directly in new component CSS.

**Warning signs:** Metadata cards appear with light background in dark mode.

### Pitfall 6: `validateAll()` Still References `age` Field

**What goes wrong:** `validateAll()` at line 208 calls `validateField('age', formData.age)` — if `age` is removed from `formData`, this becomes `validateField('age', undefined)` which returns no error (age validation is optional), but it adds a spurious `null` to `newErrors`. This is functionally harmless but should be cleaned up.

**Why it happens:** The `validateAll` function is a copy of field-by-field validation calls that was built when `age` was a user input.

**How to avoid:** Remove the `age` case from `validateField` switch and from `validateAll` when removing the age input.

---

## Code Examples

### Revised PatientForm Initial State (remove `age`)

```jsx
// Source: ProtocolTriage.jsx line 157 — after removing age field
const [formData, setFormData] = useState({
  cpf: '',
  name: '',
  sex: 'M',
  birth_date: '',
  patient_code: '',
  ticket_number: '',
  insurance: '',
  visit_id: '',
  same: ''
});
// age is computed at submit time — not stored in formData
```

### Computed Age Display

```jsx
// Source: calcAgeFromDDMMYYYY at ProtocolTriage.jsx line 145
const computedAge = calcAgeFromDDMMYYYY(formData.birth_date);

<div className="patient-form__age-display-wrapper">
  <span className="patient-form__label">Idade</span>
  <p className="patient-form__age-display" aria-live="polite">
    {computedAge !== null ? `${computedAge} anos` : '—'}
  </p>
</div>
```

### Metadata Card Section CSS (new tokens needed)

```css
/* Uses only existing semantic tokens — no new primitives needed */
.patient-form__metadata {
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.patient-form__section-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--spacing-sm);
}

.patient-form__meta-input {
  width: 100%;
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);      /* lighter than primary inputs */
  background-color: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);             /* smaller than primary */
  box-sizing: border-box;
}

.patient-form__meta-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.12);
}
```

### Sticky Submit Wrapper CSS

```css
.patient-form__submit-wrapper {
  position: sticky;
  bottom: 0;
  background-color: var(--color-surface);
  padding-top: var(--spacing-md);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1;
}
```

### Input Style Refinement (D-18)

```css
/* Refine existing .patient-form__input — add subtle gray background */
.patient-form__input {
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);          /* lighter at rest (was --color-border-strong) */
  box-sizing: border-box;
  background-color: var(--color-surface-muted);   /* subtle gray (was --color-surface/white) */
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.patient-form__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
  background-color: var(--color-surface);         /* lighten on focus for clarity */
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-input-mask` | `react-imask` 7 | Phase 7 (Dec 2025 archive) | `react-imask` uses `onAccept` not `onChange` — already applied to existing CPF/date fields |
| Age as user-editable `<input type="number">` | Age computed from birth_date, display-only | Phase 9 (this phase) | `validateField('age', ...)` and `formData.age` initial state must be removed |
| CPF positioned after Name | CPF at top (first field) | Phase 9 (this phase) | DOM order must change; tab order follows naturally |

**Deprecated/outdated in this phase:**

- `formData.age` initial state key — remove when age input is removed
- `validateField` case `'age'` — remove with age input
- `newErrors.age = validateField('age', ...)` in `validateAll` — remove
- `patient-form__grid-2`, `patient-form__grid-half`, `patient-form__grid-equal` CSS classes — may be reorganized/renamed; new grid structure serves new layout

---

## Open Questions

1. **Does `handlePatientSubmit` transcription string need updating?**
   - What we know: Line 630 builds `PACIENTE: ${data.name}, IDADE: ${data.age}, ...` — the age value will now come from the computed value passed in the submit payload, not a user input. If `age` is `null` (no birth date), the string would show `IDADE: null`.
   - What's unclear: Whether "IDADE: null" in the transcription context string causes a backend problem, or just a cosmetic issue.
   - Recommendation: PatientForm should always pass a numeric age or `undefined`. `handlePatientSubmit` should guard: `IDADE: ${data.age ?? 'não informada'}` — but this is inside ProtocolTriage.jsx, outside PatientForm. Flag for implementor.

2. **Scroll container for sticky submit**
   - What we know: `.patient-form-wrapper` is `display: flex; align-items: center; height: 100%`. The form element inside has `max-width: 600px`. On short viewports, overflow behavior is not explicitly set.
   - What's unclear: Whether the triage-layout or parent container allows the form to scroll or clips it.
   - Recommendation: Implementor must test on a viewport shorter than the form height. If sticky doesn't activate, wrap form content in a `div` with `overflow-y: auto` and move sticky wrapper outside that div.

3. **Should `PatientForm` be extracted to its own file?**
   - What we know: Interface is clean (2 props). Co-located CSS pattern is established. ProtocolTriage.jsx is 1570 lines.
   - What's unclear: Whether extraction is worth the cross-file refactor cost vs. benefit.
   - Recommendation: Extract to `PatientForm.jsx` + `PatientForm.css`. ProtocolTriage.jsx is already very large; extraction makes both files more maintainable and follows the project's co-located CSS convention. This is Claude's discretion per CONTEXT.md.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` — this section is included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — "Test suite: Zero coverage is known risk; adding tests is a future milestone" (REQUIREMENTS.md Out of Scope) |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FORM-05 (CPF lookup) | CPF blur triggers lookup stub | manual-only | N/A — no test infrastructure | N/A |
| FORM-05 (auto-fill) | Fields fill on lookup match | manual-only | N/A | N/A |
| FORM-05 (computed age) | Age label updates from birth date | manual-only | N/A | N/A |
| FORM-05 (metadata cards) | Metadata section visually distinct | manual-only | N/A | N/A |
| FORM-05 (sticky submit) | Submit stays visible on scroll | manual-only | N/A | N/A |
| FORM-05 (tab order) | Tab flows CPF→Name→Birth→Sex→submit | manual-only | N/A | N/A |
| FORM-05 (inline errors) | Error changes border color, no detached text | manual-only | N/A | N/A |

**Justification for all manual-only:** REQUIREMENTS.md explicitly lists "Test suite" as Out of Scope. No test runner, config, or test files exist in the project. All verification is manual UAT per VERIFICATION.md pattern established in Phase 8.

### Sampling Rate

- **Per task commit:** Manual browser check in dev server (`npm run dev`)
- **Per wave merge:** Full manual UAT of all FORM-05 success criteria
- **Phase gate:** All 8 success criteria verified manually before `/gsd:verify-work`

### Wave 0 Gaps

None — no automated test infrastructure is expected or needed for this project per REQUIREMENTS.md.

---

## Sources

### Primary (HIGH confidence)

- ProtocolTriage.jsx lines 136-385 — `calcAgeFromDDMMYYYY`, `PatientForm` component, IMask usage, validation, all field definitions
- ProtocolTriage.jsx lines 604-648 — `handlePatientSubmit` — API call, age field usage in payload and transcription string
- ProtocolTriage.css lines 38-138, 899-914 — All `.patient-form*` CSS classes including error states
- `src/styles/tokens.css` — Full semantic token inventory (light + dark); confirmed available tokens for metadata card styling
- `openapi.yaml` lines 400-440, 846-885 — `POST /patient-info` contract; `age` is an optional integer field (can be computed and passed)
- `src/components/ui/Button.jsx` + `Button.css` — `btn__spinner` pattern for CPF lookup spinner reuse
- `src/components/ui/Tooltip.jsx` — Tooltip interface (`content`, `label` props)
- `.planning/phases/09-patient-form-redesign/09-CONTEXT.md` — All decisions D-01 through D-20

### Secondary (MEDIUM confidence)

- STATE.md accumulated decisions — `react-imask` 7 decision confirmed, IMask `onAccept` pattern confirmed
- `react-imask` 7.6.1 installed version confirmed via `npm view react-imask --prefix` — `IMaskInput`, `onAccept`, `unmask` props are established API

### Tertiary (LOW confidence)

- None — all findings verified against source code or installed packages

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries already installed and in active use; versions verified
- Architecture: HIGH — patterns derived directly from existing codebase, not hypothetical
- Pitfalls: HIGH — derived from reading actual code (age in submit payload, validateAll age case, sticky CSS constraint)
- CSS token availability: HIGH — tokens.css read in full; confirmed `--color-surface-muted`, `--color-border`, `--color-text-muted`, `--color-text-secondary` all exist with dark mode overrides

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase; no external API changes expected)
