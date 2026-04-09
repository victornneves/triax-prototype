# Milestones

## v2.0.0 UI/UX Overhaul (Shipped: 2026-04-09)

**Phases completed:** 5 phases, 17 plans, 34 tasks
**Timeline:** 3 days (2026-04-07 → 2026-04-09)
**Git stats:** 83 commits, 97 files changed, +18,580 / -1,359 lines

**Key accomplishments:**

- CSS custom property design token system with `--mts-*` clinical color namespace, FOUC prevention script, and Amplify coexistence
- Shared Button primitive (primary/secondary/danger variants) and toast notification system replacing all 5 alert() call sites
- All components migrated from inline styles to token-backed CSS — 97 files changed, WCAG 2.1 AA contrast, semantic HTML, ARIA labels, focus indicators
- Responsive sensor panel (desktop sidebar / mobile slide-up), form validation with input masking (CPF, dates, BP), age auto-calculation
- Dark mode toggle with localStorage persistence, keyboard shortcuts (Y/N/R/Esc) for triage flow, oscilloscope waveform recording UI with live transcript
- Patient form redesigned as standalone component — CPF-first flow, lookup stub, metadata cards, Material-style inputs, sticky submit

### Known Gaps

Milestone completed without formal audit (`/gsd:audit-milestone` not run).

- **FORM-05** referenced by Phase 9 plans/roadmap but never formally added to REQUIREMENTS.md — traceability gap only, requirement is functionally complete
- **4 phases have partial UAT** (human testing items pending in HUMAN-UAT.md): Phases 5, 6, 8, 9
- **Phase 9 verification** was `human_needed` — approved by user (3 items were intentional design decisions: lookup stub per D-06, editable metadata per D-14, inline error spans per UI-SPEC)

---

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
