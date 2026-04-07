# Phase 6: UI Primitives + Toast System — Research

**Researched:** 2026-04-07
**Domain:** React custom toast system, button component API, CSS animation patterns
**Confidence:** HIGH — all decisions locked in CONTEXT.md; this research validates implementation patterns against the existing codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Toast system design**
- D-01: Custom-built toast — no external library. Simple error/success banner for 5 call sites.
- D-02: Position: top-right, offset below Header (64px height).
- D-03: Auto-dismiss after 8 seconds minimum. Manual close button (X) always visible.
- D-04: Stack up to 3 visible toasts; oldest auto-dismissed when 4th arrives.
- D-05: Toast types: `error`, `success`, `info`. Error = `--color-feedback-error-*` tokens, success = `--color-feedback-ok-*`, info = `--color-primary`. None overlap with MTS clinical colors.
- D-06: `role="alert"` + `aria-live="assertive"` on error toasts. Success/info use `aria-live="polite"`.
- D-07: Toast must pass contrast in both `[data-app-theme]` (light) and `[data-app-theme="dark"]` environments.
- D-08: React Context-based `ToastProvider` wrapping the app — `useToast()` hook, no prop drilling.
- D-09: All 5 existing `alert()` call sites replaced 1:1 — same PT-BR messages, same trigger conditions.

**Button component API**
- D-10: Three variants: `primary` (teal — `--color-primary`), `secondary` (gray outline — `--color-border`), `danger` (muted red — `--color-feedback-error-text`, NOT `--mts-red`).
- D-11: Two sizes: `sm` and `md` (default). No `lg`.
- D-12: Props: `variant`, `size`, `disabled`, `loading`, `onClick`, `children`, `type`, `className`. Loading shows spinner + disables.
- D-13: All button styles use design tokens — no hardcoded hex values.

**Animation approach**
- D-14: CSS-only transitions and `@keyframes` — no animation library.
- D-15: Toast entrance: slide-in from right + fade <=250ms. Exit: fade-out <=200ms.
- D-16: Chat bubbles: extend existing `fadeIn` keyframe from `index.css`. Apply via `.animate-fade-in` utility class.
- D-17: Page-level route transitions are NOT in scope.

**Component library scope**
- D-18: Phase 6 delivers exactly two primitives: `Button` and `Toast`/`Toaster`.
- D-19: File structure: `src/components/ui/Button.jsx`, `src/components/ui/Button.css`, `src/components/ui/Toast.jsx`, `src/components/ui/Toast.css`, `src/components/ui/ToastProvider.jsx`.

### Claude's Discretion
- Toast animation timing curves (ease-out vs cubic-bezier)
- Exact spinner implementation for button loading state
- Toast z-index value (must be above Header)
- Whether to add `--color-danger` and `--color-success` semantic tokens to `tokens.css` or reuse existing feedback tokens directly
- Exact border-radius and padding values for Button/Toast

### Deferred Ideas (OUT OF SCOPE)
- Page-level route transitions (React Router animated routes)
- Additional UI primitives (Card, Input, Badge, Modal) — Phase 7 scope
- Toast persistence across route changes
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-04 | All buttons use unified variant system (primary, secondary, danger) from shared component | Button.jsx + Button.css with token-backed variants; adoption limited to new Button component — existing inline-styled buttons NOT migrated in Phase 6 |
| INTR-01 | All error feedback uses accessible toast notifications (role="alert", 8s minimum dismiss) instead of alert() | ToastProvider + useToast hook; 5 specific alert() sites identified in codebase |
| INTR-04 | UI transitions use subtle animations (<300ms) for chat bubbles, page transitions, and feedback states | CSS @keyframes; extends existing fadeIn; chat bubble wrapper gets .animate-fade-in; page transitions deferred (D-17) |
</phase_requirements>

---

## Summary

Phase 6 builds three things: a React Context-based toast notification system, a shared Button component, and a CSS animation utility for chat bubbles. All decisions are locked. The implementation is CSS-first, no external libraries.

