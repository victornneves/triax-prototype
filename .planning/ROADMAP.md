# Roadmap: Triax Prototype

## Milestones

- ✅ **v1.1.0 Alignment & Cleanup** -- Phases 1-4 (shipped 2026-04-07)
- ✅ **v2.0.0 UI/UX Overhaul** -- Phases 5-9 (shipped 2026-04-09)
- 🚧 **v2.1.0 UX Polish** -- Phases 10-14 (in progress)

## Phases

<details>
<summary>✅ v1.1.0 Alignment & Cleanup (Phases 1-4) -- SHIPPED 2026-04-07</summary>

- [x] Phase 1: API Alignment (4/4 plans) -- Align all frontend API calls with openapi.yaml v1.1.0
- [x] Phase 2: Auth & Security (2/2 plans) -- completed 2026-03-30
- [x] Phase 3: Tech Debt (2/2 plans) -- completed 2026-04-07
- [x] Phase 4: Fragility (2/2 plans) -- completed 2026-04-07

Full details: `.planning/milestones/v1.1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v2.0.0 UI/UX Overhaul (Phases 5-9) -- SHIPPED 2026-04-09</summary>

- [x] Phase 5: Design Token Foundation (2/2 plans) -- completed 2026-04-07
- [x] Phase 6: UI Primitives + Toast System (3/3 plans) -- completed 2026-04-08
- [x] Phase 7: Component Migration + Accessibility (7/7 plans) -- completed 2026-04-08
- [x] Phase 8: New Interactions (3/3 plans) -- completed 2026-04-09
- [x] Phase 9: Patient Form Redesign (2/2 plans) -- completed 2026-04-09

Full details: `.planning/milestones/v2.0.0-ROADMAP.md`

</details>

### 🚧 v2.1.0 UX Polish (In Progress)

**Milestone Goal:** Fix triage interaction bugs and polish the clinical UX for pilot readiness

- [x] **Phase 10: Sensor Panel Refactor** - Extract shared sensor panel component used by both desktop and mobile views (completed 2026-04-09)
- [x] **Phase 11: Triage Interaction Fixes** - Fix yes/no button logic, vital sign highlighting, and Shift+Enter input behavior (completed 2026-04-09)
- [ ] **Phase 12: Vital Signs UX** - Add abnormal/critical value indicators and mobile-friendly BP input layout
- [ ] **Phase 13: Session History Enrichment** - Add priority badge, patient name preview, and duration to history list
- [ ] **Phase 14: Discoverability** - Surface keyboard shortcut legend so clinicians can find Y/N/R/Esc bindings

## Phase Details

### Phase 10: Sensor Panel Refactor
**Goal**: A single shared sensor panel component replaces duplicated desktop and mobile implementations
**Depends on**: Phase 9 (previous milestone)
**Requirements**: REFAC-01
**Success Criteria** (what must be TRUE):
  1. Sensor panel renders identically in both desktop sidebar and mobile slide-up contexts from a single component
  2. No duplicated sensor panel rendering logic remains in ProtocolTriage.jsx
  3. Desktop and mobile sensor panel behavior (expand/collapse, field display) is unchanged after refactor
**Plans**: 1 plan
Plans:
- [x] 10-01-PLAN.md — Extract SensorPanel component and wire into ProtocolTriage

### Phase 11: Triage Interaction Fixes
**Goal**: Clinicians can answer yes/no questions and see correct vital sign highlights during triage, and can type multiline messages
**Depends on**: Phase 10
**Requirements**: TRIAGE-01, TRIAGE-02, TRIAGE-03, TRIAGE-04
**Success Criteria** (what must be TRUE):
  1. Yes/No quick-reply buttons appear whenever the agent poses a yes/no question, regardless of `missingSensors` state
  2. Yes/No buttons remain visible and clickable while vital sign inputs are still pending
  3. When the agent requests Glasgow Coma Scale, the GCS field on the sensor dock is highlighted (not missing due to `gcs_scale` key mismatch)
  4. Pressing Shift+Enter in the chat input inserts a new line; pressing Enter alone submits the message
**Plans**: 1 plan
Plans:
- [x] 11-01-PLAN.md — Fix yes/no button visibility, GCS highlight mismatch, and multiline chat input

### Phase 12: Vital Signs UX
**Goal**: Clinicians can immediately spot abnormal vital sign readings and enter blood pressure comfortably on mobile
**Depends on**: Phase 10
**Requirements**: VITALS-01, VITALS-02
**Success Criteria** (what must be TRUE):
  1. Vital sign fields displaying abnormal values (e.g., SpO2 <90%, temperature >40°C) show a visible warning indicator
  2. Vital sign fields displaying critical values show a distinct critical indicator distinguishable from abnormal
  3. Blood pressure input shows SIS and DIA as stacked labeled fields on narrow viewports, not side-by-side
**Plans**: TBD

### Phase 13: Session History Enrichment
**Goal**: The history list gives clinicians enough at-a-glance context to identify and navigate to any past session
**Depends on**: Phase 11
**Requirements**: HIST-01, HIST-02
**Success Criteria** (what must be TRUE):
  1. Each history list row displays the MTS priority color badge matching the session outcome
  2. Each history list row shows the patient name (or a placeholder when unavailable)
  3. Each history list row shows the session duration (time from start to end)
**Plans**: TBD

### Phase 14: Discoverability
**Goal**: Keyboard shortcuts are discoverable without needing external documentation
**Depends on**: Phase 11
**Requirements**: DISC-01
**Success Criteria** (what must be TRUE):
  1. A help legend or tooltip is visible during active triage that lists Y, N, R, and Esc bindings with their actions
  2. The legend is accessible via keyboard (no mouse required to reveal it)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. API Alignment | v1.1.0 | 4/4 | Complete | 2026-03-30 |
| 2. Auth & Security | v1.1.0 | 2/2 | Complete | 2026-03-30 |
| 3. Tech Debt | v1.1.0 | 2/2 | Complete | 2026-04-07 |
| 4. Fragility | v1.1.0 | 2/2 | Complete | 2026-04-07 |
| 5. Design Token Foundation | v2.0.0 | 2/2 | Complete | 2026-04-07 |
| 6. UI Primitives + Toast System | v2.0.0 | 3/3 | Complete | 2026-04-08 |
| 7. Component Migration + Accessibility | v2.0.0 | 7/7 | Complete | 2026-04-08 |
| 8. New Interactions | v2.0.0 | 3/3 | Complete | 2026-04-09 |
| 9. Patient Form Redesign | v2.0.0 | 2/2 | Complete | 2026-04-09 |
| 10. Sensor Panel Refactor | v2.1.0 | 1/1 | Complete    | 2026-04-09 |
| 11. Triage Interaction Fixes | v2.1.0 | 1/1 | Complete   | 2026-04-09 |
| 12. Vital Signs UX | v2.1.0 | 0/TBD | Not started | - |
| 13. Session History Enrichment | v2.1.0 | 0/TBD | Not started | - |
| 14. Discoverability | v2.1.0 | 0/TBD | Not started | - |
