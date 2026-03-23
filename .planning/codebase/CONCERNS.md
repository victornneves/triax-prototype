# CONCERNS.md — Technical Debt & Concerns

## Security

### AWS Config Hardcoded in Source
**File:** `src/aws-config.js`
Cognito User Pool ID, Client ID, Identity Pool ID, and S3 bucket name are hardcoded directly in source code. While these are not secret keys (Cognito public identifiers), they should ideally be env vars to allow different configs per environment (dev/staging/prod).

### Client-Side-Only Admin Guard
**File:** `src/pages/AdminUsers.jsx:16-19`
Admin route protection is done client-side only — the component redirects non-admins via `navigate('/')`, but momentarily renders `null` before the redirect. The real guard must be on the API, but the frontend has no route-level protection.

### Silent Token Omission
**File:** `src/components/HistoryPage.jsx:22-26` (and duplicated elsewhere)
If `fetchAuthSession()` fails or returns no token, `getAuthHeaders` silently returns headers **without** the Authorization header. The request proceeds unauthenticated — this could cause confusing failures rather than a clear auth error.

### Blob URL Memory Leak
**File:** `src/components/HistoryPage.jsx:47-49`
PDF blob URL created with `window.URL.createObjectURL(blob)` is never revoked (`URL.revokeObjectURL`). Each PDF download leaks a blob URL in memory.

## Tech Debt

### `getAuthHeaders` Duplicated in 5 Files
The same async function is copy-pasted into `ProtocolTriage.jsx`, `HistoryPage.jsx`, `Profile.jsx`, `AdminUsers.jsx`, and `UserContext.jsx`. Should be extracted to `src/utils/auth.js`.

### God Component — ProtocolTriage.jsx
**File:** `src/components/ProtocolTriage.jsx` (~400+ lines)
Contains: PatientForm, sensor config, GCSInput, PainInput, SensorLabel sub-components, the main triage state machine, audio recording integration, and all triage API calls. Extremely difficult to maintain or extend.

### Hardcoded Demo Patient Data
**File:** `src/components/ProtocolTriage.jsx:149-158`
`PatientForm` is pre-filled with demo data (`João da Silva`, age 45, ticket `AZ001`, etc.). This debug data ships to production.

### Unused Dependencies
`html2canvas` and `jspdf` are installed but never imported. PDF generation is done server-side (backend returns a PDF blob). These add ~500KB+ to the bundle unnecessarily.

## Performance

### Deprecated `ScriptProcessorNode` on Main Thread
**File:** `src/useTranscribe.js:70`
`audioContext.createScriptProcessor(4096, 1, 1)` uses the deprecated `ScriptProcessorNode` API which runs on the main thread and can cause audio glitches. Should be replaced with `AudioWorklet`.

### No API Response Caching
Protocol names (`/protocol_names`) are fetched on every `ProtocolTriage` mount with no caching. User profile (`/me`) is also fetched fresh on every page load.

## Fragility

### Date Parsing from S3 Key Filenames
**File:** `src/pages/Profile.jsx:47-58`
Session timestamps are parsed by splitting the S3 object key filename on `-` and extracting `parts[1]` as a Unix timestamp. This is extremely fragile — any key naming change in the backend breaks date display.

### Deprecated `escape()` Encoding
**File:** `src/useTranscribe.js:138`
`decodeURIComponent(escape(text))` uses the deprecated global `escape()` function for character encoding workaround. This is a fragile hack that may not work in all browsers.

### No `response.ok` Check in Some Fetch Calls
**File:** `src/components/ProtocolTriage.jsx` (patient-info POST)
Some `fetch` calls don't check `response.ok` before proceeding, meaning silent failures are possible.

## Zero Test Coverage
This is a clinical triage application with no tests whatsoever. Protocol traversal logic, sensor input handling, and auth flows are all untested. High risk for a healthcare context.
