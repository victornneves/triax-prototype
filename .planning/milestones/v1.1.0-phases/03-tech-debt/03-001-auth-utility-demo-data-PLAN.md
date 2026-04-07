---
phase: 03-tech-debt
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/auth.js
  - src/components/ProtocolTriage.jsx
  - src/components/HistoryPage.jsx
  - src/components/TriageDetailsModal.jsx
  - src/pages/AdminUsers.jsx
  - src/pages/Profile.jsx
autonomous: true
requirements: [DEBT-01, DEBT-02]

must_haves:
  truths:
    - "getAuthHeaders is defined once in src/utils/auth.js and nowhere else"
    - "All 5 consumer files import getAuthHeaders from src/utils/auth.js"
    - "No file still imports fetchAuthSession for the purpose of building auth headers (UserContext excluded per D-03)"
    - "getAuthHeaders throws when no token is available instead of returning incomplete headers"
    - "PatientForm initial state contains no demo patient data"
  artifacts:
    - path: "src/utils/auth.js"
      provides: "Shared async getAuthHeaders function"
      exports: ["getAuthHeaders"]
    - path: "src/components/ProtocolTriage.jsx"
      provides: "Imports getAuthHeaders, demo data cleared"
      contains: "import { getAuthHeaders } from"
    - path: "src/components/HistoryPage.jsx"
      provides: "Imports getAuthHeaders"
      contains: "import { getAuthHeaders } from"
    - path: "src/components/TriageDetailsModal.jsx"
      provides: "Imports getAuthHeaders"
      contains: "import { getAuthHeaders } from"
    - path: "src/pages/AdminUsers.jsx"
      provides: "Imports getAuthHeaders"
      contains: "import { getAuthHeaders } from"
    - path: "src/pages/Profile.jsx"
      provides: "Imports getAuthHeaders"
      contains: "import { getAuthHeaders } from"
  key_links:
    - from: "src/components/ProtocolTriage.jsx"
      to: "src/utils/auth.js"
      via: "ES module import"
      pattern: "import.*getAuthHeaders.*from.*utils/auth"
    - from: "src/components/HistoryPage.jsx"
      to: "src/utils/auth.js"
      via: "ES module import"
      pattern: "import.*getAuthHeaders.*from.*utils/auth"
---

<objective>
Extract the duplicated `getAuthHeaders` auth helper into a single shared utility and remove hardcoded demo patient data from the PatientForm component.

Purpose: Eliminate 5 copies of identical auth logic (DRY principle) and ensure production builds never ship with test patient data pre-filled in form fields.
Output: `src/utils/auth.js` with shared `getAuthHeaders`, 5 refactored consumer files, demo data cleared from ProtocolTriage.jsx PatientForm.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-tech-debt/03-CONTEXT.md

@src/components/ProtocolTriage.jsx
@src/components/HistoryPage.jsx
@src/components/TriageDetailsModal.jsx
@src/pages/AdminUsers.jsx
@src/pages/Profile.jsx

<interfaces>
<!-- Current inline auth pattern (duplicated in all 5 files). This is what gets extracted. -->

From src/components/HistoryPage.jsx (lines 19-31, canonical example):
```javascript
const getAuthHeaders = async () => {
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    } catch (e) {
        console.error("Error fetching auth session", e);
        return { 'Content-Type': 'application/json' };
    }
};
```

From src/components/ProtocolTriage.jsx (lines 360-372, useCallback variant):
```javascript
const getAuthHeaders = useCallback(async () => {
    // Same body as above, wrapped in useCallback
}, []);
```

From src/contexts/UserContext.jsx (lines 15-16, NOT to be changed per D-03):
```javascript
const session = await fetchAuthSession();
// Used for error detection, not header building
```

Note: AdminUsers, Profile, and TriageDetailsModal do NOT define a getAuthHeaders function.
They call fetchAuthSession() inline in their fetch blocks and build headers manually.
All must be refactored to use the shared utility.

