---
plan: 01-001
status: complete
duration: ~10min
requirements: [API-01, API-03, API-08]
---

## Summary

Fixed `/patient-info` request body to send flat fields per openapi.yaml PatientInfoRequest schema, added `prompt` field to `/protocol-suggest` per ProtocolSuggestRequest schema, and added missing `POST /session-finish` call on triage completion.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Fix /patient-info flat body + /protocol-suggest prompt field | 67d377a | ✓ |
| 2 | Add POST /session-finish on triage completion | c64f299 | ✓ |

## Key Files

### key-files.created
(none — all changes to existing files)

### key-files.modified
- `src/components/ProtocolTriage.jsx` — flattened patient-info body, added prompt param to checkProtocolSuggestion, added finishSession function with two call sites

## Decisions

- `finishSession()` is fire-and-forget (no await) — user already sees the result; errors logged to console only
- `prompt` field sourced from `userMsg` passed through `checkProtocolSuggestion(headers, promptText)`

## Self-Check: PASSED

- /patient-info no longer wraps fields in `patient_info:` object
- /protocol-suggest includes required `prompt:` field
- `finishSession()` called in both `status === 'complete'` and `next.type === 'assignment'` branches
- Build passed without errors
