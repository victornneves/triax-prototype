# Stack Research

**Domain:** Clinical triage React SPA — UI/UX overhaul additions
**Researched:** 2026-04-07
**Confidence:** MEDIUM-HIGH (design system selection HIGH; animation/form libs MEDIUM)

---

## Context: What Already Exists (Do Not Re-research)

| Existing | Version | Status |
|----------|---------|--------|
| React | 19.2.0 | Locked — no change |
| Vite | 7.2.4 | Locked — no change |
| aws-amplify | 6.15.9 | Locked — no change |
| @aws-amplify/ui-react | 6.13.2 | Locked — Authenticator must be preserved |
| react-router-dom | 7.12.0 | Locked — no change |

This research covers ONLY new additions for the v2.0.0 UI/UX overhaul.

---

## Recommended Stack — New Additions

### Design System / Component Library

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Mantine** | 8.x (8.3.0 current) | Primary component library | 120+ components including DatePicker, NumberInput, Stepper, Notifications, Tooltip — all needed for this project. CSS Modules styling avoids CSS-in-JS runtime cost. Built-in dark mode via `useMantineColorScheme`. React 18 + 19 peer deps declared. No conflict surface with @aws-amplify/ui-react because Amplify UI uses its own CSS variable namespace (`--amplify-*`). |

**Why Mantine over alternatives:**
- **Over Chakra UI v3:** Chakra v3 switched to Panda CSS (a build-time CSS-in-JS); Mantine uses plain CSS modules which is simpler and avoids a PostCSS/build pipeline change in Vite. Chakra has ~60 components vs Mantine's 120+ — missing DatePicker and Stepper needed here.
- **Over shadcn/ui:** shadcn copies component source into your repo (good for full control) but requires Tailwind CSS — adding Tailwind to a project with 3,400 LOC of inline styles is a migration not an addition. Scope creep risk is high.
- **Over MUI (Material UI):** MUI's Material Design aesthetic conflicts with clinical branding requirements. Heavier bundle.

**Amplify UI coexistence strategy:** `@aws-amplify/ui-react` uses `--amplify-*` CSS custom properties in its own stylesheet. Mantine uses `--mantine-*` CSS variables. No namespace collision. The `Authenticator` component (login page only) stays untouched. All post-login UI migrates to Mantine components progressively. Mantine's `ThemeProvider` wraps the router, inside the `Authenticator` wrapper — no conflict.

### Dark Mode

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Mantine built-in | (bundled with Mantine) | Color scheme toggle + persistence | `useMantineColorScheme` hook + `ColorSchemeScript` inject. Persists to localStorage. No additional library needed. |
| CSS custom properties | (native CSS) | MTS priority colors + semantic tokens | Define `--color-priority-red`, `--color-priority-orange`, etc. in `:root`. These never change between modes — they are clinical constants. All other palette tokens get dark/light variants. |

**Implementation approach:** Single `data-mantine-color-scheme` attribute on `<html>` drives all color scheme changes. Mantine handles this automatically. Override Mantine's default palette with Triax clinical design tokens via `createTheme()`. MTS colors (red/orange/yellow/green/blue) stay identical in both schemes — they are safety-critical.

### Toast Notifications

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Mantine Notifications** | (bundled with @mantine/notifications) | Replace all `alert()` calls | Already included in Mantine ecosystem. No extra dep. Accessible by default. Supports success/error/warning variants. Positioned top-right by default, configurable. `notifications.show()` callable from anywhere — no hook needed at call site. |

**Why not standalone toast libs:** Since Mantine is already the design system, `@mantine/notifications` gives consistent visual language without a second library. Sonner (2.0.7) and react-hot-toast are excellent but would create visual inconsistency alongside Mantine components.

