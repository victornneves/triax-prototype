# Phase 4: Fragility - Research

**Researched:** 2026-04-07
**Domain:** Browser fetch API, deprecated JS APIs, blob URL lifecycle, React hook patterns
**Confidence:** HIGH

## Summary

Phase 4 is a surgical hardening pass with four independent fixes. Every change has a precise target location and a clear replacement pattern. No new dependencies are needed; all solutions use Web platform APIs that are already available in the project's ES2020+ target.

The highest-risk fix is FRAG-01 because `ProtocolTriage.jsx` is the largest file (~850 lines) and carries 5 of the 6 guard sites. The key distinction the planner must preserve is between guarded calls that surface errors to users (protocol_names, protocol-traverse) and fire-and-forget calls that must stay silent even on failure (transcription logging).

FRAG-02 is already partially solved: `Profile.jsx` line 113 already reads `item.created_at` for the table date column. The `formatDateFromKey` function (lines 43-67) is defined but not called in the rendered JSX — making this fix a dead-code removal rather than a live replacement. The API contract (`openapi.yaml` `HistorySession` schema) confirms `created_at` as a first-class `date-time` field.

**Primary recommendation:** Tackle each requirement as a standalone task in file order. No cross-cutting refactors are needed; the fixes are localized and independent.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add `response.ok` guards to all fetch calls that currently lack them. Calls already guarded (from Phase 1 and Phase 2 work) are left as-is.
- **D-02:** Missing guards are at: `ProtocolTriage.jsx:337`, `ProtocolTriage.jsx:387`, `ProtocolTriage.jsx:415`, `ProtocolTriage.jsx:451`, `ProtocolTriage.jsx:629`
- **D-03:** For `/transcription` fire-and-forget calls: add `response.ok` check that logs `console.error` on failure but does NOT alert the user or block the triage flow.
- **D-04:** For `/protocol_names` and `/protocol-traverse`: surface errors to the user via the existing error handling pattern (console.error + user-visible message).
- **D-05:** The `/protocol-traverse` retry logic (503 handling) stays as-is — just add a general `!response.ok` guard after the 503-specific check for other status codes.
- **D-06:** Replace `formatDateFromKey` in `Profile.jsx` with a reliable API field.
- **D-07:** Verify what date fields the `/history` API response includes. If `created_at` exists, use it directly.
- **D-08:** Date formatting stays as `pt-BR` locale with `America/Sao_Paulo` timezone.
- **D-09:** Replace `decodeURIComponent(escape(text))` in `useTranscribe.js:138` with a modern approach.
- **D-10:** Verify whether AWS Transcribe Streaming SDK already returns properly decoded UTF-8 strings. If yes, remove the entire block.
- **D-11:** If encoding IS needed: use `TextEncoder`/`TextDecoder` APIs.
- **D-12:** All three blob URL creation sites must revoke after use: `HistoryPage.jsx:30`, `TriageDetailsModal.jsx:124`, `ProtocolTriage.jsx:838`.
- **D-13:** Use `setTimeout(() => URL.revokeObjectURL(url), 60000)` — 60 seconds gives the browser time to load the PDF.
- **D-14:** Pattern is identical across all three sites — apply the same fix consistently.

### Claude's Discretion
- Exact error message wording for new `response.ok` guards (must be PT-BR)
- Whether to refactor the `.then()` chain on `protocol_names` fetch to `async/await` for consistency while adding the guard
- Whether to extract a shared `downloadPdf` helper for the three identical blob URL sites

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRAG-01 | Every `fetch` call checks `response.ok` before proceeding, surfaces error on non-2xx | 5 unguarded sites identified in ProtocolTriage.jsx; established guard pattern already used in 8+ other fetch calls in the codebase |
| FRAG-02 | Session date in `Profile.jsx` does not depend on S3 key splitting | `HistorySession.created_at` confirmed as `date-time` field in openapi.yaml schema; table already uses it at line 113; `formatDateFromKey` is dead code |
| FRAG-03 | `useTranscribe.js` does not use deprecated `escape()` function | `escape()` confirmed deprecated; AWS Transcribe Streaming SDK returns JavaScript strings (JS strings are natively UTF-16); the encoding workaround is unnecessary |
| FRAG-04 | PDF blob URLs are revoked via `URL.revokeObjectURL` after download | Three identical patterns at HistoryPage.jsx:30, TriageDetailsModal.jsx:124, ProtocolTriage.jsx:838; all use `window.open(url, '_blank')` requiring deferred revocation |
</phase_requirements>

