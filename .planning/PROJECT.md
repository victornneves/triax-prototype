# Triax Prototype

## What This Is

React SPA for clinical emergency triage using the Manchester Triage System (MTS). Clinicians log in, register a patient, capture the chief complaint (voice or text), and the app guides them through an AI-driven protocol decision tree — assigning a priority color (red → blue). The app is hosted on AWS Amplify and is currently in demos/pilot phase with stakeholders.

## Core Value

Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

## Current Milestone: v2.0.0 UI/UX Overhaul

**Goal:** Transform the functional prototype into a polished, clinician-centric triage tool with cohesive design system, responsive layout, improved interactions, and accessibility.

**Target features:**
- Cohesive design system replacing scattered inline styles
- Softer color palette with dark mode support (preserving MTS priority colors)
- Responsive layout with collapsible panels and progress indicators
- Unified button styling, keyboard shortcuts, and micro-interactions
- WCAG-compliant accessibility (contrast, ARIA, focus indicators)
- Reduced cognitive load (smart defaults, contextual help, toast notifications)
- Improved voice input UX (waveform, timer, transcription preview)

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

<!-- v2.0.0 scope — UI/UX Overhaul -->

- [ ] Design system adoption with reusable component library
- [x] Softer color palette with clinical MTS colors preserved — Validated in Phase 5: Design Token Foundation
- [ ] Dark mode support
- [x] Responsive grid layout with collapsible sensor panel — Validated in Phase 7: Component Migration & Accessibility
- [ ] Triage progress indicator (stepper/progress bar)
- [x] Unified button system (primary, secondary, danger variants) — Validated in Phase 6: UI Primitives + Toast
- [ ] Keyboard shortcuts for triage flow (number keys for quick replies, Esc to cancel)
- [x] Toast notification system replacing alert() calls — Validated in Phase 6: UI Primitives + Toast
- [ ] Improved voice recording UX (waveform, timer, transcription preview)
- [x] WCAG-compliant color contrast across all components — Validated in Phase 7: Component Migration & Accessibility
- [x] Semantic HTML and ARIA labels for screen reader support — Validated in Phase 7: Component Migration & Accessibility
- [x] Focus indicators for keyboard navigation — Validated in Phase 7: Component Migration & Accessibility
- [x] Smart form defaults and auto-calculation (e.g., age from birth date) — Validated in Phase 7: Component Migration & Accessibility
- [x] Contextual help tooltips for all form fields — Validated in Phase 7: Component Migration & Accessibility
- [ ] Session summary timeline during triage

### Out of Scope

- Test suite — zero coverage is a known risk; adding tests is a future milestone
- `ScriptProcessorNode` → `AudioWorklet` migration — high effort, low urgency for pilot phase
- API response caching (/protocol_names, /me) — nice-to-have, deferred
- i18n framework (react-i18next) — strings stay hardcoded PT-BR for now; localization is a future milestone
- Command palette (Ctrl+K) — over-engineered for pilot; revisit after core UX ships
- Hospital system integration (auto-fill from EHR) — requires backend work outside current scope
- Pause/resume triage sessions — requires backend session persistence changes

## Context

- **Current state:** v2.0.0 in progress — Phase 7 (Component Migration & Accessibility) complete. All components migrated from inline styles to token-backed CSS. ARIA attributes, focus traps, keyboard nav added. Tooltip + StatusBar primitives created. Form validation with input masking live. 2 accepted clinical inline style exceptions (pain slider accentColor, GCS select dynamic border).
- **Deployment:** AWS Amplify auto-deploys on every commit to `main`. Working on `v2-ui-overhaul` branch; merging to `main` at milestone completion.
- **Backend:** External REST API at AWS API Gateway (sa-east-1). Frontend owns no backend code.
- **Language:** App targets Brazilian Portuguese-speaking clinical staff (São Paulo region).
- **Auth:** Cognito User Pool + Identity Pool. JWT id token sent as Bearer on every authenticated request. Shared `getAuthHeaders` utility in `src/utils/auth.js`.
- **No state library:** Component-local `useState`, `UserContext` for profile only.

## Constraints

- **Tech stack:** React 19 + Vite + AWS Amplify — no framework changes
- **Deployment target:** Static SPA (no SSR), Amplify builds from `main` branch
- **Branch strategy:** All work on `v2-ui-overhaul` branch; merge to `main` only at verified milestone completion
- **Healthcare context:** Changes to triage logic require extra care — wrong priority assignment is a patient safety issue
- **MTS priority colors:** Red/orange/yellow/green/blue are clinical standard — do not alter these specific colors

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
*Last updated: 2026-04-08 after Phase 6 completion*
