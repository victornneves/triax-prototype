# Phase 5: Design Token Foundation - Research

**Researched:** 2026-04-07
**Domain:** CSS Custom Properties / Design Tokens / Amplify UI coexistence
**Confidence:** HIGH

## Summary

Phase 5 introduces a two-layer CSS custom property token system into a React 19 + Vite SPA that currently uses exclusively inline styles and a handful of global CSS classes. The token file (`src/styles/tokens.css`) defines primitive values and semantic aliases, with `--mts-*` clinical priority colors locked to their exact v1.1.0 hex values. The Amplify Authenticator uses its own `--amplify-*` namespaced CSS custom properties scoped to `[data-amplify-theme]`, so there is zero risk of collision as long as the project uses a different prefix (`--mts-*`, `--color-*`, `--spacing-*`, etc.).

The Header.jsx migration proves the token pattern: inline styles are extracted to a co-located `Header.css` file that references semantic tokens. The `[data-app-theme]` selector scopes the app's CSS reset and token overrides, ensuring nothing bleeds into the Amplify login screen. A blocking `<script>` in `index.html` sets `[data-app-theme]` before React mounts to prevent a flash of unstyled content.

**Primary recommendation:** Define tokens in `src/styles/tokens.css` on `:root` (primitives) and `[data-app-theme]` (semantic overrides + dark shell), import it first in `src/App.jsx` before `App.css`, and migrate Header.jsx inline styles to a co-located CSS file using semantic token references.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Warm-professional aesthetic — slightly warm grays, soft teal accents, approachable without being playful (think Notion/Linear mood, not hospital-sterile)
- **D-02:** Soft teal as primary action color (buttons, links, active states), replacing Bootstrap blue `#0d6efd`
- **D-03:** Neutral surround for MTS priority colors — cards and backgrounds stay warm gray/white so priority badges are the only saturated elements on screen
- **D-04:** UI feedback states (error, warning, success) use separate muted variants distinct from MTS clinical colors — no ambiguity between "form validation error" and "MTS red priority"
- **D-05:** Two-layer system: primitives (raw values like `--color-teal-500`) and semantics (intent like `--color-primary: var(--color-teal-500)`). No component-level token layer.
- **D-06:** Include both light and dark mode shells — light with final values, dark (`[data-theme="dark"]`) with placeholder/estimated values. Toggle doesn't ship until Phase 8, but structure is ready.
- **D-07:** Tokens cover colors, spacing (`--spacing-xs` through `--spacing-xl`), and typography (`--font-size-sm/md/lg`). Complete foundation, not color-only.
- **D-08:** Single file at `src/styles/tokens.css` — no splitting by concern.
- **D-09:** Header.jsx is the migration target — high visibility (every page), isolated from triage logic, moderate complexity (23 inline color references)
- **D-10:** Full CSS extraction — Header's inline styles move to co-located `src/components/Header.css` with token-backed classes. Sets the reference pattern for Phase 7 migration.
- **D-11:** Light visual refresh of Header using the new warm-professional palette (soft teal primary, warm grays). Not pixel-identical to v1.1.0, but a deliberate, polished application of the new design direction.

From STATE.md §Accumulated Context > Decisions:
- MTS priority colors (`--mts-*`) are immutable — never aliased or softened; yellow requires `--mts-yellow-text: #000000` companion token
- CSS resets scoped to `[data-app-theme]` to prevent Amplify Authenticator breakage
- Inline style migration is atomic per file — never mix inline styles and token classes in the same file

### Claude's Discretion
- Specific teal/gray hex values for the palette
- Token naming conventions (prefix scheme, scale numbering)
- Dark mode placeholder values
- Spacing and typography scale values
- How to structure the `[data-app-theme]` scoping alongside Amplify styles
- FOUC-prevention script implementation details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-01 | App uses CSS custom property design tokens with immutable `--mts-*` clinical color namespace | Token file structure, primitive/semantic layering, `--mts-*` preservation pattern documented below |
| DSGN-02 | Non-clinical UI uses soft color palette (muted greens/blues) replacing Bootstrap hex values | Warm-professional teal palette, semantic token naming, Header migration pattern documented below |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native CSS custom properties | N/A (browser-native) | Token storage and cascade | No build step, live updates, 97%+ browser support |
| CSS `@import` / Vite module resolution | N/A | Load order control | `tokens.css` imported first guarantees cascade priority |

