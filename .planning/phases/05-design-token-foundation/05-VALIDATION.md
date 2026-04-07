---
phase: 5
slug: design-token-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — zero test coverage is a known project constraint |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + visual review of login screen and header
- **Before `/gsd:verify-work`:** Full visual smoke test — login, header, triage flow
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DSGN-01 | smoke | `npm run build` | N/A | ⬜ pending |
| 05-01-02 | 01 | 1 | DSGN-01 | manual | `grep -n -- '--mts-' src/styles/tokens.css` | N/A | ⬜ pending |
| 05-02-01 | 02 | 2 | DSGN-02 | smoke | `npm run build` | N/A | ⬜ pending |
| 05-02-02 | 02 | 2 | DSGN-02 | manual | `grep -n '#0d6efd\|#198754\|#6c757d\|#dc3545\|#fd7e14' src/components/Header.jsx` | N/A | ⬜ pending |
| 05-xx-vis | all | 2 | visual | manual | Sign out, view login screen | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install — validation is build smoke test + visual review per project constraints.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Amplify login screen renders without regression | DSGN-01 | Visual rendering cannot be automated without screenshot testing | Sign out, view login screen, check layout and styles |
| Header renders warm-professional styles | DSGN-02 | Aesthetic verification requires human judgment | Load app, inspect header colors/spacing match intent |
| MTS priority badges remain unchanged | DSGN-01 | Color fidelity at pixel level | Navigate to triage, verify badge colors match v1.1.0 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
