# Phase 6: UI Primitives + Toast System - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

A shared component library exists in `src/components/ui/` and every `alert()` call in the app has been replaced with accessible toast notifications. Button variants are visually distinct from a single shared component. UI transitions on chat bubbles and page changes are animated under 300ms.

</domain>

<decisions>
## Implementation Decisions

### Toast system design
- **D-01:** Custom-built toast — no external library. The app needs a simple error/success banner; react-hot-toast or sonner would be overkill for 5 call sites.
- **D-02:** Position: top-right, offset below Header. Doesn't overlap main triage content area or the chat column.
- **D-03:** Auto-dismiss after 8 seconds minimum (INTR-01 requirement). Manual close button (X) always visible.
- **D-04:** Stack up to 3 visible toasts; oldest auto-dismissed when a 4th arrives.
- **D-05:** Toast types: `error`, `success`, `info`. Error uses `--color-feedback-error-*` tokens, success uses `--color-feedback-ok-*`, info uses `--color-primary` — none overlap with MTS clinical colors.
- **D-06:** `role="alert"` and `aria-live="assertive"` on error toasts for screen reader announcement. Success/info use `aria-live="polite"`.
- **D-07:** Toast must pass contrast in both light and dark token environments (test against both `[data-app-theme]` and `[data-app-theme="dark"]` even before dark mode toggle ships).

### Toast integration pattern
- **D-08:** React Context-based toast provider (`ToastProvider`) wrapping the app — components call `useToast()` hook to dispatch toasts. No prop drilling.
- **D-09:** All 5 existing `alert()` call sites are replaced 1:1 — same error messages (PT-BR), same trigger conditions, just rendered as toast instead of blocking dialog.

### Button component API
- **D-10:** Three variants: `primary` (teal — `--color-primary`), `secondary` (gray outline — `--color-border`), `danger` (muted red — `--color-feedback-error-text`, NOT `--mts-red`).
- **D-11:** Two sizes: `sm` and `md` (default). No `lg` — current app doesn't have large buttons.
- **D-12:** Props: `variant`, `size`, `disabled`, `loading`, `onClick`, `children`, `type`, `className`. Loading state shows a spinner and disables interaction.
- **D-13:** All button styles use design tokens from Phase 5 — no hardcoded hex values in Button CSS.

### Animation approach
- **D-14:** CSS-only transitions and `@keyframes` — no animation library (framer-motion, react-spring). The required animations are simple opacity/translate effects under 300ms.
- **D-15:** Toast entrance: slide-in from right + fade. Toast exit: fade-out. Both <=250ms.
- **D-16:** Chat bubbles in ProtocolTriage: extend the existing `fadeIn` keyframe from `index.css` (already does opacity + translateY). Apply via a shared `.animate-fade-in` utility class.
- **D-17:** Page-level transitions are NOT in scope — React Router doesn't have built-in transition support without a library, and wrapping routes is complexity that belongs in Phase 7 if needed.

### Component library scope
- **D-18:** Phase 6 delivers exactly two primitives: `Button` and `Toast`/`Toaster`. Additional primitives (Card, Input, Badge) are Phase 7 work during full component migration.
- **D-19:** File structure: `src/components/ui/Button.jsx`, `src/components/ui/Button.css`, `src/components/ui/Toast.jsx`, `src/components/ui/Toast.css`, `src/components/ui/ToastProvider.jsx`. Co-located CSS per component, same pattern as Header.css from Phase 5.

### Claude's Discretion
- Toast animation timing curves (ease-out vs cubic-bezier)
- Exact spinner implementation for button loading state
- Toast z-index value (must be above Header)
- Whether to add `--color-danger` and `--color-success` semantic tokens to `tokens.css` or reuse existing feedback tokens directly
- Exact border-radius and padding values for Button/Toast

</decisions>

<specifics>
## Specific Ideas

- Toast should feel lightweight — a slim banner, not a heavy modal-like notification. Think VS Code's notification toasts or Linear's feedback banners.
- Button danger variant must NOT use `--mts-red` — clinicians should never confuse a "delete" button with a "red priority" indicator. Use the muted feedback error color instead.
- The existing `fadeIn` keyframe in `index.css` is already close to what chat bubbles need — reuse and extend rather than creating a parallel animation.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DSGN-04 (unified button variants), INTR-01 (toast replacing alert, role="alert", 8s dismiss), INTR-04 (UI animations <300ms)

### Token system (Phase 5 output)
- `src/styles/tokens.css` — All design tokens: primitives (:root), semantic light ([data-app-theme]), dark shell ([data-app-theme="dark"]), feedback colors, spacing, typography
- `src/components/Header.css` — Reference pattern for co-located token-backed CSS (Phase 5 migration example)

### Alert call sites to replace
- `src/components/HistoryPage.jsx` L35, L81 — PDF download error, session detail load error
- `src/components/TriageDetailsModal.jsx` L129 — PDF download error
- `src/components/ProtocolTriage.jsx` L401, L846 — Session start error, PDF download error

### Existing animations
- `src/index.css` — `@keyframes fadeIn` (opacity + translateY), `@keyframes typing` (dot animation), `@keyframes pulse-missing` (sensor pulse)

### Prior phase decisions
- `.planning/phases/05-design-token-foundation/05-CONTEXT.md` — Token structure (D-05..D-08), color palette decisions (D-01..D-04), scoping strategy
- `.planning/STATE.md` §Accumulated Context > Decisions — Immutable MTS colors, `[data-app-theme]` scoping, atomic migration pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fadeIn` keyframe in `index.css`: Already animates opacity 0→1 + translateY 5px→0. Can be shared as `.animate-fade-in` utility class for chat bubbles.
- Feedback color tokens in `tokens.css`: `--color-feedback-error-*`, `--color-feedback-ok-*`, `--color-feedback-warn-*` — ready for toast styling without new token work.
- Semantic tokens: `--color-primary`, `--color-surface`, `--color-text-*`, `--color-border` — Button component can use these directly.

### Established Patterns
- Co-located CSS pattern: `Header.jsx` + `Header.css` established in Phase 5 — Button and Toast follow the same structure.
- `[data-app-theme]` scoping: All semantic tokens are scoped here; new component CSS must reference semantic tokens, not primitives.
- Inline styles dominant: 255 occurrences across 7 files. Phase 6 only replaces button-related inline styles where the new Button component is adopted. Full migration is Phase 7.

### Integration Points
- `src/App.jsx`: ToastProvider wraps inside the Amplify Authenticator (toasts are for authenticated users only — all 5 alert sites are in authenticated components).
- Every file with `alert()`: Import `useToast` hook and replace `alert("msg")` with `toast.error("msg")`.
- Every file with inline-styled `<button>`: Candidates for Button component adoption, but full migration is Phase 7. Phase 6 creates the component; Phase 7 replaces all usages.

</code_context>

<deferred>
## Deferred Ideas

- Page-level route transitions (React Router animated routes) — complexity without clear clinical value; revisit if Phase 7 identifies the need.
- Additional UI primitives (Card, Input, Badge, Modal) — Phase 7 scope during full component migration.
- Toast persistence across route changes — not needed; all 5 alert sites are within single-page contexts.

</deferred>

---

*Phase: 06-ui-primitives-toast*
*Context gathered: 2026-04-07*
