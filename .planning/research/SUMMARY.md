# Project Research Summary

**Project:** Triax Prototype v2.0.0 UI/UX Overhaul
**Domain:** Clinical emergency triage SPA (Manchester Triage System — React 19 + Vite + AWS Amplify)
**Researched:** 2026-04-07
**Confidence:** HIGH

## Executive Summary

Triax is a functioning clinical SPA in active pilot use. The v2.0.0 milestone is a UI/UX overhaul of an existing ~3,400 LOC codebase that has zero tests, 260+ inline style occurrences, five `alert()` calls, and no design token layer. The recommended approach is a strict incremental migration: establish a CSS custom property token foundation first, then build reusable UI primitives, then migrate components one at a time, and finally layer in new interactions (dark mode, keyboard shortcuts, voice waveform). No framework changes. No big-bang rewrites.

Mantine 8 is the recommended design system — it handles React 19 natively, uses CSS Modules (no CSS-in-JS runtime), and avoids namespace collision with `@aws-amplify/ui-react` (`--mantine-*` vs `--amplify-*`). Tailwind and shadcn/ui are explicitly out of scope — adding Tailwind to 3,400 LOC of inline styles is a full migration, not an overhaul.

The overriding constraint is patient safety. The five Manchester Triage System priority colors (red/orange/yellow/green/blue) are clinically mandated constants — not stylistic variables — and must survive the migration with exact hex values intact. This is the single highest-risk item in the entire overhaul. Every phase that touches color must treat `--mts-*` tokens as immutable.

## Key Findings

### Recommended Stack

The locked stack (React 19, Vite 7, AWS Amplify 6, React Router 7) must not change. Seven new production dependencies are recommended.

