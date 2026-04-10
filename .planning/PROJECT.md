# Triax Prototype

## What This Is

React SPA for clinical emergency triage using the Manchester Triage System (MTS). Clinicians log in, register a patient, capture the chief complaint (voice or text), and the app guides them through an AI-driven protocol decision tree — assigning a priority color (red → blue). The app features a cohesive design system with dark mode, responsive layout, WCAG 2.1 AA accessibility, keyboard-driven triage flow, clinical vital sign indicators, enriched session history, and discoverable shortcuts. Hosted on AWS Amplify, currently in demos/pilot phase with stakeholders.

## Core Value

Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

## Current State

**Shipped:** v2.1.0 UX Polish (2026-04-10)
**Branch:** `main`
**Codebase:** 6,710 LOC (JSX/JS/CSS), 14 phases shipped across 3 milestones

v2.1.0 polished the clinical UX for pilot readiness:
- Shared SensorPanel component replacing duplicated desktop/mobile implementations
- Yes/no quick-reply buttons work independently of pending vital signs
- GCS key normalization for correct vital sign highlighting
- Multiline chat input (Shift+Enter) with auto-resizing textarea
- Abnormal/critical vital sign indicators (warning/error severity)
- Mobile-friendly blood pressure input with stacked SIS/DIA layout
- Session history enriched with MTS priority badges, patient names, and duration
- Keyboard shortcut legend (? trigger) with Y/N/R/Esc/Shift+Enter bindings
- Migrated history API from S3-legacy to session-id-based calls

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
- ✓ Shared sensor panel component (desktop/mobile unified) — v2.1.0
- ✓ Yes/no quick-reply buttons visible during triage questions — v2.1.0
- ✓ All requested vital signs correctly highlighted on sensor dock — v2.1.0
- ✓ Shift+Enter creates new line in chat input (Enter submits) — v2.1.0
- ✓ Yes/no buttons shown even when vital signs are pending — v2.1.0
- ✓ Visual indicators for abnormal/critical vital sign values — v2.1.0
- ✓ Mobile-friendly blood pressure input layout — v2.1.0
- ✓ Session history shows priority badge, patient name, duration — v2.1.0
- ✓ Keyboard shortcut discoverability (help legend/tooltip) — v2.1.0

### Active

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

- **Deployment:** AWS Amplify auto-deploys on every commit to `main`.
- **Backend:** External REST API at AWS API Gateway (sa-east-1). Frontend owns no backend code.
- **Language:** App targets Brazilian Portuguese-speaking clinical staff (Sao Paulo region).
- **Auth:** Cognito User Pool + Identity Pool. JWT id token sent as Bearer on every authenticated request. Shared `getAuthHeaders` utility in `src/utils/auth.js`.
- **State management:** Component-local `useState`, `UserContext` for profile, `ThemeContext` for dark mode.
- **Design system:** CSS custom properties in `src/styles/tokens.css`. FOUC prevention via blocking script in `index.html`. Amplify Authenticator coexists via `[data-app-theme]` scoping.
- **Component library:** Shared UI primitives in `src/components/ui/` (Button, Toast, Tooltip, StatusBar, SensorPanel). Shared utilities in `src/utils/` (auth, priority).

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
| SENSOR_CONFIG as named export from SensorPanel | ProtocolTriage needs label lookup for missing_sensors chat messages | ✓ Good — single source of truth for sensor metadata |
| getFieldStatus as optional SensorPanel prop | Forward-compatibility for Phase 12 without touching ProtocolTriage | ✓ Good — clean phase boundary |
| Decouple yes/no buttons from missingSensors | Sensors pending and yes/no questions are independent concerns | ✓ Good — clinicians can answer while entering vitals |
| Normalize gcs_scale to gcs at setMissingSensors | Keep all downstream consumers using SENSOR_CONFIG keys | ✓ Good — single normalization point |
| Warning/critical indicators via CSS attribute selectors | data-status attributes on sensor items, styled without JS | ✓ Good — zero runtime cost, clean separation |
| Shared resolvePriority in src/utils/priority.js | Profile.jsx and HistoryPage.jsx both need MTS color resolution | ✓ Good — eliminated duplication |
| Session-id-based history API migration | S3-legacy endpoints were fragile; session-id is the canonical key | ✓ Good — consistent with backend model |

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
*Last updated: 2026-04-10 after v2.1.0 milestone*
