---
status: partial
phase: 02-auth-security
source: [02-VERIFICATION.md]
started: 2026-03-30T00:00:00Z
updated: 2026-03-30T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Auth error screen renders on real token failure
expected: Full-screen "Erro de Autenticacao" message in Portuguese with a "Sair e tentar novamente" button appears on page reload after session invalidation — not a broken app or infinite spinner.
result: [pending]

### 2. RequireAdmin redirect works end-to-end
expected: Non-admin user navigating directly to `/admin/users` is immediately redirected to `/` — the AdminUsers component content never renders.
result: [pending]

### 3. Amplify configures successfully with env vars at build time
expected: With all 6 VITE_ vars set in `.env`, `npm run dev` / `npx vite build` succeed with no errors and the Cognito login screen appears.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
