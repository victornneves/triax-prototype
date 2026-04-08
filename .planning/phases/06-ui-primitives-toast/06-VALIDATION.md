---
phase: 6
slug: ui-primitives-toast
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — zero test coverage is a documented project constraint (REQUIREMENTS.md Out of Scope) |
| **Config file** | None |
| **Quick run command** | `npm run dev` (manual browser verification) |
| **Full suite command** | N/A — no automated test suite |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Manual browser verification — `npm run dev`, visual confirm
- **After every plan wave:** Same — visual verification in dev server
- **Before `/gsd:verify-work`:** Manual UAT per phase verification criteria
- **Max feedback latency:** ~5 seconds (dev server hot reload)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DSGN-04 | manual | `grep "variant" src/components/ui/Button.jsx` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | DSGN-04 | manual | `grep "className" src/components/ui/Button.css` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | INTR-01 | manual | `grep "role=\"alert\"" src/components/ui/Toast.jsx` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | INTR-01 | manual | `grep "useToast" src/components/ui/ToastProvider.jsx` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | INTR-01 | manual | `grep -rL "alert(" src/components/` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 2 | INTR-04 | manual | `grep "animate-fade-in" src/components/ProtocolTriage.jsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework install needed — project has zero test coverage by design. All verification is manual/visual per REQUIREMENTS.md out-of-scope decision.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toast auto-dismisses after 8s | INTR-01 | Timing behavior requires browser | Open dev server, trigger error, confirm toast disappears after ~8s |
| Toast stacks max 3 visible | INTR-01 | Visual stacking behavior | Trigger 4+ toasts rapidly, confirm oldest dismissed |
| Button loading spinner visible | DSGN-04 | Visual spinner rendering | Click button with loading prop, confirm spinner shows |
| Toast contrast in dark theme | INTR-01 | Visual contrast check | Toggle `data-app-theme="dark"`, verify toast readability |
| Chat bubble fade-in animation | INTR-04 | Animation timing visual | Send message in triage, confirm bubble animates in <300ms |
| Toast slide-in from right | INTR-01 | Animation direction visual | Trigger toast, confirm slides from right edge |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions or grep-checkable acceptance criteria
- [ ] Sampling continuity: visual verification after every task commit
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s (hot reload)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