No new npm packages required for this phase. Token infrastructure is pure CSS.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@aws-amplify/ui-react` | 6.13.2 (already installed) | Authenticator component — uses `--amplify-*` namespace | Verify coexistence only; no changes to Amplify config |

**Installation:** No new packages — this phase is infrastructure only.

## Architecture Patterns

### Recommended File Structure
```
src/
├── styles/
│   └── tokens.css          # NEW — single source of truth for all tokens
├── components/
│   ├── Header.jsx           # Modified — inline styles removed
│   └── Header.css           # NEW — co-located CSS using token classes
├── App.jsx                  # Modified — import tokens.css before App.css
├── App.css                  # Modified — .priority-* classes updated to use --mts-* tokens
└── index.css                # Modified — :root cleaned of Vite defaults, replaced by token declarations

index.html                   # Modified — FOUC-prevention blocking script added
```

### Pattern 1: Two-Layer Token Structure in tokens.css

**What:** Primitive layer defines raw named values. Semantic layer maps intent to primitives. Both live in a single file.

**When to use:** Always. Primitives enable palette-level changes; semantics decouple component code from raw values.

**Example:**
```css
/* Source: CSS custom properties best practice — verified by MDN + multiple 2025 guides */

/* ===== PRIMITIVE LAYER ===== */
:root {
  /* Teal scale */
  --color-teal-300: #5eead4;
  --color-teal-400: #2dd4bf;
  --color-teal-500: #14b8a6;
  --color-teal-600: #0d9488;
  --color-teal-700: #0f766e;

  /* Warm gray scale */
  --color-gray-50:  #fafaf9;
  --color-gray-100: #f5f5f4;
  --color-gray-200: #e7e5e4;
  --color-gray-300: #d6d3d1;
  --color-gray-400: #a8a29e;
  --color-gray-500: #78716c;
  --color-gray-600: #57534e;
  --color-gray-700: #44403c;
  --color-gray-800: #292524;
  --color-gray-900: #1c1917;

  /* Muted feedback (DISTINCT from MTS clinical colors) */
  --color-feedback-error-bg:   #fef2f2;
  --color-feedback-error-text: #991b1b;
  --color-feedback-warn-bg:    #fffbeb;
  --color-feedback-warn-text:  #92400e;
  --color-feedback-ok-bg:      #f0fdf4;
  --color-feedback-ok-text:    #166534;

  /* MTS clinical colors — IMMUTABLE, byte-for-byte from v1.1.0 */
  --mts-red:          #dc3545;
  --mts-orange:       #fd7e14;
  --mts-yellow:       #ffc107;
  --mts-yellow-text:  #000000;   /* companion: yellow badge always needs black text */
  --mts-green:        #28a745;
  --mts-blue:         #007bff;

  /* Spacing */
  --spacing-xs:  0.25rem;
  --spacing-sm:  0.5rem;
  --spacing-md:  1rem;
  --spacing-lg:  1.5rem;
  --spacing-xl:  2rem;
  --spacing-2xl: 3rem;

  /* Typography */
  --font-size-sm:  0.85rem;
  --font-size-md:  1rem;
  --font-size-lg:  1.125rem;
  --font-size-xl:  1.25rem;
  --font-size-2xl: 1.5rem;
}

