# Retrospective

Living document — updated after each milestone.

---

## Milestone: v1.1.0 — Alignment & Cleanup

**Shipped:** 2026-04-07
**Phases:** 4 | **Plans:** 10

### What Was Built
- All API calls aligned with openapi.yaml v1.1.0 (8 endpoint paths/schemas corrected)
- Auth hardened: env-var config, explicit auth errors, route-level admin guard
- Shared `getAuthHeaders` utility extracted, 5 inline duplications eliminated
- Demo patient data cleared, unused deps pruned (jspdf, html2canvas)
- Every fetch call guarded with `response.ok`, blob URL leaks fixed, deprecated `escape()` removed

### What Worked
- **Phase ordering** — API alignment first prevented rework in later phases
- **Research before execution** — Researcher caught that `formatDateFromKey` was dead code and `escape()` should be deleted (not replaced), saving execution from wrong approaches
- **Parallel execution** — Phase 4 plans ran in parallel with no conflicts (disjoint file sets)
- **Auto-advance chain** — Phases 3→4 planned and executed in one continuous session

### What Was Inefficient
- **Phase 1 predates GSD** — Plans had inconsistent naming (01-PLAN-001 vs 01-001), no CONTEXT.md or RESEARCH.md, ROADMAP status was stale
- **DEBT-03 traceability** — Requirement marked "Pending" in traceability table despite being complete; caught at milestone completion rather than at phase verification

### Patterns Established
- Fire-and-forget calls (transcription logging) get silent `console.error`, not user-facing alerts
- `getAuthHeaders` throws on null token — callers handle via existing try/catch
- Blob URL revocation uses 60s timeout for `window.open` pattern
- Dead code deletion preferred over replacement when research confirms no functional need

### Key Lessons
- Research phase pays for itself when there's ambiguity about whether to replace or remove code
- Parallel executor agents work well when plans touch disjoint file sets
- Stale traceability records should be verified at phase completion, not deferred to milestone

### Cost Observations
- Model mix: Opus for planning, Sonnet for research/execution/verification
- Phase 4 end-to-end (discuss→plan→execute→verify): single session, auto-advanced
- Parallel execution saved ~3 min on Phase 4 (2 plans, disjoint files)

---

## Milestone: v2.0.0 — UI/UX Overhaul

**Shipped:** 2026-04-09
**Phases:** 5 | **Plans:** 17 | **Tasks:** 34

### What Was Built
- CSS custom property design token system with MTS clinical color protection and FOUC prevention
- Shared UI component library (Button, Toast, Tooltip, StatusBar) in `src/components/ui/`
- Full component migration from inline styles to token-backed CSS across 97 files
- WCAG 2.1 AA accessibility (contrast, semantic HTML, ARIA, focus indicators)
- Dark mode toggle, keyboard shortcuts (Y/N/R/Esc), oscilloscope waveform recording UI
- CPF-first patient form redesign with input masks, computed age, metadata cards, sticky submit

### What Worked
- **Token-first approach** — Building the design token foundation (Phase 5) before component work meant every subsequent phase had a stable vocabulary with no rework
- **Atomic migration per file** — Never mixing inline styles and token classes in the same file prevented half-migrated states
- **Wave-based parallel execution** — Plans within a wave ran in parallel, keeping total wall-clock time low (3 days for 17 plans)
- **UI-SPEC design contracts** — Phase 9 used a UI design contract which front-loaded visual decisions and reduced executor ambiguity
- **discuss-phase context gathering** — Locking 20 design decisions before planning Phase 9 eliminated back-and-forth during execution

### What Was Inefficient
- **SUMMARY.md one-liner extraction** — Several files had malformed one-liner fields; `summary-extract` tool needs better parsing
- **FORM-05 traceability gap** — Phase 9 added after requirements were defined; FORM-05 never backfilled into REQUIREMENTS.md
- **4 partial UATs never completed** — Human verification items accumulated across Phases 5, 6, 8, 9 but were never run through `/gsd:verify-work`
- **No milestone audit run** — Proceeding without `/gsd:audit-milestone` means cross-phase integration wasn't formally verified

