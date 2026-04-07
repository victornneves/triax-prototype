---
phase: 04
slug: fragility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework in project (out of scope per REQUIREMENTS.md) |
| **Config file** | None |
| **Quick run command** | `grep` verification commands (see Per-Task map) |
| **Full suite command** | `npm run build` (confirms no build errors) |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run grep verification commands from task map
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must succeed + all grep checks pass
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | FRAG-01 | grep | `grep -c 'response.ok' src/components/ProtocolTriage.jsx` | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | FRAG-04 | grep | `grep -c 'revokeObjectURL' src/components/ProtocolTriage.jsx src/components/HistoryPage.jsx src/components/TriageDetailsModal.jsx` | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | FRAG-02 | grep | `grep -c 'formatDateFromKey' src/pages/Profile.jsx` (expect 0) | N/A | ⬜ pending |
| 04-02-02 | 02 | 1 | FRAG-03 | grep | `grep -c 'escape(' src/useTranscribe.js` (expect 0) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needed — verification is via grep and build checks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-2xx fetch shows error to user | FRAG-01 | No test framework; requires browser | Trigger API error, confirm error message appears |
| PDF opens in new tab after blob fix | FRAG-04 | Requires browser interaction | Download PDF, confirm it opens; check DevTools for blob URL cleanup |
| Transcribe text displays correctly | FRAG-03 | Requires live AWS Transcribe stream | Record voice input, confirm transcript displays without corruption |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
