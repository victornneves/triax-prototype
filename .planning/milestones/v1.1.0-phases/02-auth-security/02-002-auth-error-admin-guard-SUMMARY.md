---
phase: 02-auth-security
plan: 002
subsystem: auth
tags: [auth, error-handling, admin-guard, routing, UX]
dependency_graph:
  requires: []
  provides: [auth-error-visible, admin-route-guarded]
  affects: [src/App.jsx, src/contexts/UserContext.jsx, src/components/RequireAdmin.jsx]
tech_stack:
  added: []
  patterns: [route-level guard component, context-aware error screen, inner component pattern for context access]
key_files:
  created:
    - src/components/RequireAdmin.jsx
  modified:
    - src/contexts/UserContext.jsx
    - src/App.jsx
decisions:
  - "RequireAdmin renders Carregando... loading state while profile fetches to prevent flash redirect"
  - "AppContent inner component extracts useUser() from UserProvider scope; error screen intercepts before BrowserRouter renders"
  - "AdminUsers internal useEffect redirect left intact as defense-in-depth (per plan D-11)"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-30"
  tasks: 2
  files: 3
---

# Phase 02 Plan 002: Auth Error Display and Admin Route Guard Summary

## One-liner

JWT session failures now surface as a full-screen PT-BR error with sign-out button; /admin/users route protected at routing layer via RequireAdmin component checking effective_role.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Harden UserContext auth session failure detection | f48d20a | src/contexts/UserContext.jsx |
| 2 | Create RequireAdmin component and wire auth error + admin guard into App.jsx | 39e2acf | src/components/RequireAdmin.jsx, src/App.jsx |

## What Was Built

**Task 1 — UserContext hardening:** The silent early return when `fetchAuthSession()` returns no token was replaced with an explicit `setError(new Error('AUTH_SESSION_FAILED'))`. The existing catch block already handled thrown errors with `setError(err)`. Now both failure paths (no token and thrown error) produce visible error state.

**Task 2 — RequireAdmin and App.jsx refactor:**
- Created `src/components/RequireAdmin.jsx` that reads `userProfile` and `loading` from UserContext. While loading, shows `Carregando...` to prevent flash redirects. Non-admins get `<Navigate to="/" replace />`. Admins see `children`.
- Refactored `src/App.jsx` to add an `AppContent` inner component that calls `useUser()` (requires being inside `UserProvider`). When `error` is set, renders a full-screen error in PT-BR with a sign-out button. Otherwise renders the normal `BrowserRouter` / `Routes` tree.
- The `/admin/users` route now wraps `<AdminUsers />` with `<RequireAdmin>`.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

All plan verification checks passed:
- `grep "RequireAdmin" src/App.jsx` shows import and route usage
- `grep "Erro de Autenticacao" src/App.jsx` confirms PT-BR error heading
- `grep "AUTH_SESSION_FAILED" src/contexts/UserContext.jsx` confirms auth failure detection
- `grep "effective_role.*admin" src/components/RequireAdmin.jsx` confirms role check
- `grep "Navigate" src/components/RequireAdmin.jsx` confirms redirect
- `grep "Carregando" src/components/RequireAdmin.jsx` confirms loading state
- `npx vite build` completed without errors

## Known Stubs

None — all features are fully wired.

## Self-Check: PASSED

Files verified:
- `src/components/RequireAdmin.jsx` — FOUND
- `src/contexts/UserContext.jsx` — FOUND (modified)
- `src/App.jsx` — FOUND (modified)

Commits verified:
- f48d20a — FOUND
- 39e2acf — FOUND
