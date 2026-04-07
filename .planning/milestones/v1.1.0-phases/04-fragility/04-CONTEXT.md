# Phase 4: Fragility - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace brittle patterns across the codebase: add missing `response.ok` guards to all fetch calls, replace fragile S3-key date parsing with a reliable API field, remove deprecated `escape()` encoding, and revoke blob URLs after PDF downloads. No new features, no UI changes beyond error messaging.

</domain>

<decisions>
## Implementation Decisions

### FRAG-01: response.ok guards — scope and behavior
- **D-01:** Add `response.ok` guards to all fetch calls that currently lack them. Calls already guarded (from Phase 1 and Phase 2 work) are left as-is.
- **D-02:** Missing guards identified in codebase:
  - `ProtocolTriage.jsx:337` — `GET /protocol_names` (`.then()` chain, no ok check)
  - `ProtocolTriage.jsx:387` — `POST /transcription` (patient context log, fire-and-forget)
  - `ProtocolTriage.jsx:415` — `POST /transcription` (system message log)
  - `ProtocolTriage.jsx:451` — `POST /transcription` (user message log, fire-and-forget)
  - `ProtocolTriage.jsx:629` — `POST /protocol-traverse` (has 503 retry but no general ok guard for other non-2xx)
- **D-03:** For `/transcription` fire-and-forget calls: add `response.ok` check that logs `console.error` on failure but does NOT alert the user or block the triage flow. These are logging calls — a failed transcription log must not interrupt patient triage.
- **D-04:** For `/protocol_names` and `/protocol-traverse`: surface errors to the user via the existing error handling pattern (console.error + user-visible message).
- **D-05:** The `/protocol-traverse` retry logic (503 handling) stays as-is — just add a general `!response.ok` guard after the 503-specific check for other status codes.

### FRAG-02: Profile date source
- **D-06:** Replace `formatDateFromKey` in `Profile.jsx` (S3 key splitting) with a reliable API field. The `/history` response items should be checked for `created_at`, `timestamp`, or similar fields.
- **D-07:** Researcher must verify what date fields the `/history` API response includes. If `created_at` exists, use it directly. If no reliable field exists, keep S3 parsing as fallback with a code comment marking it fragile.
- **D-08:** Date formatting stays as `pt-BR` locale with `America/Sao_Paulo` timezone — consistent with existing code.

### FRAG-03: escape() replacement
- **D-09:** Replace `decodeURIComponent(escape(text))` in `useTranscribe.js:138` with a modern approach. The `escape()` function is deprecated.
- **D-10:** Researcher must verify whether AWS Transcribe Streaming SDK already returns properly decoded UTF-8 strings. If the SDK handles encoding, the entire `try { text = decodeURIComponent(escape(text)); } catch {}` block can be removed entirely rather than replaced.
- **D-11:** If encoding IS needed: use `TextEncoder`/`TextDecoder` APIs as the standard replacement.

### FRAG-04: Blob URL revocation
- **D-12:** All three blob URL creation sites must revoke after use: `HistoryPage.jsx:30`, `TriageDetailsModal.jsx:124`, `ProtocolTriage.jsx:838`.
- **D-13:** Since all three use `window.open(url, '_blank')`, immediate revocation would break the opened tab. Use `setTimeout(() => URL.revokeObjectURL(url), 60000)` — 60 seconds gives the browser time to load the PDF.
- **D-14:** Pattern is identical across all three sites — apply the same fix consistently.

### Claude's Discretion
- Exact error message wording for new `response.ok` guards (must be PT-BR)
- Whether to refactor the `.then()` chain on `protocol_names` fetch to `async/await` for consistency while adding the guard
- Whether to extract a shared `downloadPdf` helper for the three identical blob URL sites (only if it reduces duplication meaningfully)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — these are defensive hardening fixes with clear technical approaches.

</specifics>

<canonical_refs>
## Canonical References

### Requirements
- `.planning/REQUIREMENTS.md` SS Fragility — FRAG-01, FRAG-02, FRAG-03, FRAG-04 definitions and acceptance criteria

### API contract
- `openapi.yaml` — Check `/history` response schema for date fields (FRAG-02)

### Files to modify
- `src/components/ProtocolTriage.jsx` — 5 missing ok guards + 1 blob URL fix (FRAG-01, FRAG-04)
- `src/pages/Profile.jsx` — S3 date parsing replacement (FRAG-02)
- `src/useTranscribe.js` — escape() removal (FRAG-03)
- `src/components/HistoryPage.jsx` — blob URL revocation (FRAG-04)
- `src/components/TriageDetailsModal.jsx` — blob URL revocation (FRAG-04)

### Prior phase context
- `.planning/phases/03-tech-debt/03-CONTEXT.md` — Phase 3 created `src/utils/auth.js`; all fetch callers now use shared `getAuthHeaders`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getAuthHeaders()` from `src/utils/auth.js`: All fetch callers already import this (Phase 3 work). No auth changes needed.
- Existing error patterns: `if (!response.ok) throw new Error('Erro ao...')` is the established pattern in most guarded calls.

### Established Patterns
- Error handling: `try/catch` with `console.error` + sometimes `alert()` for user-facing errors
- Fire-and-forget: transcription calls use `.catch(e => console.error(...))` — new ok guards should follow this quiet-failure pattern
- Inline styles for everything — no new CSS needed
- All UI strings in PT-BR

### Integration Points
- `ProtocolTriage.jsx` is the largest file (~850+ lines) and carries 6 of the fixes — changes must be precise and non-disruptive
- `Profile.jsx` date display: consumers render the formatted date string directly — changing source doesn't affect rendering logic
- `useTranscribe.js` encoding: change is inside the transcript processing callback — isolated from component state

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-fragility*
*Context gathered: 2026-04-07*