### Keyboard Shortcuts

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **react-hotkeys-hook** | 5.x (5.2.1 current) | Number key quick replies, Esc to cancel triage | Hook-based (`useHotkeys`), scoped to component focus, supports enableOnFormTags, sequential hotkeys, and scope groups. Actively maintained — v5 released 2025. React 19 compatible (peer deps `react >= 16`). 37KB unpacked. |

**Why not tinykeys:** tinykeys (~650B) is framework-agnostic and requires manual `useEffect` wiring per component. react-hotkeys-hook provides the React integration pattern already (scope isolation, form element detection, cleanup on unmount) which matters for triage flow where number keys must not fire inside text inputs.

### Animation / Micro-interactions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **motion** (fka framer-motion) | 12.x | Page transitions, priority badge reveal, voice waveform, collapsible panel | Renamed from `framer-motion` to `motion` in 2025. Import from `motion/react`. Full React 19 support confirmed. LazyMotion defers ~30KB from initial load. Use `m.*` elements + `LazyMotion` wrapper to keep first-paint bundle minimal. |

**Scope constraint:** Use motion ONLY for: (1) Stepper step transitions, (2) priority color badge entrance animation, (3) collapsible sensor panel, (4) voice recording waveform bars. Do not animate form inputs or API loading states — clinical speed matters over polish.

### Input Masking (Date / CPF)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **react-imask** | 7.x (7.6.1 current) | CPF input masking, phone number formatting | `react-input-mask` was archived December 2025 — do not use. `react-imask` is the official recommended successor per the archived repo's own notice. `useIMask` hook integrates cleanly with uncontrolled inputs. MIT license. |

**For date inputs:** Use Mantine's `DateInput` / `DatePicker` from `@mantine/dates` (backed by dayjs). Do not add a separate date picker library — Mantine's already handles locale, time zones, and accessible keyboard navigation.

### CSS Architecture (Replacing Inline Styles)

| Approach | Tooling | Why |
|----------|---------|-----|
| CSS custom properties (design tokens) | Native CSS in `src/styles/tokens.css` | Single source of truth for all colors, spacing, radii. Imported once in `main.jsx`. Zero runtime cost. Dark mode via `[data-mantine-color-scheme="dark"]` selector. |
| Mantine CSS Modules | Built into Mantine | Component-specific overrides via `classNames` prop — no global selector fights. |
| Global component styles | `src/styles/components.css` | One-time replacement for scattered inline styles per component. Scoped by `.triax-` prefix to avoid collisions with Amplify UI class names. |

**Migration strategy:** Do NOT do a big-bang inline-style removal. Replace inline styles per component at the time each component is redesigned in the UI/UX phases. Keep existing inline styles on un-touched components until their phase.

---

## Supporting Libraries (Full Install List)

```bash
# Mantine core + required packages
npm install @mantine/core @mantine/hooks @mantine/notifications @mantine/dates

# Mantine peer deps
npm install dayjs

# Keyboard shortcuts
npm install react-hotkeys-hook

# Animation
npm install motion

# Input masking (CPF, phone)
npm install react-imask

# PostCSS (required by Mantine for CSS Modules processing)
npm install -D postcss postcss-preset-mantine postcss-simple-vars
```

