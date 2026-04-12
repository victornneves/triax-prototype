# Roadmap: Triax Prototype

## Milestones

- ✅ **v1.1.0 Alignment & Cleanup** -- Phases 1-4 (shipped 2026-04-07)
- ✅ **v2.0.0 UI/UX Overhaul** -- Phases 5-9 (shipped 2026-04-09)
- ✅ **v2.1.0 UX Polish** -- Phases 10-14 (shipped 2026-04-10)
- 🚧 **v2.2.0 Batch Traversal** -- Phase 15 (in progress)

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

<details>
<summary>✅ v2.1.0 UX Polish (Phases 10-14) -- SHIPPED 2026-04-10</summary>

- [x] Phase 10: Sensor Panel Refactor (1/1 plans) -- completed 2026-04-09
- [x] Phase 11: Triage Interaction Fixes (1/1 plans) -- completed 2026-04-09
- [x] Phase 12: Vital Signs UX (1/1 plans) -- completed 2026-04-10
- [x] Phase 13: Session History Enrichment (1/1 plans) -- completed 2026-04-10
- [x] Phase 14: Discoverability (1/1 plans) -- completed 2026-04-10

Full details: `.planning/milestones/v2.1.0-ROADMAP.md`

</details>

### 🚧 v2.2.0 Batch Traversal (In Progress)

**Milestone Goal:** Switch protocol traversal from sequential to batch mode, cutting API round-trips by ~65% while preserving the sequential path as a deprecated fallback.

- [ ] **Phase 15: Batch Traversal** - Enable batch mode and deprecate the next_node sequential handler

## Phase Details

### Phase 15: Batch Traversal
**Goal**: The triage traversal engine sends batch requests by default, handles all batch response shapes, and clearly marks the old sequential path as deprecated
**Depends on**: Phase 14
**Requirements**: BATCH-01, BATCH-02
**Success Criteria** (what must be TRUE):
  1. Every `/protocol-traverse` call includes `batch: true` in the request body
  2. The traversal flow completes correctly for `complete`, `ask_user`, and `missing_sensors` batch response shapes
  3. The `next_node` sequential handler is annotated with a deprecation comment and emits a `console.warn` when entered
  4. Triage sessions that receive a `next_node` response still complete successfully (fallback path intact)
**Plans:** 1 plan
Plans:
- [ ] 15-01-PLAN.md -- Add batch: true to traverseTree payload and deprecate next_node handler

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
| 10. Sensor Panel Refactor | v2.1.0 | 1/1 | Complete | 2026-04-09 |
| 11. Triage Interaction Fixes | v2.1.0 | 1/1 | Complete | 2026-04-09 |
| 12. Vital Signs UX | v2.1.0 | 1/1 | Complete | 2026-04-10 |
| 13. Session History Enrichment | v2.1.0 | 1/1 | Complete | 2026-04-10 |
| 14. Discoverability | v2.1.0 | 1/1 | Complete | 2026-04-10 |
| 15. Batch Traversal | v2.2.0 | 0/1 | Not started | - |
