# Phase 11: Triage Interaction Fixes - Research

**Researched:** 2026-04-09
**Domain:** React JSX bug fixes — conditional rendering, key normalization, textarea UX
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Remove `missingSensors.length === 0` guard from quick-reply render condition at line 869. Yes/No buttons must appear whenever `currentNode?.yesNo && !loading`.

**D-02:** Y/N keyboard shortcuts (lines 176-188) already have correct condition — no change needed there. Only the JSX render guard is wrong.

**D-03:** Both TRIAGE-01 and TRIAGE-02 resolve from the same single-line fix. The `missingSensors` guard was the sole blocking condition.

**D-04:** Normalize `missingSensors` array at the point of `setMissingSensors` (line 606): map `gcs_scale` → `gcs` so it matches SENSOR_CONFIG keys.

**D-05:** Normalize in the `setMissingSensors` call (line 606), not in SensorPanel. Pattern established at lines 542-543 and 602.

**D-06:** Also normalize `blood_pressure` → `bp_systolic` defensively in the same mapping. (See Pitfall 1 below — this normalization is a no-op because SENSOR_CONFIG uses `blood_pressure` as its key; D-06 requires clarification but is harmless if implemented as written.)

**D-07:** Replace `<input type="text">` at line 919 with `<textarea>`.

**D-08:** `onKeyDown` handler changes to: Enter without Shift → `e.preventDefault()` + `handleSendMessage()`. Shift+Enter → let default insert newline.

**D-09:** Auto-resize textarea to content height up to ~4 lines using `scrollHeight` approach. No library.

**D-10:** Preserve `chat-text-input` CSS class. CSS adjustments (resize: none, overflow-y, min/max-height) go in ProtocolTriage.css.

### Claude's Discretion

- Exact max-height value for textarea (3-5 lines reasonable)
- Whether to reset textarea height after message send (recommended: yes)
- CSS transition on height change (subtle or none)
- Order of commits (one per requirement or grouped logically)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRIAGE-01 | Yes/No quick-reply buttons appear when agent asks a yes/no question (fix `missingSensors` blocking condition) | Single-line fix at ProtocolTriage.jsx:869 — remove `missingSensors.length === 0` from condition |
| TRIAGE-02 | Yes/No buttons remain visible and functional even when vital signs are still pending | Same fix as TRIAGE-01 — the `missingSensors` guard was blocking both simultaneously |
| TRIAGE-03 | All requested vital signs are correctly highlighted on the sensor dock (fix `gcs_scale`→`gcs` key mismatch) | API sends `gcs_scale` in `missing_sensors` (confirmed via openapi.yaml:1296), SENSOR_CONFIG key is `gcs` — normalize at setMissingSensors call |
| TRIAGE-04 | Shift+Enter creates a new line in chat input; Enter alone submits the message | Replace `<input>` with `<textarea>` + updated onKeyDown handler |

</phase_requirements>

---

## Summary

Phase 11 is a focused bug-fix phase with four requirements, all in `ProtocolTriage.jsx`. Every fix is surgical: no new components, no new state variables, no API changes. The changes are isolated to three locations in the component (the quick-reply JSX condition, the `setMissingSensors` call, and the chat input element) plus minor CSS adjustments.

The root bugs are well-understood from code inspection:
1. Line 869 has an overly restrictive guard (`missingSensors.length === 0`) that prevents yes/no buttons from appearing when vital sign input is also requested simultaneously. Removing this guard resolves TRIAGE-01 and TRIAGE-02 together.
2. Line 606 calls `setMissingSensors(data.missing_sensors)` without applying the `gcs_scale → gcs` key normalization that is already applied in two other branches of the same function (lines 542-543 and 602). SensorPanel checks `missingSensors.includes(key)` where `key` comes from SENSOR_CONFIG (which uses `gcs`), so the unnormalized `gcs_scale` never matches and no highlight appears.
3. The chat input is an `<input type="text">` which cannot support multiline content; replacing it with a `<textarea>` and adjusting the Enter key handler resolves TRIAGE-04.

**Primary recommendation:** Implement fixes in the order TRIAGE-01/02 → TRIAGE-03 → TRIAGE-04, as complexity increases in that order.

## Standard Stack

### Core (all verified by code inspection — HIGH confidence)

