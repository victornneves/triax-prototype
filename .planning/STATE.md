---
gsd_state_version: 1.0
milestone: v2.0.0
milestone_name: UI/UX Overhaul
status: unknown
stopped_at: Completed 08-new-interactions-03-PLAN.md
last_updated: "2026-04-09T12:46:16.980Z"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 15
  completed_plans: 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.
**Current focus:** Phase 08 — new-interactions

## Current Position

Phase: 08
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v2.0.0)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| — | — | — | — |

*Updated after each plan completion*
| Phase 05-design-token-foundation P01 | 8min | 2 tasks | 5 files |
| Phase 05-design-token-foundation P02 | 2min | 2 tasks | 2 files |
| Phase 06-ui-primitives-toast P01 | 2min | 2 tasks | 3 files |
| Phase 06-ui-primitives-toast P02 | 1min | 2 tasks | 4 files |
| Phase 06-ui-primitives-toast P03 | 4min | 2 tasks | 4 files |
| Phase 07-component-migration-accessibility P01 | 3min | 2 tasks | 9 files |
| Phase 07-component-migration-accessibility P04 | 4min | 2 tasks | 4 files |
| Phase 07-component-migration-accessibility P02 | 8min | 2 tasks | 4 files |
| Phase 07-component-migration-accessibility P03 | 12min | 2 tasks | 3 files |
| Phase 07-component-migration-accessibility P05 | 8min | 2 tasks | 2 files |
| Phase 07-component-migration-accessibility P06 | 2min | 2 tasks | 2 files |
| Phase 07-component-migration-accessibility P07 | 6min | 2 tasks | 2 files |
| Phase 08-new-interactions P02 | 8min | 2 tasks | 2 files |
| Phase 08-new-interactions P01 | 2min | 2 tasks | 6 files |
| Phase 08-new-interactions P03 | 8min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

