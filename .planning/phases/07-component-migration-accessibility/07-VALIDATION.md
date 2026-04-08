---
phase: 7
slug: component-migration-accessibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — test suite is explicitly out of scope per REQUIREMENTS.md |
| **Config file** | none |
| **Quick run command** | `npm run build` (compile check) |
| **Full suite command** | `npm run build` + manual verification |
| **Estimated runtime** | ~15 seconds (build only) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (ensures no syntax/import errors)
- **After every plan wave:** Run `npm run build` + visual spot-check in browser
- **Before `/gsd:verify-work`:** Full manual verification per UAT checklist
- **Max feedback latency:** 15 seconds (build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | — | build | `npm run build` | N/A | ⬜ pending |
| 07-01-02 | 01 | 1 | A11Y-01 | manual | Lighthouse accessibility audit | N/A | ⬜ pending |
| 07-02-01 | 02 | 1 | A11Y-02 | manual | Keyboard tab-through all pages | N/A | ⬜ pending |
| 07-02-02 | 02 | 1 | A11Y-03 | manual | Check focus-visible outlines | N/A | ⬜ pending |
| 07-03-01 | 03 | 2 | LAYT-01 | manual | Chrome DevTools mobile viewport | N/A | ⬜ pending |
| 07-03-02 | 03 | 2 | LAYT-02 | manual | Start triage, check StatusBar | N/A | ⬜ pending |
| 07-04-01 | 04 | 2 | FORM-01 | manual | Blur required fields, check errors | N/A | ⬜ pending |
| 07-04-02 | 04 | 2 | FORM-02 | manual | Enter birth date, check age auto-fill | N/A | ⬜ pending |
| 07-04-03 | 04 | 2 | FORM-03 | manual | Hover/tab to tooltip icons | N/A | ⬜ pending |
| 07-04-04 | 04 | 2 | FORM-04 | manual | Type in CPF/date/BP masked fields | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers build verification. No test framework to install (out of scope).

- [ ] `npm run build` — confirm clean build before phase work begins

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Zero contrast failures | A11Y-01 | Requires browser Axe/Lighthouse audit | Run Lighthouse Accessibility in Chrome DevTools on every page |
| Semantic HTML + ARIA | A11Y-02 | Screen reader behavior check | Tab through app with keyboard; verify labels, roles, aria attributes |
| Visible focus indicators | A11Y-03 | Visual confirmation | Tab through every interactive element, verify 2px primary outline |
| Sensor panel responsive | LAYT-01 | Viewport-dependent layout | Toggle Chrome DevTools to 375px width; check collapse + toggle |
| StatusBar visibility | LAYT-02 | Runtime UI check | Start triage session; verify session ID, protocol name, connection dot |
| Inline validation | FORM-01 | User interaction test | Leave required fields empty, blur, check inline error messages |
| Age auto-fill | FORM-02 | User interaction test | Enter birth date; verify age field calculates correctly |
| Tooltips | FORM-03 | Hover/focus behavior | Hover and tab to info icons; verify tooltip text appears |
| Input masking | FORM-04 | Keystroke behavior | Type in CPF, date, BP fields; verify formatting as-you-type |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: build check after every commit provides continuous feedback
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
