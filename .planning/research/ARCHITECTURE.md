# Architecture Research

**Domain:** UI/UX overhaul of a clinical React SPA (Manchester Triage System)
**Researched:** 2026-04-07
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   ThemeProvider (Amplify UI)                     │
│   Owns: colorMode (light/dark/system), design token CSS vars     │
├─────────────────────────────────────────────────────────────────┤
│                   Authenticator (Amplify UI)                     │
│   Owns: login/signup UI — themed via ThemeProvider tokens        │
├─────────────────────────────────────────────────────────────────┤
│                   UserProvider (React Context)                   │
│   Owns: user profile, role — unchanged from v1                   │
├─────────────────────────────────────────────────────────────────┤
│                   ThemeContext (new, thin)                        │
│   Owns: colorMode toggle, localStorage persistence               │
├─────────────────────────────────────────────────────────────────┤
│                   ToastContext (new)                              │
│   Owns: toast queue, dispatch — replaces alert() calls           │
├─────────────────────────────────────────────────────────────────┤
│   ┌─────────────┐  ┌────────────────┐  ┌─────────────────────┐  │
│   │   Header    │  │ ProtocolTriage │  │  HistoryPage /       │  │
│   │  (modified) │  │  (modified)    │  │  Profile / Admin     │  │
│   └─────────────┘  └───────┬────────┘  └─────────────────────┘  │
│                            │                                      │
│              ┌─────────────┴──────────────┐                      │
│              │    src/components/ui/       │                      │
│              │  Reusable primitives        │                      │
│              │  Button, Badge, Card, Toast │                      │
│              │  ProgressBar, VoiceInput    │                      │
│              └────────────────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│                   src/styles/tokens.css                          │
│   CSS custom properties: primitives → semantic → MTS colors      │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Notes |
|-----------|----------------|-------|
| `ThemeProvider` (Amplify UI) | Wraps entire app; applies token CSS vars to `:root` | Wrap outside `Authenticator` so login screen is also themed |
| `ThemeContext` (new) | Toggle colorMode, persist to localStorage | Thin — delegates actual CSS to ThemeProvider |
| `ToastContext` (new) | Global toast queue; `addToast(msg, type)` API | Renders via `createPortal` into `document.body` |
| `src/styles/tokens.css` | Single source of truth for all CSS custom properties | Consumed by both custom components and Amplify token overrides |
| `src/components/ui/` | Primitive components built on tokens | Button, Badge, Card, ProgressBar, VoiceRecorder, Tooltip |
| `ProtocolTriage.jsx` | Core triage state machine — logic unchanged | Visuals refactored to use `ui/` primitives |

---

## Recommended Project Structure

```
src/
├── styles/
│   ├── tokens.css          # CSS custom properties (primitive + semantic + MTS)
│   ├── reset.css           # Minimal reset (move base rules out of index.css)
│   └── amplify-theme.js    # Amplify ThemeProvider theme object (references tokens)
│
├── components/
│   ├── ui/                 # New — design system primitives
│   │   ├── Button.jsx      # primary / secondary / danger variants
│   │   ├── Badge.jsx       # MTS priority badge (red/orange/yellow/green/blue)
│   │   ├── Card.jsx        # white surface with token-based shadow and radius
│   │   ├── ProgressBar.jsx # triage step indicator
│   │   ├── Toast.jsx       # single toast item
│   │   ├── ToastContainer.jsx  # portal-mounted stack of Toasts
│   │   ├── Tooltip.jsx     # contextual help for sensor labels
│   │   └── VoiceRecorder.jsx   # waveform + timer + transcript preview
│   │
│   ├── Header.jsx          # Modified — replace inline styles with tokens
│   ├── ProtocolTriage.jsx  # Modified — consume ui/ primitives, add shortcuts
│   ├── HistoryPage.jsx     # Modified — token-based layout
│   ├── TriageDetailsModal.jsx  # Modified — token-based modal
│   └── RequireAdmin.jsx    # Unchanged
│
├── contexts/
│   ├── UserContext.jsx     # Unchanged
│   ├── ThemeContext.jsx    # New — colorMode state + toggle
│   └── ToastContext.jsx    # New — toast queue + addToast
│
├── hooks/
│   └── useShortcuts.js     # New — keyboard shortcut registration hook
│
├── utils/
│   └── auth.js             # Unchanged
│
├── aws-config.js           # Unchanged
├── useTranscribe.js        # Unchanged (voice logic stays isolated)
├── App.jsx                 # Modified — add ThemeProvider + ThemeContext + ToastContext
├── App.css                 # Reduced — keep only layout classes, delete hardcoded colors
└── index.css               # Reduced — base reset only, animations kept
```