/* ===== SEMANTIC LAYER (light mode) — scoped to app container ===== */
[data-app-theme] {
  --color-primary:           var(--color-teal-500);
  --color-primary-hover:     var(--color-teal-600);
  --color-primary-text:      #ffffff;

  --color-surface:           #ffffff;
  --color-surface-subtle:    var(--color-gray-50);
  --color-surface-muted:     var(--color-gray-100);

  --color-border:            var(--color-gray-200);
  --color-border-strong:     var(--color-gray-300);

  --color-text-primary:      var(--color-gray-900);
  --color-text-secondary:    var(--color-gray-600);
  --color-text-muted:        var(--color-gray-400);

  --color-nav-bg:            var(--color-gray-100);
  --color-nav-bg-hover:      var(--color-gray-200);
  --color-nav-text:          var(--color-gray-600);
  --color-nav-text-hover:    var(--color-gray-800);

  --color-header-bg:         var(--color-surface);
  --color-header-border:     var(--color-border);

  --color-error-bg:          var(--color-feedback-error-bg);
  --color-error-text:        var(--color-feedback-error-text);
}

/* ===== DARK MODE SHELL (placeholder values — toggle ships Phase 8) ===== */
[data-app-theme="dark"] {
  --color-surface:           var(--color-gray-900);
  --color-surface-subtle:    var(--color-gray-800);
  --color-surface-muted:     var(--color-gray-700);
  --color-border:            var(--color-gray-700);
  --color-border-strong:     var(--color-gray-600);
  --color-text-primary:      var(--color-gray-50);
  --color-text-secondary:    var(--color-gray-300);
  --color-text-muted:        var(--color-gray-500);
  --color-header-bg:         var(--color-gray-900);
  --color-header-border:     var(--color-gray-700);
  --color-nav-bg:            var(--color-gray-800);
  --color-nav-bg-hover:      var(--color-gray-700);
  --color-nav-text:          var(--color-gray-300);
  --color-nav-text-hover:    var(--color-gray-100);
  /* MTS colors unchanged in dark mode — clinical meaning is sacrosanct */
}
```

### Pattern 2: Amplify Coexistence via Namespace Separation

**What:** Amplify UI uses exclusively `--amplify-*` CSS custom properties, scoped to `[data-amplify-theme]`. The project tokens use `--mts-*`, `--color-*`, `--spacing-*`, `--font-size-*` — no overlap possible.

**When to use:** Always. The namespaces are orthogonal.

**Key constraint:** The CSS reset and token semantic layer must be scoped to `[data-app-theme]` (the app shell div), NOT to `:root`. Scoping to `:root` would affect the Amplify login page (which renders before the app shell). Primitives on `:root` are safe because they are passive values.

**Evidence:** Amplify UI docs confirm all its variables use `--amplify-` prefix exclusively. Source: https://ui.docs.amplify.aws/react/theming

**Where `[data-app-theme]` is set:** The `app-container` div in `App.jsx` gets `data-app-theme="light"` (default). The FOUC script in `index.html` sets it on `<html>` before React mounts if a persisted preference exists.

### Pattern 3: `[data-app-theme]` Attribute Placement

**What:** A `data-app-theme` attribute is used instead of a class to scope the design system, avoiding conflicts with Amplify's own attribute (`data-amplify-theme`).

**Implementation in App.jsx:**
```jsx
// The app-container div gains data-app-theme
<div className="app-container" data-app-theme="light" style={{ ... }}>
```

The FOUC prevention script (index.html) runs before React and sets the attribute on `document.documentElement` (html tag) as a fallback, so CSS works even during initial paint.

### Pattern 4: FOUC Prevention (Blocking Script)

**What:** A synchronous inline `<script>` in `index.html` reads `localStorage` and immediately sets the theme attribute before the browser parses any CSS. This prevents a flash from wrong theme on page load.

**When to use:** Required because localStorage is client-side only and React hasn't hydrated yet.

**Example:**
```html
<!-- Source: Established pattern — verified by multiple 2025 blog posts on FOUC prevention -->
<!-- index.html, inside <head>, BEFORE any stylesheet links -->
<script>
  (function() {
    try {
      var theme = localStorage.getItem('triax-theme') || 'light';
      document.documentElement.setAttribute('data-app-theme', theme);
    } catch (e) {
      document.documentElement.setAttribute('data-app-theme', 'light');
    }
  })();
