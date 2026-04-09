---
status: partial
phase: 08-new-interactions
source: [08-VERIFICATION.md]
started: 2026-04-09
updated: 2026-04-09
---

## Current Test

[awaiting human testing]

## Tests

### 1. Dark Mode Visual Completeness
expected: All UI components switch to dark colors simultaneously with smooth ~200ms crossfade. No element remains light-themed.
result: [pending]

### 2. FOUC Prevention on First Visit
expected: No flash of light theme visible between page load and React hydration; page appears in dark mode from first paint when OS is in dark mode.
result: [pending]

### 3. Keyboard Shortcut Y/N During Triage
expected: Y sends "Sim", N sends "Não" immediately; teal ring pulse visible on corresponding button for 150ms.
result: [pending]

### 4. Recording Panel Waveform Animation
expected: Canvas waveform animates in real time matching speech amplitude. Timer increments each second. Transcript preview shows partial text in italic, promotes to regular weight when finalized.
result: [pending]

### 5. Transcript-to-Input on Stop
expected: Recording panel disappears, text input reappears pre-filled with transcription text. No message sent automatically.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
