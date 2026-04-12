# Requirements: Triax Prototype

**Defined:** 2026-04-12
**Core Value:** Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

## v2.2.0 Requirements

Requirements for batch traversal milestone. Each maps to roadmap phases.

### Batch Traversal

- [ ] **BATCH-01**: All `/protocol-traverse` calls send `batch: true` by default, reducing API round-trips by ~65%
- [ ] **BATCH-02**: The `next_node` sequential handler is flagged as deprecated (code comment + console.warn on entry) and retained as fallback

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### UX Enhancements

- **UX-01**: Triage progress indicator (stepper/progress bar) — depends on /traverse API exposing step data
- **UX-02**: Session summary timeline during triage

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| UI changes for batch mode | No visible difference to clinician — batch mode is transparent |
| Batch mode toggle/setting | Always-on by default, no user preference needed |
| Remove `next_node` handler | Kept as deprecated fallback for backend compatibility |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BATCH-01 | Phase 15 | Pending |
| BATCH-02 | Phase 15 | Pending |

**Coverage:**
- v2.2.0 requirements: 2 total
- Mapped to phases: 2
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*
