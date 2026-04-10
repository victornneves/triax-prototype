# Phase 12: Vital Signs UX - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual indicators for abnormal/critical vital sign values on the sensor panel, and make blood pressure input mobile-friendly with a stacked layout on narrow viewports. No changes to triage logic, API payloads, or sensor submission behavior.

**Requirements:** VITALS-01, VITALS-02

</domain>

<decisions>
## Implementation Decisions

### Clinical thresholds (VITALS-01)
- **D-01:** Two-tier system — "warning" (abnormal, outside normal range) and "critical" (immediately dangerous). Normal values show no indicator.
- **D-02:** Thresholds per vital sign, based on standard emergency nursing references:

| Vital Sign | Normal | Warning | Critical |
|---|---|---|---|
| Temperature | 36.5-37.4 °C | <36 or >38 | <35 or >40 |
| Heart Rate | 60-100 bpm | <50 or >110 | <40 or >130 |
| SpO2 | >=95% | 90-94% | <90% |
| Respiratory Rate | 12-20 irpm | <10 or >24 | <8 or >30 |
| Blood Glucose | 70-140 mg/dL | <60 or >200 | <40 or >400 |
| BP Systolic | 90-140 mmHg | <80 or >160 | <70 or >200 |
| BP Diastolic | 60-90 mmHg | <50 or >100 | <40 or >120 |
| GCS | 15 | 9-14 | <=8 |
| Pain | 0-3 | 4-6 | 7-10 |

- **D-03:** `getFieldStatus(key, value)` returns `null` (normal/empty), `"warning"`, or `"critical"`. Defined in ProtocolTriage and passed to SensorPanel as callback prop — follows Phase 10 D-06/D-07 contract.
- **D-04:** For blood_pressure (composite), getFieldStatus receives the key `"blood_pressure"` and evaluates both `bp_systolic` and `bp_diastolic` from sensorInputs. Worst-case wins (if systolic is critical but diastolic is warning, the field shows critical).
- **D-05:** Empty/unfilled fields return `null` — no indicator shown for fields the clinician hasn't entered yet.

### Visual indicator treatment (VITALS-01)
- **D-06:** CSS-only styling via `[data-field-status]` attribute already on the `.triage-sensors__item` wrapper. No JS changes to SensorPanel needed — just CSS additions.
- **D-07:** Warning style: left border accent using `--color-feedback-warn-text`, subtle background tint using `--color-feedback-warn-bg`.
- **D-08:** Critical style: left border accent using `--color-feedback-error-text`, subtle background tint using `--color-feedback-error-bg`.
- **D-09:** Left border width: 4px (consistent with GCS select's existing 5px clinical border pattern, but on the wrapper not the input).
- **D-10:** Indicators supplement GCS/Pain existing inline colors — GCS select border and pain slider accent remain unchanged. The wrapper-level indicator adds ambient context without conflicting with input-level clinical coloring.
- **D-11:** Both light and dark mode get indicator styles. Dark mode uses the existing dark feedback token overrides already in tokens.css.

### Mobile BP layout (VITALS-02)
- **D-12:** Below 768px viewport (existing mobile breakpoint), BP fields stack vertically instead of side-by-side.
- **D-13:** Each BP field gets a visible label above it ("SIS" / "DIA") replacing the placeholder-only approach. Labels are always visible (not just on mobile) for clarity.
- **D-14:** Stacked fields use full width of the input area. The "/" separator is hidden on mobile.
- **D-15:** On desktop (>=768px), layout remains side-by-side with the "/" separator, but labels are also visible above each field.

### Claude's Discretion
- Exact CSS transition/animation for indicator appearance
- Whether to add new design tokens for vital sign indicators or reuse existing feedback tokens
- getFieldStatus implementation structure (inline function vs extracted helper)
- Any micro-interactions (e.g., pulse on transition from normal to critical)

</decisions>

<specifics>
## Specific Ideas

- GCS and Pain already have dynamic clinical coloring at the input level — the wrapper-level `data-field-status` indicator adds a second, ambient layer without replacing those
- The `getFieldStatus` prop was specifically designed in Phase 10 for this exact use case — no SensorPanel component changes needed, only CSS additions and a callback function in ProtocolTriage
- Feedback color tokens (`--color-feedback-warn-*`, `--color-feedback-error-*`) already exist in tokens.css with dark mode variants — reuse over inventing new tokens

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sensor panel component
- `src/components/SensorPanel.jsx` — Full component with `getFieldStatus` prop (line 137), `data-field-status` attribute application (line 208), SENSOR_CONFIG with range descriptions (lines 4-69)
- `src/components/SensorPanel.css` — All sensor panel styles including `.triage-sensors__item` (line 56), BP group (line 89), GCS select (line 143), pain group (line 155)

### Design tokens
- `src/styles/tokens.css` — Feedback color tokens: `--color-feedback-warn-*` (lines 39-40), `--color-feedback-error-*` (lines 37-38), dark mode overrides (lines 176-188)

### Prior phase decisions
- `.planning/phases/10-sensor-panel-refactor/10-CONTEXT.md` — D-06 (getFieldStatus callback contract), D-07 (data attribute passthrough)

### Sensor panel consumer
- `src/components/ProtocolTriage.jsx` — Where getFieldStatus callback will be defined and passed to SensorPanel

### Mobile breakpoint pattern
- `src/components/SensorPanel.css` — Existing responsive patterns to follow
- `src/components/ProtocolTriage.css` — Mobile breakpoint at 768px used throughout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getFieldStatus` prop on SensorPanel: Already wired, accepts `(key, value)`, output applied as `data-field-status` attribute — zero component changes needed for VITALS-01
- Feedback color tokens: `--color-feedback-warn-bg/text` and `--color-feedback-error-bg/text` with dark mode variants already defined
- `SENSOR_CONFIG` range descriptions: Contain human-readable thresholds that align with D-02 clinical values

### Established Patterns
- `[data-field-status]` CSS attribute selector: Same pattern as `[data-app-theme]` scoping used throughout the design system
- `.triage-sensors__item--missing` modifier: Existing precedent for field-level visual state change (background + border) — warning/critical follows same approach
- GCS `border-left-width: 5px` clinical indicator: Establishes the left-border accent as a recognized pattern in this UI
- Mobile-first responsive with `min-width: 768px` desktop overrides

### Integration Points
- ProtocolTriage.jsx: Define `getFieldStatus` function using sensorInputs state, pass to SensorPanel
- SensorPanel.css: Add `[data-field-status="warning"]` and `[data-field-status="critical"]` styles on `.triage-sensors__item`
- SensorPanel.jsx BP rendering (lines 163-189): Restructure markup for stacked mobile layout with visible labels

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-vital-signs-ux*
*Context gathered: 2026-04-10*
