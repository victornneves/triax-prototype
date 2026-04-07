# Roadmap: Triax Prototype — Alignment & Cleanup Milestone

## Overview

The frontend is drifting from the backend API contract (openapi.yaml v1.1.0) and carries security gaps, duplicated code, and fragile patterns from the prototype phase. This milestone aligns the SPA with the current API, hardens auth and route protection, eliminates tech debt, and removes brittle code patterns — in that order. All work happens on `dev`; the milestone merges to `main` when all four phases are verified.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: API Alignment** - Align all frontend API calls with openapi.yaml v1.1.0 endpoint paths and schemas
- [x] **Phase 2: Auth & Security** - Harden authentication headers, config sourcing, and admin route protection (completed 2026-03-30)
- [x] **Phase 3: Tech Debt** - Extract shared auth utility, remove demo data, and prune unused dependencies (completed 2026-04-07)
- [ ] **Phase 4: Fragility** - Replace brittle patterns: missing ok-checks, fragile date parsing, deprecated APIs, memory leak

## Phase Details

### Phase 1: API Alignment
**Goal**: Every API call the frontend makes matches the endpoint paths, HTTP methods, and request/response schemas defined in openapi.yaml v1.1.0
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08
**Success Criteria** (what must be TRUE):
  1. Protocol suggestion calls `POST /protocol-suggest` and the app returns a suggested protocol without errors
  2. Decision tree traversal calls `POST /protocol-traverse` and nodes advance correctly through the triage flow
  3. Session finalization calls `POST /session-finish` and the triage result is displayed with the correct priority color
  4. Vital sign readings are submitted via `POST /sensor-data` as a dedicated call (not only embedded in traversal)
  5. History views display `triage_result.discriminador` instead of the old `classification` field
**Plans:** 2/3 plans executed
Plans:
- [ ] 01-PLAN-001-protocol-triage-schema-fixes.md — Fix /patient-info and /protocol-suggest request schemas, add POST /session-finish call
- [x] 01-PLAN-002-sensor-data-and-protocol-fetch.md — Add dedicated POST /sensor-data and GET /protocol/{protocol_name} calls
- [ ] 01-PLAN-003-history-discriminador.md — Replace classification with discriminador in all history views

### Phase 2: Auth & Security
**Goal**: Auth credentials are never silently dropped, AWS config is environment-driven, and admin routes are protected at the routing layer
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. `src/aws-config.js` contains no hardcoded Cognito IDs — all values read from `VITE_*` environment variables
  2. When `fetchAuthSession()` fails or returns no token, the app surfaces an explicit auth error instead of proceeding without an Authorization header
  3. Navigating directly to `/admin/users` as a non-admin user is blocked at the route level — the component never renders
**Plans:** 2/2 plans complete
Plans:
- [x] 02-001-env-config-PLAN.md — Move hardcoded AWS resource IDs to VITE_* env vars
- [x] 02-002-auth-error-admin-guard-PLAN.md — Auth failure error screen and RequireAdmin route guard

### Phase 3: Tech Debt
**Goal**: Duplicated auth code is centralized, demo data is gone from production builds, and dead dependencies no longer bloat the bundle
**Depends on**: Phase 2
**Requirements**: DEBT-01, DEBT-02, DEBT-03
**Success Criteria** (what must be TRUE):
  1. `src/utils/auth.js` exports `getAuthHeaders` and all five previously-duplicating files import from it — no inline copies remain
  2. `PatientForm` initial state contains no hardcoded patient data; form fields are empty or use neutral placeholders on load
  3. `jspdf` and `html2canvas` are absent from `package.json` and the production bundle does not include them
**Plans:** 2/2 plans complete
Plans:
- [x] 03-001-auth-utility-demo-data-PLAN.md — Extract getAuthHeaders to shared utility, refactor 5 consumers, clear demo patient data
- [x] 03-002-prune-unused-deps-PLAN.md — Remove unused jspdf and html2canvas dependencies

### Phase 4: Fragility
**Goal**: Every fetch call fails visibly on non-2xx responses, dates come from reliable API fields, deprecated encoding is replaced, and PDF blob URLs are cleaned up
**Depends on**: Phase 3
**Requirements**: FRAG-01, FRAG-02, FRAG-03, FRAG-04
**Success Criteria** (what must be TRUE):
  1. Every `fetch` call in the codebase has a `response.ok` guard — a non-2xx response surfaces an error to the user, not a silent failure
  2. Session date display in `Profile.jsx` reads from a stable API field (`created_at` or equivalent), not from splitting S3 key filenames
  3. `useTranscribe.js` uses `TextDecoder` (or equivalent supported API) for character encoding — no call to `escape()`
  4. After a PDF download in `HistoryPage.jsx`, the blob URL is revoked via `URL.revokeObjectURL` — no blob URLs accumulate in memory
**Plans:** 2 plans
Plans:
- [ ] 04-01-PLAN.md — Add response.ok guards to unguarded fetch calls + blob URL revocation for PDF downloads
- [ ] 04-02-PLAN.md — Remove dead formatDateFromKey code and deprecated escape() workaround

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. API Alignment | 2/3 | In Progress|  |
| 2. Auth & Security | 2/2 | Complete   | 2026-03-30 |
| 3. Tech Debt | 2/2 | Complete   | 2026-04-07 |
| 4. Fragility | 0/2 | Not started | - |
