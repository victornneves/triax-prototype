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
- ✓ All API calls aligned with openapi.yaml v1.1.0 — v1.1.0
- ✓ AWS config moved to environment variables — v1.1.0
- ✓ Silent token omission replaced with explicit auth error — v1.1.0
- ✓ Route-level admin guard hardened via RequireAdmin — v1.1.0
- ✓ Shared `getAuthHeaders` utility extracted — v1.1.0
- ✓ Demo patient data removed from PatientForm — v1.1.0
- ✓ Unused `jspdf`/`html2canvas` dependencies removed — v1.1.0
- ✓ All fetch calls include `response.ok` check — v1.1.0
- ✓ Fragile S3 date parsing removed (dead code) — v1.1.0
- ✓ Deprecated `escape()` encoding removed — v1.1.0
- ✓ Blob URL memory leak fixed (PDF download) — v1.1.0

### Active

<!-- Next milestone scope — to be defined via /gsd:new-milestone -->

(None yet — define next milestone to populate)

### Out of Scope

- Test suite — zero coverage is a known risk; adding tests is a future milestone
- `ScriptProcessorNode` → `AudioWorklet` migration — high effort, low urgency for pilot phase
- API response caching (/protocol_names, /me) — nice-to-have, deferred
- UI redesign / new features — pilot phase, stakeholder feedback first

## Context

- **Current state:** v1.1.0 shipped. Frontend aligned with API contract, auth hardened, tech debt cleared, brittle patterns fixed. 3,390 LOC across JS/JSX/CSS.
- **Deployment:** AWS Amplify auto-deploys on every commit to `main`. Working on `dev` branch; merging to `main` at milestone checkpoints.
- **Backend:** External REST API at AWS API Gateway (sa-east-1). Frontend owns no backend code.
- **Language:** App targets Brazilian Portuguese-speaking clinical staff (São Paulo region).
- **Auth:** Cognito User Pool + Identity Pool. JWT id token sent as Bearer on every authenticated request. Shared `getAuthHeaders` utility in `src/utils/auth.js`.
- **No state library:** Component-local `useState`, `UserContext` for profile only.

## Constraints

- **Tech stack:** React 19 + Vite + AWS Amplify — no framework changes
- **Deployment target:** Static SPA (no SSR), Amplify builds from `main` branch
- **Branch strategy:** All work on `dev` branch; merge to `main` only at verified milestone checkpoints
- **Healthcare context:** Changes to triage logic require extra care — wrong priority assignment is a patient safety issue

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dev branch, merge to main at milestones | Amplify auto-deploys main; broken deploys disrupt demos | ✓ Good — protected demo stability throughout v1.1.0 |
| OpenAPI sync before concerns cleanup | Backend API must be the source of truth | ✓ Good — Phase 1 first prevented wasted rework |
| No test suite in this milestone | Adds significant time; pilot phase can tolerate it | ⚠️ Revisit — zero coverage is tech debt, prioritize for next milestone |
| getAuthHeaders throws on null token | Callers have try/catch, errors propagate instead of silent 401s | ✓ Good — consistent with Phase 2 auth hardening |
| Transcription calls stay fire-and-forget | Logging failures must not interrupt patient triage flow | ✓ Good — patient safety preserved |
| formatDateFromKey deleted (not replaced) | Already dead code — JSX uses created_at directly | ✓ Good — research caught this before execution |
| escape() deleted (not replaced with TextDecoder) | AWS Transcribe SDK returns decoded strings | ✓ Good — research confirmed no encoding needed |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
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
*Last updated: 2026-04-07 after v1.1.0 milestone*