The existing codebase provides a solid foundation: `tokens.css` has all required feedback and semantic color tokens, `index.css` has a `fadeIn` keyframe ready for reuse, and `UserContext.jsx` is the exact pattern for `ToastProvider`. The Header component is 64px tall (established in `Header.css`), which determines the toast `top` offset.

The five `alert()` call sites are all in authenticated components (`HistoryPage.jsx` L35/L81, `TriageDetailsModal.jsx` L129, `ProtocolTriage.jsx` L401/L846), so `ToastProvider` wraps inside the Amplify `Authenticator` but outside `BrowserRouter`. No page-level route transitions are required (D-17 deferred).

**Primary recommendation:** Follow `UserContext.jsx` exactly as the `ToastProvider` pattern. Use CSS `@keyframes` with `translateX` for toast slide-in and `opacity` for exit. Add `.animate-fade-in` to `index.css` as a utility class backed by the existing `fadeIn` keyframe. The `src/components/ui/` directory does not exist yet — create it.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 (project) | Context API for ToastProvider, useState for toast queue | Already in project — no new dependency |
| CSS Custom Properties | native | Token-backed Button/Toast styles | Phase 5 established this as project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None (CSS only) | — | Animations via @keyframes | D-14 locked; CSS is sufficient for 3 simple animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom toast | react-hot-toast 2.x | Would work but D-01 locked it out; 5 call sites don't justify the dependency |
| CSS @keyframes | Framer Motion | D-14 locked CSS-only; framer-motion adds ~40KB for animations achievable in 10 lines of CSS |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── ui/                    # New in Phase 6
│       ├── Button.jsx          # Shared button primitive
│       ├── Button.css          # Token-backed button styles
│       ├── Toast.jsx           # Individual toast + Toaster container
│       ├── Toast.css           # Toast animations and layout
│       └── ToastProvider.jsx   # Context + useToast hook
├── contexts/
│   └── UserContext.jsx         # Reference pattern for ToastProvider
└── index.css                   # Add .animate-fade-in utility class here
```

### Pattern 1: ToastProvider (mirrors UserContext.jsx exactly)

**What:** React Context that holds a toast queue in state. Exposes `useToast()` hook. Components call `toast.error("msg")`, `toast.success("msg")`, `toast.info("msg")`.

**When to use:** Wrap once in `App.jsx` inside `Authenticator` but outside `BrowserRouter` — toasts are per-session, not per-route.

**Example:**
```jsx
// src/components/ui/ToastProvider.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toaster } from './Toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      // D-04: max 3 visible — drop oldest if at limit
      const next = prev.length >= 3 ? prev.slice(1) : prev;
      return [...next, { id, type, message }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    error: (msg) => addToast('error', msg),
    success: (msg) => addToast('success', msg),
    info: (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
```

### Pattern 2: App.jsx integration point

**What:** `ToastProvider` wraps `UserProvider` + `AppContent`. This placement means toasts work in all authenticated views.

**Example:**
```jsx
// src/App.jsx — updated wrapper order
function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <ToastProvider>
          <UserProvider>
            <AppContent signOut={signOut} />
          </UserProvider>
        </ToastProvider>
      )}
    </Authenticator>
  );
}
```

**Important:** `ToastProvider` must be OUTSIDE `BrowserRouter` so the `Toaster` component is not remounted on route changes. The `Toaster` renders a fixed-position div that sits above the router.

### Pattern 3: Toast auto-dismiss with cleanup

**What:** Each toast sets a `setTimeout` for 8000ms (D-03). When the component unmounts or the toast is manually dismissed, the timeout is cleared to prevent memory leaks.

**Example:**
```jsx
// src/components/ui/Toast.jsx — individual toast item
import { useEffect } from 'react';

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 8000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`toast toast--${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  );
}
```

### Pattern 4: CSS animation — toast slide-in from right