</script>
```

This is a Phase 5 stub (always sets light). Phase 8 adds actual dark mode toggle logic.

### Pattern 5: Header.jsx Migration Pattern

**What:** All inline `style={{}}` props removed. Equivalent CSS classes defined in co-located `Header.css` using token references.

**Rule from STATE.md:** Migration is atomic — no file may mix inline styles with token classes. The entire file converts at once.

**Example — before (inline):**
```jsx
<header className="app-header" style={{
  height: '64px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e9ecef',
  ...
}}>
```

**Example — after (token-backed class):**
```css
/* Header.css */
.app-header {
  height: 64px;
  background-color: var(--color-header-bg);
  border-bottom: 1px solid var(--color-header-border);
  ...
}
```
```jsx
/* Header.jsx — no style prop */
<header className="app-header">
```

### Pattern 6: Import Order in App.jsx

**What:** `tokens.css` must be imported before all other stylesheets so primitive and semantic tokens cascade correctly.

```jsx
// App.jsx import order (CRITICAL)
import '@aws-amplify/ui-react/styles.css';  // Amplify stays first (its own scoping)
import './styles/tokens.css';               // Project tokens second
import './App.css';                          // Component-level styles last
```

**Note:** `index.css` is imported in `main.jsx`. Animations (`@keyframes typing`, `pulse-missing`, `fadeIn`) in `index.css` must be preserved as-is.

### Anti-Patterns to Avoid

- **Mixing inline styles and CSS classes in the same migrated file:** Violates the atomic migration rule from STATE.md. Either all inline or all class-based per file.
- **Scoping semantic tokens to `:root` instead of `[data-app-theme]`:** Would cascade into the Amplify Authenticator login screen and break its visuals.
- **Using `--amplify-` prefix in project tokens:** Amplify owns this namespace exclusively.
- **Touching triage logic files during this phase:** Header only. ProtocolTriage, HistoryPage, etc. are Phase 7 scope.
- **Softening or aliasing `--mts-*` values:** Clinical colors are byte-for-byte from v1.1.0. No warm/muted variants of clinical colors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS variable fallback chain | Custom JS fallback system | Native CSS `var(--token, fallback)` | Browser handles fallback natively in the var() function |
| Theme switching mechanism | Custom React context + JS style injection | CSS `[data-app-theme]` attribute + `tokens.css` | CSS cascade handles theme switching; Phase 8 adds the toggle |
| Color scale generation | Manual hex value calculation | Use Tailwind Stone (warm gray) and Teal scales as reference values | Stone/Teal are well-researched accessible scales with correct relative luminance |

**Key insight:** CSS custom properties on `:root` are handled efficiently by browsers; 100+ tokens have no measurable performance impact. No JavaScript token system (CSS-in-JS, styled-components) is needed or appropriate here given the project's inline-style-first codebase.

## Common Pitfalls

### Pitfall 1: Amplify Authenticator Visual Regression
**What goes wrong:** Adding a CSS reset or font/color declaration to `:root` overrides Amplify's baseline, breaking the login screen layout or typography.
**Why it happens:** The Amplify Authenticator renders at the root level, outside the `app-container` div. Any `:root` style that isn't a passive primitive token value will cascade into it.
**How to avoid:** Scope ALL semantic tokens and resets to `[data-app-theme]`. Only passive primitives (raw values) go on `:root`. Verify the login screen visually after adding tokens.
**Warning signs:** Login page text color wrong, button sizes changed, form layout broken.

### Pitfall 2: `index.css` Vite Defaults Still Active
**What goes wrong:** `index.css` currently declares `color: rgba(255, 255, 255, 0.87)` and `background-color: #242424` on `:root` (Vite dark-mode defaults). These conflict with the warm-professional light palette.
**Why it happens:** These are Vite's out-of-the-box styles, not removed when the project was created.
**How to avoid:** Clean `index.css` — remove the Vite `:root` color/background declarations and the `@media (prefers-color-scheme: light)` block. Keep only `font-family`, `line-height`, `font-synthesis`, `text-rendering`, `-webkit-font-smoothing`, and animations. The token system owns color and background from this point.
**Warning signs:** App background is dark gray (#242424) after adding tokens; text is nearly white.

### Pitfall 3: MTS Yellow Badge Text Contrast Failure
**What goes wrong:** Yellow background (`#ffc107`) with white text fails WCAG 4.5:1 contrast. Current `App.css` already handles this with `color: #333` on `.priority-yellow`.
**Why it happens:** Yellow is light enough that white text on it reads ~1.7:1 contrast — a patient safety and accessibility issue.
**How to avoid:** Define `--mts-yellow-text: #000000` as a companion primitive and use it wherever the yellow badge text color is set. This is a locked decision from STATE.md.
**Warning signs:** `.priority-yellow` badge text becomes white after migration.

### Pitfall 4: FOUC on Hard Refresh
**What goes wrong:** User persisted dark mode. On hard refresh, page flashes light before React sets the theme attribute.
**Why it happens:** React hasn't mounted yet when the browser first paints. No `data-app-theme` attribute exists until React runs.
**How to avoid:** The blocking `<script>` in `index.html` reads localStorage synchronously before the browser paints. It must be in `<head>`, not at end of `<body>`. In Phase 5, the script always sets `light` — the full toggle logic ships in Phase 8.
**Warning signs:** Brief white flash then dark transition on page load.

### Pitfall 5: Header onMouseEnter/onMouseLeave Inline Handlers Still Present
**What goes wrong:** After migrating inline styles to CSS classes, the `onMouseEnter`/`onMouseLeave` JavaScript hover handlers remain in Header.jsx — they won't do anything because the style prop is gone, but they are dead code and can cause confusion.
**Why it happens:** Hover state was implemented via JS event handlers because inline styles can't use `:hover` pseudo-class.
**How to avoid:** Remove all `onMouseEnter`/`onMouseLeave` handlers from Header.jsx during migration. Replace with CSS `:hover` pseudo-class in `Header.css`.
**Warning signs:** Event handler functions in JSX that reference `e.currentTarget.style.*` after migration.

### Pitfall 6: getRoleBadgeColor() Uses Bootstrap Hex Inline
**What goes wrong:** `Header.jsx` has a `getRoleBadgeColor()` function that returns Bootstrap hex strings (`#dc3545`, `#fd7e14`, `#0d6efd`, `#198754`, `#6c757d`). These are returned as inline style values and can't be expressed in the CSS class approach directly.
**Why it happens:** Dynamic color mapping via JavaScript is incompatible with pure CSS class extraction.
**How to avoid:** Two approaches — (A) convert to CSS classes (`role-badge--admin`, `role-badge--doctor`, etc.) and remove the function, or (B) replace hex returns with token variable names and apply via `style={{ color: 'var(--color-role-admin)' }}`. The class approach (A) is cleaner and consistent with the migration goal. Note that role badge colors use `--mts-*` values (red, orange, blue, green) for admin/tenant_admin/doctor/nurse — these are MTS colors being repurposed for role display, not clinical priority display. They should map to MTS tokens directly.
**Warning signs:** Function still present after migration returning raw hex values.

## Code Examples

### tokens.css — MTS Clinical Color Block (immutable section)
```css
/* Source: Extracted from src/App.css v1.1.0 — byte-for-byte preservation required */

/* MTS Priority Colors — IMMUTABLE — patient safety constraint */
/* These values match v1.1.0 App.css .priority-* classes exactly */
--mts-red:         #dc3545;   /* .priority-red background */
--mts-orange:      #fd7e14;   /* .priority-orange background */
--mts-yellow:      #ffc107;   /* .priority-yellow background */
--mts-yellow-text: #000000;   /* .priority-yellow text (was #333 — black is more correct) */
--mts-green:       #28a745;   /* .priority-green background */
--mts-blue:        #007bff;   /* .priority-blue background */
```

### App.css — Migrated .priority-* Classes Using Tokens
```css
/* Source: Pattern derived from two-layer token approach */
.priority-badge {
  display: inline-block;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  color: white;
  margin: 1rem 0;
  font-size: 1.5rem;
}
.priority-red    { background-color: var(--mts-red); }
.priority-orange { background-color: var(--mts-orange); }
.priority-yellow { background-color: var(--mts-yellow); color: var(--mts-yellow-text); }
.priority-green  { background-color: var(--mts-green); }
.priority-blue   { background-color: var(--mts-blue); }
```

### Header.css — Token-Backed Classes (key patterns)
```css
/* Source: Pattern derived from D-10 and D-11 decisions */
.app-header {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg);
  background-color: var(--color-header-bg);
  border-bottom: 1px solid var(--color-header-border);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.header-brand {
  margin: 0;
  font-size: var(--font-size-xl);
  /* Soft teal gradient replaces Bootstrap blue gradient */
  background: linear-gradient(45deg, var(--color-teal-600), var(--color-teal-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  padding: 0.4rem var(--spacing-md);
  border-radius: 20px;
  transition: all 0.2s;
  background-color: var(--color-nav-bg);
  color: var(--color-nav-text);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
}
.header-nav-link:hover {
  background-color: var(--color-nav-bg-hover);
  color: var(--color-nav-text-hover);
}

.header-signout-btn {
  padding: 0.5rem var(--spacing-md);
  background-color: transparent;
  color: var(--mts-red);
  border: 1px solid var(--mts-red);
  border-radius: 6px;
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all 0.2s;
}
.header-signout-btn:hover {
  background-color: var(--mts-red);
  color: white;
}
```

### index.html — FOUC Prevention Script
```html
<!-- Source: Established FOUC prevention pattern — verified by multiple 2025 sources -->
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Triax</title>
    <!-- FOUC prevention: runs synchronously before any CSS or React -->
    <script>
      (function() {
        try {
          var t = localStorage.getItem('triax-theme') || 'light';
          document.documentElement.setAttribute('data-app-theme', t);
        } catch(e) {
          document.documentElement.setAttribute('data-app-theme', 'light');
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline `style={{}}` everywhere | CSS custom property tokens + co-located CSS | Phase 5 (this phase) | Theming, dark mode, and maintainability enabled |
| Bootstrap hex hardcoded (`#0d6efd`, `#dc3545`) | Semantic token references (`var(--color-primary)`) | Phase 5 | One-place palette updates; Phase 8 dark mode free |
| `color-scheme: light dark` in `:root` | Explicit `[data-app-theme]` attribute + FOUC script | Phase 5 | Controlled theme switching, no flash |
| Vite default dark-mode `:root` styles | Clean `:root` with only font and rendering properties | Phase 5 | App is light by default with no dark flash |

**Deprecated/outdated in this codebase:**
- Vite's `:root` dark-mode defaults in `index.css` (`color: rgba(255,255,255,0.87)`, `background-color: #242424`, `@media (prefers-color-scheme: light)` block): These must be removed. They predate any design intent and conflict with the token system.
- `color-scheme: light dark` in `:root`: Replaced by explicit `[data-app-theme]` management.

## Open Questions

1. **`app-container` div vs. `html` as `[data-app-theme]` host**
   - What we know: Semantic tokens are scoped to `[data-app-theme]`. The FOUC script sets it on `document.documentElement` (html tag). App.jsx's `app-container` div can also carry the attribute.
   - What's unclear: If the attribute is only on `app-container` div, the Amplify Authenticator (which renders ABOVE the app-container) gets no token scoping — that's correct. But if the FOUC script sets it on `html`, do Amplify tokens leak into the Authenticator screen?
   - Recommendation: Set `[data-app-theme]` on `app-container` div only (not on html) during app-authenticated state. The FOUC script on html tag is only needed in Phase 8 when dark mode ships and needs to persist across the login page reload. For Phase 5, the FOUC script stub is safe since it always sets `light`, and semantic overrides are passive enough to not break the Authenticator visuals. The planner should decide whether to put the attribute on html or app-container for Phase 5.

2. **`getRoleBadgeColor()` function — which approach?**
   - What we know: The function returns Bootstrap hex for 5 role types. These happen to coincide with MTS colors (`#dc3545` = `--mts-red`, etc.).
   - What's unclear: D-10 calls for full CSS extraction. But dynamic role-color mapping requires either JS or per-role CSS classes.
   - Recommendation: Convert to CSS classes (`.role-badge--admin`, `.role-badge--doctor`, etc.) assigned via `className`. Cleaner, fully extractable, and eliminates the one JavaScript hex reference in Header. The function is deleted.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — zero test coverage is a known project constraint (see REQUIREMENTS.md Out of Scope) |
| Config file | none |
| Quick run command | `npm run build` (Vite build as smoke test) |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| DSGN-01 | `src/styles/tokens.css` exists with `--mts-*` primitives matching v1.1.0 hex values | manual | `grep -n -- '--mts-' src/styles/tokens.css` | Visual diff against App.css source values |
| DSGN-01 | No CSS parse errors | smoke | `npm run build` | Vite build fails on CSS syntax errors |
| DSGN-02 | No Bootstrap hex values in Header.jsx | manual | `grep -n '#0d6efd\|#198754\|#6c757d\|#dc3545\|#fd7e14' src/components/Header.jsx` | Should return 0 matches after migration |
| DSGN-02 | App builds without errors | smoke | `npm run build` | Basic regression gate |
| (visual) | Amplify Authenticator login renders correctly | manual | Sign out, view login screen | Eyeball for visual regression |
| (visual) | Header renders with warm-professional styles | manual | Load app, inspect header | Check against D-11 intent |

### Sampling Rate
- **Per task commit:** `npm run build` (ensures no CSS/JSX syntax errors)
- **Per wave merge:** `npm run build` + visual review of login screen and header
- **Phase gate:** Full visual smoke test — login screen, header, triage flow — before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure exists or is expected per project constraints. Validation is visual + build smoke test.

## Sources

### Primary (HIGH confidence)
- https://ui.docs.amplify.aws/react/theming — Amplify UI CSS variable prefix (`--amplify-`), `[data-amplify-theme]` scoping, coexistence approach
- https://ui.docs.amplify.aws/react/theming/default-theme — Full list of `--amplify-components-*` tokens confirming namespace isolation
- `src/App.css` (v1.1.0) — MTS hex values to preserve byte-for-byte
- `src/components/Header.jsx` (v1.1.0) — 23 inline color references inventoried

### Secondary (MEDIUM confidence)
- https://www.frontendtools.tech/blog/css-variables-guide-design-tokens-theming-2025 — Two-layer primitive/semantic pattern confirmed against multiple 2025 sources
- https://notanumber.in/blog/fixing-react-dark-mode-flickering — FOUC prevention blocking script pattern
- https://dev.to/bishoy_bishai/implementing-dark-mode-css-variables-system-preference-and-persistence-2a43 — localStorage + blocking script approach for SPAs

### Tertiary (LOW confidence)
None — all claims above verified against official docs or multiple consistent sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; CSS custom properties are browser-native
- Architecture: HIGH — patterns confirmed against Amplify docs and CSS standards
- Pitfalls: HIGH — Vite defaults and Amplify scoping issues verified by reading source files directly
- MTS color values: HIGH — read byte-for-byte from `src/App.css`

**Research date:** 2026-04-07
**Valid until:** 2026-10-07 (CSS custom properties are stable; Amplify major version bump would need re-check)
