---
phase: 8
slug: new-interactions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project defers test suite to future milestone |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual browser smoke test
- **Before `/gsd:verify-work`:** Full manual verification of all 11 behaviors
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | DSGN-03 | build | `npm run build` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | DSGN-03 | manual | N/A | N/A | ⬜ pending |
| 08-02-01 | 02 | 1 | INTR-02 | build | `npm run build` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 1 | INTR-02 | manual | N/A | N/A | ⬜ pending |
| 08-03-01 | 03 | 2 | INTR-03 | build | `npm run build` | ✅ | ⬜ pending |
| 08-03-02 | 03 | 2 | INTR-03 | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework setup needed — project explicitly defers test suite to a future milestone.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toggle switches `data-app-theme` attribute | DSGN-03 | No test framework; requires DOM inspection | Toggle dark mode, verify `data-app-theme="dark"` on root element |
| Theme persists across reload | DSGN-03 | Requires full page reload | Set dark mode, reload page, verify dark mode still active |
| OS preference detection on first visit | DSGN-03 | Requires DevTools emulation | Clear `localStorage.triax-theme`, emulate `prefers-color-scheme: dark`, reload |
| Y/N shortcuts fire handleSendMessage | INTR-02 | Requires active triage session | Start triage, reach yes/no node, press Y — verify "Sim" sent |
| Shortcuts suppressed inside input fields | INTR-02 | Requires focus context | Focus text input, press Y — must not fire shortcut |
| R toggles recording | INTR-02 | Requires mic permission | Press R during triage, verify mic activates/deactivates |
| Esc cancels recording | INTR-02 | Requires active recording | Start recording, press Esc, verify recording stops |
| Waveform appears during recording | INTR-03 | Visual verification | Start recording, verify canvas waveform animates |
| Elapsed timer counts up | INTR-03 | Visual verification | Start recording, verify 0:00 → 0:01 → ... increments |
| Live transcript preview shows | INTR-03 | Requires speech input | Speak while recording, verify partialTranscript displays in preview |
| No auto-send on stop | INTR-03 | Patient safety verification | Stop recording, verify transcript populates input but is NOT sent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