Additional note: HistoryPage.jsx, ProtocolTriage.jsx, and TriageDetailsModal.jsx each have
a handleDownloadPDF function that calls fetchAuthSession() directly (not through getAuthHeaders)
to build an Authorization-only header (no Content-Type, since it fetches a PDF blob).
These PDF download calls should also use getAuthHeaders for the Authorization token,
but note they only need the Authorization header, not Content-Type. The shared utility
returns both headers which is fine — extra Content-Type on a GET request is harmless.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create shared auth utility</name>
  <files>src/utils/auth.js</files>
  <read_first>
    - src/components/HistoryPage.jsx (lines 19-31 for canonical getAuthHeaders pattern)
    - src/contexts/UserContext.jsx (lines 14-24 for Phase 2 auth error pattern — D-04 consistency)
  </read_first>
  <action>
    Create directory `src/utils/` and file `src/utils/auth.js`.

    The file must export a single async function `getAuthHeaders` per D-01:

    ```javascript
    import { fetchAuthSession } from 'aws-amplify/auth';

    export async function getAuthHeaders() {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    ```

    Key differences from the current inline pattern (per D-04):
    - No try/catch — let errors propagate to callers (each caller already has its own try/catch)
    - Throws explicitly when token is null/undefined instead of returning incomplete headers
    - No conditional spread for Authorization — if no token, we throw, so Authorization is always present

    Do NOT wrap in useCallback (per D-05 — stateless function, not a hook).
  </action>
  <verify>
    <automated>test -f src/utils/auth.js && grep -q "export async function getAuthHeaders" src/utils/auth.js && grep -q "throw new Error" src/utils/auth.js && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <acceptance_criteria>
    - src/utils/auth.js exists
    - File contains `export async function getAuthHeaders()`
    - File contains `import { fetchAuthSession } from 'aws-amplify/auth'`
    - File contains `throw new Error` for null token case
    - File does NOT contain `try {` or `catch` (errors propagate to callers)
    - File contains `'Authorization': \`Bearer ${token}\``
    - File contains `'Content-Type': 'application/json'`
  </acceptance_criteria>
  <done>src/utils/auth.js exists, exports getAuthHeaders, throws on missing token</done>
</task>