| File | Current Element | Change |
|------|----------------|--------|
| `src/components/ProtocolTriage.jsx` | Line 869 JSX condition | Remove `missingSensors.length === 0` |
| `src/components/ProtocolTriage.jsx` | Line 606 `setMissingSensors` call | Normalize `gcs_scale` → `gcs` before setting |
| `src/components/ProtocolTriage.jsx` | Lines 919-927 `<input>` element | Replace with `<textarea>` + new `onKeyDown` |
| `src/components/ProtocolTriage.css` | `.chat-text-input` rule block | Add `resize: none`, `min-height`, `max-height`, `overflow-y: auto` |

### No New Dependencies

All fixes use only existing React patterns already in the file. No new imports, no new libraries.

## Architecture Patterns

### Pattern 1: Key Normalization at the Boundary (TRIAGE-03)

**What:** Data from the API uses one key namespace (`gcs_scale`); the component uses another (`gcs`). Normalization happens at the point where API data enters component state — not deep inside child components.

**Evidence from codebase:** The same pattern exists at two other points in `handleTraversalResponse`:
- Lines 542-543: `sensor_data` branch normalizes `gcs_scale` → `gcs`
- Line 602: `translatedSensors` mapping normalizes `gcs_scale` → `gcs` for display labels

The `missing_sensors` branch at line 606 is the only place that forgot to apply it.

**Fix:**
```javascript
// ProtocolTriage.jsx ~line 600-606 — BEFORE
setMissingSensors(data.missing_sensors);

// AFTER
setMissingSensors(
    data.missing_sensors.map(s => s === 'gcs_scale' ? 'gcs' : s)
);
```

### Pattern 2: Conditional Quick-Reply Rendering (TRIAGE-01 + TRIAGE-02)

**What:** The quick-reply block is already correctly gated on `currentNode?.yesNo && !loading`. The additional `missingSensors.length === 0` guard was an over-constraint that is not required by any design decision.

**Evidence:** The Y/N keyboard shortcut handler at lines 175-188 correctly uses only `currentNode?.yesNo && !loading` — the JSX render condition should match this.

**Fix:**
```jsx
// ProtocolTriage.jsx line 869 — BEFORE
{currentNode?.yesNo && missingSensors.length === 0 && !loading && (

// AFTER
{currentNode?.yesNo && !loading && (
```

### Pattern 3: Textarea Auto-Resize (TRIAGE-04)

**What:** A self-sizing textarea collapses to single-line height when empty and expands as the user types, up to a defined max-height. No library needed — a `useEffect` or `onInput` handler sets `element.style.height = 'auto'` then `element.style.height = element.scrollHeight + 'px'`.

**Approach (no-library, consistent with project conventions):**

```jsx
// ProtocolTriage.jsx — replacement for <input type="text">
const textareaRef = useRef(null);

const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};

const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
        // Reset height after send
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }
    // Shift+Enter: default browser behavior inserts newline — no action needed
};

<textarea
    ref={textareaRef}
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onInput={handleTextareaInput}
    onKeyDown={handleTextareaKeyDown}
    placeholder="Digite a queixa do paciente..."
    disabled={loading}
    className="chat-text-input"
    rows={1}
/>
```

**CSS additions to `.chat-text-input`:**
```css
.chat-text-input {
    /* existing styles preserved */
    resize: none;
    overflow-y: auto;
    min-height: 44px;   /* single-line — matches current input height */
    max-height: 108px;  /* ~4 lines at 16px font + padding */
    line-height: 1.5;
}
```

**Note on `border-radius`:** The current `.chat-text-input` uses `border-radius: var(--radius-pill)` which creates a fully rounded pill shape. For a single-line textarea this looks identical to the current input. When expanded to multiple lines, a pill radius may look visually unintended — discretion area: could reduce to `var(--radius-md)` for textarea or leave as-is for consistency. Either is acceptable.

### Anti-Patterns to Avoid

- **Don't normalize in SensorPanel:** Normalization belongs at the data ingestion point (ProtocolTriage), not inside the display component. SensorPanel's `missingSensors.includes(key)` check is correct by design — fix the data it receives.
- **Don't use controlled height with `useState`:** Using React state for textarea height causes an extra render cycle. Direct DOM manipulation via `element.style.height` is the correct pattern for auto-resize.
- **Don't add `resize: both` or `resize: vertical`:** Clinicians should not manually resize the input. `resize: none` is required.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Textarea auto-resize | Complex state + ResizeObserver | Direct `scrollHeight` manipulation | Simple, no library, no render overhead |
| Key normalization | Separate mapping module | Inline `.map()` at call site | One line, consistent with existing pattern |

