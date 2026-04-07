---
phase: 03-tech-debt
plan: 001
subsystem: auth
tags: [aws-amplify, cognito, jwt, react, cleanup, dry]

# Dependency graph
requires:
  - phase: 02-auth-security
    provides: fetchAuthSession pattern and UserContext error handling established in Phase 02
provides:
  - Single shared getAuthHeaders utility at src/utils/auth.js
  - All 5 consumer components using shared auth helper (no duplication)
  - PatientForm with empty initial state (no demo data)
affects: [03-tech-debt, future phases that add new API call sites]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared auth helper: getAuthHeaders in src/utils/auth.js; all fetch callers import from there"
    - "Auth utility throws on missing token rather than silently returning incomplete headers"

key-files:
  created:
    - src/utils/auth.js
  modified:
    - src/components/ProtocolTriage.jsx
    - src/components/HistoryPage.jsx
    - src/components/TriageDetailsModal.jsx
    - src/pages/AdminUsers.jsx
    - src/pages/Profile.jsx

key-decisions:
  - "getAuthHeaders throws on null token instead of returning incomplete headers — callers already have try/catch so errors propagate correctly"
  - "useCallback wrapper removed from getAuthHeaders — it is a pure async function, not a hook; no memoization needed"
  - "UserContext.jsx left unchanged — it uses fetchAuthSession for error detection, not header building (D-03)"

patterns-established:
  - "Auth utility pattern: import { getAuthHeaders } from '../utils/auth' in any file making authenticated API calls"

requirements-completed: [DEBT-01, DEBT-02]

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 03 Plan 001: Auth Utility and Demo Data Summary

**Shared `getAuthHeaders` extracted to `src/utils/auth.js`, eliminating 5 duplicated inline definitions, plus PatientForm demo data cleared**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T13:25:06Z
- **Completed:** 2026-04-07T13:27:10Z
- **Tasks:** 2
- **Files modified:** 7 (1 created, 5 refactored, 1 partially pre-done)

## Accomplishments

- `src/utils/auth.js` created with a single `export async function getAuthHeaders()` that throws on null/missing token (replaces 5 duplicate inline copies)
- All 5 consumer files (`ProtocolTriage.jsx`, `HistoryPage.jsx`, `TriageDetailsModal.jsx`, `AdminUsers.jsx`, `Profile.jsx`) now import from the shared utility — zero inline `const getAuthHeaders` definitions remain
- PatientForm initial state cleared: all 9 fields set to empty strings — no demo patient data (`João da Silva`, `AZ001`, etc.) will ship to production
- `handleDownloadPDF` in `ProtocolTriage.jsx` also refactored to use shared utility (was using `fetchAuthSession` directly)
- `useCallback` import removed from `ProtocolTriage.jsx` — it had been used solely to wrap the now-deleted local `getAuthHeaders`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared auth utility** - `033cef1` (feat) — pre-existing from previous session
2. **Task 2: Refactor 5 consumer files and clear demo data** - `fb3c8e6` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/utils/auth.js` - Shared async `getAuthHeaders()` function; throws on missing token; single import for all callers
- `src/components/ProtocolTriage.jsx` - Replaced `fetchAuthSession` import + inline `useCallback` getAuthHeaders + PDF inline auth with shared utility; cleared PatientForm demo data
- `src/components/HistoryPage.jsx` - Already refactored (Task 1 session); imports from shared utility
- `src/components/TriageDetailsModal.jsx` - Already refactored (Task 1 session); imports from shared utility
- `src/pages/AdminUsers.jsx` - Already refactored (Task 1 session); imports from shared utility
- `src/pages/Profile.jsx` - Replaced `fetchAuthSession` inline usage with shared utility import

## Decisions Made

- `getAuthHeaders` throws on null token rather than silently returning incomplete headers — existing callers all have `try/catch`, so errors propagate and clinicians see an error instead of a silent 401
- `useCallback` wrapper removed — the function has no dependencies and is not a hook; wrapping it added noise with no benefit
- `UserContext.jsx` left unchanged — it uses `fetchAuthSession` for auth error detection at app startup, not for building request headers (per D-03)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Also fixed handleDownloadPDF in ProtocolTriage.jsx**
- **Found during:** Task 2 (Refactor 5 consumer files)
- **Issue:** The plan's Task 2 action mentioned fixing `handleDownloadPDF` (line 847) but it was the only remaining `fetchAuthSession` call in ProtocolTriage.jsx after removing the inline `getAuthHeaders`. Not fixing it would have left an orphaned `fetchAuthSession` call.
- **Fix:** Replaced `fetchAuthSession` + manual token extraction with `const headers = await getAuthHeaders()` in `handleDownloadPDF`
- **Files modified:** src/components/ProtocolTriage.jsx
- **Verification:** `grep fetchAuthSession src/components/ProtocolTriage.jsx` returns nothing; build passes
- **Committed in:** fb3c8e6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug — this fix was explicitly described in the plan action text)
**Impact on plan:** Necessary for correctness; no scope creep.

## Issues Encountered

- `HistoryPage.jsx`, `TriageDetailsModal.jsx`, and `AdminUsers.jsx` were already refactored in the prior session that created `src/utils/auth.js` (commit `033cef1`). Only `ProtocolTriage.jsx` and `Profile.jsx` remained. Execution resumed from that state without redoing completed work.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Auth utility is the shared foundation; any new API call sites in Phase 03 onward should import from `src/utils/auth.js`
- Phase 03 Plans 002+ (response.ok guards, S3 date parsing, escape() fix, blob URL leak) can proceed
- No blockers

---
*Phase: 03-tech-debt*
*Completed: 2026-04-07*