**What:** Toast enters from the right with opacity fade. Uses `@keyframes` in `Toast.css`. Exit is handled by a CSS class toggled before DOM removal — but since we remove items from state immediately on dismiss, use a fade-out only (no DOM delay needed for this simple case).

**Example:**
```css
/* Toast.css */
@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast {
  animation: toast-enter 250ms ease-out forwards;
}
```

**Note on exit animation:** True CSS exit animations on removed DOM nodes require either:
1. A delayed state removal (set `exiting` flag → wait for animation → remove from array), or
2. The Web Animations API, or
3. An animation library.

For simplicity and alignment with D-14 (CSS-only), implement entry animation only. On dismiss, the element removes immediately with no exit animation. This matches VS Code/Linear "slim banner" aesthetic described in CONTEXT.md specifics.

If exit animation is desired without a library: use the `exiting` flag pattern — add `exiting: true` to the toast object, apply `.toast--exiting { animation: toast-exit 200ms... }`, then `setTimeout(removeToast, 200)`.

### Pattern 5: Button component with CSS BEM

**What:** Single Button.jsx renders a `<button>` element. CSS classes are composed from `variant` and `size` props. Loading state adds a spinner via `::after` pseudo-element or an inline SVG.

**Example:**
```jsx
// src/components/ui/Button.jsx
import './Button.css';

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${loading ? ' btn--loading' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
```

### Pattern 6: .animate-fade-in utility class in index.css

**What:** The existing `fadeIn` keyframe in `index.css` already animates `opacity 0→1 + translateY 5px→0`. Add a utility class that applies it. Chat bubble wrapper `<div>` in ProtocolTriage gets `className="animate-fade-in"` added to its existing inline styles.

**Example:**
```css
/* index.css — add after existing @keyframes fadeIn */
.animate-fade-in {
  animation: fadeIn 200ms ease-out forwards;
}
```

**ProtocolTriage usage:** The message `<div key={idx}>` wrapper at L1104 currently has only inline styles. Add `className="animate-fade-in"` to it. No structural change needed — just the class addition.

### Anti-Patterns to Avoid

