---
phase: 01-api-alignment
verified: 2026-03-23T00:00:00Z
status: gaps_found
score: 6/8 requirements verified
gaps:
  - truth: "App calls POST /protocol-suggest (not /suggest_protocol) for protocol suggestion"
    status: failed
    reason: "The endpoint path is correct (/protocol-suggest at line 496) but the request body is missing the required response.ok check — a non-2xx response is silently ignored. More critically: API-01 in REQUIREMENTS.md is still marked [ ] (pending), and the ROADMAP plan status for 01-001 is also marked [ ]. The SUMMARY for 01-001 claims both tasks complete but the path was already right before Phase 1. No independent pre-phase evidence exists, yet the requirement remains unchecked in REQUIREMENTS.md."
    artifacts:
      - path: "src/components/ProtocolTriage.jsx"
        issue: "checkProtocolSuggestion has no response.ok check — non-2xx silently falls through to data.reply which will be undefined. This is a silent failure path."
    missing:
      - "Add response.ok guard in checkProtocolSuggestion (line ~505) before calling response.json()"
  - truth: "All API calls use the correct request body schemas as defined in openapi.yaml v1.1.0 (API-08)"
    status: failed
    reason: "API-08 covers all request body schemas. checkProtocolSuggestion lacks a response.ok check, meaning a 4xx/5xx response body is parsed as if it were a valid ProtocolSuggestResponse — schema mismatch at runtime. Additionally, the /patient-info call (line 381) has no response.ok check either; errors are swallowed. REQUIREMENTS.md still marks API-08 as [ ] (pending)."
    artifacts:
      - path: "src/components/ProtocolTriage.jsx"
        issue: "checkProtocolSuggestion (line 505): response.json() called unconditionally — no response.ok guard"
      - path: "src/components/ProtocolTriage.jsx"
        issue: "handlePatientSubmit (line 381): /patient-info fetch has no response.ok check"
    missing:
      - "Add response.ok check in checkProtocolSuggestion before response.json()"
      - "Add response.ok check in handlePatientSubmit for /patient-info"
human_verification:
  - test: "Complete a triage session end-to-end"
    expected: "Protocol suggestion works, traversal advances correctly, session-finish is called at completion, and the triage priority color is displayed correctly"
    why_human: "Runtime API integration cannot be verified statically — needs a live Cognito session and backend"
  - test: "Submit vital signs and confirm sensor-data call fires"
    expected: "POST /sensor-data is sent before POST /protocol-traverse when clinician confirms vital signs"
    why_human: "Fire order and network request timing require browser devtools to verify"
  - test: "View session history and confirm discriminador field displays"
    expected: "History views show triage_result.discriminador value, not 'Discriminador Indisponivel'"
    why_human: "Requires real session data in the backend to verify the field is populated"
---

# Phase 1: API Alignment Verification Report

**Phase Goal:** Every API call the frontend makes matches the endpoint paths, HTTP methods, and request/response schemas defined in openapi.yaml v1.1.0
**Verified:** 2026-03-23
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Protocol suggestion calls `POST /protocol-suggest` and the app returns a suggested protocol without errors | PARTIAL | Path is correct (line 496), `prompt` field present (line 500), `userMsg` passed as second arg (line 475). BUT: no `response.ok` check — non-2xx silently falls through |
| 2 | Decision tree traversal calls `POST /protocol-traverse` and nodes advance correctly | VERIFIED | `fetch(\`${API_URL}/protocol-traverse\`)` at line 639. Call wired in `traverseTree`, called from multiple paths including `handleSendSensors` and `confirmProtocol` |
| 3 | Session finalization calls `POST /session-finish` and the triage result is displayed | VERIFIED | `finishSession()` defined at line 755, calls `/session-finish` with `{ session_id }`. Called in both `status === 'complete'` branch (line 699) and `next.type === 'assignment'` branch (line 715). No `end_session` references remain |
| 4 | Vital sign readings are submitted via `POST /sensor-data` as a dedicated call | VERIFIED | `submitSensorData()` at line 535 calls `fetch(\`${API_URL}/sensor-data\`)`. Called in `handleSendSensors` BEFORE `traverseTree` (line 789). Payload maps all SensorDataRequest fields with correct type coercion |
| 5 | History views display `triage_result.discriminador` instead of the old `classification` field | VERIFIED | HistoryPage.jsx line 192: `discriminador \|\| 'Discriminador Indisponivel'` — no `classification` present. TriageDetailsModal.jsx line 153: `triageResult.discriminador \|\| 'Discriminador Indisponivel'` — `details?.discriminator` fallback removed. Profile.jsx: no `classification` references confirmed |