**Core technologies (new additions only):**
- **Mantine 8** (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/dates`): 120+ components covering every UI need (Stepper, DatePicker, Notifications, Tooltip); CSS Modules avoids runtime overhead; `--mantine-*` namespace does not collide with Amplify
- **motion 12** (fka framer-motion): Page transitions and voice waveform animation; use `LazyMotion` to defer ~30KB; import from `motion/react`, not `framer-motion`
- **react-hotkeys-hook 5**: Hook-based keyboard shortcuts with built-in form element detection; prevents number keys from firing during patient data entry
- **react-imask 7**: CPF/phone input masking; `react-input-mask` was archived December 2025 — do not use
- **CSS custom properties** (native): Zero-cost design token layer; dark mode via attribute selector — no React re-render on theme switch

**Critical version note:** `react-input-mask` is archived and must not be used.

### Expected Features

**Must have (v2.0.0):**
- CSS variable design token system — gates all other work
- Soft palette + unified button variants — largest first-impression improvement
- Toast notification system replacing all 5 `alert()` calls
- WCAG 2.1 AA color contrast and semantic HTML + ARIA labels
- Triage progress indicator — clinicians have no sense of position in decision tree
- Voice recording waveform + timer + live transcript preview
- Auto age calculation from birth date
- Form validation feedback on required fields

**Should have (v2.x — after stakeholder feedback):**
- Dark mode toggle with localStorage persistence
- Keyboard shortcuts (modifier keys for yes/no, Esc to cancel)
- Responsive / collapsible sensor panel (depends on confirmed tablet usage)
- Session summary timeline

**Defer (v3+):** i18n, AudioWorklet migration, API response caching, command palette.

**Anti-features to avoid:** Auto-submit on triage completion (patient safety), swipe gestures (gloves in clinical settings), persistent dark mode on shared devices.

### Architecture Approach

The architecture is a layered provider stack with CSS custom properties as the foundation. Recommended nesting: `ThemeContextProvider` → `AmplifyThemeProviderBridge` → `Authenticator` → `UserProvider` → `ToastContextProvider` → `AppContent`.

**Major components:**
1. `src/styles/tokens.css` — single source of truth; three layers: primitives → semantic → `--mts-*` clinical colors (immutable)
2. `src/components/ui/` — new primitive library (Button, Badge, Card, Toast, ProgressBar, Tooltip, VoiceRecorder)
3. `ThemeContext` — thin context; holds `colorMode` + `toggleColorMode()`; CSS custom property swap does actual theme work
4. `ToastContext` — global toast queue via `createPortal` into `document.body`; mounted at app root
5. `useShortcuts` hook — centralizes keyboard event registration; guards against input focus
6. `ProtocolTriage.jsx` — triage state machine logic stays untouched; only render return is refactored

### Critical Pitfalls

1. **MTS priority colors softened or renamed** — `--mts-red/orange/yellow/green/blue` namespace, commented as immutable, never aliased to brand tokens. Yellow requires `--mts-yellow-text: #000000` companion token.
2. **Inline style specificity stalemate** — 260+ inline `style={{}}` beat all CSS classes. Migration must be atomic per file — never both inline and token in the same file.
3. **Amplify Authenticator CSS conflict** — Global resets on `:root` break login screen silently. Scope design system resets to `[data-app-theme]` wrapper; use Amplify's `theme` prop, not class overrides.
4. **Dark mode FOUC** — Blocking `<script>` in `index.html` sets `data-theme` from `localStorage` before React loads.
5. **ARIA without semantic HTML** — Fix `<div>` → `<button>`, add `<label htmlFor>` before adding ARIA attributes.
6. **Toast ARIA urgency** — All 5 existing `alert()` sites are error conditions: use `role="alert"` + minimum 8-second dismiss, not `aria-live="polite"`.
7. **Keyboard shortcut conflicts** — Use `Alt+key` modifier keys (not bare number keys) to avoid screen reader browse mode conflicts.

## Implications for Roadmap

### Phase 1: Foundation — Design Token System + Provider Stack
**Rationale:** CSS custom properties gate dark mode, palette work, and Amplify coexistence. Must come first.
**Delivers:** `tokens.css` with `--mts-*` immutable namespace, updated `App.jsx` provider stack, Amplify ThemeProvider bridge, FOUC-prevention script in `index.html`, scoped CSS reset.
**Avoids:** MTS color drift, inline style specificity stalemate, Amplify CSS conflict, dark mode FOUC.
**Research flag:** Standard patterns — no deeper research needed.

### Phase 2: UI Primitives + Toast System
**Rationale:** Primitives are referenced by all subsequent migration phases. Toast must exist before form validation.
**Delivers:** `src/components/ui/` library (Button, Badge, Card, Toast, ProgressBar, Tooltip), `ToastContext`, replacement of all 5 `alert()` call sites.
**Avoids:** Toast accessibility pitfalls (implement `role="alert"` correctly from day one).
**Research flag:** Standard patterns — no deeper research needed.

### Phase 3: Component Migration + Accessibility
**Rationale:** Leaf-first ordering (Header → PatientForm → sensors → ProtocolTriage → pages) limits blast radius on highest-risk component.
**Delivers:** Full inline-style elimination, semantic HTML, ARIA labels, focus management, WCAG 2.1 AA compliance, triage progress indicator, voice waveform.
**Research flag:** ProtocolTriage sub-component extraction — state machine / render separation needs pre-planning review.

### Phase 4: New Interactions — Dark Mode + Keyboard Shortcuts
**Rationale:** Dark mode requires all components using tokens (phase 3). Keyboard shortcuts require unified button components (phase 2) as consistent focusable targets.
**Delivers:** Dark mode toggle with localStorage persistence, keyboard shortcuts for triage flow (modifier-key, input-guarded), light mode as default.
**Research flag:** `Alt+key` shortcut scheme — verify against VoiceOver/NVDA before committing.

### Phase Ordering Rationale

- Phases 1–2 deliver zero visible UI change — infrastructure, not stakeholder-visible milestones
- Phase 3 is the longest phase with highest clinical risk — ProtocolTriage last
- Phase 4 is only meaningful after phase 3 — dark mode on partially migrated tree shows inconsistent theming
- Responsive layout (collapsible sensor panel) held pending tablet-usage data from pilot

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** ProtocolTriage sub-component extraction — complex 500+ LOC state machine with API coupling
- **Phase 4:** Keyboard shortcut scheme — screen reader testing required

Phases with standard patterns (skip research-phase):
- **Phase 1:** Design tokens + provider stack — well-documented canonical patterns
- **Phase 2:** UI primitives + toast — standard React Context + Portal patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries version-checked; React 19 peer dep compatibility confirmed |
| Features | MEDIUM-HIGH | Prioritization from codebase inspection + healthcare UX research |
| Architecture | HIGH | Provider stack verified against Amplify official docs; all anti-patterns backed by codebase evidence |
| Pitfalls | HIGH | Inline style counts verified by direct file inspection; ARIA and toast pitfalls verified against WCAG |

**Overall confidence:** HIGH

### Gaps to Address

- **Progress indicator step count:** `/traverse` API response may not include node depth or total steps — needs backend API contract review before phase 3 planning
- **Keyboard shortcut modifier keys:** `Alt+1/2` on macOS conflicts with special character input — specific key selection deferred to testing
- **Amplify UI version pinning:** Locking to `6.13.x` means security patches require deliberate upgrades with visual regression checks
- **ProtocolTriage API coupling:** Research assumes triage state machine is fully separable from render logic — confirm during phase 3 planning

---
*Research completed: 2026-04-07*
*Ready for roadmap: yes*