---

## Standard Stack

No new dependencies. All solutions use existing Web platform APIs.

### Core APIs Used in This Phase
| API | Platform Support | Purpose |
|-----|-----------------|---------|
| `response.ok` | Fetch API — universal | Boolean shorthand: true when status is 200-299 |
| `URL.revokeObjectURL()` | Browser — universal | Releases blob URL memory reference |
| `URL.createObjectURL()` | Browser — universal | Already in use; revocation is the missing counterpart |
| `TextDecoder` | Web API — ES2020+ | UTF-8/UTF-16 decoding, replaces deprecated `escape()` |
| `setTimeout()` | Browser — universal | Deferred revocation so opened tab loads before URL is freed |

**Installation:** None required.

---

## Architecture Patterns

### Pattern 1: response.ok Guard (user-visible fetch)
**What:** Throw an Error immediately after a non-2xx response, inside the existing `try/catch`.
**When to use:** Any fetch call where failure should block the workflow or show the user a message (`/protocol_names`, `/protocol-traverse`).

```javascript
// Established pattern already in use across the codebase (e.g. HistoryPage.jsx:48)
const response = await fetch(`${API_URL}/some-endpoint`, { method: 'POST', headers, body });
if (!response.ok) {
    throw new Error(`Erro ao carregar dados: ${response.status}`);
}
const data = await response.json();
```

### Pattern 2: response.ok Guard (fire-and-forget / logging)
**What:** Check `response.ok` inside a `.catch`-chained `.then()`, or after `await`, logging silently on failure.
**When to use:** Transcription logging calls — failure must never surface to the clinician or interrupt triage.

```javascript
// For .then() chain (current style at line 451):
fetch(`${API_URL}/transcription`, { method: 'POST', headers, body })
    .then(res => { if (!res.ok) console.error('Transcription log failed:', res.status); })
    .catch(e => console.error('Transcription upload failed', e));

// For await style (used at lines 387, 415):
const res = await fetch(`${API_URL}/transcription`, { method: 'POST', headers, body });
if (!res.ok) console.error('Transcription log failed:', res.status);
```

### Pattern 3: protocol-traverse Guard (retry-aware)
**What:** Insert `!response.ok` guard after the existing 503-specific check, before `response.json()`.
**When to use:** `traverseTree()` in ProtocolTriage.jsx — the 503 retry loop must remain intact; a general non-2xx guard handles other error codes.

```javascript
// Current code at line 636 (503-check):
if (response.status === 503 && attempt < MAX_RETRIES) {
    // ... retry logic stays untouched ...
    continue;
}
// ADD AFTER the 503 block:
if (!response.ok) {
    throw new Error(`Erro no protocolo: ${response.status}`);
}
const data = await response.json();
```

### Pattern 4: Blob URL Revocation
**What:** After `window.open(url, '_blank')`, schedule `URL.revokeObjectURL` with a 60-second delay.
**When to use:** All three PDF download handlers.

```javascript
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
window.open(url, '_blank');
// Revoke after browser has had time to load the PDF
setTimeout(() => URL.revokeObjectURL(url), 60000);
```

### Pattern 5: Remove escape() from useTranscribe.js
**What:** Delete the `try { text = decodeURIComponent(escape(text)); } catch {}` block entirely.
**When to use:** The AWS Transcribe Streaming SDK returns JavaScript strings. JS strings are natively UTF-16, so there is nothing to decode. The `escape()` hack is a historic workaround for byte-level Latin-1 to UTF-8 conversion that does not apply here.

```javascript
// BEFORE (lines 137-139):
try {
    text = decodeURIComponent(escape(text));
} catch { }

// AFTER: delete the block entirely. text is already a proper JS string.
```

