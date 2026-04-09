# Requirements: Triax Prototype

**Defined:** 2026-04-09
**Core Value:** Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

## v2.1.0 Requirements

Requirements for UX Polish release. Each maps to roadmap phases.

### Triage Interaction

- [ ] **TRIAGE-01**: Yes/No quick-reply buttons appear when agent asks a yes/no question (fix `missingSensors` blocking condition)
- [ ] **TRIAGE-02**: Yes/No buttons remain visible and functional even when vital signs are still pending
- [ ] **TRIAGE-03**: All requested vital signs are correctly highlighted on the sensor dock (fix `gcs_scale`→`gcs` key mismatch)
- [ ] **TRIAGE-04**: Shift+Enter creates a new line in chat input; Enter alone submits the message

### Vital Signs UX

- [ ] **VITALS-01**: Sensor panel displays visual indicators for abnormal/critical vital sign values (e.g., temp >40C, SpO2 <90%)
- [ ] **VITALS-02**: Blood pressure input uses mobile-friendly stacked layout with explicit SIS/DIA labels

### Session History

- [ ] **HIST-01**: History list shows MTS priority color badge for each session
- [ ] **HIST-02**: History list shows patient name preview and session duration

### Discoverability

- [ ] **DISC-01**: Keyboard shortcuts (Y/N/R/Esc) are discoverable via help legend or tooltip

### Refactoring

- [ ] **REFAC-01**: Sensor panel rendering extracted into shared component used by both desktop and mobile views

## Future Requirements

### Deferred from v2.0.0

- **PROG-01**: Triage progress indicator (stepper/progress bar) — depends on /traverse API exposing step data
- **PROG-02**: Session summary timeline during triage

## Out of Scope

| Feature | Reason |
|---------|--------|
| Test suite | Known tech debt; separate milestone |
| AudioWorklet migration | High effort, low urgency for pilot |
| API response caching | Nice-to-have, deferred |
| i18n framework | Strings stay hardcoded PT-BR |
| Command palette (Ctrl+K) | Over-engineered for pilot |
| Hospital EHR integration | Requires backend work |
| Pause/resume triage | Requires backend changes |
| CPF patient lookup API | Backend endpoint needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRIAGE-01 | — | Pending |
| TRIAGE-02 | — | Pending |
| TRIAGE-03 | — | Pending |
| TRIAGE-04 | — | Pending |
| VITALS-01 | — | Pending |
| VITALS-02 | — | Pending |
| HIST-01 | — | Pending |
| HIST-02 | — | Pending |
| DISC-01 | — | Pending |
| REFAC-01 | — | Pending |

**Coverage:**
- v2.1.0 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