### Structure Rationale

- **`src/styles/tokens.css`**: Central CSS custom property file. All hardcoded hex values in inline styles are replaced by references to these tokens. This is the single change point for brand color updates or dark mode overrides.
- **`src/components/ui/`**: Isolated primitive library. New folder to avoid polluting the existing `components/` flat structure. Components here accept only semantic props (`variant="danger"`, not `style={{ color: '#dc3545' }}`).
- **`src/hooks/`**: New folder for non-state hooks. `useShortcuts.js` does not belong in `components/` or `utils/`.
- **`src/contexts/ThemeContext.jsx` and `ToastContext.jsx`**: Thin contexts. ThemeContext holds one value (colorMode). ToastContext holds one array and one dispatch function. Neither owns business logic.

---

## Architectural Patterns

### Pattern 1: CSS Custom Properties as the Design Token Layer

**What:** Define all design values as `--token-name` in `tokens.css`. Components reference tokens, never raw hex values. Amplify's `ThemeProvider` theme object also reads these tokens, creating a unified system.

**When to use:** Always — this is the foundation. Every new or modified component must use tokens.

**Trade-offs:** Pure CSS, zero JS runtime cost. Dark mode switches by toggling a `data-theme="dark"` attribute on `<html>`, which overrides the semantic tokens — no re-render needed. The downside is discipline: inline styles remain possible and must be actively prevented in code review.

**Token structure:**

```css
/* tokens.css */

/* 1. Primitives (raw values — not used directly in components) */
:root {
  --color-blue-600: #0d6efd;
  --color-red-600: #dc3545;
  --color-gray-50: #f8f9fa;
  /* ... */

  /* MTS priority colors — never change these */
  --mts-red: #dc3545;
  --mts-orange: #fd7e14;
  --mts-yellow: #ffc107;
  --mts-green: #198754;
  --mts-blue: #0d6efd;
}

/* 2. Semantic tokens (what components actually reference) */
:root {
  --color-surface: var(--color-gray-50);
  --color-surface-elevated: #ffffff;
  --color-text-primary: #212529;
  --color-text-secondary: #495057;
  --color-text-muted: #6c757d;
  --color-border: #dee2e6;
  --color-interactive: var(--color-blue-600);
  --color-danger: var(--color-red-600);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);
  --radius-card: 12px;
  --radius-button: 6px;
}

/* 3. Dark mode overrides (same tokens, different values) */
[data-theme="dark"] {
  --color-surface: #1a1a2e;
  --color-surface-elevated: #16213e;
  --color-text-primary: #f8f9fa;
  --color-text-secondary: #adb5bd;
  /* MTS priority colors are intentionally NOT overridden — they must remain vivid */
}
```

### Pattern 2: Amplify ThemeProvider + Custom Tokens Coexistence

**What:** Amplify UI's `ThemeProvider` maps its design token JS object to CSS custom properties namespaced under `--amplify-*`. The Authenticator login screen consumes these. Custom components consume `--triax-*` tokens from `tokens.css`. The two systems are additive — they do not conflict.

**When to use:** Wrap `ThemeProvider` outside `Authenticator` in `App.jsx` so both the login screen and the app share the same colorMode.

**Trade-offs:** Amplify's `defaultDarkModeOverride` handles the dark Authenticator automatically when `colorMode="dark"` is passed to `ThemeProvider`. You do not need to manually restyle the Authenticator for dark mode — just pipe `colorMode` from `ThemeContext` to `ThemeProvider`.