<task type="auto">
  <name>Task 2: Refactor 5 consumer files and clear demo data</name>
  <files>
    src/components/ProtocolTriage.jsx
    src/components/HistoryPage.jsx
    src/components/TriageDetailsModal.jsx
    src/pages/AdminUsers.jsx
    src/pages/Profile.jsx
  </files>
  <read_first>
    - src/utils/auth.js (just created in Task 1 — verify export signature)
    - src/components/ProtocolTriage.jsx (full file — multiple auth call sites + demo data at lines 149-159)
    - src/components/HistoryPage.jsx (full file — getAuthHeaders definition + handleDownloadPDF inline auth)
    - src/components/TriageDetailsModal.jsx (full file — two inline fetchAuthSession calls)
    - src/pages/AdminUsers.jsx (full file — one inline fetchAuthSession call)
    - src/pages/Profile.jsx (full file — one inline fetchAuthSession call)
  </read_first>
  <action>
    **Part A: Refactor ProtocolTriage.jsx (per D-01, D-02, D-05, D-06, D-07)**

    1. Add import: `import { getAuthHeaders } from '../utils/auth';`
    2. Remove import: `import { fetchAuthSession } from 'aws-amplify/auth';` — BUT check if fetchAuthSession is also used outside getAuthHeaders. Lines 847 shows `const sessionData = await fetchAuthSession()` in handleDownloadPDF. Replace that with getAuthHeaders() too (extract token from returned headers or refactor to use the shared function for the Authorization header). The simplest approach: replace the handleDownloadPDF's inline fetchAuthSession with `const headers = await getAuthHeaders(); ... headers: { 'Authorization': headers['Authorization'] }` or just pass the full headers object.
    3. Remove the entire `const getAuthHeaders = useCallback(async () => { ... }, []);` block (lines 360-372)
    4. Replace demo data (lines 149-159) — change PatientForm initial useState to:
       ```javascript
       const [formData, setFormData] = useState({
           name: '',
           age: '',
           sex: '',
           patient_code: '',
           birth_date: '',
           ticket_number: '',
           insurance: '',
           visit_id: '',
           same: ''
       });
       ```
    5. Verify all existing `getAuthHeaders()` call sites still work (they call the same function name, now imported instead of local)

    **Part B: Refactor HistoryPage.jsx (per D-01, D-02)**

    1. Add import: `import { getAuthHeaders } from '../utils/auth';`
    2. Remove import: `import { fetchAuthSession } from 'aws-amplify/auth';`
    3. Remove the local `const getAuthHeaders = async () => { ... };` block (lines 19-31)
    4. In handleDownloadPDF (line 37): replace inline `const sessionData = await fetchAuthSession(); const token = ...` with `const headers = await getAuthHeaders();` and use `headers: headers` (or extract just Authorization if needed for the blob fetch). Full headers object is fine for a GET request.

    **Part C: Refactor TriageDetailsModal.jsx (per D-01)**

    1. Add import: `import { getAuthHeaders } from '../utils/auth';`
    2. Remove import: `import { fetchAuthSession } from 'aws-amplify/auth';`
    3. In fetchDetails (line 17-18): replace `const session = await fetchAuthSession(); const token = session.tokens?.idToken?.toString();` with `const headers = await getAuthHeaders();` and use `headers: headers` in the fetch call instead of `headers: { 'Authorization': \`Bearer ${token}\` }`
    4. In handleDownloadPDF (line 120-121): same replacement pattern as step 3

    **Part D: Refactor AdminUsers.jsx (per D-01)**

    1. Add import: `import { getAuthHeaders } from '../../utils/auth';` (note: pages/ is one level deeper than components/)
    2. Remove import: `import { fetchAuthSession } from 'aws-amplify/auth';`
    3. In fetchUsers (line 28-29): replace `const session = await fetchAuthSession(); const token = session.tokens?.idToken?.toString();` with `const headers = await getAuthHeaders();` and use `headers: headers` in the fetch call

    **Part E: Refactor Profile.jsx (per D-01)**

    1. Add import: `import { getAuthHeaders } from '../../utils/auth';` (pages/ directory)
    2. Remove import: `import { fetchAuthSession } from 'aws-amplify/auth';`
    3. In fetchHistory (line 18-19): replace `const session = await fetchAuthSession(); const token = session.tokens?.idToken?.toString();` with `const headers = await getAuthHeaders();` and use `headers: headers` in the fetch call

    **IMPORTANT per D-03:** Do NOT touch `src/contexts/UserContext.jsx`. It uses fetchAuthSession for error detection, not header building.
  </action>
  <verify>
    <automated>
      # No inline getAuthHeaders definitions remain (except in auth.js itself)
      ! grep -rn "const getAuthHeaders" src/components/ src/pages/ 2>/dev/null | grep -v node_modules && \
      # No fetchAuthSession imports in the 5 target files
      ! grep -l "from 'aws-amplify/auth'" src/components/HistoryPage.jsx src/components/ProtocolTriage.jsx src/components/TriageDetailsModal.jsx src/pages/AdminUsers.jsx src/pages/Profile.jsx 2>/dev/null && \
      # All 5 files import from utils/auth
      grep -l "from.*utils/auth" src/components/HistoryPage.jsx src/components/ProtocolTriage.jsx src/components/TriageDetailsModal.jsx src/pages/AdminUsers.jsx src/pages/Profile.jsx | wc -l | grep -q "5" && \
      # Demo data cleared
      ! grep -q "João" src/components/ProtocolTriage.jsx && \
      # UserContext unchanged
      grep -q "fetchAuthSession" src/contexts/UserContext.jsx && \
      echo "ALL PASS" || echo "FAIL"
    </automated>
  </verify>
  <acceptance_criteria>
    - No file in src/components/ or src/pages/ contains `const getAuthHeaders` (local definitions removed)
    - No file among the 5 targets contains `import { fetchAuthSession } from 'aws-amplify/auth'`
    - All 5 files contain `import { getAuthHeaders } from` with path to `utils/auth`
    - src/components/ProtocolTriage.jsx does NOT contain `useCallback` wrapping getAuthHeaders
    - src/components/ProtocolTriage.jsx PatientForm useState contains `name: ''` (not `'João da Silva'`)
    - src/components/ProtocolTriage.jsx does NOT contain `AZ001`
    - src/components/ProtocolTriage.jsx does NOT contain `João`
    - src/contexts/UserContext.jsx still contains `fetchAuthSession` (unchanged per D-03)
    - `npm run build` completes without errors (Vite production build)
  </acceptance_criteria>
  <done>All 5 files import getAuthHeaders from shared utility, no inline auth definitions remain, demo patient data is cleared, UserContext untouched, build succeeds</done>
</task>

</tasks>

<verification>
1. `grep -rn "getAuthHeaders" src/` — should show: 1 definition in utils/auth.js, imports in 5 consumer files, call sites in those files
2. `grep -rn "fetchAuthSession" src/` — should show ONLY in src/contexts/UserContext.jsx and src/utils/auth.js
3. `grep "João\|AZ001\|12345\|Unimed\|VISIT-999\|009988" src/components/ProtocolTriage.jsx` — should return nothing
4. `npm run build` — should succeed with zero errors
</verification>

<success_criteria>
- Single source of truth for auth headers at src/utils/auth.js
- Zero duplicated getAuthHeaders definitions across the codebase
- PatientForm loads with empty fields (no demo data)
- Production build succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/03-tech-debt/03-001-auth-utility-demo-data-SUMMARY.md`
</output>