- **Rendering Toaster inside BrowserRouter:** If `Toaster` is inside a `<Route>`, it unmounts on navigation, killing active toasts. Place it above the router.
- **Using MTS colors for Button danger variant:** `--mts-red` is reserved for clinical priority indicators. Danger buttons must use `--color-feedback-error-text` (`#991b1b`).
- **Hardcoded hex values in Button.css or Toast.css:** All colors must reference semantic tokens from `[data-app-theme]`. Failure to do so breaks dark mode compatibility (D-07).
- **Forgetting `aria-live` on the toast container:** The `aria-live` attribute must be on the container element that exists in the DOM before toasts appear — not on the dynamically inserted toast item — for some screen readers. The safest approach: put `aria-live` on the `Toaster` wrapper div AND on each individual `ToastItem`.
- **Timer leak on rapid dismiss:** Each `ToastItem` must clear its timer in the `useEffect` cleanup. Missing cleanup causes `setState` on unmounted components.
- **z-index below Header:** Header uses no explicit z-index in `Header.css` (default `auto`), but the fixed toast container still needs a high z-index (e.g., `1100`) to render above potential modal overlays (`TriageDetailsModal` uses z-index `1000`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS animation exit on removed nodes | Custom React animation state machine | Simple `exiting` flag + setTimeout, OR skip exit animation | Exit animations on removing DOM nodes need choreography — the complexity is manageable with a single flag approach |
| Button loading spinner | Custom SVG spinner | CSS border-spin trick via `::after` pseudo-element | 3 lines of CSS, no markup overhead |
| Toast position relative to Header | JS-calculated `top` offset | CSS `top: calc(64px + 1rem)` hardcoded | Header height is a known constant (64px from `Header.css`); no dynamic measurement needed |

**Key insight:** The hardest part of a custom toast system is the exit animation (animating elements being removed from the DOM). All other pieces are straightforward. Given D-14 (CSS-only), either skip exit animation or use the `exiting` flag pattern — do not attempt CSS-only keyframe exit without the flag pattern.

---

## Common Pitfalls

### Pitfall 1: aria-live on dynamically inserted elements
**What goes wrong:** `aria-live="assertive"` placed only on the toast `<div>` that is dynamically inserted into the DOM. Some screen readers (NVDA, JAWS) only announce content added to a live region that was already present in the DOM when the page loaded.
**Why it happens:** Developers assume `aria-live` works on the element itself when it's added to the DOM.
**How to avoid:** The `Toaster` container div must be rendered unconditionally in the DOM (even when empty), with `aria-live` on it or on a stable wrapper. Each `ToastItem` can reinforce with its own `role="alert"` / `role="status"`.
**Warning signs:** Toast appears visually but screen reader does not announce it.

### Pitfall 2: Dark mode token gaps
**What goes wrong:** Toast or Button CSS uses feedback color primitives directly (e.g., `--color-feedback-error-bg: #fef2f2`) instead of semantic tokens. This works in light mode but has no dark override.
**Why it happens:** Feedback color primitives are on `:root`, not `[data-app-theme]`, so they appear to "just work" — but in dark mode they remain light-mode colors.
**How to avoid:** Check `tokens.css` — feedback colors (`--color-feedback-error-bg`, `--color-feedback-error-text`, `--color-feedback-ok-*`) are on `:root` as primitives. The semantic layer maps `--color-error-bg` and `--color-error-text` on `[data-app-theme]`. Toast CSS must reference `--color-error-bg` / `--color-error-text` (semantic), not the `--color-feedback-*` primitives directly.

**Current token situation (verified from tokens.css):**
- `--color-error-bg` → `var(--color-feedback-error-bg)` — exists on `[data-app-theme]` light
- `--color-error-text` → `var(--color-feedback-error-text)` — exists on `[data-app-theme]` light
- Dark mode `[data-app-theme="dark"]` does NOT define `--color-error-bg` or `--color-error-text` overrides yet

**Action required (Claude's Discretion):** Either add dark-mode overrides for `--color-error-bg`/`--color-error-text` to the dark shell in `tokens.css`, or add `--color-toast-error-bg` and `--color-toast-error-text` as new semantic tokens with both light and dark values. Same decision needed for success/info toast colors. Recommend adding semantic toast tokens with dark-mode overrides since they're specific to the component.

### Pitfall 3: ToastProvider placement causes BrowserRouter remount of Toaster
**What goes wrong:** `ToastProvider` placed inside `BrowserRouter`, causing `Toaster` (fixed-position container) to unmount/remount on navigation, dismissing active toasts.
**Why it happens:** Natural instinct to co-locate providers with the components that need them.
**How to avoid:** In `App.jsx`, `ToastProvider` wraps `UserProvider` which wraps `AppContent` which contains `BrowserRouter`. All 5 `alert()` sites are in authenticated views within `AppContent`. Toasts survive route changes since the provider and Toaster are above the router. See Pattern 2 above.

### Pitfall 4: Button loading state doesn't prevent double-submit
**What goes wrong:** `loading` prop visually shows spinner but doesn't prevent `onClick` from firing if someone clicks again quickly before state updates.
**Why it happens:** The `disabled` prop must also be set when `loading` is true.
**How to avoid:** In `Button.jsx`, `disabled={disabled || loading}` — always enforce this. All 5 alert() call sites already use `loading` booleans to prevent duplicate API calls; the Button component must honor this contract.

### Pitfall 5: animate-fade-in applied to message wrapper breaks scroll position
**What goes wrong:** Adding `translateY` animation to chat bubble wrapper causes layout shift during animation, pushing other messages down and disrupting the auto-scroll behavior (L354: `scrollIntoView`).
**Why it happens:** `translateY` in the `fadeIn` animation moves the element 5px during the animation, which can jitter other elements during paint.
**How to avoid:** The existing `fadeIn` uses `translateY(5px)→0` which is minimal. Verify that `will-change: opacity, transform` or `translateZ(0)` on the animated element promotes it to its own compositor layer, preventing layout jitter. Alternatively, simplify the chat bubble animation to `opacity` only (no translateY) to guarantee no layout impact.

---

## Code Examples

Verified patterns from codebase audit:

### Alert call sites — exact replacement map

| File | Line | Current | Replacement |
|------|------|---------|-------------|
| `src/components/HistoryPage.jsx` | 35 | `alert("Erro ao gerar PDF. Tente novamente.")` | `toast.error("Erro ao gerar PDF. Tente novamente.")` |
| `src/components/HistoryPage.jsx` | 81 | `alert("Erro ao carregar detalhes da sessão.")` | `toast.error("Erro ao carregar detalhes da sessão.")` |
| `src/components/TriageDetailsModal.jsx` | 129 | `alert("Erro ao gerar PDF. Tente novamente.")` | `toast.error("Erro ao gerar PDF. Tente novamente.")` |
| `src/components/ProtocolTriage.jsx` | 401 | `alert("Erro ao iniciar sessão. Tente novamente.")` | `toast.error("Erro ao iniciar sessão. Tente novamente.")` |
| `src/components/ProtocolTriage.jsx` | 846 | `alert("Erro ao gerar PDF. Tente novamente.")` | `toast.error("Erro ao gerar PDF. Tente novamente.")` |

### Token reference for Button variants
```css
/* Button.css */
.btn--primary {
  background-color: var(--color-primary);       /* teal-500 in light, teal-400 in dark */
  color: var(--color-primary-text);             /* always #ffffff */
  border-color: transparent;
}
.btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover); /* teal-600 in light, teal-300 in dark */
}

.btn--secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border);            /* gray-200 in light, gray-700 in dark */
}
.btn--secondary:hover:not(:disabled) {
  background-color: var(--color-surface-muted);
  border-color: var(--color-border-strong);
}

.btn--danger {
  background-color: transparent;
  color: var(--color-error-text);               /* #991b1b — NOT --mts-red */
  border-color: var(--color-error-text);
}
.btn--danger:hover:not(:disabled) {
  background-color: var(--color-error-bg);
}
```

### CSS spinner for button loading state
```css
/* Button.css */
.btn--loading {
  position: relative;
  color: transparent; /* hide text while loading */
}

.btn--loading::after {
  content: '';
  position: absolute;
  width: 1em;
  height: 1em;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

Note: `currentColor` on loading state inherits the button's text color. For `btn--primary` (white text), this shows white spinner on teal — correct. For `btn--secondary` (gray text), this shows gray spinner on transparent — correct.

### Toast container positioning
```css
/* Toast.css */
.toaster {
  position: fixed;
  top: calc(64px + var(--spacing-md)); /* 64px = Header height from Header.css */
  right: var(--spacing-md);
  z-index: 1100;  /* above TriageDetailsModal z-index:1000 */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  pointer-events: none; /* clicks pass through empty toaster area */
  max-width: 360px;
  width: calc(100vw - 2 * var(--spacing-md));
}

.toast {
  pointer-events: all; /* re-enable on actual toast items */
  /* ... */
}
```

### Chat bubble animation addition (ProtocolTriage.jsx)
```jsx
// Current (L1103-1124) — wrapper div:
<div key={idx} style={{
  display: 'flex',
  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
  marginBottom: '1rem'
}}>

// After Phase 6 change — add className only:
<div key={idx} className="animate-fade-in" style={{
  display: 'flex',
  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
  marginBottom: '1rem'
}}>
```

This is a minimal, safe change — one attribute added, no structural modification.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.alert()` for errors | Toast notifications with role="alert" | WCAG 2.1 (2018) | `alert()` is synchronous, blocking, inaccessible — not suitable for clinical interfaces |
| Per-component inline button styles | Shared Button component with design tokens | Design system maturity | 255+ inline button occurrences become composable variants |
| No animation | CSS @keyframes utility classes | React 16+ era | Minimal animation without runtime overhead |

**Deprecated/outdated:**
- `window.alert()`: Blocks JS execution, not announced properly by all screen readers as a live region, breaks automated testing. WCAG 2.1 SC 4.1.3 requires status messages without focus change.

---

## Open Questions

1. **Toast dark mode tokens — add new or reuse existing?**
   - What we know: `--color-error-bg`/`--color-error-text` exist in light semantic layer but dark shell has no override. Feedback primitive colors are light-mode values.
   - What's unclear: Whether Phase 8 dark mode will handle these retroactively or Phase 6 must handle them proactively.
   - Recommendation: Add `--color-toast-error-bg`, `--color-toast-error-text`, `--color-toast-ok-bg`, `--color-toast-ok-text`, `--color-toast-info-bg`, `--color-toast-info-text` to both `[data-app-theme]` and `[data-app-theme="dark"]` in `tokens.css`. This is additive, non-breaking, and aligns with D-07 (must pass contrast in both environments). Dark values should use slightly elevated surface colors (e.g., error dark: bg `#450a0a`, text `#fca5a5`).

2. **Exit animation: implement or skip?**
   - What we know: D-15 specifies toast exit as "fade-out 200ms". D-14 requires CSS-only.
   - What's unclear: CSS-only exit animation on removed DOM nodes requires `exiting` flag + setTimeout coordination.
   - Recommendation: Implement the `exiting` flag pattern. It is ~10 lines of extra state logic per toast item and cleanly achieves D-15. Skip only if planner judges complexity too high relative to value.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — zero test coverage is a documented project constraint (REQUIREMENTS.md Out of Scope) |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

**Note:** REQUIREMENTS.md explicitly defers test suite to a future milestone. nyquist_validation is enabled in config.json but no test infrastructure exists or is being added in Phase 6.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSGN-04 | Button renders with correct variant class | unit | N/A — no test framework | ❌ deferred |
| INTR-01 | useToast() triggers toast; auto-dismisses after 8s | unit | N/A — no test framework | ❌ deferred |
| INTR-04 | Chat bubbles have animate-fade-in class | visual | N/A | ❌ deferred |

### Sampling Rate
- **Per task commit:** Manual browser verification — dev server `npm run dev`, visual confirm
- **Per wave merge:** Same
- **Phase gate:** Manual UAT per VERIFICATION.md (pattern from Phase 5)

### Wave 0 Gaps
None scheduled — project has zero test coverage by design. All verification is manual/visual.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase audit: `src/styles/tokens.css`, `src/index.css`, `src/App.jsx`, `src/contexts/UserContext.jsx`, `src/components/Header.css`
- Direct codebase audit: `src/components/HistoryPage.jsx`, `src/components/TriageDetailsModal.jsx`, `src/components/ProtocolTriage.jsx` — all 5 alert() sites verified at exact line numbers
- `.planning/phases/06-ui-primitives-toast/06-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- WCAG 2.1 SC 4.1.3 (Status Messages) — role="alert" and aria-live requirements for toast systems
- MDN Web Docs — CSS @keyframes, animation property, `aria-live` attribute behavior

### Tertiary (LOW confidence — needs validation)
- Screen reader behavior with dynamically inserted aria-live regions: NVDA/JAWS quirk (aria-live container must pre-exist in DOM). Cited from known accessibility community consensus; not verified against current NVDA/JAWS release notes.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new dependencies
- Architecture: HIGH — ToastProvider pattern directly mirrors existing UserContext.jsx
- Token mapping: HIGH — verified against actual tokens.css
- Alert call sites: HIGH — line numbers verified by direct file read
- Dark mode token gaps: MEDIUM — identified gap in tokens.css, recommended solution is additive
- Screen reader aria-live behavior: LOW — known community pattern, not verified against current assistive tech versions

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain; React 19 Context API is not changing)