### Patterns Established
- `[data-app-theme]` scoping for CSS resets (Amplify Authenticator coexistence)
- `--mts-*` namespace is immutable — clinical colors never aliased or softened
- `data-priority` attribute pattern for runtime MTS-color keying without inline styles
- Blocking `<script>` in index.html for FOUC prevention
- Component extraction when parent exceeds ~500 LOC with clean interface
- Clinical inline style exceptions formally documented in VERIFICATION.md

### Key Lessons
1. Design tokens are a multiplier — upfront investment in Phase 5 paid off in every subsequent phase
2. Lock decisions before planning frontend phases — discuss-phase + UI-SPEC eliminated ambiguity
3. Run UAT between phases, not at the end — accumulated partial UATs create noise at milestone completion
4. Backfill requirements when adding phases mid-milestone — traceability gaps are caught late

### Cost Observations
- Model mix: ~40% opus (planning, orchestration), ~60% sonnet (research, execution, verification)
- 83 commits across 3 days
- Notable: Parallel wave execution kept total execution time short despite 17 plans

---

## Milestone: v2.1.0 — UX Polish

**Shipped:** 2026-04-10
**Phases:** 5 | **Plans:** 5 | **Tasks:** 10

### What Was Built
- Shared SensorPanel component extracted from duplicated desktop/mobile implementations (~170 LOC consolidated)
- Triage interaction fixes: yes/no buttons decoupled from sensor state, GCS key normalized, multiline chat input
- Clinical vital sign indicators using CSS attribute selectors (warning/critical severity levels)
- Session history enriched with MTS priority badges, patient names, and duration; migrated to session-id API
- Keyboard shortcut legend with ? trigger, revealing Y/N/R/Esc/Shift+Enter bindings in PT-BR

### What Worked
- **Forward-compatible design** — SensorPanel's optional `getFieldStatus` prop (Phase 10) meant Phase 12 required zero changes to ProtocolTriage
- **Surgical phases** — Each phase was 1 plan / 2 tasks, making execution fast and focused (~5-12 min each)
- **Shared utility extraction** — `resolvePriority` in `src/utils/priority.js` used immediately by both Profile.jsx and HistoryPage.jsx
- **CSS attribute selector approach** — `data-status` attributes for vital sign indicators: zero JS runtime cost, clean separation

### What Was Inefficient
- **REQUIREMENTS.md bookkeeping lag** — HIST-01, HIST-02, DISC-01 never checked off in REQUIREMENTS.md despite phases completing; caught at milestone completion
- **No milestone audit** — Proceeding without `/gsd:audit-milestone` again (same gap as v2.0.0)
- **Phase 12 UAT gap** — 3 visual verification items (indicator colors, dark mode contrast, mobile BP layout) remained pending as human-only items

### Patterns Established
- `data-status="warning|critical"` attribute pattern for clinical value indicators
- Warning uses `--color-feedback-warn-*` tokens; critical uses `--color-feedback-error-*` — distinct from MTS clinical colors
- Composite vital sign status (blood_pressure) resolved from worst-case of sub-fields
- `gcs_scale` → `gcs` normalization at setMissingSensors call site — single normalization point
- Shared priority resolution utility in `src/utils/priority.js` with optional chaining

### Key Lessons
1. Forward-compatible props pay off within the same milestone — Phase 10→12 boundary was frictionless
2. Bookkeeping tasks (checking off requirements) should happen at phase completion, not deferred to milestone
3. Small phases (1 plan, 2 tasks) execute extremely fast — good granularity for UX polish work
4. CSS attribute selectors are ideal for runtime state indicators — no JS, no class list management