**Score:** 4/5 truths fully verified (Truth 1 is partial due to missing response.ok guard)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ProtocolTriage.jsx` | Fixed API schemas, session-finish, sensor-data, protocol fetch | VERIFIED (with gap) | All new functions present and substantive. Gap: missing response.ok in checkProtocolSuggestion and handlePatientSubmit |
| `src/components/HistoryPage.jsx` | discriminador as primary display field | VERIFIED | Line 192 uses `discriminador` only, no `classification` |
| `src/components/TriageDetailsModal.jsx` | discriminador from triage_result | VERIFIED | Line 153: `triageResult.discriminador \|\| 'Discriminador Indisponivel'` |
| `src/pages/Profile.jsx` | No classification references | VERIFIED | grep returns 0 matches for `classification` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| ProtocolTriage.jsx | `/patient-info` | fetch POST flat body | VERIFIED | Lines 381-396: flat fields (session_id, name, age, sex, patient_code, birth_date, ticket_number, insurance, visit_id, same). No `patient_info:` wrapper |
| ProtocolTriage.jsx | `/protocol-suggest` | fetch POST with prompt field | VERIFIED | Line 496-503: body includes `prompt: promptText \|\| ""`, `session_id`, `node_id`. Called with `userMsg` at line 475 |
| ProtocolTriage.jsx | `/session-finish` | fetch POST on triage completion | VERIFIED | Line 758: `fetch(\`${API_URL}/session-finish\`)` with `{ session_id }`. Wired at lines 699 and 715 |
| ProtocolTriage.jsx | `/sensor-data` | fetch POST with sensor readings + session_id | VERIFIED | Line 555: `fetch(\`${API_URL}/sensor-data\`)`. Called in handleSendSensors before traverseTree (line 789) |
| ProtocolTriage.jsx | `/protocol/{protocol_name}` | fetch GET with protocol name path param | VERIFIED | Line 575: `fetch(\`${API_URL}/protocol/${protocolName}\`)`. No auth headers (public endpoint per openapi.yaml). Called in confirmProtocol at line 601 |
| ProtocolTriage.jsx | `/protocol-traverse` | fetch POST for traversal | VERIFIED | Line 639: `fetch(\`${API_URL}/protocol-traverse\`)`. Multiple call sites intact |
| ProtocolTriage.jsx | `/transcription` | fetch POST with transcription text | VERIFIED | Lines 400, 428, 464: three distinct call sites, all unmodified |
| HistoryPage.jsx | `triage_result.discriminador` | direct property access | VERIFIED | Line 192: `selectedSession.triage_result?.discriminador` |
| TriageDetailsModal.jsx | `triage_result.discriminador` | direct property access | VERIFIED | Line 153: `triageResult.discriminador` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| API-01 | 01-001 | App calls `POST /protocol-suggest` (not `/suggest_protocol`) | SATISFIED | Line 496: `fetch(\`${API_URL}/protocol-suggest\`)`. Path is correct. REQUIREMENTS.md checkbox not updated but the code is aligned |
| API-02 | 01-002 | App calls `POST /protocol-traverse` (not `/traverse`) | SATISFIED | Line 639: confirmed present and unmodified |
| API-03 | 01-001 | App calls `POST /session-finish` (not `/end_session`) | SATISFIED | Line 758: `session-finish` used. No `end_session` in file |
| API-04 | 01-002 | Vital signs submitted via `POST /sensor-data` as dedicated call | SATISFIED | `submitSensorData` at line 535, called in handleSendSensors (line 789) before traverseTree |
| API-05 | 01-002 | App submits transcription text via `POST /transcription` | SATISFIED | Lines 400, 428, 464: three call sites |
| API-06 | 01-003 | History views display `triage_result.discriminador` | SATISFIED | HistoryPage line 192, TriageDetailsModal line 153, Profile.jsx clean |
| API-07 | 01-002 | App calls `GET /protocol/{protocol_name}` before traversal | SATISFIED | `fetchProtocolDefinition` at line 571, called in confirmProtocol (line 601) |
| API-08 | 01-001 | All API calls use correct request body schemas | PARTIAL | /patient-info flat body: CORRECT. /protocol-suggest prompt field: CORRECT. /session-finish schema: CORRECT. /sensor-data type coercion: CORRECT. GAP: no response.ok guard in checkProtocolSuggestion means a non-2xx response body is parsed as if it were a valid schema response — silent type mismatch |

**Note on REQUIREMENTS.md traceability table:** API-01, API-03, and API-08 are still marked `Pending` in the traceability table. The code satisfies API-01 and API-03 fully. API-08 is partially satisfied but has the response.ok gap noted above. The traceability table should be updated after gap closure.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| ProtocolTriage.jsx | 505 | `response.json()` called without `response.ok` check in `checkProtocolSuggestion` | Warning | If /protocol-suggest returns 4xx/5xx, `data.reply` will be undefined — the `else if (data.error)` branch handles it, but only if the error body has an `error` field; otherwise falls to generic "Informação insuficiente" message |
| ProtocolTriage.jsx | 381 | `/patient-info` fetch has no `response.ok` check | Warning | A rejection from the backend (e.g., validation error) is silently ignored; `setPatientInfo` and `setIsPatientInfoSubmitted` are set even on failure |
| ProtocolTriage.jsx | 571-586 | `fetchProtocolDefinition` return value is unused | Info | The fetched protocol definition is fire-and-forget — the returned data is discarded. This is noted as intentional in the SUMMARY but means the GET /protocol/{protocol_name} call currently has no downstream effect on app state |

### Human Verification Required

#### 1. End-to-End Triage Flow

**Test:** Log in, register a patient, enter a chief complaint, confirm suggested protocol, answer triage questions, submit vitals, reach a triage priority result.
**Expected:** Each step calls the correct endpoint with the correct schema; `/session-finish` is called at the end and the priority color is displayed.
**Why human:** Runtime API integration, Cognito auth, and backend responses cannot be verified statically.

#### 2. Sensor Data Submission Order

**Test:** Open browser devtools Network tab, submit vitals in the triage flow.
**Expected:** A POST to `/sensor-data` fires before the POST to `/protocol-traverse` in the network waterfall.
**Why human:** Fire order and timing require live network observation.

#### 3. History Discriminador Display

**Test:** Navigate to History, open a session that has a completed triage result.
**Expected:** The discriminador label (e.g., "Dor Torácica Típica") is shown — NOT "Discriminador Indisponivel".
**Why human:** Requires real persisted session data from the backend.

### Gaps Summary

Two gaps block full API-08 compliance:

1. **`checkProtocolSuggestion` missing `response.ok` guard** (line 505): The function calls `response.json()` unconditionally. A 4xx or 5xx response from `/protocol-suggest` will attempt to parse the error body as a `ProtocolSuggestResponse`, which will likely not have a `reply` field. The fallback message shown is generic ("Informação insuficiente") rather than an actionable error. This is the primary API-08 gap.

2. **`handlePatientSubmit` missing `response.ok` guard for `/patient-info`** (line 381): If patient registration fails on the backend, the frontend advances to the chat stage (`setIsPatientInfoSubmitted(true)`) as if registration succeeded. This is a functional correctness issue for the triage session lifecycle.

Both gaps are missing `response.ok` checks — a pattern consistent with FRAG-01 (scheduled for Phase 4). However, the two call sites above are API-schema-alignment issues (API-08 scope) because a failed registration or suggest call leaves the session in an inconsistent API state.

The `fetchProtocolDefinition` return value being unused is informational — the call is made (API-07 satisfied), but the data is discarded. If the protocol definition is needed for future features, it will need to be wired into component state.

---

_Verified: 2026-03-23_
_Verifier: Claude (gsd-verifier)_