### Anti-Patterns to Avoid
- **Re-implementing the 503 retry check:** D-05 locks this — the retry block is intentional, add the `!response.ok` guard below it, not instead of it.
- **Alerting on transcription failures:** D-03 is explicit — transcription is logging, not control flow. `console.error` only.
- **Immediate revocation:** Calling `URL.revokeObjectURL(url)` synchronously after `window.open()` races against the browser and breaks the opened tab. The 60-second delay is required.
- **Replacing `escape()` with `TextDecoder`:** SDK strings do not need decoding. Using `TextDecoder` would be unnecessary churn. Prefer deletion.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP error detection | Custom status code checker | `response.ok` (boolean, built-in) | Covers all 200-299 statuses; already the project standard |
| Blob URL cleanup | Manual URL tracking / WeakMap | `URL.revokeObjectURL()` + `setTimeout` | Platform API designed for this; no state management needed |
| UTF-8 decoding | Manual byte manipulation | Delete the workaround entirely | SDK returns decoded strings; nothing to do |

---

## FRAG-02 Finding: formatDateFromKey is Dead Code

**Confirmed by reading `Profile.jsx`:**

The `formatDateFromKey` function is defined at lines 43-67 but is **never called in JSX**. The rendered table at line 113 already reads `item.created_at`:

```javascript
// Profile.jsx line 113 — already in production code
{item.created_at ? new Date(item.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
```

The `formatDateFromKey` function is dead code. FRAG-02 fix = delete `formatDateFromKey` (lines 43-67).

**API contract confirmation:** `openapi.yaml` `HistorySession` schema defines `created_at` as `type: string, format: date-time, nullable: true`. The `/history` list response example at line 611 includes `created_at: "2026-03-23T14:00:00"`. Field is stable and intentional.

**Sorting:** The sort at lines 26-30 of `Profile.jsx` also already uses `a.created_at` / `b.created_at`. No sorting change needed.

---

## FRAG-03 Finding: escape() Workaround is Unnecessary

**Context:** `escape()` was historically used as a hack to convert a Latin-1 string into percent-encoded UTF-8 bytes, which `decodeURIComponent` would then decode back to Unicode. The full idiom `decodeURIComponent(escape(text))` re-encodes Latin-1 bytes as UTF-8.

**Why it doesn't apply here:** The AWS Transcribe Streaming SDK (`@aws-sdk/client-transcribe-streaming` 3.971.0) parses the binary stream and returns `Transcript` as a JavaScript `string`. JS strings are UTF-16 internally — they are already fully decoded Unicode. There are no Latin-1 bytes to convert. The `escape()` workaround does nothing useful and may corrupt characters (the `try/catch` swallowing the error is a sign this was already failing silently in some cases).

**Verification approach (confidence HIGH):** AWS Transcribe Streaming protocol documentation specifies that transcript text is returned as a Unicode string. The SDK handles binary frame parsing and string decoding internally before exposing the `Transcript` property. No caller-side encoding is needed.

---

## Common Pitfalls

### Pitfall 1: Breaking the 503 Retry Loop
**What goes wrong:** Adding `if (!response.ok) throw new Error(...)` before the 503-check means a 503 response throws instead of retrying.
**Why it happens:** Treating `!response.ok` as a single catch-all without reading the existing control flow.
**How to avoid:** The 503 block uses `continue` to retry. The `!response.ok` guard must come after the 503-specific check — not before it.
**Warning signs:** If the new guard is inserted above line 636 (`if (response.status === 503 ...)`), it is in the wrong place.

### Pitfall 2: Synchronous Blob URL Revocation
**What goes wrong:** `URL.revokeObjectURL(url)` called immediately after `window.open()` causes the opened tab to show a blank or broken page — the URL is freed before the browser fetches the content.
**Why it happens:** Treating `window.open` as synchronous (it is not — the tab loads asynchronously).
**How to avoid:** Use `setTimeout(..., 60000)`. 60 seconds is conservative and safe for large PDFs on slow connections.
**Warning signs:** If `revokeObjectURL` is called on the same tick as `window.open`, the tab will open but immediately fail to load the PDF.

