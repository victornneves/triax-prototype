---
phase: 14
slug: discoverability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test infrastructure exists |
| **Config file** | None |
| **Quick run command** | `npm run build` (compilation check only) |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Build must succeed
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | DISC-01 | build | `npm run build` | N/A | ⬜ pending |
| 14-01-02 | 01 | 1 | DISC-01 | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `?` button visible in chat-input-bar | DISC-01 | No test runner; visual UI element | Start triage, verify `?` icon appears in input bar |
| Legend popover appears on hover | DISC-01 | No test runner; hover interaction | Hover `?` icon, verify 5-row legend appears |
| Legend accessible via keyboard focus | DISC-01 | No test runner; focus interaction | Tab to `?` icon, verify legend appears on focus |
| Popover not clipped by overflow | DISC-01 | Visual rendering | Verify legend fully visible above input bar |
| Dark mode renders correctly | DISC-01 | Visual rendering | Toggle dark mode, verify token-backed colors |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
