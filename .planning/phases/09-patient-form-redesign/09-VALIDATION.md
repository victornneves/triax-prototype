---
phase: 09
slug: patient-form-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (no test suite — out of scope per PROJECT.md) |
| **Config file** | none |
| **Quick run command** | `npm run dev` (visual inspection) |
| **Full suite command** | `npm run build` (build passes = no syntax/import errors) |
| **Estimated runtime** | ~5 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + visual inspection in browser
- **Before `/gsd:verify-work`:** Full build must pass + browser walkthrough
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | FORM-05 | build | `npm run build` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | FORM-05 | build | `npm run build` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 1 | FORM-05 | build | `npm run build` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 1 | FORM-05 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install (tests out of scope per PROJECT.md).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CPF blur triggers lookup stub + spinner | FORM-05 SC1 | No test framework; UI interaction | Enter 11-digit CPF, tab away, verify spinner appears briefly |
| Age computed from birth date, no age input | FORM-05 SC2 | Visual verification | Enter birth date DD/MM/AAAA, verify age label shows computed value |
| Metadata cards non-editable appearance | FORM-05 SC3 | Visual verification | Verify SAME/Visit ID/Patient Code/Ticket/Insurance styled as secondary cards |
| Material-style input styling | FORM-05 SC4 | Visual verification | Verify gray background, subtle border, teal focus highlight on all inputs |
| CPF and date auto-format masks | FORM-05 SC5 | UI interaction | Type digits in CPF field, verify 000.000.000-00 formatting |
| Inline validation border color change | FORM-05 SC6 | Visual verification | Leave Name empty, blur, verify red border on field |
| Tab order CPF→Name→Birth→Sex→Submit | FORM-05 SC7 | Keyboard navigation | Tab through form, verify focus order matches |
| Sticky submit button | FORM-05 SC8 | Visual verification | Resize viewport small, scroll form, verify submit stays visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
