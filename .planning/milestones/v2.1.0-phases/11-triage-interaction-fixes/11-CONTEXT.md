# Phase 11: Triage Interaction Fixes - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Clinicians can answer yes/no questions and see correct vital sign highlights during triage, and can type multiline messages. Four bug fixes in ProtocolTriage.jsx — no new features, no visual redesign.

**Requirements:** TRIAGE-01, TRIAGE-02, TRIAGE-03, TRIAGE-04

</domain>

<decisions>
## Implementation Decisions

### Yes/No button visibility (TRIAGE-01 + TRIAGE-02)
- **D-01:** Remove `missingSensors.length === 0` guard from the quick-reply render condition at line 869. Yes/No buttons must appear whenever `currentNode?.yesNo && !loading` — regardless of whether vital signs are pending.
- **D-02:** The Y/N keyboard shortcuts (lines 176-188) already have the correct condition (`currentNode?.yesNo && !loading`) — no change needed there. Only the JSX render guard is wrong.
- **D-03:** Both TRIAGE-01 and TRIAGE-02 resolve from the same single-line fix. The `missingSensors` guard was the sole blocking condition — removing it satisfies both requirements simultaneously.

### GCS highlight mismatch (TRIAGE-03)
- **D-04:** The API sends `gcs_scale` in `data.missing_sensors` (line 606: `setMissingSensors(data.missing_sensors)`), but SensorPanel checks `missingSensors.includes(key)` where key is `gcs` (from SENSOR_CONFIG). Fix by normalizing the `missingSensors` array at the point where it's set — map `gcs_scale` → `gcs` so it matches SENSOR_CONFIG keys.
- **D-05:** Normalize in the `setMissingSensors` call (line 606), not in SensorPanel. The component should receive clean data that matches its key namespace. This follows the existing pattern at line 542-543 and line 602 where `gcs_scale` is already mapped to `gcs` for sensor data values.
- **D-06:** Also normalize `blood_pressure` → `bp_systolic` in the same mapping, since the API may send `blood_pressure` but SENSOR_CONFIG has `bp_systolic` and `bp_diastolic` as separate keys. Apply the same normalization pattern defensively.

### Multiline chat input (TRIAGE-04)
- **D-07:** Replace the `<input type="text">` at line 919 with a `<textarea>`. This is the only way to support Shift+Enter for newlines while Enter submits.
- **D-08:** The `onKeyDown` handler (line 923) changes to: if `Enter` pressed without `Shift`, call `e.preventDefault()` and `handleSendMessage()`. If `Shift+Enter`, let default behavior insert the newline.
- **D-09:** Auto-resize the textarea to content height (up to a max of ~4 lines), then scroll. No fixed tall textarea that wastes space when typing single-line messages. Use a simple `scrollHeight` approach — no library needed.
- **D-10:** Preserve the existing `chat-text-input` CSS class. The textarea should inherit the same styling. Minor CSS adjustments (resize: none, overflow-y, min/max-height) go in ProtocolTriage.css.

### Claude's Discretion
- Exact max-height value for textarea (3-5 lines reasonable)
- Whether to reset textarea height after message send (recommended: yes)
- CSS transition on height change (subtle or none)
- Order of commits (one per requirement or grouped logically)

</decisions>

<specifics>
## Specific Ideas

- The `missingSensors` guard removal is a one-line fix but has high clinical impact — clinicians currently get stuck unable to answer yes/no questions when vital signs are requested simultaneously
- The `gcs_scale` → `gcs` normalization follows the exact same mapping already done in two other places in `handleTraversalResponse` (lines 542-543, 602) — the missing_sensors branch at line 606 simply forgot to apply it
- The textarea swap should feel identical to the current input for single-line messages — the change should be invisible until the user presses Shift+Enter

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Quick-reply button visibility (TRIAGE-01, TRIAGE-02)
- `src/components/ProtocolTriage.jsx` line 869 — Quick-reply render condition with `missingSensors.length === 0` guard (the bug)
- `src/components/ProtocolTriage.jsx` lines 870-886 — Full quick-reply JSX block (Sim/Nao buttons)
- `src/components/ProtocolTriage.jsx` lines 175-188 — Y/N keyboard shortcuts (correct condition, for reference)

### GCS highlight mismatch (TRIAGE-03)
- `src/components/ProtocolTriage.jsx` lines 599-610 — `missing_sensors` response handler where `setMissingSensors` is called without key normalization
- `src/components/ProtocolTriage.jsx` lines 542-543 — Existing `gcs_scale` → `gcs` normalization in `sensor_data` handler (pattern to follow)
- `src/components/ProtocolTriage.jsx` line 602 — Existing `gcs_scale` → `gcs` normalization in `translatedSensors` mapping
- `src/components/SensorPanel.jsx` line 145 — `missingSensors.includes(key)` check that expects SENSOR_CONFIG keys
- `src/components/SensorPanel.jsx` lines 1-30 — SENSOR_CONFIG keys: `temperature`, `heart_rate`, `spo2`, `bp_systolic`, `bp_diastolic`, `respiratory_rate`, `gcs`, `pain_scale`

### Chat input / multiline (TRIAGE-04)
- `src/components/ProtocolTriage.jsx` lines 918-927 — Current `<input>` element with `onKeyDown` Enter handler
- `src/components/ProtocolTriage.css` — `.chat-text-input` styling (search for class)
- `src/components/ProtocolTriage.css` — `.chat-input-bar` container styling

### Shared context
- `src/components/ProtocolTriage.jsx` line 637 — `missingSensors` state declaration
- `src/components/ProtocolTriage.jsx` lines 530-614 — Full `handleTraversalResponse` function (all response branches)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None needed — all fixes are modifications to existing code in ProtocolTriage.jsx

### Established Patterns
- Key normalization: `gcs_scale` → `gcs` pattern established at lines 542-543 and 602 — extend to `setMissingSensors`
- `[data-app-theme]` CSS scoping — any new textarea styles follow this pattern
- `chat-text-input` class — existing styling to preserve/extend for textarea

### Integration Points
- `SensorPanel.jsx` line 145 — consumes `missingSensors` prop; fix is upstream in ProtocolTriage
- `handleSendMessage()` — called by both quick-reply buttons and Enter key; textarea change must preserve this call
- `inputText` state + `setInputText` — current text state; textarea uses the same state variable

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-triage-interaction-fixes*
*Context gathered: 2026-04-09*
