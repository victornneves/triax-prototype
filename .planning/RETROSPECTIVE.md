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

## Cross-Milestone Trends

| Metric | v1.1.0 | v2.0.0 |
|--------|--------|--------|
| Phases | 4 | 5 |
| Plans | 10 | 17 |
| Avg plans/phase | 2.5 | 3.4 |
| Research used | 1/4 phases | 5/5 phases |
| Verification pass rate | 4/4 first-pass | 4/5 first-pass (Phase 9 human_needed) |
| Timeline | ~10 days | 3 days |
| Commits | ~35 | 83 |

### Top Lessons (Verified Across Milestones)

1. Research before planning catches issues early — v1.1.0 (dead code discovery) and v2.0.0 (react-input-mask deprecation) both benefited
2. Dev branch per milestone protects demo stability — validated across both milestones with zero broken deploys
3. Parallel executor agents work well when plans touch disjoint file sets — confirmed in both v1.1.0 Phase 4 and v2.0.0 Phase 7