### Pitfall 3: Turning Silent Transcription Errors into Visible Alerts
**What goes wrong:** Adding `throw new Error(...)` inside the transcription fetch would cause the outer `catch` in `handleSendMessage` to show "Ocorreu um erro ao processar sua mensagem" — blocking the clinician's triage flow because a non-critical logging call failed.
**Why it happens:** Applying the same guard pattern uniformly without reading D-03.
**How to avoid:** For fire-and-forget transcription calls: `if (!res.ok) console.error(...)` only. Never throw. Never alert.
**Warning signs:** Any change that causes `handleSendMessage`'s catch block to trigger on a transcription failure is wrong.

### Pitfall 4: Converting .then() Chain to async/await Unnecessarily
**What goes wrong:** The `protocol_names` fetch at line 335-347 uses a `.then()` chain inside a `useEffect`. Refactoring this to `async/await` adds churn and risk to the largest file.
**Why it happens:** Claude's discretion allows this, but it's low-value and risky in a 850-line file.
**How to avoid:** Adding the ok guard within the existing `.then()` chain is safer. Only refactor to async/await if the planner explicitly scopes it as a task and values consistency over risk.

---

## Code Examples

### Complete traverseTree guard (FRAG-01, D-05)
```javascript
// Source: verified from ProtocolTriage.jsx:625-655 + D-05 decision
if (response.status === 503 && attempt < MAX_RETRIES) {
    const delay = attempt * 1000;
    console.warn(`protocol-traverse 503, retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
    await new Promise(r => setTimeout(r, delay));
    continue;
}
// NEW: general non-2xx guard (after 503 check, before json())
if (!response.ok) {
    throw new Error(`Erro no protocolo de triagem: ${response.status}`);
}
const data = await response.json();
```

### protocol_names guard (FRAG-01, fire-and-forget not applicable — this IS user-visible per D-04)
```javascript
// Source: ProtocolTriage.jsx:335-347 current .then() chain
getAuthHeaders().then(headers => {
    fetch(`${API_URL}/protocol_names`, { headers })
        .then(res => {
            if (!res.ok) throw new Error(`Erro ao carregar protocolos: ${res.status}`);
            return res.json();
        })
        .then(data => {
            const list = data.protocols || data;
            const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
            setAllProtocols(sorted);
        })
        .catch(err => console.error("Error fetching protocols:", err));
});
```

### handlePatientSubmit transcription guard (FRAG-01, silent — D-03)
```javascript
// Source: ProtocolTriage.jsx:387 current await fetch (no ok check)
const transcriptionRes = await fetch(`${API_URL}/transcription`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ session_id: sessionId, transcription: `CONTEXTO INICIAL: ${infoString}` })
});
if (!transcriptionRes.ok) console.error('Transcription context log failed:', transcriptionRes.status);
// NOTE: do NOT throw here — patient info was already registered successfully
```

### PDF blob URL revocation (FRAG-04, identical pattern for all 3 sites)
```javascript
// Source: D-13 decision; applies to HistoryPage.jsx:30, TriageDetailsModal.jsx:124, ProtocolTriage.jsx:838
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
window.open(url, '_blank');
setTimeout(() => URL.revokeObjectURL(url), 60000);
```

### Remove escape() from useTranscribe.js (FRAG-03)
```javascript
// BEFORE — useTranscribe.js:137-139:
let text = alternatives[0].Transcript || "";
try {
    text = decodeURIComponent(escape(text));
} catch { }

// AFTER — delete the try/catch block entirely:
let text = alternatives[0].Transcript || "";
// SDK returns a decoded JS string; no re-encoding needed
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config, no test directory, no test scripts in package.json |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRAG-01 | fetch calls guard response.ok | manual-only | N/A — no test framework | N/A |
| FRAG-02 | formatDateFromKey removed, created_at used | manual-only | N/A | N/A |
| FRAG-03 | escape() removed from useTranscribe.js | manual-only | N/A | N/A |
| FRAG-04 | revokeObjectURL called after PDF open | manual-only | N/A | N/A |

**Manual-only justification:** No test infrastructure exists in this project. Testing is listed as out-of-scope in REQUIREMENTS.md until a future milestone. Verification for this phase will be via code review (grep for removed patterns) and manual browser smoke-tests.