## Common Pitfalls

### Pitfall 1: D-06 blood_pressure Normalization is a No-Op

**What goes wrong:** D-06 says to normalize `blood_pressure` → `bp_systolic` in the `missing_sensors` mapping. This would be wrong. SENSOR_CONFIG uses `blood_pressure` as its key (line 12 of SensorPanel.jsx). If the API sends `blood_pressure` in `missing_sensors`, it already matches. Normalizing it to `bp_systolic` would break the highlight — SENSOR_CONFIG has no `bp_systolic` key.

**Root cause:** The context decision was written assuming SENSOR_CONFIG uses `bp_systolic`/`bp_diastolic`, but inspection shows SENSOR_CONFIG uses `blood_pressure` (the composite key). The `bp_systolic`/`bp_diastolic` field names are internal to the HTML input elements, not SENSOR_CONFIG keys.

**How to handle:** Apply only the `gcs_scale` → `gcs` normalization. Either skip D-06 entirely, or apply it as `s === 'gcs_scale' ? 'gcs' : s` (which leaves `blood_pressure` unchanged — effectively a no-op). The OpenAPI spec (line 1296) confirms the API only sends `gcs_scale` as a non-trivially-named alias; `blood_pressure` matches SENSOR_CONFIG verbatim.

**Warning signs:** If implementing D-06 as `blood_pressure → bp_systolic`, the blood pressure field would never highlight as missing — the symptom would be identical to the pre-fix GCS bug.

### Pitfall 2: Textarea and the Existing TEXTAREA Keyboard Shortcut Suppressor

**What goes wrong:** Line 173 already suppresses Y/N/R shortcuts when `tag === 'TEXTAREA'`. Once the chat input is a textarea, the user typing 'y' or 'n' in the chat box will not trigger the yes/no shortcut handlers — which is correct behavior. However, if the chat textarea is focused when the clinician presses Y to answer a yes/no question, they must click elsewhere first (or use buttons). This is the intended behavior per D-08 in the keyboard shortcuts section of Phase 10.

**How to avoid:** No action needed — the suppressor was deliberately added in Phase 10 to handle this exact case. Just verify the behavior is as expected.

### Pitfall 3: inputText State Not Reset After Textarea Send

**What goes wrong:** `handleSendMessage()` already calls `setInputText('')` to clear the input. But the textarea's visual height (set via `style.height`) is not tied to React state — it persists until explicitly reset. After send, the textarea will remain tall even though the value is empty.

**How to avoid:** After `handleSendMessage()` fires from the onKeyDown handler, also reset `textareaRef.current.style.height = 'auto'`. If `handleSendMessage` is also called from the send button click handler, that path does not have access to the ref — either pass the reset as a callback or use a `useEffect` on `inputText === ''` to reset height.

**Simplest pattern:** `useEffect(() => { if (!inputText && textareaRef.current) textareaRef.current.style.height = 'auto'; }, [inputText]);`

### Pitfall 4: `rows={1}` + `scrollHeight` Initial State

**What goes wrong:** On first render, `scrollHeight` may not be available or may reflect the wrong value before the browser paints. Setting `rows={1}` ensures the textarea starts at one-row height without needing JavaScript. The `onInput` handler fires on every keystroke to adjust.

**How to avoid:** Set `rows={1}` as the initial prop. The CSS `min-height` provides the floor. No JavaScript needed on mount.

## Code Examples

Verified patterns from code inspection (HIGH confidence — directly read from source):

### Existing Normalization Pattern to Follow (lines 542-543)
```javascript
// ProtocolTriage.jsx — sensor_data branch (lines 537-547)
Object.entries(data.sensor_data).forEach(([key, value]) => {
    if (key === 'blood_pressure' && typeof value === 'string' && value.includes('/')) {
        const [sys, dia] = value.split('/');
        newData.bp_systolic = sys;
        newData.bp_diastolic = dia;
    } else if (key === 'gcs_scale') {
        newData.gcs = value;   // <-- this pattern
    } else {
        newData[key] = value;
    }
});
```

### Target Fix — setMissingSensors (line 606)
```javascript
// BEFORE:
setMissingSensors(data.missing_sensors);

// AFTER:
setMissingSensors(data.missing_sensors.map(s => s === 'gcs_scale' ? 'gcs' : s));
```

