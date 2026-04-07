# Milestones

## v1.1.0 Alignment & Cleanup (Shipped: 2026-04-07)

**Phases completed:** 4 phases, 10 plans, 11 tasks

**Key accomplishments:**

- response.ok guards added to /protocol-suggest and /patient-info fetch calls, closing the two API-08 gaps identified in 01-VERIFICATION.md and marking all 8 Phase 1 API requirements Complete
- One-liner:
- Task 1 — UserContext hardening:
- Shared `getAuthHeaders` extracted to `src/utils/auth.js`, eliminating 5 duplicated inline definitions, plus PatientForm demo data cleared
- Removed jspdf ^4.2.0 and html2canvas ^1.4.1 from package.json — 23 packages pruned, zero source imports, build confirmed passing
- response.ok guards on 5 unguarded fetch calls (2 throw, 3 silent) and 60-second blob URL revocation on all 3 PDF download handlers
- Removed formatDateFromKey S3 date-parsing dead code from Profile.jsx and eliminated deprecated escape() encoding workaround from useTranscribe.js

---