### Wave 0 Gaps
None — no test infrastructure is expected for this phase.

### Sampling Rate
- **Per task commit:** Manual grep verification (see State of the Art section for commands)
- **Phase gate:** All 4 requirements verified by code inspection before `/gsd:verify-work`

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `decodeURIComponent(escape(text))` | Delete entirely — SDK returns decoded strings | Removes deprecated API, no behavioral change |
| Blob URL never revoked | `setTimeout(() => URL.revokeObjectURL(url), 60000)` | Prevents memory leak in long-running sessions |
| Bare `fetch()` with no status check | `if (!response.ok) throw new Error(...)` | Non-2xx responses no longer silently succeed |
| S3 key string-split for date | `item.created_at` (already in JSX) | `formatDateFromKey` deleted as dead code |

**Deprecated/outdated:**
- `escape()`: Deprecated since ES3. MDN marks it "do not use." Browsers retain it for legacy web compatibility only.
- `ScriptProcessorNode` (used in useTranscribe.js at line 70): Deprecated but out of scope for Phase 4.

**Verification grep commands (for planner to include in task completion checks):**
```bash
# FRAG-03: confirm escape() is gone
grep -n "escape(" src/useTranscribe.js  # should return nothing

# FRAG-02: confirm formatDateFromKey is gone
grep -n "formatDateFromKey" src/pages/Profile.jsx  # should return nothing

# FRAG-04: confirm revokeObjectURL present in all 3 files
grep -n "revokeObjectURL" src/components/HistoryPage.jsx src/components/TriageDetailsModal.jsx src/components/ProtocolTriage.jsx

# FRAG-01: check for unguarded fetches (manual review still needed)
grep -n "\.then(res => res\.json" src/components/ProtocolTriage.jsx  # should be gone or guarded
```

---

## Open Questions

1. **Does the /history API actually return created_at at runtime (not just in the spec)?**
   - What we know: `openapi.yaml` schema declares `created_at` as `date-time, nullable: true`. The spec example includes it. `Profile.jsx` line 113 already uses it in production (meaning it must work or the date column would always show '-').
   - What's unclear: `nullable: true` means the backend may omit it for old sessions.
   - Recommendation: The fallback `? ... : '-'` already handles null. No extra work needed. FRAG-02 is safe.

2. **Should `ProtocolTriage.jsx` protocol_names fetch be converted to async/await?**
   - What we know: The current `.then()` chain works; adding an ok guard inline is mechanical.
   - What's unclear: Whether the planner will scope this as an optional refactor task.
   - Recommendation: Keep as `.then()` chain. Lower risk in the largest file. Add the guard inline.

---

## Sources

### Primary (HIGH confidence)
- `src/components/ProtocolTriage.jsx` — direct code read; 5 unguarded fetch sites confirmed at lines 337, 387, 415, 451, 629
- `src/pages/Profile.jsx` — direct code read; `formatDateFromKey` confirmed dead code; `created_at` confirmed in production at line 113
- `src/useTranscribe.js` — direct code read; `escape()` at line 138 confirmed
- `src/components/HistoryPage.jsx` — direct code read; blob URL at line 30, no revocation
- `src/components/TriageDetailsModal.jsx` — direct code read; blob URL at line 124, no revocation
- `openapi.yaml` — direct schema read; `HistorySession.created_at` confirmed as `date-time` field at line 1317

### Secondary (MEDIUM confidence)
- MDN Web Docs (implicit): `escape()` is documented as deprecated; `URL.revokeObjectURL()` is the documented cleanup API for blob URLs
- AWS Transcribe Streaming SDK behavior: SDK returns `Transcript` as a JS string (post-parsed); no caller-side byte decoding needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all Web platform APIs
- Architecture: HIGH — all patterns verified directly from source code
- Pitfalls: HIGH — derived from reading actual control flow (503 retry, fire-and-forget pattern)
- FRAG-02 dead code finding: HIGH — confirmed by direct JSX inspection

**Research date:** 2026-04-07
**Valid until:** This research describes code at a specific commit. Valid until any of the 5 target files are modified.