```jsx
// App.jsx — updated provider stack order
function App() {
  return (
    <ThemeContextProvider>       {/* owns colorMode state */}
      <AmplifyThemeProviderBridge> {/* reads colorMode, passes to Amplify ThemeProvider */}
        <Authenticator>
          {({ signOut }) => (
            <UserProvider>
              <ToastContextProvider>
                <AppContent signOut={signOut} />
              </ToastContextProvider>
            </UserProvider>
          )}
        </Authenticator>
      </AmplifyThemeProviderBridge>
    </ThemeContextProvider>
  );
}
```

`AmplifyThemeProviderBridge` is a small component (10 lines) that calls `useThemeContext()` and renders `<ThemeProvider theme={amplifyTheme} colorMode={colorMode}>`. This keeps `App.jsx` clean and avoids circular imports.

### Pattern 3: Toast Context via React Portal

**What:** `ToastContext` provides `addToast(message, type, duration?)` globally. `ToastContainer` is mounted once in `App.jsx` and renders via `createPortal(container, document.body)`. No external library required.

**When to use:** Replace every `alert()` call in `ProtocolTriage.jsx`, `HistoryPage.jsx`, and `Profile.jsx`. Do not use for triage logic errors that require user confirmation — those still use inline error states.

**Trade-offs:** Pure React, zero bundle cost. The portal ensures toasts render above the Authenticator overlay and any modals. Auto-dismiss timer is managed inside `ToastContext` with `setTimeout` — clean up on unmount with `useEffect` return.

### Pattern 4: Incremental Migration Strategy (Component Boundary Migration)

**What:** Never do a big-bang rewrite. Migrate one component boundary at a time. The order is: tokens → ui/ primitives → Header → ProtocolTriage → pages.

**When to use:** This is the only viable strategy for a ~3,390 LOC codebase with zero tests and live demo risk.

**Migration sequence:**

```
Phase 1 — Foundation (no visible changes):
  1. Create src/styles/tokens.css with all primitives + semantics
  2. Confirm tokens.css imported in main.jsx (before App.css)
  3. Create amplify-theme.js referencing the same tokens
  4. Wrap App.jsx with ThemeProvider + ThemeContext + ToastContext
  5. Verify Authenticator login screen still works and dark mode toggles

Phase 2 — Primitives (ui/ components built fresh):
  1. Build Button, Badge — these are used in every component
  2. Build Card — used in PatientForm and session list items
  3. Build Toast + ToastContainer — replace alert() calls
  4. Build ProgressBar — triage step indicator (new feature)
  5. Build Tooltip — sensor label contextual help

Phase 3 — Component Migration (top-down, leaf-first):
  1. Header.jsx — smallest, isolated, high visibility
  2. PatientForm (sub-component of ProtocolTriage) — extractable, no API calls
  3. Sensor sub-components (SensorLabel, PainInput, GCSInput) — pure UI
  4. ProtocolTriage main body — largest, most careful
  5. HistoryPage, Profile, AdminUsers — pages, lower risk than core triage

Phase 4 — New interactions:
  1. useShortcuts hook + keyboard bindings in ProtocolTriage
  2. VoiceRecorder component (wraps existing useTranscribe, improves UX)
  3. Dark mode toggle button in Header
  4. Progress indicator wired to triage step state
```

**Trade-offs:** Slower than a full rewrite. But each phase is deployable independently. The triage logic in `ProtocolTriage.jsx` is never touched — only its render return.

### Pattern 5: Keyboard Shortcuts via Custom Hook

**What:** A `useShortcuts(shortcuts, enabled)` hook registers/unregisters `keydown` event listeners scoped to the active context. `ProtocolTriage` calls it when a triage session is active; it deactivates when any `<input>` or `<textarea>` is focused.

**When to use:** Only for the triage flow. Number keys (1, 2, 3) for quick-reply options, `Escape` to cancel the current node. Do not add shortcuts to forms — clinicians type in patient data.

```js
// hooks/useShortcuts.js
export function useShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const action = shortcuts[e.key];
      if (action) action(e);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
```

---

## Data Flow

### Theme Toggle Flow