### Cost Observations
- Model mix: ~30% opus (planning, orchestration), ~70% sonnet (research, execution, verification)
- 28 commits across 2 days
- Notable: Smallest milestone yet (5 plans vs 10 and 17) but high user-visible impact per plan

---

## Milestone: v2.2.0 — Batch Traversal

**Shipped:** 2026-04-12
**Phases:** 1 | **Plans:** 1 | **Tasks:** 2

### What Was Built
- Batch traversal mode enabled by default (`batch: true` on all `/protocol-traverse` calls, ~65% fewer API round-trips)
- Sequential `next_node` handler deprecated with `@deprecated` comment and diagnostic `console.warn('[batch_fallback_detected]')`

### What Worked
- **Narrow scope** — Single phase, single plan, 2 tasks. Entire milestone completed in one session (~15 min execution)
- **discuss-phase efficiency** — Only 2 gray areas identified, both resolved in minutes. Phase was well-defined by openapi.yaml and requirements
- **Skip research** — Correct call for a narrow, well-documented change. No wasted tokens on research that would have confirmed what the spec already says
- **Auto-advance pipeline** — discuss→plan→execute→verify ran continuously with no manual intervention needed

### What Was Inefficient
- **No milestone audit** — Third milestone in a row without `/gsd:audit-milestone`. For a 1-phase milestone this is acceptable, but the pattern should not carry forward
- **Nyquist validation skipped** — Research was skipped (correctly), which meant VALIDATION.md couldn't be generated. Acceptable for narrow scope but highlights coupling between research and validation

### Patterns Established
- `batch: true` as stateless flag in payload — no per-call variation, no toggle UI
- `console.warn('[batch_fallback_detected]', { context })` as diagnostic pattern for deprecated code paths
- `@deprecated` JSDoc comment for code paths kept as fallback

### Key Lessons
1. Well-defined API contracts (openapi.yaml) make discuss-phase and research nearly trivial — invest in specs
2. Single-phase milestones are fast but still benefit from the full GSD ceremony (planning, verification, archival)
3. Skipping research is the right call when the spec is authoritative — saves ~2 min and avoids noise

### Cost Observations
- Model mix: ~40% opus (planning, orchestration), ~60% sonnet (execution, verification)
- 5 commits in 1 session
- Notable: Entire milestone from discuss to completion in a single conversation

---

## Cross-Milestone Trends

| Metric | v1.1.0 | v2.0.0 | v2.1.0 | v2.2.0 |
|--------|--------|--------|--------|--------|
| Phases | 4 | 5 | 5 | 1 |
| Plans | 10 | 17 | 5 | 1 |
| Tasks | 11 | 34 | 10 | 2 |
| Avg plans/phase | 2.5 | 3.4 | 1.0 | 1.0 |
| Research used | 1/4 phases | 5/5 phases | 3/5 phases | 0/1 phases |
| Verification pass rate | 4/4 first-pass | 4/5 first-pass | 5/5 first-pass | 1/1 first-pass |
| Timeline | ~10 days | 3 days | 2 days | 1 session |
| Commits | ~35 | 83 | 28 | 5 |
| LOC delta | — | +17,221 | +302 | +8 |

### Top Lessons (Verified Across Milestones)

1. Research before planning catches issues early — v1.1.0 (dead code discovery), v2.0.0 (react-input-mask deprecation), v2.1.0 (API migration path)
2. Dev branch per milestone protects demo stability — validated across all three milestones with zero broken deploys
3. Parallel executor agents work well when plans touch disjoint file sets — confirmed in v1.1.0 Phase 4 and v2.0.0 Phase 7
4. Requirements bookkeeping must happen at phase completion — gap found in v2.0.0 (FORM-05) and v2.1.0 (HIST-01, HIST-02, DISC-01)
5. Forward-compatible interfaces reduce cross-phase friction — v2.1.0 Phase 10→12 boundary was frictionless due to optional props
