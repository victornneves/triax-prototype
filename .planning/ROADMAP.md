# Roadmap: Triax Prototype

## Milestones

- ✅ **v1.1.0 Alignment & Cleanup** — Phases 1-4 (shipped 2026-04-07)
- 🚧 **v2.0.0 UI/UX Overhaul** — Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.1.0 Alignment & Cleanup (Phases 1-4) — SHIPPED 2026-04-07</summary>

- [x] Phase 1: API Alignment (4/4 plans) — Align all frontend API calls with openapi.yaml v1.1.0
- [x] Phase 2: Auth & Security (2/2 plans) — completed 2026-03-30
- [x] Phase 3: Tech Debt (2/2 plans) — completed 2026-04-07
- [x] Phase 4: Fragility (2/2 plans) — completed 2026-04-07

Full details: `.planning/milestones/v1.1.0-ROADMAP.md`

</details>

### 🚧 v2.0.0 UI/UX Overhaul (In Progress)

**Milestone Goal:** Transform the functional prototype into a polished, clinician-centric triage tool with a cohesive design system, responsive layout, improved interactions, and WCAG-compliant accessibility.

- [x] **Phase 5: Design Token Foundation** — CSS custom property system, provider stack, and Amplify coexistence (completed 2026-04-07)
- [ ] **Phase 6: UI Primitives + Toast System** — Reusable component library and toast notifications replacing alert()
- [ ] **Phase 7: Component Migration + Accessibility** — Inline style elimination, semantic HTML, ARIA, WCAG 2.1 AA, form improvements, responsive layout
- [ ] **Phase 8: New Interactions** — Dark mode toggle, keyboard shortcuts, and voice recording UX

## Phase Details

### Phase 5: Design Token Foundation
**Goal**: The app has a CSS custom property token system that gates all subsequent visual work, with `--mts-*` clinical colors protected, provider stack updated, and Amplify coexistence confirmed.
**Depends on**: Phase 4 (v1.1.0 complete)
**Requirements**: DSGN-01, DSGN-02
**Success Criteria** (what must be TRUE):
  1. `src/styles/tokens.css` exists with primitive, semantic, and `--mts-*` clinical color layers; MTS red/orange/yellow/green/blue values are byte-for-byte unchanged from v1.1.0
  2. The Amplify Authenticator login screen renders without visual regression after the token layer is added
  3. No existing component shows broken styles — the app looks identical to v1.1.0 from a clinician's perspective
  4. Non-clinical UI colors (buttons, backgrounds, text) in at least one migrated file use `--token` references instead of hardcoded Bootstrap hex values
**Plans:** 2/2 plans complete
Plans:
- [x] 05-01-PLAN.md — Token infrastructure: create tokens.css, FOUC script, clean Vite defaults, wire imports
- [x] 05-02-PLAN.md — Header migration: extract inline styles to token-backed CSS, visual refresh

### Phase 6: UI Primitives + Toast System
**Goal**: A shared component library exists in `src/components/ui/` and every `alert()` call in the app has been replaced with accessible toast notifications.
**Depends on**: Phase 5
**Requirements**: DSGN-04, INTR-01, INTR-04
**Success Criteria** (what must be TRUE):
  1. All five existing `alert()` call sites are replaced; errors surface as toast banners with `role="alert"` that auto-dismiss no sooner than 8 seconds
  2. Button variants (primary, secondary, danger) are visually distinct and rendered from a single shared Button component — not duplicated inline styles
  3. UI transitions on chat bubbles and page changes are visibly animated and complete in under 300ms
  4. Toast notifications are visible and readable in both light and dark environments (contrast passes even before dark mode is wired up)
**Plans**: TBD

### Phase 7: Component Migration + Accessibility
**Goal**: Every component uses design tokens instead of inline styles, the app meets WCAG 2.1 AA contrast and semantic HTML requirements, form interactions are improved, and the sensor panel is responsive.
**Depends on**: Phase 6
**Requirements**: A11Y-01, A11Y-02, A11Y-03, LAYT-01, LAYT-02, FORM-01, FORM-02, FORM-03, FORM-04
**Success Criteria** (what must be TRUE):
  1. No `style={{}}` inline style attribute remains in any component file — all visual properties come from token-backed CSS classes
  2. A browser accessibility audit (Axe or Lighthouse) finds zero contrast failures across all pages
  3. A keyboard-only user can tab through every interactive element on every page and see a visible focus indicator at each step
  4. The sensor/vitals panel collapses automatically on a narrow (mobile) viewport and a toggle button restores it on wider screens
  5. The patient form auto-fills the age field when a birth date is entered, shows inline validation errors on blur for required fields, and all fields have visible tooltip help; CPF, date, and blood pressure fields format themselves as the clinician types
**Plans**: TBD

### Phase 8: New Interactions
**Goal**: Clinicians have a dark mode toggle persisted across sessions, keyboard shortcuts for triage answers, and a voice recording UI that shows real-time feedback before submission.
**Depends on**: Phase 7
**Requirements**: DSGN-03, INTR-02, INTR-03
**Success Criteria** (what must be TRUE):
  1. A dark mode toggle is visible in the app; switching it changes all component colors consistently (no light-mode remnants) and the preference survives a page reload
  2. During an active triage session, keyboard shortcuts advance yes/no responses without the clinician touching the mouse; pressing Esc cancels an active voice recording
  3. While recording, the clinician sees a waveform animation, a running elapsed-time counter, and a live transcript preview before the recording is submitted
  4. Keyboard shortcuts do not fire when focus is inside a text input or other form field
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. API Alignment | v1.1.0 | 4/4 | Complete | 2026-03-30 |
| 2. Auth & Security | v1.1.0 | 2/2 | Complete | 2026-03-30 |
| 3. Tech Debt | v1.1.0 | 2/2 | Complete | 2026-04-07 |
| 4. Fragility | v1.1.0 | 2/2 | Complete | 2026-04-07 |
| 5. Design Token Foundation | v2.0.0 | 2/2 | Complete   | 2026-04-07 |
| 6. UI Primitives + Toast System | v2.0.0 | 0/? | Not started | - |
| 7. Component Migration + Accessibility | v2.0.0 | 0/? | Not started | - |
| 8. New Interactions | v2.0.0 | 0/? | Not started | - |
