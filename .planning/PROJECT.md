# Triax Prototype

## What This Is

React SPA for clinical emergency triage using the Manchester Triage System (MTS). Clinicians log in, register a patient, capture the chief complaint (voice or text), and the app guides them through an AI-driven protocol decision tree — assigning a priority color (red → blue). The app is hosted on AWS Amplify and is currently in demos/pilot phase with stakeholders.

## Core Value

Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

## Requirements

### Validated

<!-- What the codebase already ships today. -->

- ✓ Cognito-authenticated login (AWS Amplify Authenticator) — existing
- ✓ Patient registration via POST /patient-info — existing
- ✓ Protocol list from GET /protocol_names — existing
- ✓ AI protocol suggestion from chief complaint (voice or text) — existing
- ✓ Protocol decision tree traversal with sensor input (vitals) — existing
- ✓ Triage result display with priority color — existing
- ✓ Session history list and detail view — existing
- ✓ PDF report download per session — existing
- ✓ Admin user listing (client-side role guard) — existing
- ✓ Real-time voice transcription via AWS Transcribe Streaming — existing
- ✓ AWS config moved to environment variables (no hardcoded Cognito IDs in source) — Validated in Phase 02: auth-security
- ✓ Silent token omission replaced with explicit auth error (UserContext) — Validated in Phase 02: auth-security
- ✓ Route-level admin guard hardened via RequireAdmin component — Validated in Phase 02: auth-security
- ✓ Shared `getAuthHeaders` utility extracted (no duplication across 5 files) — Validated in Phase 03: tech-debt
- ✓ Demo patient data removed from PatientForm — Validated in Phase 03: tech-debt
- ✓ Unused `jspdf` and `html2canvas` dependencies removed — Validated in Phase 03: tech-debt

### Active

<!-- Current scope: what we are building toward. -->

- [ ] Frontend aligned with openapi.yaml v1.1.0 — all endpoint paths, request/response schemas correct
- [ ] All fetch calls include `response.ok` check
- [ ] Fragile S3 date parsing replaced with a robust solution
- [ ] Deprecated `escape()` encoding replaced
- [ ] Blob URL memory leak fixed (PDF download)

### Out of Scope

- Test suite — zero coverage is a known risk; adding tests is a future milestone, not this one
- `ScriptProcessorNode` → `AudioWorklet` migration — high effort, low urgency for pilot phase
- API response caching (/protocol_names, /me) — nice-to-have, deferred
- UI redesign / new features — this milestone is alignment and cleanup only

## Context

- **Deployment:** AWS Amplify auto-deploys on every commit to `main`. Working on a `dev` branch; merging to `main` only at stable phase milestones to protect demo stability.
- **Backend:** External REST API at AWS API Gateway (sa-east-1). Frontend owns no backend code.
- **API version change:** openapi.yaml updated to v1.1.0 — endpoint paths may have been renamed (e.g. `/suggest_protocol` → `/protocol-suggest`, `/traverse` → `/protocol-traverse`). Full diff needed as first task.
- **Language:** App targets Brazilian Portuguese-speaking clinical staff (São Paulo region).
- **Auth:** Cognito User Pool + Identity Pool. JWT id token sent as Bearer on every authenticated request.
- **No state library:** Component-local `useState`, `UserContext` for profile only.

## Constraints

- **Tech stack:** React 19 + Vite + AWS Amplify — no framework changes
- **Deployment target:** Static SPA (no SSR), Amplify builds from `main` branch
- **Branch strategy:** All work on `dev` branch; merge to `main` only at verified milestone checkpoints
- **No new features:** This milestone is strictly alignment + cleanup — no scope creep
- **Healthcare context:** Changes to triage logic require extra care — wrong priority assignment is a patient safety issue

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dev branch, merge to main at milestones | Amplify auto-deploys main; broken deploys disrupt demos with stakeholders | — Pending |
| OpenAPI sync before concerns cleanup | Backend API must be the source of truth; cleaning up code that calls wrong endpoints wastes effort | — Pending |
| No test suite in this milestone | Adds significant time; pilot phase can tolerate it; future milestone will address | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 — Phase 03 (tech-debt) complete*