- [v2.0.0]: MTS priority colors (`--mts-*`) are immutable — never aliased or softened; yellow requires `--mts-yellow-text: #000000` companion token
- [v2.0.0]: CSS resets scoped to `[data-app-theme]` to prevent Amplify Authenticator breakage
- [v2.0.0]: Inline style migration is atomic per file — never mix inline styles and token classes in the same file
- [v2.0.0]: `react-input-mask` archived Dec 2025 — use `react-imask` 7 for CPF/date/BP masking
- [v2.0.0]: FOUC prevention needs blocking `<script>` in `index.html` reading localStorage before React hydrates
- v2.0.0 work on `v2-ui-overhaul` branch; merge to main only at milestone completion
- [Phase 05-design-token-foundation]: MTS priority colors (--mts-*) kept byte-for-byte from v1.1.0 App.css — immutable clinical constraint
- [Phase 05-design-token-foundation]: Semantic tokens scoped to [data-app-theme] not :root to prevent Amplify Authenticator visual regression
- [Phase 05-design-token-foundation]: FOUC script stubs to light mode in Phase 5; full toggle and localStorage logic deferred to Phase 8
- [Phase 05-design-token-foundation]: Atomic migration: no mixed inline/token state in Header.jsx; full swap in one commit
- [Phase 05-design-token-foundation]: Sign-out button uses var(--mts-red) for destructive-action semantics; brand gradient changed to teal tokens (D-02/D-11)
- [Phase 06-ui-primitives-toast]: Button spinner uses child <span> not ::after pseudo-element — cleaner in flex context, avoids z-index edge cases
- [Phase 06-ui-primitives-toast]: Dark error-bg/text token overrides added with toast tokens (same commit) — Button danger variant required them and had no dark coverage
- [Phase 06-ui-primitives-toast]: Toaster renders as sibling to children (not inside BrowserRouter) so toasts survive route changes
- [Phase 06-ui-primitives-toast]: aria-live Toaster div always in DOM even when empty for NVDA/JAWS pre-registration compatibility
- [Phase 06-ui-primitives-toast]: alert() replacement is 1:1 swap — same PT-BR messages, same catch blocks, only feedback mechanism changes from blocking dialog to toast
- [Phase 06-ui-primitives-toast]: .animate-fade-in uses will-change: opacity, transform to prevent layout jitter with ProtocolTriage scrollIntoView
- [Phase 07-component-migration-accessibility]: Profile nav element converted to <Link to='/profile'> — navigation to known route makes Link more semantically correct than button
- [Phase 07-component-migration-accessibility]: app-error classes added to existing App.css — App.jsx concerns belong in App.css, not a new file
- [Phase 07-component-migration-accessibility]: Tooltip position (top/left) stays as inline style — dynamic values from getBoundingClientRect, not design properties; all visual styling in CSS
- [Phase 07-component-migration-accessibility]: StatusBar uses var(--color-feedback-ok-text) / var(--color-feedback-error-text) for dot colors — reuses existing feedback primitive tokens, avoids new tokens
- [Phase 07-component-migration-accessibility]: HistoryPage session list converted from div-cards to semantic table — satisfies A11Y-02 caption/scope requirement and is more correct for tabular session data
- [Phase 07-component-migration-accessibility]: Profile and HistoryPage priority badges reuse existing App.css .priority-badge/.priority-* classes via JS helper that maps priority string to CSS class name
- [Phase 07-component-migration-accessibility]: data-priority attribute pattern: for runtime MTS-color keying, use data-priority=[key] + CSS [data-priority='key'] selectors instead of inline styles — achieves zero inline styles without violating MTS immutability
- [Phase 07-component-migration-accessibility]: MTS priority tint tokens added to tokens.css — light background tints derived from MTS colors belong in the token system, not hardcoded in JS helper functions
- [Phase 07-component-migration-accessibility]: MTS priority colors and GCS/pain severity colors kept inline in JSX — dynamic clinical state cannot be represented as static CSS classes
- [Phase 07-component-migration-accessibility]: Tooltip portal removed from ProtocolTriage; SensorLabel functional without popup; re-wiring deferred to Plan 06
- [Phase 07-component-migration-accessibility]: Mobile sensor panel uses CSS max-height transition (0 to 70vh) per RESEARCH.md Pattern 8 — avoids JS animation
- [Phase 07-component-migration-accessibility]: CPF field added to PatientForm (was missing) — formData initial state + grid position alongside patient_code
- [Phase 07-component-migration-accessibility]: StatusBar renders in React fragment outside triage-layout grid — avoids CSS grid disruption
- [Phase 07-component-migration-accessibility]: SensorLabel tooltip content: config.desc + config.range concatenated — reuses existing SENSOR_CONFIG metadata
- [Phase 07-component-migration-accessibility]: Priority badge converted from inline style to .priority-{color} CSS classes from App.css — same approach used in HistoryPage and Profile
- [Phase 07-component-migration-accessibility]: BP inputs use type=number + maxLength/min/max constraints (not IMask) to satisfy FORM-04 without adding IMask to sensor inputs
- [Phase 07-component-migration-accessibility]: GCS select dynamic border and pain slider accentColor formally accepted as clinical exceptions in VERIFICATION.md — runtime state indicators cannot be static CSS classes
- [Phase 08-new-interactions]: Esc check placed BEFORE INPUT/TEXTAREA/SELECT guard so recording cancels on Esc even when typing in text input (D-09)
- [Phase 08-new-interactions]: activeShortcut state + 150ms setTimeout drives pulse rather than CSS :active — keyboard path triggers it programmatically
- [Phase 08-new-interactions]: color-mix() produces 30% opacity teal ring in shortcut-pulse keyframe without a new token
- [Phase 08-new-interactions]: ThemeProvider wraps outermost inside Authenticator (wraps ToastProvider and UserProvider) so theme is available to all children
- [Phase 08-new-interactions]: FOUC script clears via removeAttribute on mount — .app-container [data-app-theme={theme}] is sole authority post-hydration
- [Phase 08-new-interactions]: Unicode emoji icons (U+2600 sun, U+1F319 moon) for dark mode toggle — no icon library dependency added
- [Phase 08-new-interactions]: latestAudioRef holds audio frame (not React state) to avoid re-renders from high-frequency onaudioprocess callbacks
- [Phase 08-new-interactions]: Canvas getComputedStyle resolves --color-primary at draw start since canvas 2D ctx cannot use CSS variables
- [Phase 08-new-interactions]: Canvas HTML 280x120 with CSS 140x60 for 2x DPI sharpness on HiDPI screens
- [Phase 08-new-interactions]: Recording panel replaces entire chat-input-bar (not overlay) per D-15 design decision

### Roadmap Evolution

- Phase 9 added: Patient Form Redesign — CPF-first flow, API auto-fill, Material-style inputs, metadata cards, input masks, sticky submit

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 7 planning]: ProtocolTriage.jsx is 500+ LOC with coupled state machine and render — needs pre-planning review
- [Phase 7 planning]: `/traverse` API may not expose node depth — confirm before any progress-indicator work
- [Phase 8 planning]: Alt+key shortcut scheme on macOS may conflict with special chars — confirm modifier key before committing

## Session Continuity

Last session: 2026-04-09T12:41:43.623Z
Stopped at: Completed 08-new-interactions-03-PLAN.md
Resume file: None