**Total new production deps:** 7 (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/dates`, `dayjs`, `react-hotkeys-hook`, `motion`, `react-imask`)

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **react-input-mask** | Archived December 2025, read-only, unmaintained | `react-imask` 7.x |
| **Tailwind CSS** | Adding Tailwind to 3,400 LOC of inline styles is a full rewrite, not an overhaul. Scope creep. | CSS custom properties + Mantine |
| **shadcn/ui** | Requires Tailwind (see above). Component copy-paste pattern also clashes with incremental migration strategy. | Mantine components |
| **@mantine/charts / recharts** | Recharts has React 19 peer dep warnings in Mantine 8. Not needed for this milestone. | Not needed |
| **framer-motion** (old package) | Renamed to `motion` in 2025. Still installable but the `motion` package is the maintained one. | `motion` (import `motion/react`) |
| **Standalone toast library** (Sonner, react-hot-toast) | Would create visual inconsistency with Mantine components | `@mantine/notifications` |
| **react-datepicker** | Extra dep when Mantine already ships `@mantine/dates` | `@mantine/dates` DateInput |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@mantine/core@8.x` | `react@^18 \|\| ^19` | Peer dep explicitly allows React 19 since v7.13.5+ |
| `react-hotkeys-hook@5.x` | `react >= 16` | No React 19 issues reported |
| `motion@12.x` | `react@^18 \|\| ^19` | Full React 19 support confirmed |
| `react-imask@7.x` | `react >= 16` | No React 19 issues reported |
| `@mantine/dates@8.x` | `dayjs >= 1.9` | Requires dayjs as peer dep |
| `@aws-amplify/ui-react@6.x` | All of the above | Uses `--amplify-*` CSS namespace — no collision with `--mantine-*` |

---

## Amplify UI Coexistence Detail

`@aws-amplify/ui-react` injects styles via a stylesheet with `--amplify-*` CSS custom properties. Mantine uses `--mantine-*`. No variable collision.

Amplify UI is used in exactly one place: `<Authenticator>` in `src/App.jsx` wrapping the entire authenticated app. All Mantine usage lives inside the authenticated tree. Wrap order:

```jsx
// src/App.jsx — safe nesting order
<Authenticator>  {/* Amplify — login screen only */}
  <MantineProvider theme={triaxTheme}>
    <Notifications />
    <RouterProvider router={router} />
  </MantineProvider>
</Authenticator>
```

The Authenticator renders only when the user is unauthenticated. Once logged in, only `MantineProvider`'s children render. No CSS conflict surface in the authenticated app.

**Style injection order:** Amplify UI stylesheet loads first (imported in `main.jsx`). Mantine's CSS loads after. Triax custom tokens (`tokens.css`) load last. This order ensures custom tokens override Mantine defaults where needed.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Mantine 8 | Chakra UI v3 | If team already has Chakra muscle memory and Tailwind is already in the project |
| Mantine 8 | shadcn/ui | If Tailwind is already installed and you want full component ownership (greenfield) |
| @mantine/notifications | Sonner 2.x | If NOT using Mantine as design system — Sonner is the best standalone toast |
| motion (framer-motion) | CSS transitions only | For projects where bundle size is a hard constraint — CSS transitions handle simple show/hide at zero cost |
| react-hotkeys-hook | tinykeys | If you need absolutely minimal bundle and are willing to write the React integration boilerplate manually |

---

## Sources

- Mantine v8.0.0 changelog — React 19 peer dep support confirmed — https://mantine.dev/changelog/8-0-0/
- Mantine v7.13.5 release — `react@^19` added to peer deps — https://github.com/mantinedev/mantine/releases/tag/7.13.5
- react-input-mask archived notice — recommends react-imask — https://github.com/sanniassin/react-input-mask/issues/318
- react-hotkeys-hook v5.2.1 on npm — https://www.npmjs.com/package/react-hotkeys-hook
- motion (framer-motion) upgrade guide — React 19 support, import path change — https://motion.dev/docs/react-upgrade-guide
- sonner 2.0.7 on npm — https://www.npmjs.com/package/sonner
- Amplify UI CSS Variables docs — https://ui.docs.amplify.aws/react/theming/css-variables
- Amplify UI ThemeProvider docs — https://ui.docs.amplify.aws/react/theming/theme-provider
- shadcn/ui React 19 docs — https://ui.shadcn.com/docs/react-19
- LogRocket React toast comparison 2025 — https://blog.logrocket.com/react-toast-libraries-compared-2025/
- Makers Den React UI libs 2025 comparison — https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra

---

*Stack research for: Triax Prototype v2.0.0 UI/UX Overhaul*
*Researched: 2026-04-07*
