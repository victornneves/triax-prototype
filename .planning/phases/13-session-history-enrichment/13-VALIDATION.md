---
phase: 13
slug: session-history-enrichment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework installed (out of scope per project decision) |
| **Config file** | None |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must pass + manual visual verification
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | HIST-01 | build | `npm run build` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | HIST-01, HIST-02 | build | `npm run build` | ✅ | ⬜ pending |
| 13-01-03 | 01 | 1 | HIST-01, HIST-02 | build+lint | `npm run lint && npm run build` | ✅ | ⬜ pending |
| 13-01-04 | 01 | 1 | HIST-02 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — unit tests are out of scope per project decision (REQUIREMENTS.md §Out of Scope).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Priority badge renders correct MTS color for each priority level | HIST-01 | No test framework; visual correctness requires rendered output | Navigate to /historico, verify each row shows colored pill badge matching session priority |
| Patient name shows "Paciente anon." when name is null | HIST-02 | No test framework; requires sessions with missing patient_info | Create or find session without patient name, verify fallback text appears |
| Duration displays "Xmin Ys" format correctly | HIST-02 | No test framework; formatting verified visually | Check multiple rows show formatted duration; verify null duration shows "—" |
| Yellow badge has dark text (not white) for WCAG contrast | HIST-01 | Contrast is visual; build check cannot verify CSS specificity | Inspect yellow priority badge in browser, confirm text color is dark |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
