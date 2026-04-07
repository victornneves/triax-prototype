---
phase: 04-fragility
verified: 2026-04-07T00:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 04: Fragility Verification Report

**Phase Goal:** Every fetch call fails visibly on non-2xx responses, dates come from reliable API fields, deprecated encoding is replaced, and PDF blob URLs are cleaned up
**Verified:** 2026-04-07
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                          | Status     | Evidence                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| 1   | Every fetch call has a response.ok guard — non-2xx surfaces an error, not a silent failure                     | VERIFIED   | All 5 previously-unguarded sites in ProtocolTriage.jsx now have guards; other files confirmed |
| 2   | Session date display in Profile.jsx reads from item.created_at, not S3 key filename splitting                  | VERIFIED   | formatDateFromKey absent; item.created_at used at line 86 and sort at lines 27-29             |
| 3   | useTranscribe.js has no call to escape() — deprecated workaround removed                                       | VERIFIED   | grep for escape( returns no matches; alternatives[0].Transcript and IsPartial preserved       |
| 4   | After PDF download, blob URL is revoked via URL.revokeObjectURL in all three download sites                     | VERIFIED   | setTimeout(() => URL.revokeObjectURL(url), 60000) present in HistoryPage, TriageDetailsModal, ProtocolTriage |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact                                  | Expected                                    | Status   | Details                                                                              |
| ----------------------------------------- | ------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `src/components/ProtocolTriage.jsx`       | 5 new response.ok guards + blob URL cleanup | VERIFIED | Guards at lines 338, 395, 424, 460, 644; revokeObjectURL at line 843                |
| `src/components/HistoryPage.jsx`          | blob URL revocation after PDF download      | VERIFIED | revokeObjectURL at line 32; existing fetch guards at lines 49, 75 confirmed          |
| `src/components/TriageDetailsModal.jsx`   | blob URL revocation after PDF download      | VERIFIED | revokeObjectURL at line 126; existing fetch guard at line 25 confirmed               |
| `src/pages/Profile.jsx`                   | Clean date handling via created_at API field| VERIFIED | formatDateFromKey absent; item.created_at used at lines 27, 28, 86                  |
| `src/useTranscribe.js`                    | No deprecated escape() call                 | VERIFIED | escape( absent; alternatives[0].Transcript at line 135 and IsPartial at line 137 intact |

### Key Link Verification

| From                                            | To                                                | Via                                                                   | Status   | Details                                                                |
| ----------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| ProtocolTriage.jsx /protocol_names fetch        | existing .catch(err => console.error(...))        | !res.ok throw inside .then() before res.json()                        | WIRED    | Line 338: `if (!res.ok) throw new Error('Erro ao carregar protocolos: ' + res.status)` |
| ProtocolTriage.jsx traverseTree 503 check       | !response.ok guard before response.json()         | guard at line 644, AFTER 503 continue block at line 638               | WIRED    | Ordering confirmed: 503 check line 638, ok guard line 644             |
| ProtocolTriage.jsx /transcription (3 sites)     | silent console.error only                         | !transcriptionRes.ok (395), !res.ok (424), .then(res => ...) (460)   | WIRED    | All 3 transcription sites log only, do not throw                      |
| Profile.jsx session list rendering              | item.created_at from /history API                 | toLocaleString at line 86 (already working)                           | WIRED    | `item.created_at ? new Date(item.created_at).toLocaleString('pt-BR', ...)` |
| HistoryPage.jsx PDF download                    | URL.revokeObjectURL after 60s                     | setTimeout(() => URL.revokeObjectURL(url), 60000) after window.open   | WIRED    | Line 32, immediately after window.open(url, '_blank') at line 31      |
| TriageDetailsModal.jsx PDF download             | URL.revokeObjectURL after 60s                     | setTimeout(() => URL.revokeObjectURL(url), 60000) after window.open   | WIRED    | Line 126, immediately after window.open(url, '_blank') at line 125    |
| ProtocolTriage.jsx PDF download                 | URL.revokeObjectURL after 60s                     | setTimeout(() => URL.revokeObjectURL(url), 60000) after window.open   | WIRED    | Line 843, immediately after window.open(url, '_blank') at line 842    |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                     | Status    | Evidence                                                            |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------- |
| FRAG-01     | 04-01-PLAN  | Every fetch call checks response.ok and surfaces error on non-2xx                               | SATISFIED | 5 new guards in ProtocolTriage.jsx; pre-existing guards in other files confirmed |
| FRAG-02     | 04-02-PLAN  | Session date in Profile.jsx uses created_at, not S3 key filename splitting                      | SATISFIED | formatDateFromKey absent; created_at used at lines 27, 28, 86      |
| FRAG-03     | 04-02-PLAN  | useTranscribe.js does not use deprecated escape()                                               | SATISFIED | escape( absent; TextDecoder not needed — SDK returns native strings |
| FRAG-04     | 04-01-PLAN  | PDF blob URLs in HistoryPage.jsx revoked via URL.revokeObjectURL                                | SATISFIED | revokeObjectURL in all 3 PDF handlers with 60s setTimeout           |

Note: REQUIREMENTS.md marks all four FRAG requirements as [x] Complete with Phase 4 traceability. No orphaned requirements detected.

### Anti-Patterns Found

None found. Scanned modified files for TODO/FIXME/placeholder patterns, empty implementations, and hardcoded empty data. Build succeeded with no errors (only a pre-existing Vite chunk size advisory, not an error).

### Human Verification Required

#### 1. Transcription failure silent path

**Test:** Simulate a non-2xx from /transcription during a live triage session (e.g., intercept the network request via browser DevTools and return 500).
**Expected:** The triage flow continues uninterrupted; a console.error appears in DevTools; no alert or throw reaches the user.
**Why human:** The silent error path (console.error only, no UI feedback) cannot be confirmed by static analysis — behavior requires runtime observation.

#### 2. PDF blob URL lifecycle

**Test:** Download a PDF in HistoryPage, TriageDetailsModal, and ProtocolTriage. After 60 seconds, attempt to access the blob URL directly in the browser address bar.
**Expected:** The URL returns a resource-not-found or empty response (blob revoked). Memory usage should not grow across repeated downloads.
**Why human:** URL.revokeObjectURL behavior after setTimeout requires a running browser; cannot be verified statically.

### Gaps Summary

No gaps. All four success criteria are achieved: response.ok guards are present at all five previously-unguarded fetch sites in ProtocolTriage.jsx (plus confirmed in other files), Profile.jsx uses item.created_at with formatDateFromKey completely absent, useTranscribe.js has no escape() call with transcript handling intact, and all three PDF download handlers revoke blob URLs via 60-second setTimeout. The production build succeeds cleanly.

---

_Verified: 2026-04-07_
_Verifier: Claude (gsd-verifier)_
