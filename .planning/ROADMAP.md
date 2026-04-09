# Roadmap: Triax Prototype

## Milestones

- **v1.1.0 Alignment & Cleanup** -- Phases 1-4 (shipped 2026-04-07)
- **v2.0.0 UI/UX Overhaul** -- Phases 5-9 (in progress)

## Phases

<details>
<summary>v1.1.0 Alignment & Cleanup (Phases 1-4) -- SHIPPED 2026-04-07</summary>

- [x] Phase 1: API Alignment (4/4 plans) -- Align all frontend API calls with openapi.yaml v1.1.0
- [x] Phase 2: Auth & Security (2/2 plans) -- completed 2026-03-30
- [x] Phase 3: Tech Debt (2/2 plans) -- completed 2026-04-07
- [x] Phase 4: Fragility (2/2 plans) -- completed 2026-04-07

Full details: `.planning/milestones/v1.1.0-ROADMAP.md`

</details>

### v2.0.0 UI/UX Overhaul (In Progress)

**Milestone Goal:** Transform the functional prototype into a polished, clinician-centric triage tool with a cohesive design system, responsive layout, improved interactions, and WCAG-compliant accessibility.

- [x] **Phase 5: Design Token Foundation** -- CSS custom property system, provider stack, and Amplify coexistence (completed 2026-04-07)
- [x] **Phase 6: UI Primitives + Toast System** -- Reusable component library and toast notifications replacing alert() (completed 2026-04-08)
- [x] **Phase 7: Component Migration + Accessibility** -- Inline style elimination, semantic HTML, ARIA, WCAG 2.1 AA, form improvements, responsive layout (completed 2026-04-08)
- [x] **Phase 8: New Interactions** -- Dark mode toggle, keyboard shortcuts, and voice recording UX (completed 2026-04-09)
- [ ] **Phase 9: Patient Form Redesign** -- CPF-first flow, API auto-fill, Material-style inputs, metadata cards, input masks, sticky submit

## Phase Details

### Phase 5: Design Token Foundation
**Goal**: The app has a CSS custom property token system that gates all subsequent visual work, with `--mts-*` clinical colors protected, provider stack updated, and Amplify coexistence confirmed.
**Depends on**: Phase 4 (v1.1.0 complete)
**Requirements**: DSGN-01, DSGN-02
**Success Criteria** (what must be TRUE):
  1. `src/styles/tokens.css` exists with primitive, semantic, and `--mts-*` clinical color layers; MTS red/orange/yellow/green/blue values are byte-for-byte unchanged from v1.1.0
  2. The Amplify Authenticator login screen renders without visual regression after the token layer is added
  3. No existing component shows broken styles -- the app looks identical to v1.1.0 from a clinician's perspective
  4. Non-clinical UI colors (buttons, backgrounds, text) in at least one migrated file use `--token` references instead of hardcoded Bootstrap hex values
**Plans:** 2/2 plans complete
Plans:
- [x] 05-01-PLAN.md -- Token infrastructure: create tokens.css, FOUC script, clean Vite defaults, wire imports
- [x] 05-02-PLAN.md -- Header migration: extract inline styles to token-backed CSS, visual refresh

### Phase 6: UI Primitives + Toast System
**Goal**: A shared component library exists in `src/components/ui/` and every `alert()` call in the app has been replaced with accessible toast notifications.
**Depends on**: Phase 5
**Requirements**: DSGN-04, INTR-01, INTR-04
**Success Criteria** (what must be TRUE):
  1. All five existing `alert()` call sites are replaced; errors surface as toast banners with `role="alert"` that auto-dismiss no sooner than 8 seconds
  2. Button variants (primary, secondary, danger) are visually distinct and rendered from a single shared Button component -- not duplicated inline styles
  3. UI transitions on chat bubbles and page changes are visibly animated and complete in under 300ms
  4. Toast notifications are visible and readable in both light and dark environments (contrast passes even before dark mode is wired up)
**Plans:** 3/3 plans complete
Plans:
- [x] 06-01-PLAN.md -- Button component + toast color tokens
- [x] 06-02-PLAN.md -- Toast system (ToastProvider, Toast, App.jsx wiring)
- [x] 06-03-PLAN.md -- Alert replacement + chat bubble animation

### Phase 7: Component Migration + Accessibility
**Goal**: Every component uses design tokens instead of inline styles, the app meets WCAG 2.1 AA contrast and semantic HTML requirements, form interactions are improved, and the sensor panel is responsive.
**Depends on**: Phase 6
**Requirements**: A11Y-01, A11Y-02, A11Y-03, LAYT-01, LAYT-02, FORM-01, FORM-02, FORM-03, FORM-04
**Success Criteria** (what must be TRUE):
  1. No `style={{}}` inline style attribute remains in any component file -- all visual properties come from token-backed CSS classes
  2. A browser accessibility audit (Axe or Lighthouse) finds zero contrast failures across all pages
  3. A keyboard-only user can tab through every interactive element on every page and see a visible focus indicator at each step
  4. The sensor/vitals panel collapses automatically on a narrow (mobile) viewport and a toggle button restores it on wider screens
  5. The patient form auto-fills the age field when a birth date is entered, shows inline validation errors on blur for required fields, and all fields have visible tooltip help; CPF, date, and blood pressure fields format themselves as the clinician types
