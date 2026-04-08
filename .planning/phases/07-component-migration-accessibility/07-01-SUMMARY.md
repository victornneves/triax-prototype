---
phase: 07-component-migration-accessibility
plan: 01
subsystem: design-system
tags: [tokens, accessibility, migration, wcag, semantic-html]
dependency_graph:
  requires: []
  provides: [radius-tokens, shadow-tokens, transition-tokens, focus-visible-global, react-imask, AdminUsers-css, RequireAdmin-css, App-css-layout]
  affects: [src/styles/tokens.css, src/index.css, src/pages/AdminUsers.jsx, src/components/RequireAdmin.jsx, src/components/Header.jsx, src/App.jsx, src/App.css]
tech_stack:
  added: [react-imask@7.6.1]
  patterns: [BEM-prefixed token-backed CSS, co-located component CSS files]
key_files:
  created:
    - src/pages/AdminUsers.css
    - src/components/RequireAdmin.css
  modified:
    - src/styles/tokens.css
    - src/index.css
    - src/pages/AdminUsers.jsx
    - src/components/RequireAdmin.jsx
    - src/components/Header.jsx
    - src/App.jsx
    - src/App.css
    - package.json
    - package-lock.json
decisions:
  - "Profile nav element converted to <Link to='/profile'> not <button> — navigation to known route makes Link more semantically correct"
  - "Unused useNavigate import removed from Header.jsx after Link conversion"
  - "app-error classes added to App.css (existing file) not a new app-error.css — App.css already handles App.jsx concerns"
metrics:
  duration: 3min
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_modified: 9
---

# Phase 7 Plan 01: Foundation Tokens, Focus-Visible, and Simple Component Migrations Summary

**One-liner:** Radius/shadow/transition tokens, WCAG :focus-visible global rule, react-imask install, and full inline-style removal from AdminUsers/RequireAdmin/App.jsx with semantic HTML improvements.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Token additions + global focus-visible + react-imask install | a6df76d | tokens.css, index.css, package.json |
| 2 | Migrate AdminUsers, RequireAdmin, App.jsx + fix Header profile div | 610bf70 | AdminUsers.jsx/css, RequireAdmin.jsx/css, Header.jsx, App.jsx, App.css |

## What Was Built

### Task 1: Foundation

- Added 6 primitive tokens to `src/styles/tokens.css` in `:root`:
  - Border radius: `--radius-sm: 0.25rem`, `--radius-md: 0.5rem`, `--radius-lg: 0.75rem`
  - Shadows: `--shadow-sm`, `--shadow-md`
  - Transition: `--transition-fast: 150ms ease`
- Replaced WebKit focus ring (`4px auto -webkit-focus-ring-color`) with WCAG 2.1 AA compliant `:focus-visible` rule covering ALL interactive elements (not just buttons)
- Installed `react-imask@7.6.1` for CPF/date/BP masking (required by Plan 06)

### Task 2: Component Migrations

**AdminUsers** (`src/pages/AdminUsers.jsx` + `src/pages/AdminUsers.css`):
- Created co-located CSS file with 14 BEM classes, 34 `var(--)` token references, zero raw hex values
- Replaced 23 inline style objects with `className` references
- Added `<caption>Usuarios cadastrados na plataforma</caption>` to table (A11Y-02)
- Added `scope="col"` to all 4 `<th>` elements (A11Y-02)
- Fixed 3 failing contrast colors: `#adb5bd` (2.07:1 FAIL) and `#868e96` (3.32:1 FAIL) → `--color-text-secondary` (gray-600, 7.63:1 PASS)

**RequireAdmin** (`src/components/RequireAdmin.jsx` + `src/components/RequireAdmin.css`):
- Created co-located CSS file with `.require-admin-loading` class using token spacing
- Replaced 1 inline style block with `className="require-admin-loading"`

**App.jsx** (`src/App.jsx` + `src/App.css`):
- Added `.app-error`, `.app-error__title`, `.app-error__message`, `.app-error__button`, `.app-container`, `.app-main` to `App.css`
- Replaced 6 inline style objects in AppContent with className references
- `data-app-theme="light"` preserved on `.app-container` div

**Header.jsx** (`src/components/Header.jsx`):
- Converted `<div onClick={() => navigate('/profile')}>` to `<Link to="/profile">` (D-14, A11Y-02)
- Removed unused `useNavigate` import (auto-fix: Rule 1)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `useNavigate` import from Header.jsx**
- **Found during:** Task 2, after converting profile div to `<Link to="/profile">`
- **Issue:** `navigate` variable was declared but no longer referenced — would cause lint warning
- **Fix:** Removed `useNavigate` from import and removed `const navigate = useNavigate()` declaration
- **Files modified:** `src/components/Header.jsx`
- **Commit:** 610bf70

## Known Stubs

None. All components render with live data from API. No placeholder values wired to UI.

## Self-Check: PASSED
