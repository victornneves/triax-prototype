# TESTING.md — Testing Practices

## Current State
**No tests exist.** There are zero test files anywhere in the repository.

- No test runner configured (no Jest, Vitest, Cypress, Playwright)
- No `test` script in `package.json`
- No `*.test.*`, `*.spec.*`, or `__tests__/` files
- No testing library dependencies

## What This Means
The codebase has 0% test coverage. This is especially notable given this is a **clinical triage application** used in healthcare decision-making.

## Risk Areas Without Tests
- `useTranscribe.js` — complex async audio streaming lifecycle; no tests for start/stop/error paths
- `ProtocolTriage.jsx` — core triage state machine with complex traversal logic; no tests for protocol flow
- Auth token handling — `getAuthHeaders` called on every API request; no tests for token absence
- Role-based access control — admin guard is purely client-side; no tests verify it
- Sensor input validation — clinical vital signs entered by users; no validation or tests

## Recommended Testing Approach (if adding tests)

### Unit / Component Tests
- **Vitest** (native to Vite) with `@testing-library/react`
- Test `useTranscribe` hook with mocked AWS SDK
- Test `UserContext` with mocked `fetchAuthSession`
- Test `PatientForm` submit behavior
- Test sensor input components (PainInput, GCSInput)

### Integration Tests
- Mock REST API with MSW (Mock Service Worker)
- Test full triage flow: patient submit → protocol suggest → traverse → end session

### E2E Tests
- Playwright or Cypress for full browser flow
- Auth flow via Cognito (or mock)

## CI
No CI pipeline configured (no `.github/workflows/`, no `.gitlab-ci.yml`, etc.).
