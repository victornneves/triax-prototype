# Phase 7: Component Migration + Accessibility - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Every component uses design tokens instead of inline styles, the app meets WCAG 2.1 AA contrast and semantic HTML requirements, form interactions are improved (validation, auto-calc, tooltips, masking), and the sensor panel is responsive. No new features — this is migration + accessibility + form UX within existing components.

**Requirements:** LAYT-01, LAYT-02, A11Y-01, A11Y-02, A11Y-03, FORM-01, FORM-02, FORM-03, FORM-04

</domain>

<decisions>
## Implementation Decisions

### Inline style migration strategy
- **D-01:** File-by-file atomic migration — each component gets a co-located `.css` file (same pattern as Header.css). Never mix inline styles and token classes in the same file; full swap per component in one commit.
- **D-02:** Migration order by complexity: AdminUsers (23 inline) → RequireAdmin (1) → Profile (39) → HistoryPage (48) → TriageDetailsModal (77) → ProtocolTriage (108). Smallest first to build the CSS extraction pattern, heaviest last.
- **D-03:** App.jsx's 6 inline styles migrate into existing App.css — no new file needed.
- **D-04:** Extract common patterns into shared utility classes in `index.css` (e.g., `.container`, `.page-title`, `.card`) only when 3+ components share the exact same pattern. No premature abstractions.
- **D-05:** Add `--radius-sm` (0.25rem), `--radius-md` (0.5rem), `--radius-lg` (0.75rem), `--shadow-sm`, `--shadow-md`, and `--transition-fast` (150ms) tokens to `tokens.css` — needed for migrated components.

### Sensor panel responsive behavior (LAYT-01)
- **D-06:** Sensor panel is a `<aside>` element positioned as a sidebar on desktop (≥768px) and collapses to a toggleable drawer on mobile (<768px).
- **D-07:** On desktop: sensor panel is always visible alongside the chat column. On mobile: collapsed by default, toggle button (pill-shaped, fixed bottom-right) expands it as a slide-up overlay.
- **D-08:** Collapse/expand uses CSS transitions (max-height or transform) — no JS animation library. State managed via `useState` in ProtocolTriage.
- **D-09:** When collapsed on mobile, show a compact "vitals summary" strip (e.g., "SpO2: 98% | FC: 80 | T: 36.5°C") so clinicians see current values without expanding.

### Global status bar (LAYT-02)
- **D-10:** Thin bar below Header showing: session ID (truncated), selected protocol name, and connection indicator (green dot = online). Only visible during active triage session (ProtocolTriage route).
- **D-11:** Implemented as a `StatusBar.jsx` component in `src/components/ui/`, rendered conditionally in ProtocolTriage. Uses token-backed CSS.
- **D-12:** Connection status uses `navigator.onLine` + `online`/`offline` event listeners. Green dot = connected, red dot = disconnected with "Sem conexão" text.

### Semantic HTML + ARIA (A11Y-02)
- **D-13:** All form labels converted from styled `<div>` to `<label htmlFor={id}>`. Every input gets a unique `id` and its label gets matching `htmlFor`.
- **D-14:** Header profile `<div onClick>` converted to `<button>` or `<Link>`.
- **D-15:** Modal uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title. Focus trapped inside modal when open.
- **D-16:** Tables in HistoryPage, Profile, AdminUsers get `<caption>` elements and `scope="col"` on header cells.

### Focus indicators (A11Y-03)
- **D-17:** Global `:focus-visible` style in `index.css`: `outline: 2px solid var(--color-primary); outline-offset: 2px`. Applies to all interactive elements (inputs, buttons, links, selects).
- **D-18:** Remove browser default `outline: 4px auto -webkit-focus-ring-color` in favor of consistent token-backed focus ring.
- **D-19:** Dark mode focus ring uses same `--color-primary` token (already has dark override).

### Contrast compliance (A11Y-01)
- **D-20:** Audit all hardcoded hex values (`#666`, `#555`, `#999`, etc.) and replace with token references that meet 4.5:1 ratio. `--color-text-secondary` and `--color-text-muted` must be validated.
- **D-21:** MTS priority badge text colors checked — `--mts-yellow` background gets `--mts-yellow-text: #000000` (already exists from Phase 5).
- **D-22:** All new CSS uses semantic tokens only — no raw hex values in component CSS files.

### Form validation (FORM-01)
- **D-23:** Custom validation logic — no library. Validation runs on blur for individual fields and on submit for the full form.
- **D-24:** Error state: red border (`--color-feedback-error-text`), inline error message below field, `aria-invalid="true"` + `aria-describedby` pointing to error message element.
- **D-25:** Required fields: `name` and `age` (already required). Show asterisk (*) indicator next to label.
- **D-26:** Validation rules: name (non-empty), age (1-150 integer), birth_date (valid DD/MM/YYYY), CPF (11 digits), blood_pressure (systolic/diastolic in range).

### Age auto-calculation (FORM-02)
- **D-27:** When birth_date is filled and valid (DD/MM/YYYY), auto-calculate and populate age field. Age field remains editable (clinician override).
- **D-28:** Calculation uses simple year subtraction with month/day adjustment — no date library needed.

### Contextual help tooltips (FORM-03)
- **D-29:** Small info icon (ⓘ) next to each form label. Hover/focus shows tooltip with field description and expected format.
- **D-30:** Reuse the existing tooltip pattern from ProtocolTriage sensor tooltips (lines 1470-1499) — extract into a shared `Tooltip.jsx` component in `src/components/ui/`.
- **D-31:** Tooltip content is static PT-BR strings defined inline per field. No i18n.

