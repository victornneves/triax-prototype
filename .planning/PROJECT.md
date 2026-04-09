# Triax Prototype

## What This Is

React SPA for clinical emergency triage using the Manchester Triage System (MTS). Clinicians log in, register a patient, capture the chief complaint (voice or text), and the app guides them through an AI-driven protocol decision tree — assigning a priority color (red → blue). The app features a cohesive design system with dark mode, responsive layout, WCAG 2.1 AA accessibility, and keyboard-driven triage flow. Hosted on AWS Amplify, currently in demos/pilot phase with stakeholders.

## Core Value

Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

## Current Milestone: v2.1.0 UX Polish

**Goal:** Fix triage interaction bugs and polish the clinical UX for pilot readiness

**Target features:**
- Fix yes/no quick-reply buttons not appearing during triage questions
- Fix vital sign highlighting mismatch (Glasgow/GCS not highlighted when requested)
- Support Shift+Enter for multiline input in chat text box
- Allow answering yes/no questions while vital signs are still pending
- Add visual indicators for abnormal/critical vital sign values
- Enrich session history with priority badge, patient name, and duration
- Improve keyboard shortcut discoverability
- Improve mobile blood pressure input layout
- Extract shared sensor panel component to reduce duplication

## Current State

**Shipped:** v2.0.0 UI/UX Overhaul (2026-04-09)
**Branch:** `main`
**Codebase:** 6,433 LOC (JSX/JS/CSS), 97 files changed in v2.0.0

v2.0.0 transformed the functional prototype into a polished, clinician-centric triage tool:
- CSS custom property design token system with `--mts-*` clinical color namespace
- Shared UI component library (Button, Toast, Tooltip, StatusBar) in `src/components/ui/`
- All components migrated from inline styles to token-backed CSS
- WCAG 2.1 AA contrast, semantic HTML, ARIA labels, focus indicators
- Dark mode with localStorage persistence, keyboard shortcuts (Y/N/R/Esc)
- Oscilloscope waveform recording UI with live transcript preview
- CPF-first patient form with input masks, computed age, metadata cards

## Requirements

### Validated

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
- ✓ CSS custom property design token system with immutable MTS clinical colors — v2.0.0
- ✓ Softer color palette with clinical MTS colors preserved — v2.0.0
- ✓ Dark mode support with localStorage persistence — v2.0.0
- ✓ Responsive grid layout with collapsible sensor panel — v2.0.0
- ✓ Unified button system (primary, secondary, danger variants) — v2.0.0
- ✓ Keyboard shortcuts for triage flow (Y/N/R/Esc) — v2.0.0
- ✓ Toast notification system replacing all alert() calls — v2.0.0
- ✓ Voice recording UX (waveform, timer, transcription preview) — v2.0.0
- ✓ WCAG 2.1 AA color contrast across all components — v2.0.0
- ✓ Semantic HTML and ARIA labels for screen reader support — v2.0.0
- ✓ Focus indicators for keyboard navigation — v2.0.0
- ✓ Smart form defaults and auto-calculation (age from birth date) — v2.0.0
- ✓ Contextual help tooltips for all form fields — v2.0.0
- ✓ Input masking for CPF, date, and blood pressure fields — v2.0.0
- ✓ CPF-first patient form with lookup stub, metadata cards, sticky submit — v2.0.0

### Active

<!-- v2.1.0 UX Polish scope -->

- [ ] Yes/no quick-reply buttons visible during triage questions
- [ ] All requested vital signs correctly highlighted on sensor dock
- [ ] Shift+Enter creates new line in chat input (Enter submits)
- [ ] Yes/no buttons shown even when vital signs are pending
- [ ] Visual indicators for abnormal/critical vital sign values
- [ ] Session history shows priority badge, patient name, duration
- [ ] Keyboard shortcut discoverability (help legend/tooltip)
- [ ] Mobile-friendly blood pressure input layout
- [x] Shared sensor panel component (desktop/mobile unified) — Phase 10
- [ ] Triage progress indicator (stepper/progress bar) — deferred from v2.0.0 (depends on /traverse API exposing step data)
- [ ] Session summary timeline during triage — deferred from v2.0.0