### Target Fix — Quick-Reply Condition (line 869)
```jsx
// BEFORE:
{currentNode?.yesNo && missingSensors.length === 0 && !loading && (

// AFTER:
{currentNode?.yesNo && !loading && (
```

### Target Fix — Chat Input (lines 919-927)
```jsx
// BEFORE:
<input
    type="text"
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
    placeholder="Digite a queixa do paciente..."
    disabled={loading}
    className="chat-text-input"
/>

// AFTER:
<textarea
    ref={textareaRef}
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onInput={handleTextareaInput}
    onKeyDown={handleTextareaKeyDown}
    placeholder="Digite a queixa do paciente..."
    disabled={loading}
    className="chat-text-input"
    rows={1}
/>
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `<input type="text">` for chat | `<textarea rows={1}` with auto-resize | Enables multiline without page jump |
| `scrollHeight` height management | Same — standard no-library pattern | No dependency added |

## Open Questions

1. **D-06 blood_pressure normalization**
   - What we know: SENSOR_CONFIG uses `blood_pressure` as the key; `bp_systolic`/`bp_diastolic` are only internal HTML input names. Normalizing `blood_pressure` → `bp_systolic` in `missing_sensors` would break blood pressure highlighting.
   - What's unclear: Whether the API has ever been observed sending `blood_pressure` in `missing_sensors`. OpenAPI example shows `gcs_scale` and `heart_rate` — `blood_pressure` is not in the example.
   - Recommendation: Apply only `gcs_scale` → `gcs` normalization. Skip D-06 unless API behavior evidence shows otherwise.

2. **pill border-radius on expanded textarea**
   - What we know: `.chat-text-input` has `border-radius: var(--radius-pill)`. Multiline content with pill radius looks odd.
   - Recommendation: Change to `var(--radius-md)` or `8px` for the textarea variant. Small cosmetic improvement with no functional impact.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — project has no test infrastructure (confirmed: no pytest.ini, jest.config.*, vitest.config.*, or test/ directories) |
| Config file | None |
| Quick run command | N/A — manual browser testing |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| TRIAGE-01 | Yes/No buttons appear when `currentNode.yesNo=true` | manual-smoke | N/A | No test framework; verify in browser dev session |
| TRIAGE-02 | Yes/No buttons appear when `missingSensors` is non-empty simultaneously | manual-smoke | N/A | Requires live API response with `missing_sensors` status |
| TRIAGE-03 | GCS field highlights when API returns `gcs_scale` in missing_sensors | manual-smoke | N/A | Requires live API response with `gcs_scale` |
| TRIAGE-04 | Shift+Enter inserts newline; Enter submits | manual-smoke | N/A | Testable in dev server without API |

### Sampling Rate

- **Per task commit:** Manual browser verification of the specific changed behavior
- **Per wave merge:** Manual smoke of all four requirements together in a live triage session
- **Phase gate:** All four manual checks green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No test infrastructure exists — out of scope per REQUIREMENTS.md ("Test suite: Known tech debt; separate milestone"). No Wave 0 test setup needed.

*(If no automated tests: manual verification plan serves as the phase gate.)*

## Sources

### Primary (HIGH confidence)
- `src/components/ProtocolTriage.jsx` lines 175-188, 530-614, 637, 869-886, 918-927 — direct code inspection
- `src/components/SensorPanel.jsx` lines 1-69, 137-188 — SENSOR_CONFIG keys and `missingSensors.includes(key)` logic
- `src/components/ProtocolTriage.css` lines 182-203 — `.chat-input-bar` and `.chat-text-input` current styling
- `openapi.yaml` lines 1274-1297 — API contract for `missing_sensors` array, confirms `gcs_scale` as canonical alias

### Secondary (MEDIUM confidence)
- Browser standard behavior for `textarea` `scrollHeight` auto-resize — well-established DOM pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- TRIAGE-01/02 fix: HIGH — single-line removal of verified incorrect guard, seen directly in source
- TRIAGE-03 fix: HIGH — key mismatch confirmed by SENSOR_CONFIG inspection + OpenAPI spec; normalization pattern already used twice in same function
- TRIAGE-04 fix: HIGH — standard DOM textarea + scrollHeight pattern; CSS adjustments straightforward
- D-06 blood_pressure concern: HIGH — SENSOR_CONFIG key `blood_pressure` confirmed by direct read

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase, no external dependencies)
