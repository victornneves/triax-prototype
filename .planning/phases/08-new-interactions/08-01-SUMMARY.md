---
phase: 08-new-interactions
plan: 01
subsystem: ui
tags: [react, context, dark-mode, localStorage, css-tokens, accessibility]

# Dependency graph
requires:
  - phase: 05-design-token-foundation
    provides: Dark token block in tokens.css ([data-app-theme="dark"] fully defined lines 145-181)
  - phase: 07-component-migration-accessibility
    provides: Header.jsx with header-right layout and CSS token classes
provides:
  - ThemeContext provider with localStorage persistence and OS preference detection
  - FOUC script with prefers-color-scheme fallback in index.html
  - Dynamic data-app-theme attribute controlled by ThemeProvider in App.jsx
  - Dark mode toggle button in header-right (accessible, 36x36 touch target)
  - 200ms crossfade transition on [data-app-theme] container
affects: [09, all-future-phases-using-header]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ThemeContext follows UserContext pattern (createContext + Provider export + useX hook)
    - FOUC prevention via blocking <script> in index.html before React hydrates
    - FOUC script owns <html> attribute; ThemeProvider removes it on mount so .app-container becomes sole theme authority
    - Icon-only buttons use aria-label for accessibility, no external icon library needed

key-files:
  created:
    - src/contexts/ThemeContext.jsx
  modified:
    - index.html
    - src/App.jsx
    - src/App.css
    - src/components/Header.jsx
    - src/components/Header.css

key-decisions:
  - "ThemeProvider wraps outermost inside Authenticator (wraps ToastProvider and UserProvider) so theme is available to all children"
  - "FOUC script clears via removeAttribute on mount — .app-container [data-app-theme={theme}] is sole authority post-hydration"
  - "Unicode emoji icons (U+2600 sun, U+1F319 moon) for toggle — no icon library dependency added"
  - "200ms ease crossfade on [data-app-theme] selector in App.css — matches D-03 timing spec"

patterns-established:
  - "ThemeContext pattern: createContext + lazy initializer + localStorage effect + removeAttribute effect + toggleTheme"
  - "FOUC script reads localStorage first, then prefers-color-scheme, then defaults to light"

requirements-completed: [DSGN-03]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 08 Plan 01: Dark Mode Toggle — End-to-End Wiring Summary

**ThemeContext with localStorage persistence and OS preference detection wired to dynamic data-app-theme in App.jsx, FOUC script updated with prefers-color-scheme fallback, and toggle button with sun/moon icons added to Header**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-09T12:31:01Z
- **Completed:** 2026-04-09T12:33:00Z
- **Tasks:** 2
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- Created `ThemeContext.jsx` with `ThemeProvider` and `useTheme` hook — lazy init from localStorage with `prefers-color-scheme` fallback, localStorage sync effect, and FOUC attribute cleanup on mount
- Updated FOUC script in `index.html` to check `prefers-color-scheme` when no stored value (was previously defaulting to `'light'` unconditionally)
- Wired `App.jsx` — `ThemeProvider` wraps outermost provider stack, `AppContent` uses `const { theme } = useTheme()`, `data-app-theme` is now dynamic `{theme}` instead of hardcoded `"light"`
- Added 200ms crossfade transition rule on `[data-app-theme]` in `App.css` for smooth theme switching
- Added dark mode toggle button as first child of `header-right` in `Header.jsx` — sun/moon emoji, accessible `aria-label` in PT-BR, `onClick={toggleTheme}`
- Added `.header-theme-toggle` CSS rule in `Header.css` — 36x36 min touch target, hover + focus-visible states using existing token variables

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ThemeContext, update FOUC script, wire App.jsx** - `dc0d59e` (feat)
2. **Task 2: Add dark mode toggle button to Header** - `46aea1d` (feat)

**Plan metadata:** committed with docs commit below

## Files Created/Modified

- `src/contexts/ThemeContext.jsx` — ThemeProvider and useTheme hook; lazy init, localStorage effect, FOUC cleanup effect, toggleTheme
- `index.html` — FOUC script updated: `prefers-color-scheme` media query fallback when no localStorage value
- `src/App.jsx` — ThemeProvider added outermost, useTheme() in AppContent, data-app-theme={theme} dynamic
- `src/App.css` — [data-app-theme] crossfade transition rule (200ms ease on bg/color/border)
- `src/components/Header.jsx` — useTheme import, toggle button as first child of header-right
- `src/components/Header.css` — .header-theme-toggle with 36x36 touch target, hover, focus-visible

## Decisions Made

- `ThemeProvider` placed outermost inside `Authenticator` callback (wraps `ToastProvider` and `UserProvider`) so theme is available to all consumers
- FOUC script attribute on `<html>` is removed by a `useEffect` on mount — `.app-container[data-app-theme={theme}]` becomes sole authority after hydration, eliminating dual-authority conflict
- Unicode emoji icons chosen for toggle button (U+2600 sun, U+1F319 moon) — no icon library dependency needed
- 200ms ease timing matches D-03 crossfade spec and mirrors existing `.header-theme-toggle` transition

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Dark mode toggle is fully wired end-to-end; all existing dark token definitions in `tokens.css` (lines 145-181) now activate on toggle
- Plan 02 (keyboard shortcuts) and Plan 03 (voice recording UX) can proceed independently — no shared state dependencies with ThemeContext

---
*Phase: 08-new-interactions*
*Completed: 2026-04-09*
