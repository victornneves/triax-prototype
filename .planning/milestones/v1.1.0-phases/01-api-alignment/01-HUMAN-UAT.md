---
status: partial
phase: 01-api-alignment
source: [01-VERIFICATION.md]
started: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-End Triage Flow
expected: Log in, register a patient, enter a chief complaint, confirm the suggested protocol, answer triage questions, submit vitals, and reach a priority result. Each step calls the correct endpoint with the correct schema; `/session-finish` fires at the end and the triage priority color is displayed.
result: [pending]

### 2. Sensor Data Submission Order
expected: Open browser devtools Network tab and submit vitals during the triage flow. POST `/sensor-data` appears before POST `/protocol-traverse` in the network waterfall.
result: [pending]

### 3. History Discriminador Display
expected: Navigate to History, open a completed session. The discriminador label (e.g., "Dor Torácica Típica") is shown — NOT the "Discriminador Indisponível" fallback string.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