```
User clicks dark mode toggle (Header)
    ↓
ThemeContext.setColorMode('dark')
    ↓
localStorage.setItem('triax-color-mode', 'dark')
    ↓
document.documentElement.setAttribute('data-theme', 'dark')
    ↓
CSS custom properties in [data-theme="dark"] activate immediately
    ↓
AmplifyThemeProviderBridge re-renders with colorMode="dark"
    ↓
Amplify Authenticator dark tokens apply (login screen)
```

No React component re-renders cascade. The CSS property swap is instant.

### Toast Flow

```
Error in ProtocolTriage (e.g., /traverse fails)
    ↓
try/catch calls addToast('Erro ao avançar protocolo', 'error')
    ↓
ToastContext appends { id, message, type } to queue
    ↓
ToastContainer (portal) renders new Toast with slide-in animation
    ↓
setTimeout(3000) → removeToast(id)
    ↓
Toast slides out, removed from DOM
```

### Triage Step Progress Flow (new)

```
ProtocolTriage state: currentNode, triage step index
    ↓
ProgressBar receives { current: stepIndex, total: estimatedSteps }
    ↓
Renders token-colored bar; no state ownership in ProgressBar
```

---

## Integration Points

### Amplify Authenticator — Critical Integration

| Concern | Approach | Confidence |
|---------|----------|------------|
| Theming the login screen | Pass `theme` object + `colorMode` to `ThemeProvider` wrapping `Authenticator` | HIGH — official API |
| Dark mode on login screen | `ThemeProvider colorMode` prop + `defaultDarkModeOverride` in theme object | HIGH — official API |
| Custom CSS for login inputs | `[data-amplify-authenticator] input { ... }` attribute selector in tokens.css | MEDIUM — relies on stable Amplify HTML structure |
| Avoiding style conflicts | Amplify uses `--amplify-*` namespaced variables; custom tokens use `--triax-*` or `--color-*` | HIGH — namespaces are distinct |

`@aws-amplify/ui-react/styles.css` is already imported in `App.jsx` — keep it. Amplify's own CSS provides the structural layout for the Authenticator form; the `ThemeProvider` overrides only the token values.

### Existing Inline Styles — Migration Contract

The rule during migration: **never remove inline styles without replacing with token-based CSS.** Specifically:

| Existing pattern | Replacement |
|-----------------|-------------|
| `style={{ color: '#dc3545' }}` | `className="text-danger"` or `<Badge variant="red" />` |
| `style={{ backgroundColor: '#f8f9fa' }}` | `style={{ backgroundColor: 'var(--color-surface)' }}` (interim) or `className` |
| `onMouseEnter` color swap | CSS `:hover` rule in a `.css` file using tokens |
| `alert('...')` | `addToast('...', 'error')` |
| `style={{ boxShadow: '0 2px 8px ...' }}` | `var(--shadow-card)` |

Interim inline style with `var(--token)` is acceptable during migration. It picks up dark mode automatically and is a valid stepping stone before full class extraction.

### ProtocolTriage God Component — Decomposition

`ProtocolTriage.jsx` is ~500 LOC and contains multiple logical sub-components. The UI overhaul is the natural moment to extract them. The triage state machine stays in `ProtocolTriage.jsx` — only render logic is extracted:

| Sub-component to extract | New location | Risk |
|--------------------------|-------------|------|
| `PatientForm` | `src/components/ui/PatientForm.jsx` or keep inline | Low — no API calls, pure form |
| `PainInput` | `src/components/ui/PainInput.jsx` | Low — pure UI |
| `GCSInput` | `src/components/ui/GCSInput.jsx` | Low — pure UI |
| `SensorLabel` + tooltip | Absorb into `Tooltip.jsx` primitive | Low — pure UI |
| Sensor grid table | `src/components/SensorGrid.jsx` | Low — pure display |

The chat/traverse state (`messages`, `currentNode`, `handleTraverse`, etc.) stays in `ProtocolTriage.jsx`. Only rendering is delegated.

---

## Anti-Patterns

### Anti-Pattern 1: Big-Bang Style Rewrite

