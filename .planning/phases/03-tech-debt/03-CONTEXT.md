# Phase 3: Tech Debt - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract the duplicated `getAuthHeaders` auth helper into a single shared utility, remove hardcoded demo patient data from `ProtocolTriage.jsx`, and prune the unused `jspdf` and `html2canvas` dependencies from the bundle. No new features; no UI changes beyond clearing the demo values.

</domain>

<decisions>
## Implementation Decisions

### Auth utility shape (DEBT-01)
- **D-01:** Create `src/utils/auth.js` exporting a single async `getAuthHeaders()` function that calls `fetchAuthSession()`, extracts the id token, and returns `{ 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' }`.
- **D-02:** All 5 files that currently duplicate auth logic must import from the new utility: `HistoryPage.jsx`, `ProtocolTriage.jsx`, `TriageDetailsModal.jsx`, `AdminUsers.jsx`, `Profile.jsx`.
- **D-03:** `UserContext.jsx` also calls `fetchAuthSession()` but for error detection, not headers — it does NOT use `getAuthHeaders` and is NOT refactored in this phase.
- **D-04:** The shared function should include null-safety: if `fetchAuthSession()` returns no token, throw an error (consistent with Phase 2's UserContext hardening) rather than silently returning incomplete headers.
- **D-05:** `ProtocolTriage.jsx` currently defines `getAuthHeaders` as a `useCallback` (to capture nothing — it's stateless). Replace with a direct import; no need to keep it as a hook.

### Demo data removal (DEBT-02)
- **D-06:** Demo patient data lives in `ProtocolTriage.jsx` initial state (lines ~150-155: `name: 'João da Silva'`, `ticket_number: 'AZ001'`, etc.). Clear all hardcoded values to empty strings `''`.
- **D-07:** Do NOT add new placeholder text to the initial state — JSX `placeholder` attributes already handle UI hints (e.g., `placeholder="Ex: PU0022"` on ticket_number).
- **D-08:** No other files contain demo patient data — the change is isolated to `ProtocolTriage.jsx`.

### Dependency removal (DEBT-03)
- **D-09:** Remove `jspdf` and `html2canvas` from `package.json` `dependencies`. Neither is imported anywhere in `src/` — removal is safe.
- **D-10:** Run `npm install` after removal to update `package-lock.json`.
- **D-11:** No source file imports need updating (confirmed: zero import statements reference either package).

### Claude's Discretion
- Exact function signature and JSDoc (if any) for `src/utils/auth.js`
- Whether to add a brief comment explaining the null-safety throw
- Import ordering in refactored files

</decisions>

<specifics>
## Specific Ideas

No specific requirements — standard refactor approach. User deferred all decisions to Claude.

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above and in REQUIREMENTS.md.

### Requirements
- `.planning/REQUIREMENTS.md` §Tech Debt — DEBT-01, DEBT-02, DEBT-03 (acceptance criteria)

### Prior phase context (auth patterns)
- `.planning/phases/02-auth-security/02-002-auth-error-admin-guard-PLAN.md` — Phase 2 hardened UserContext auth error handling; the new shared utility should be consistent with that pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/contexts/UserContext.jsx`: Already imports `fetchAuthSession` — do not change its auth logic, only the 5 target files
- Existing `placeholder` attributes in ProtocolTriage JSX form fields: Already provide user-facing hints, so clearing initial state values is safe

### Established Patterns
- Auth pattern (HistoryPage, ProtocolTriage): `const session = await fetchAuthSession(); const token = session.tokens?.idToken?.toString(); return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }`
- ES module imports throughout — `src/utils/auth.js` should use `export async function getAuthHeaders()`

### Integration Points
- 5 files must have their inline auth logic removed and replaced with `import { getAuthHeaders } from '../utils/auth'` (adjust relative path per file location)
- `package.json` + `package-lock.json` both updated by `npm install` after removal

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-tech-debt*
*Context gathered: 2026-03-30*
