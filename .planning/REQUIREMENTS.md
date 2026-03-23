# Requirements: Triax Prototype

**Defined:** 2026-03-23
**Core Value:** Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

## v1 Requirements

### API Alignment (openapi.yaml v1.1.0)

- [ ] **API-01**: App calls `POST /protocol-suggest` (not `/suggest_protocol`) for protocol suggestion
- [ ] **API-02**: App calls `POST /protocol-traverse` (not `/traverse`) for decision tree traversal
- [ ] **API-03**: App calls `POST /session-finish` (not `/end_session`) to finalize a session
- [ ] **API-04**: App submits vital sign readings via `POST /sensor-data` as a dedicated call (not embedded inline in traversal payload only)
- [ ] **API-05**: App submits transcription text via `POST /transcription` as a dedicated call
- [x] **API-06**: History views display `triage_result.discriminador` (not the old `classification` field)
- [ ] **API-07**: App calls `GET /protocol/{protocol_name}` to retrieve full protocol definition before traversal (if not already fetched)
- [ ] **API-08**: All API calls use the correct request body schemas as defined in openapi.yaml v1.1.0

### Auth & Security

- [ ] **AUTH-01**: Cognito User Pool ID, Client ID, and Identity Pool ID are read from environment variables (not hardcoded in `src/aws-config.js`)
- [ ] **AUTH-02**: When `fetchAuthSession()` fails or returns no token, the app throws a clear auth error instead of silently omitting the Authorization header
- [ ] **AUTH-03**: Admin route (`/admin/users`) is protected at the route level — unauthenticated or non-admin users cannot reach the component at all

### Tech Debt

- [ ] **DEBT-01**: `getAuthHeaders` function exists in a single shared utility (`src/utils/auth.js`) and is imported from there in all 5 files that previously duplicated it
- [ ] **DEBT-02**: `PatientForm` initial state contains no demo/hardcoded patient data (no "João da Silva", age 45, ticket "AZ001")
- [ ] **DEBT-03**: `jspdf` and `html2canvas` packages are removed from `package.json` and `package-lock.json`

### Fragility

- [ ] **FRAG-01**: Every `fetch` call in the app checks `response.ok` before proceeding, and surfaces an error on non-2xx responses
- [ ] **FRAG-02**: Session date display in `Profile.jsx` does not depend on splitting S3 key filenames — dates come from a reliable field (`created_at` or equivalent from the API response)
- [ ] **FRAG-03**: `useTranscribe.js` does not use the deprecated `escape()` function — encoding uses `TextDecoder` or a supported alternative
- [ ] **FRAG-04**: PDF blob URLs created in `HistoryPage.jsx` are revoked via `URL.revokeObjectURL` after the download link is clicked

## v2 Requirements

### Performance

- **PERF-01**: Protocol names (`/protocol_names`) are cached in memory for the session — not re-fetched on every `ProtocolTriage` mount
- **PERF-02**: User profile (`/me`) is not re-fetched on every page load — cached in `UserContext` until explicit refresh
- **PERF-03**: Audio processing uses `AudioWorklet` instead of the deprecated `ScriptProcessorNode`

### Testing

- **TEST-01**: Protocol traversal state machine has unit tests covering priority assignment logic
- **TEST-02**: Auth utility (`getAuthHeaders`) has unit tests covering token success, token failure, and no-session cases
- **TEST-03**: Sensor input validation has unit tests for boundary values (min/max GCS, O2 sat, etc.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Test suite | High effort, future milestone — pilot phase can tolerate zero coverage temporarily |
| AudioWorklet migration | High complexity, no user-facing impact for pilot phase |
| New triage features | This milestone is alignment + cleanup only — no scope creep |
| OAuth / SSO | Cognito email/password is sufficient for pilot |
| Mobile app | Web-first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Pending |
| API-05 | Phase 1 | Pending |
| API-06 | Phase 1 | Complete |
| API-07 | Phase 1 | Pending |
| API-08 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| DEBT-01 | Phase 3 | Pending |
| DEBT-02 | Phase 3 | Pending |
| DEBT-03 | Phase 3 | Pending |
| FRAG-01 | Phase 4 | Pending |
| FRAG-02 | Phase 4 | Pending |
| FRAG-03 | Phase 4 | Pending |
| FRAG-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap creation*