**What people do:** Delete all inline styles at once, write a new CSS file, iterate to fix breakage.
**Why it's wrong:** No test coverage means regressions are invisible until a stakeholder demo. Healthcare context makes visual regressions (wrong priority badge color) patient safety issues.
**Do this instead:** Component-boundary migration. One component at a time. Verify visually before moving on.

### Anti-Pattern 2: Tailwind or CSS-in-JS Adoption

**What people do:** Install Tailwind or styled-components to "fix" the inline style problem.
**Why it's wrong:** The constraint is no framework changes. More critically, Tailwind requires purge configuration and a full class audit across 3,390 LOC. CSS-in-JS adds SSR concerns (irrelevant here), bundle weight, and conflicts with Amplify's CSS. The token + CSS custom properties approach achieves the same outcome (theme-aware, reusable) with zero new dependencies.
**Do this instead:** CSS custom properties in `tokens.css` + utility classes in `App.css` for the few layout patterns that repeat.

### Anti-Pattern 3: ThemeContext as a Global Style State Manager

**What people do:** Store all color values in a React Context, compute styles in JS: `const { colors } = useTheme(); style={{ color: colors.danger }}`.
**Why it's wrong:** Every component re-renders on theme change. CSS custom property toggling is instant and triggers zero re-renders.
**Do this instead:** ThemeContext holds only `colorMode` string and `toggleColorMode()`. All styling is done via CSS custom properties. Context only controls which CSS class/attribute is applied to `<html>`.

### Anti-Pattern 4: Keyboard Shortcuts Without Input Guard

**What people do:** `document.addEventListener('keydown', ...)` without checking `e.target`.
**Why it's wrong:** Clinicians type patient data (name, age, complaint). Number key shortcuts fire while typing a birth date.
**Do this instead:** In `useShortcuts`, always check `e.target.tagName` — skip `INPUT`, `TEXTAREA`, `SELECT`. See Pattern 5 above.

### Anti-Pattern 5: Toast for Triage Logic Errors

**What people do:** Replace all `alert()` calls with `addToast()`, including critical triage errors.
**Why it's wrong:** A 3-second auto-dismiss toast is inappropriate for "protocolo não encontrado" — the clinician might miss it during a stressful triage. Some errors must block the flow until acknowledged.
**Do this instead:** Use toast only for background/non-blocking feedback (PDF downloaded, session saved). Use inline error states (`setError(msg)` rendered in the component) for triage-blocking errors.

---

## Scaling Considerations

This app is a pilot with a small user base. Scaling is not a current concern. The architectural decisions here are about maintainability, not scale.

| Concern | Current Approach | Notes |
|---------|-----------------|-------|
| Bundle size | No new runtime deps for design system | tokens.css is ~2KB; no Tailwind, no CSS-in-JS |
| Component complexity | Extract sub-components from ProtocolTriage | Reduces 500-LOC file to manageable pieces |
| Theme runtime | Zero-cost CSS custom property swap | No React re-render on dark mode toggle |

---

## Sources

- [Amplify UI Theming — official docs](https://ui.docs.amplify.aws/react/theming)
- [Amplify UI ThemeProvider — official docs](https://ui.docs.amplify.aws/react/theming/theme-provider)
- [Amplify UI Dark Mode — official docs](https://ui.docs.amplify.aws/react/theming/dark-mode)
- [Amplify UI CSS Variables — official docs](https://ui.docs.amplify.aws/react/theming/css-variables)
- [Amplify UI Authenticator Customization — official docs](https://ui.docs.amplify.aws/react/connected-components/authenticator/customization)
- [CSS Custom Properties for React Devs — Josh W. Comeau](https://www.joshwcomeau.com/css/css-variables-for-react-devs/)
- [Design Tokens using CSS Custom Properties — Backlight](https://backlight.dev/docs/design-tokens-using-css-custom-properties)
- [Toast Notification System: Context API vs Custom Events — Medium](https://medium.com/@megamind19/building-a-toast-notification-system-in-react-context-api-vs-custom-events-09c967fed613)
- [Keyboard Shortcut Hook — Tania Rascia](https://www.taniarascia.com/keyboard-shortcut-hook-react/)

---

*Architecture research for: Triax Prototype v2.0.0 UI/UX Overhaul*
*Researched: 2026-04-07*
