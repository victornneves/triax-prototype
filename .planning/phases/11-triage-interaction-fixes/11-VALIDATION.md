---
phase: 11
slug: triage-interaction-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project has zero test coverage (known tech debt) |
| **Config file** | none |
| **Quick run command** | `npx vite build 2>&1 | tail -5` |
| **Full suite command** | `npx vite build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vite build 2>&1 | tail -5`
- **After every plan wave:** Run `npx vite build`
- **Before `/gsd:verify-work`:** Build must succeed with zero errors
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | TRIAGE-01, TRIAGE-02, TRIAGE-03 | build + manual | `npx vite build` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | TRIAGE-04 | build + manual | `npx vite build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needed — these are targeted bug fixes verified by build success and manual browser testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Yes/No buttons appear during yes/no questions | TRIAGE-01 | No test framework; UI render behavior | Start triage, reach yes/no question, verify buttons visible |
| Yes/No buttons visible with pending sensors | TRIAGE-02 | No test framework; UI state interaction | Start triage, trigger missing_sensors + yes/no question simultaneously, verify buttons visible |
| GCS field highlights when requested | TRIAGE-03 | No test framework; API key mapping | Start triage, reach GCS request, verify GCS field pulses red |
| Shift+Enter creates newline | TRIAGE-04 | No test framework; keyboard interaction | Focus chat input, press Shift+Enter, verify newline; press Enter alone, verify submit |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