**Plans:** 7/7 plans complete
Plans:
- [x] 07-01-PLAN.md -- Foundation tokens + focus-visible + simple migrations (AdminUsers, RequireAdmin, App.jsx)
- [x] 07-02-PLAN.md -- Profile + HistoryPage inline style migration with table semantic HTML
- [x] 07-03-PLAN.md -- TriageDetailsModal migration + modal ARIA + focus trap
- [x] 07-04-PLAN.md -- Tooltip + StatusBar shared UI components
- [x] 07-05-PLAN.md -- ProtocolTriage inline style migration + responsive sensor panel
- [x] 07-06-PLAN.md -- Form validation, age auto-calc, tooltips, input masking, StatusBar wiring
- [x] 07-07-PLAN.md -- Gap closure: BP field constraints + priority badge CSS classes + clinical exception documentation

### Phase 8: New Interactions
**Goal**: Clinicians have a dark mode toggle persisted across sessions, keyboard shortcuts for triage answers, and a voice recording UI that shows real-time feedback before submission.
**Depends on**: Phase 7
**Requirements**: DSGN-03, INTR-02, INTR-03
**Success Criteria** (what must be TRUE):
  1. A dark mode toggle is visible in the app; switching it changes all component colors consistently (no light-mode remnants) and the preference survives a page reload
  2. During an active triage session, keyboard shortcuts advance yes/no responses without the clinician touching the mouse; pressing Esc cancels an active voice recording
  3. While recording, the clinician sees a waveform animation, a running elapsed-time counter, and a live transcript preview before the recording is submitted
  4. Keyboard shortcuts do not fire when focus is inside a text input or other form field
**Plans:** 3/3 plans complete
Plans:
- [x] 08-01-PLAN.md -- Dark mode toggle: ThemeContext, FOUC OS-preference fallback, Header toggle button, crossfade transition
- [x] 08-02-PLAN.md -- Keyboard shortcuts: Y/N/R/Esc keydown listener, input-focus suppression, shortcut hints, pulse animation
- [x] 08-03-PLAN.md -- Recording UI: useTranscribe audio callback, waveform canvas, elapsed timer, transcript preview panel

### Phase 9: Patient Form Redesign
**Goal**: Redesign PatientForm for clarity and efficiency — CPF-first progressive flow with API lookup and auto-fill, computed age from birth date only (remove redundant age field), read-only metadata cards for system IDs (SAME, Visit ID, Patient Code), Material-style inputs with subtle borders and inline error states, input masks for CPF and date fields, logical tab order, and sticky submit button.
**Depends on**: Phase 8
**Requirements**: FORM-05
**Success Criteria** (what must be TRUE):
  1. Entering a valid CPF triggers an API lookup; if the patient exists, Name, Sex, and Birth Date auto-fill without manual entry
  2. Age is computed from Birth Date and displayed as a read-only label — no separate age input field exists
  3. System IDs (SAME, Patient Code, Visit ID, Ticket) render as non-editable metadata cards, not form inputs
  4. All text inputs use Material-style styling (subtle borders, gray background, focus highlight) consistent with the design token system
  5. CPF and date fields auto-format with masks as the clinician types (e.g., 000.000.000-00)
  6. Inline validation errors change the field's border color — no detached red text
  7. Tab order follows the logical flow: CPF → Name → Birth Date → Sex → Submit
  8. The submit button is sticky at the bottom of the viewport when the form overflows
**Plans:** 1/2 plans executed
Plans:
- [x] 09-01-PLAN.md -- Extract PatientForm.jsx + PatientForm.css: CPF-first layout, lookup stub, computed age, metadata section, refined styling
- [ ] 09-02-PLAN.md -- Wire PatientForm into ProtocolTriage, remove old inline code + CSS, guard transcription age

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. API Alignment | v1.1.0 | 4/4 | Complete | 2026-03-30 |
| 2. Auth & Security | v1.1.0 | 2/2 | Complete | 2026-03-30 |
| 3. Tech Debt | v1.1.0 | 2/2 | Complete | 2026-04-07 |
| 4. Fragility | v1.1.0 | 2/2 | Complete | 2026-04-07 |
| 5. Design Token Foundation | v2.0.0 | 2/2 | Complete   | 2026-04-07 |
| 6. UI Primitives + Toast System | v2.0.0 | 3/3 | Complete   | 2026-04-08 |
| 7. Component Migration + Accessibility | v2.0.0 | 7/7 | Complete   | 2026-04-08 |
| 8. New Interactions | v2.0.0 | 3/3 | Complete   | 2026-04-09 |
| 9. Patient Form Redesign | v2.0.0 | 1/2 | In Progress|  |
