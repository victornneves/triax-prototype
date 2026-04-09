# Phase 10: Sensor Panel Refactor - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract a single shared sensor panel component that replaces duplicated desktop and mobile sensor panel implementations in ProtocolTriage.jsx. No visual or behavioral changes — pure refactor. Desktop sidebar and mobile slide-up continue to render identically to current state.

**Requirements:** REFAC-01

</domain>

<decisions>
## Implementation Decisions

### Extraction scope
- **D-01:** Full panel extraction — one `SensorPanel` component owns sensor title, sensor input list, and submit button.
- **D-02:** Session info card (patient name, protocol, cancel button) stays **outside** SensorPanel, in ProtocolTriage. SensorPanel is purely about vital sign inputs.
- **D-03:** Mobile-only chrome (toggle pill button, backdrop overlay, vitals summary strip) stays in ProtocolTriage as thin wrappers around the shared SensorPanel component.

### Sub-component organization
- **D-04:** `PainInput`, `GCSInput`, and `SensorLabel` (currently defined inside ProtocolTriage.jsx lines 79-143) move into the SensorPanel file or co-located folder — they are sensor-specific sub-components.
- **D-05:** `SENSOR_CONFIG` placement — Claude's discretion (can stay in ProtocolTriage, move with SensorPanel, or become a standalone constants file).

### Phase 12 forward-compatibility
- **D-06:** SensorPanel accepts an optional `getFieldStatus(key, value)` callback. Returns a status string (e.g., `'normal'`, `'warning'`, `'critical'`). When not provided, no indicators are rendered — default behavior is unchanged.
- **D-07:** SensorPanel passes the status value through as a data attribute or prop on the field wrapper element. Phase 12 defines the actual CSS styling for those statuses — SensorPanel does not own the visual treatment.

### Bug fixes
- **D-08:** Mobile BP inputs currently lack `maxLength`, `min`, `max` validation attributes present on desktop. This inconsistency resolves naturally through unification — no special handling or explicit testing needed.

### Claude's Discretion
- SENSOR_CONFIG file placement (inline, co-located, or standalone constants file)
- SensorPanel file structure (single file vs. folder with sub-components)
- Props interface design (which props SensorPanel receives from ProtocolTriage)
- CSS organization for the extracted component (co-located .css file following established pattern)
- Whether to extract a BPInput sub-component for the dual systolic/diastolic inputs
- Internal component structure and state management approach

</decisions>

<specifics>
## Specific Ideas

- Phase 9 PatientForm extraction establishes the pattern — SensorPanel follows the same approach (extract from ProtocolTriage, own file, co-located CSS, clean prop interface)
- The refactor eliminates ~170 lines of duplication between desktop (lines 1085-1192) and mobile (lines 1197-1260) sensor rendering
- Phase 7 deferred this extraction explicitly: "SensorPanel extraction — valuable refactor but scope creep for migration phase" — this IS that phase now
- The `getFieldStatus` hook is a minimal forward-compatibility investment — Phase 12 plugs in abnormal/critical logic without reopening SensorPanel internals

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current sensor panel implementation
- `src/components/ProtocolTriage.jsx` lines 12-77 — `SENSOR_CONFIG` object defining all 8 vital signs (label, hint, range, type, composite flag)
- `src/components/ProtocolTriage.jsx` lines 79-98 — `PainInput` component (pain scale slider 0-10 with dynamic color)
- `src/components/ProtocolTriage.jsx` lines 100-130 — `GCSInput` component (Glasgow dropdown 3-15 with clinical color border)
- `src/components/ProtocolTriage.jsx` lines 132-143 — `SensorLabel` component (label + tooltip + hint wrapper)
- `src/components/ProtocolTriage.jsx` lines 1085-1192 — Desktop sensor panel (sidebar: session info + sensor list + submit)
- `src/components/ProtocolTriage.jsx` lines 1197-1260 — Mobile sensor panel (slide-up: duplicated session info + sensor list + submit)
- `src/components/ProtocolTriage.jsx` lines 1268-1275 — Mobile toggle pill button
- `src/components/ProtocolTriage.jsx` line 164 — `sensorInputs` state, line 166 — `sensorPanelOpen` state
- `src/components/ProtocolTriage.jsx` lines 772-774 — `handleSensorChange` function
- `src/components/ProtocolTriage.jsx` lines 776-790 — `handleSendSensors` function
- `src/components/ProtocolTriage.jsx` line 770 — `missingSensors` state

### Sensor panel CSS
- `src/components/ProtocolTriage.css` lines 314-500 — All `.triage-sensors*` classes (container, list, items, inputs, BP group, GCS select, pain slider, submit button)
- `src/components/ProtocolTriage.css` lines 706-796 — Mobile-specific sensor panel styles (aside, toggle, backdrop, summary strip)
- `src/components/ProtocolTriage.css` lines 799-817 — Sensor label/hint styling
- `src/index.css` lines 60-68 — `.sensor-missing-pulse` animation (red shadow pulse for missing sensors)

### API integration
- `src/components/ProtocolTriage.jsx` lines 529-563 — `submitSensorData` (POST /sensor-data with value mapping)
- `src/components/ProtocolTriage.jsx` lines 602-661 — `traverseTree` (POST /protocol-traverse, includes sensor values in payload)
- `src/components/ProtocolTriage.jsx` lines 663-748 — `handleTraversalResponse` (parses `data.sensor_data`, sets `missingSensors`)

### Extraction pattern reference
- `src/components/PatientForm.jsx` + `PatientForm.css` — Phase 9 extraction from ProtocolTriage, establishes the pattern for this refactor
- `src/components/ui/` — Shared component directory (Button, Toast, Tooltip, StatusBar)

### Design system
- `src/styles/tokens.css` — Design tokens used by sensor panel CSS
- Co-located CSS pattern: `Component.jsx` + `Component.css` with `[data-app-theme]` scoping

### Downstream consumer
- `.planning/REQUIREMENTS.md` — VITALS-01 (Phase 12: abnormal/critical indicators on the sensor panel this phase extracts)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PatientForm.jsx` extraction pattern: Clean 2-prop interface (`onSubmit`, `loading`), own CSS file, co-located with ProtocolTriage — template for SensorPanel extraction
- `PainInput`, `GCSInput`, `SensorLabel`: Already defined as functional components inside ProtocolTriage.jsx — move, don't rewrite
- `Tooltip` from `src/components/ui/Tooltip.jsx`: Used by `SensorLabel` for clinical descriptions — stays as external dependency
- `.triage-sensors*` CSS classes: Full token-backed styling already exists — extract to co-located CSS file

### Established Patterns
- Co-located CSS: `Component.jsx` + `Component.css` (PatientForm, Header, Button examples)
- `[data-app-theme]` scoping: All semantic tokens scoped here; extracted CSS must maintain this
- IMask `onAccept` callback for masked fields (not `onChange`) — not directly relevant but patterns in same file
- Mobile-first responsive: Desktop overrides at `min-width: 768px` — sensor panel CSS follows this

### Integration Points
- `ProtocolTriage.jsx`: SensorPanel renders in the triage step; receives state/callbacks as props
- `missingSensors` array: Set by API response, consumed by SensorPanel to highlight required fields
- `handleSendSensors`: Stays in ProtocolTriage (owns API calls); passed to SensorPanel as `onSubmit`
- `sensorInputs` + `handleSensorChange`: State stays in ProtocolTriage; passed down as props
- Mobile toggle/backdrop/summary: Remain in ProtocolTriage, wrap SensorPanel

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-sensor-panel-refactor*
*Context gathered: 2026-04-09*