### Out of Scope

- Test suite — zero coverage is known risk; prioritize for next milestone
- `ScriptProcessorNode` → `AudioWorklet` migration — high effort, low urgency for pilot phase
- API response caching (/protocol_names, /me) — nice-to-have, deferred
- i18n framework (react-i18next) — strings stay hardcoded PT-BR for now; localization is a separate milestone
- Command palette (Ctrl+K) — over-engineered for pilot; revisit after core UX validated with clinicians
- Hospital system integration (auto-fill from EHR) — requires backend work outside current scope
- Pause/resume triage sessions — requires backend session persistence changes
- CPF patient lookup API endpoint — stub exists in PatientForm, backend implementation needed

## Context

- **Deployment:** AWS Amplify auto-deploys on every commit to `main`. v2.0.0 work on `v2-ui-overhaul` branch; pending merge to `main`.
- **Backend:** External REST API at AWS API Gateway (sa-east-1). Frontend owns no backend code.
- **Language:** App targets Brazilian Portuguese-speaking clinical staff (São Paulo region).
- **Auth:** Cognito User Pool + Identity Pool. JWT id token sent as Bearer on every authenticated request. Shared `getAuthHeaders` utility in `src/utils/auth.js`.
- **State management:** Component-local `useState`, `UserContext` for profile, `ThemeContext` for dark mode.
- **Design system:** CSS custom properties in `src/styles/tokens.css`. FOUC prevention via blocking script in `index.html`. Amplify Authenticator coexists via `[data-app-theme]` scoping.

## Constraints

- **Tech stack:** React 19 + Vite + AWS Amplify — no framework changes
- **Deployment target:** Static SPA (no SSR), Amplify builds from `main` branch
- **Branch strategy:** Dev branch per milestone; merge to `main` only at verified milestone completion
- **Healthcare context:** Changes to triage logic require extra care — wrong priority assignment is a patient safety issue
- **MTS priority colors:** Red/orange/yellow/green/blue are clinical standard — `--mts-*` tokens are immutable
- **Clinical inline style exceptions:** Pain slider accentColor and GCS select dynamic border remain inline (runtime clinical state)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dev branch, merge to main at milestones | Amplify auto-deploys main; broken deploys disrupt demos | ✓ Good — protected demo stability through v1.1.0 and v2.0.0 |
| OpenAPI sync before concerns cleanup | Backend API must be the source of truth | ✓ Good — Phase 1 first prevented wasted rework |
| No test suite in v2.0.0 | Adds significant time; pilot phase can tolerate it | ⚠️ Revisit — zero coverage is growing tech debt |
| getAuthHeaders throws on null token | Callers have try/catch, errors propagate instead of silent 401s | ✓ Good — consistent auth error handling |
| Transcription calls stay fire-and-forget | Logging failures must not interrupt patient triage flow | ✓ Good — patient safety preserved |
| CSS custom properties over CSS-in-JS | Simpler, no runtime overhead, coexists with Amplify theming | ✓ Good — token system worked cleanly across all 5 phases |
| `[data-app-theme]` scoping (not `:root`) | Prevents Amplify Authenticator visual regression | ✓ Good — zero Amplify conflicts throughout v2.0.0 |
| `react-imask` over `react-input-mask` | react-input-mask archived Dec 2025; react-imask actively maintained | ✓ Good — clean integration for CPF, date, BP fields |
| FOUC prevention via blocking `<script>` | Must read localStorage theme before React hydrates | ✓ Good — no flash on any page load |
| MTS priority colors as immutable tokens | Clinical standard — wrong color is a patient safety issue | ✓ Good — `--mts-*` namespace protected throughout |
| PatientForm extraction from ProtocolTriage | ProtocolTriage was 1570+ lines; clean 2-prop interface | ✓ Good — reduced ProtocolTriage by ~370 lines |
| CPF lookup as stub (returns null) | Backend endpoint doesn't exist yet; establishes interface contract | ✓ Good — frontend ready for backend when it ships |

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
*Last updated: 2026-04-09 after Phase 10 (sensor-panel-refactor) complete*