### Input masking (FORM-04)
- **D-32:** Use `react-imask` 7 (per STATE.md decision — react-input-mask archived Dec 2025).
- **D-33:** Masked fields: birth_date (DD/MM/AAAA), CPF (000.000.000-00), blood_pressure systolic/diastolic (3-digit numbers).
- **D-34:** Masking is visual formatting only — stored values remain unformatted for API compatibility.

### Claude's Discretion
- Exact breakpoint values beyond 768px threshold
- Tooltip positioning logic (above/below/auto)
- Specific validation error message wording (PT-BR)
- How to structure ProtocolTriage.css given the file's 1500 LOC
- Whether to split ProtocolTriage into sub-components during migration or keep monolithic
- Exact compact vitals summary format on mobile
- StatusBar layout and styling details

</decisions>

<specifics>
## Specific Ideas

- Migration pattern reference: Header.jsx + Header.css from Phase 5 — same approach for all components
- Sensor panel should feel like a utility drawer, not a separate page — clinicians need quick access to vitals without leaving the chat flow
- Form validation should be lightweight — clinicians are under time pressure, don't block them with aggressive validation
- Tooltips should be unobtrusive — info icon only, no automatic popups

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system (Phase 5-6 outputs)
- `src/styles/tokens.css` — All design tokens: colors, spacing, typography. Add radius/shadow/transition tokens here.
- `src/components/ui/Button.jsx` + `Button.css` — Reference component with token-backed CSS, focus-visible
- `src/components/Header.jsx` + `src/components/Header.css` — Reference migration pattern (inline → co-located CSS)
- `src/components/ui/Toast.jsx` + `Toast.css` — ARIA live region pattern for accessibility reference

### Components to migrate (by migration order)
- `src/pages/AdminUsers.jsx` (133 LOC, 23 inline styles) — Admin table, simplest migration
- `src/components/RequireAdmin.jsx` (22 LOC, 1 inline style) — Trivial
- `src/pages/Profile.jsx` (187 LOC, 39 inline styles) — User history table
- `src/components/HistoryPage.jsx` (293 LOC, 48 inline styles) — Session list + detail view
- `src/components/TriageDetailsModal.jsx` (507 LOC, 77 inline styles) — Modal with tabs
- `src/components/ProtocolTriage.jsx` (1506 LOC, 108 inline styles) — Main triage: form, chat, sensors

### Form structure
- `src/components/ProtocolTriage.jsx` lines 166-275 — Patient form with inputStyle object, handleChange, handleSubmit
- `src/components/ProtocolTriage.jsx` lines 8-73 — SENSOR_CONFIG object with all sensor metadata
- `src/components/ProtocolTriage.jsx` lines 1320-1464 — Sensor panel rendering
- `src/components/ProtocolTriage.jsx` lines 1470-1499 — Existing tooltip portal (reuse for Tooltip.jsx)

### Existing CSS files
- `src/App.css` — Priority badges, step container, error class
- `src/index.css` — Global reset, animations, current focus styles to replace

### Requirements
- `.planning/REQUIREMENTS.md` — LAYT-01, LAYT-02, A11Y-01, A11Y-02, A11Y-03, FORM-01 through FORM-04

### Prior decisions
- `.planning/STATE.md` §Accumulated Context > Decisions — react-imask 7 decision, atomic migration pattern, MTS color immutability
- `.planning/phases/05-design-token-foundation/05-CONTEXT.md` — Token structure (D-05..D-08), co-located CSS pattern (D-10)
- `.planning/phases/06-ui-primitives-toast/06-CONTEXT.md` — Button API (D-10..D-13), animation approach (D-14..D-16)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button.jsx` + `Button.css`: Shared button primitive with 3 variants, focus-visible — adopt across all components during migration
- `Toast.jsx` + `ToastProvider.jsx`: ARIA live region pattern — reference for other accessibility implementations
- `Header.css`: Reference co-located CSS file with token-backed styles — migration pattern for all components
- `tokens.css`: 155 lines of design tokens (colors, spacing, typography) — need radius/shadow/transition additions
- `SENSOR_CONFIG` object (ProtocolTriage.jsx lines 8-73): Structured sensor metadata with labels, units, ranges — reuse for tooltip content
- Tooltip portal (ProtocolTriage.jsx lines 1470-1499): Existing tooltip positioning logic — extract to shared component

### Established Patterns
- Co-located CSS: `ComponentName.jsx` + `ComponentName.css` (Header, Button, Toast examples)
- `[data-app-theme]` scoping: All semantic tokens scoped here; new component CSS must use semantic tokens
- Atomic migration: Full inline-to-token swap per file in one commit (Phase 5 precedent)
- React Context pattern: `ToastProvider` wraps app — same pattern available for StatusBar if needed

### Integration Points
- `src/App.jsx`: StatusBar component renders below Header, above Routes (only on triage route)
- `src/components/ProtocolTriage.jsx`: Sensor panel restructured for responsive layout; form inputs get validation + masking
- `src/index.css`: Global `:focus-visible` styles added here
- `src/styles/tokens.css`: New radius/shadow/transition tokens added to existing file
- `package.json`: `react-imask` 7 dependency added for input masking

</code_context>

<deferred>
## Deferred Ideas

- Splitting ProtocolTriage.jsx into sub-components (PatientForm, ChatPanel, SensorPanel) — valuable refactor but scope creep for a migration phase. Consider for a future refactor phase if the monolith becomes unmanageable.
- Page-level route transitions — deferred from Phase 6, still not needed for migration.
- Additional UI primitives (Card, Input, Badge) as standalone components — only create if 3+ components need them during migration. Otherwise inline the patterns.

</deferred>

---

*Phase: 07-component-migration-accessibility*
*Context gathered: 2026-04-08*
