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

## Cross-Milestone Trends

| Metric | v1.1.0 |
|--------|--------|
| Phases | 4 |
| Plans | 10 |
| Avg plans/phase | 2.5 |
| Research used | 1/4 phases |
| Verification pass rate | 4/4 first-pass |
