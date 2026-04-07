# Pitfalls Research

**Domain:** UI/UX overhaul of clinical triage React SPA (inline-style codebase)
**Researched:** 2026-04-07
**Confidence:** HIGH (code inspected directly; external sources verified against official docs)

---

## Critical Pitfalls

### Pitfall 1: MTS Priority Colors Broken by Design System Reset

**What goes wrong:**
A design system introduces global resets, CSS variables, or utility classes that redefine color primitives. The five MTS priority colors — red `#dc3545`, orange `#fd7e14`, yellow `#ffc107`, green `#198754`, blue `#0d6efd` — are currently hardcoded inline throughout `ProtocolTriage.jsx`. When a design system provides its own `--color-red`, `--color-green` etc., the same names collide. If a developer refactors triage color logic to use design tokens without understanding that these are clinically mandated colors (not stylistic choices), the token values get softened, lightened, or changed to match the brand palette.

The yellow priority result currently uses `color: '#000'` (black text on yellow) because it is the only MTS color that requires dark text for legibility. This exception is easy to lose during a batch refactor.

**Why it happens:**
Developers conflate "the design system owns all colors" with "these clinical colors are also design-system colors." The MTS standard exists outside the design system. The distinction is invisible unless explicitly documented.

**How to avoid:**
1. Create a separate, immutable token namespace: `--mts-red`, `--mts-orange`, `--mts-yellow`, `--mts-green`, `--mts-blue`. Never alias these to brand tokens.
2. Hardcode the exact hex values in that namespace and add a comment block: `/* MTS clinical standard — do not modify */`.
3. Keep a companion `--mts-yellow-text: #000000` token to preserve the black-on-yellow rule.
4. The design system "softer palette" applies only to UI chrome (buttons, backgrounds, cards) — never to triage result display.

**Warning signs:**
- Any PR that touches `triageResult.priority` color logic.
- Any PR that renames or consolidates color tokens and doesn't list MTS colors in an explicit exception list.
- Yellow triage result showing white text instead of black.

**Phase to address:**
Foundation phase (design token definition). Establish the MTS color namespace before any component migration begins.

---

### Pitfall 2: Inline Styles Override Design System — Specificity Stalemate

**What goes wrong:**
`ProtocolTriage.jsx` alone has 85 inline `style={{}}` occurrences; across the six main component and page files the count exceeds 260. Inline styles in React have the highest CSS specificity short of `!important`. When a design system introduces utility classes or component classes, they lose every specificity contest against the existing inline styles. The result is a codebase where the design system is theoretically adopted but visually inert in any component not yet fully migrated.

This creates a "half-migrated zombie" state that is worse than either the old or new approach: bugs are harder to locate (is this inline or class?), visual inconsistency is rampant, and reviewing PRs becomes nearly impossible.

**Why it happens:**
Teams try to migrate incrementally by adding new system classes alongside old inline styles, expecting them to coexist. They don't — inline styles win.

**How to avoid:**
1. Adopt a file-by-file, atomic migration strategy: each file is either fully inline (old) or fully system-based (new) — no hybrid files.
2. When migrating a component, remove all inline styles in the same PR that adds the system classes. Never leave both in the same file.
3. If you need an escape hatch for one-off dynamic values (e.g., the triage result background color driven by API response), use CSS custom properties set via the `style` attribute: `style={{ '--triage-color': priorityHex }}` and then reference `var(--triage-color)` in CSS. This keeps inline styles isolated to genuine dynamic values, not static design decisions.
4. Lint rule: configure `eslint-plugin-react` to flag static values in `style` props (values that do not depend on component state or props).

**Warning signs:**
- Design system button styles not showing up on any existing screen.
- Mixed `style={{color: '#0d6efd'}}` and `className="btn-primary"` on the same element.
- More than two files with both `style={{` and design-system class names.

**Phase to address:**
Foundation phase. Establish the migration rule before touching any component.

---

### Pitfall 3: Amplify Authenticator CSS Variables Conflict with Design System

**What goes wrong:**
`@aws-amplify/ui-react` Authenticator uses its own CSS custom property namespace (`--amplify-*`) and injects its own stylesheet. When a project-level design system also defines CSS custom properties at `:root`, the two namespaces interact unpredictably if either uses the same token names, or if a CSS reset applied by the design system overrides the Amplify stylesheet.

A documented real-world issue: Amplify UI has broken custom CSS targeting in minor version bumps — data attributes like `data-variation` and `data-state` disappeared from sign-in buttons in a 6.x release, silently invalidating existing CSS selectors that targeted them. Because the Amplify Authenticator is a black-box component, visual regressions on the login screen can go unnoticed until a stakeholder demo.

**Why it happens:**
The Amplify Authenticator is rarely thought of as a "component to style" — it is treated as infrastructure. It sits outside the component tree that developers actively work in, so it is the last place they check when styles break.

**How to avoid:**
1. Scope your design system's CSS reset and global token declarations to a wrapper element (`[data-app-theme]`) rather than `:root`. Let Amplify own `:root` or at least avoid colliding names.
2. Theme the Authenticator explicitly through the `theme` prop object (Amplify's first-party API) rather than overriding via CSS selectors on `.amplify-*` classes — selector-based overrides break on Amplify version bumps.
3. Lock `@aws-amplify/ui-react` to a minor version in `package.json` (e.g., `"6.13.x"` not `"^6.13.2"`) and treat Amplify upgrades as deliberate decisions with visual regression checks, not automatic dependency updates.
4. Add a visual smoke-test: after any dependency update, confirm the login screen renders correctly before merging.

**Warning signs:**
- Amplify login form loses custom fonts or colors after `npm update`.
- Design system global styles (font, color, spacing) visibly apply inside the Authenticator UI.
- `amplify-button` components render with your design system's button styles.

**Phase to address:**
Foundation phase (design token definition and global CSS setup). Get the scoping boundary right before introducing any global styles.

---

### Pitfall 4: Dark Mode Flash of Incorrect Theme (FOUC)

**What goes wrong:**
The current `index.css` uses `@media (prefers-color-scheme: light)` as a media query, meaning the OS preference drives theme selection before React loads. When dark mode is introduced with a user-preference toggle (stored in `localStorage`), there is a race condition: the page renders with the CSS-media-query theme first, then JavaScript loads, reads `localStorage`, and switches — producing a visible flash on every page load.

In a clinical context this is not just a cosmetic annoyance: a screen that flashes from dark to light (or vice versa) in a dimly-lit emergency department is disruptive.

**Why it happens:**
`localStorage` is only accessible in JavaScript, which executes after the initial HTML parse and CSS application. React-rendered dark mode state always arrives after the first paint.

**How to avoid:**
1. Inject a blocking `<script>` in `index.html` (before the React bundle `<script>`) that reads `localStorage` and sets `document.documentElement.dataset.theme = 'dark' | 'light'` synchronously.
2. Base all theme CSS on `[data-theme='dark']` attribute selector, not `@media (prefers-color-scheme)`.
3. The blocking script is ~5 lines and does not affect perceived performance. This is the canonical solution (documented by Josh W. Comeau and used by major design systems).
4. Remove or subordinate the existing `@media (prefers-color-scheme: light)` block in `index.css` once the attribute-based system is in place.

**Warning signs:**
- Any dark-mode implementation that uses only React state or Context to drive the theme without a blocking inline script.
- Users with dark mode preference seeing a white flash on hard refresh.

**Phase to address:**
Dark mode phase. The blocking script must be the first thing done before any dark mode CSS is written.

---

### Pitfall 5: Clinical Color Confusion — Desaturated "Soft" Palette Meets MTS Colors

**What goes wrong:**
The v2.0.0 goal is a "softer color palette" for UI chrome. When a soft, desaturated background palette coexists with the saturated MTS priority colors, the triage result card can look visually disconnected from the rest of the UI — correct by clinical standard but jarring by design standard. The opposite error is worse: a designer softens the MTS yellow from `#ffc107` to a muted `#f5c842` because it "fits the palette better." The colors now look harmonious but are no longer the clinical standard.

A secondary risk: deuteranopia (red-green color blindness) affects ~5% of males. Red `#dc3545` and green `#198754` are problematic for this population. The MTS specification does not include an accessibility accommodation for this — supplementary visual indicators (text label, icon, pattern) are required for WCAG compliance (WCAG 1.4.1: color must not be the sole means of conveying information).

**Why it happens:**
Designers optimize for visual cohesion. Clinical mandates are invisible in a Figma file unless they are documented and enforced.

**How to avoid:**
1. The five MTS hex values are fixed. Document them as a constraint in the design brief, not a variable.
2. For WCAG 1.4.1 compliance, each triage priority result must convey its level through means other than color alone: the existing Portuguese text labels (VERMELHO - EMERGÊNCIA, etc.) already satisfy this requirement — do not remove them in the visual redesign.
3. Add a priority icon or badge that reinforces the color (e.g., exclamation mark for red/orange). This also addresses a future screen-reader requirement.
4. When softening the overall palette, use neutral or blue-grey tones for UI chrome. Keep MTS colors fully saturated to make them stand out by contrast — the visual separation from soft chrome actually makes the priority result more salient.

**Warning signs:**
- Any Figma mockup where the MTS colors have been adjusted to "match the palette."
- Triage result color hex values changing in any PR.
- Portuguese priority text labels removed or moved to secondary/subtitle styling.

**Phase to address:**
Foundation phase (design token definition) + any phase that touches the triage result display.

---

### Pitfall 6: Keyboard Shortcuts Conflict with Screen Readers and Browser Defaults

**What goes wrong:**
The plan includes number keys for quick replies and Esc to cancel. Plain single-character shortcuts (1, 2, 3, Esc) conflict directly with screen reader operation modes. In browse mode, a screen reader intercepts single-key presses to navigate by element type (H for heading, B for button). A plain `1` shortcut will fight the screen reader for every keystroke when the triage flow is active.

Additionally, Esc in a browser context can: cancel a fetch request (some browsers), close browser-native dialogs, exit fullscreen, or close a `<dialog>` element. Nested component conflicts also arise: if a modal is open inside the triage flow, Esc should close the modal before canceling the triage — this requires deliberate event priority management.

**Why it happens:**
Keyboard shortcut libraries are typically added late (as enhancement, not foundation), and the conflict surface with assistive technology is only discovered during accessibility audits after the shortcuts are already shipped.

**How to avoid:**
1. Use modifier-key shortcuts for anything that conflicts with text input or screen reader modes: `Alt+1..5` for quick replies, not bare number keys.
2. Esc to cancel triage is safe only when no modal or dropdown is open — use a centralized shortcut registry with context-scoping (shortcuts active only when their owning component is the topmost interactive layer).
3. Never attach global `keydown` listeners in individual components — use a single top-level listener that delegates based on application focus state. This prevents the same key being handled by multiple components simultaneously.
4. Test with VoiceOver (macOS) and NVDA (Windows) before shipping shortcuts.

**Warning signs:**
- Multiple `useEffect` blocks across different components all doing `window.addEventListener('keydown', ...)`.
- A bare number key or letter key registered as a shortcut without a modifier.
- No test with screen reader before merge.

**Phase to address:**
Keyboard shortcuts phase, but the architecture decision (centralized registry) must be made in the foundation phase to avoid retrofitting later.

---

### Pitfall 7: Accessibility Retrofit — ARIA Labels Added Without Semantic HTML Foundation

**What goes wrong:**
ARIA labels (`aria-label`, `aria-describedby`, `role`) are added to existing elements as an afterthought. Without correcting the underlying semantic HTML, ARIA makes things worse. A `<div onClick>` with `role="button"` is not a button — it lacks native focus, keyboard activation (Enter/Space), and expected behavior. Adding `aria-label` to a non-semantic element gives screen readers a label for something they cannot interact with.

The current codebase uses functional components with React patterns that are likely to have `<div>` wrappers for click targets, especially in the triage chat-like interface and sensor input cards.

**Why it happens:**
ARIA is treated as a checkbox ("we added aria-label, we're done") rather than as a complement to native semantics. The distinction between "using ARIA to enhance semantics" and "using ARIA to paper over missing semantics" is subtle and often missed in code review.

**How to avoid:**
1. Fix semantic HTML first — replace interactive `<div>` and `<span>` with `<button>`, `<input>`, `<select>`, `<label>` as appropriate. Only add ARIA after native semantics are correct.
2. Rule of thumb from ARIA spec: "No ARIA is better than bad ARIA." Apply this strictly in code review.
3. For each interactive element, verify it can be reached and activated by keyboard alone before calling it done.
4. Focus management after state changes: when a triage step advances (new question appears), move focus to the new question heading so screen reader users know a change occurred.

**Warning signs:**
- `role="button"` on a `<div>` or `<span>`.
- `aria-label` added without checking if the element is natively focusable.
- Triage step transitions that do not move focus.

**Phase to address:**
Accessibility phase. Semantic HTML correction must precede ARIA annotation.

---

### Pitfall 8: Dark Mode in Clinical Settings — Light Mode Must Remain the Default

**What goes wrong:**
Clinical applications are typically used in well-lit environments (emergency departments, triage stations with fluorescent overhead lighting). Dark mode is valued for night shifts and low-light contexts, but healthcare UI research consistently finds that light mode is preferred for clinical accuracy work because it more closely resembles printed reference materials and is easier to read at a distance.

If dark mode is set as the default (matching OS preference), clinicians using the app in a bright ED room on a screen without automatic brightness adjustment will have reduced contrast for data visualization and vital signs displays. The existing MTS color palette (particularly yellow on dark background) needs specific attention — yellow `#ffc107` on a dark `#242424` background passes WCAG AA (contrast ratio ~8:1) but yellow on a pure black dark card can wash out on uncalibrated screens.

**Why it happens:**
Dark mode is trendy in consumer apps and developers default to "follow OS preference." The clinical context of bright, mixed-lighting environments is not considered.

**How to avoid:**
1. Default to light mode. Respect OS preference as a fallback only if no explicit user preference is saved.
2. Give users a visible, persistent toggle in the UI (accessible from every screen, not just settings).
3. Test both modes with the MTS priority color display specifically — verify contrast ratios for all five priority colors in both themes.
4. For dark mode, do not use pure black (`#000000`) as the background. Use dark grey (`#1a1a2e` or similar) to prevent harsh contrast that causes halation for users with astigmatism.

**Warning signs:**
- Dark mode set as default or tied directly to `prefers-color-scheme` without a user override mechanism.
- MTS yellow priority result not tested in dark mode.
- Pure black used as dark background color.

**Phase to address:**
Dark mode phase.

---

### Pitfall 9: Toast Notification Accessibility — Screen Reader Announcement Timing

**What goes wrong:**
Replacing `alert()` with a visual toast notification library is the right move, but the ARIA implementation of most toast libraries is wrong by default. Toasts need `role="alert"` or an ARIA live region (`aria-live="assertive"` for errors, `aria-live="polite"` for success) to be announced by screen readers. Libraries that use `role="status"` instead of `role="alert"` for error notifications may fail to interrupt a screen reader mid-announcement.

In a clinical context, "Erro ao iniciar sessão" (session start error — currently `alert()` in ProtocolTriage.jsx line 401) is a critical error that must be announced immediately and persistently. A toast that auto-dismisses in 3 seconds will be missed by a screen reader user who is focused elsewhere on the page.

**Why it happens:**
Toast libraries are evaluated on visual DX, not accessibility. Default configurations are often `aria-live="polite"` for everything, which is too low urgency for clinical errors.

**How to avoid:**
1. For error toasts (session start failure, PDF generation failure): use `role="alert"` + `aria-live="assertive"` + no auto-dismiss, or a minimum 8-second dismiss with a visible dismiss button.
2. For success/info toasts: use `aria-live="polite"` + 5-second auto-dismiss.
3. Verify that the toast container is appended to `<body>` (not inside the Amplify Authenticator subtree or a deeply nested component), so it persists across route changes.
4. The existing 5 `alert()` call sites (HistoryPage.jsx ×2, ProtocolTriage.jsx ×2, TriageDetailsModal.jsx ×1) all indicate error conditions — they must all map to assertive/persistent toast behavior.

**Warning signs:**
- Toast library using `role="status"` for error toasts.
- Error toast auto-dismisses in under 5 seconds.
- Toast container rendered inside a component that can unmount (e.g., inside the triage flow component rather than at app root).

**Phase to address:**
Toast/notifications phase. The toast container must be rendered at app root level before any `alert()` callsites are converted.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Add design system classes alongside existing inline styles | Faster migration per PR | Specificity conflicts, hybrid state is unmaintainable | Never — migrate per file atomically |
| Use `!important` to override Amplify or inline style conflicts | Unblocks migration quickly | Creates an escalating specificity war that becomes unmaintainable | Never |
| Soft-launch dark mode behind a feature flag with incomplete coverage | Ship faster, toggle off for demos | Incomplete coverage means some screens break when toggled on | Acceptable only in a dedicated dark mode phase, not across multiple phases |
| Apply ARIA labels without fixing semantic HTML | Passes automated accessibility checkers | Screen reader experience is broken or worse than before | Never |
| Reuse Bootstrap color tokens (#dc3545 etc.) as "close enough" for MTS colors | No new token names to learn | Token values can drift if Bootstrap is updated; clinical standard is severed from implementation | Never — MTS colors must be explicitly namespaced |
| Global keyboard shortcut via `window.addEventListener` in component `useEffect` | Simple, one-liner per shortcut | Memory leaks if component unmounts without cleanup; multiple listeners for same key; conflicts | Never in production; prototype-only |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Amplify Authenticator + design system | Apply global CSS reset to `:root`, breaking Amplify's token cascade | Scope design system resets to `[data-app-theme]` wrapper; leave `:root` clear or use non-colliding variable names |
| Amplify Authenticator + dark mode | Apply `prefers-color-scheme` dark styles globally, which bleeds into Amplify's login form | Use attribute-based dark mode (`data-theme="dark"` on `<html>`) and exclude the Amplify subtree from dark mode tokens |
| Toast library + Amplify Authenticator | Mount toast container inside `<Authenticator>` wrapper | Mount toast container at React root level, outside `<Authenticator>`, in `main.jsx` or `App.jsx` top-level |
| Design tokens + CSS variables | Name tokens generically (`--color-red`) causing collision with Amplify's `--amplify-colors-red-*` | Use project-specific prefix for all tokens: `--triax-color-*`; MTS tokens: `--mts-*` |
| Keyboard shortcuts + React Router | `keydown` listener persists across route changes because it is attached globally in a component | Attach global shortcuts at app root (not component level) or use a dedicated shortcut manager that is route-aware |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Style object created inside render | Each render creates a new object reference, causing React to re-apply styles even when unchanged | Define static style objects outside the component, or use CSS classes instead | At ~100 rapid re-renders (voice transcription updates trigger this) |
| Dark mode toggle causing full re-render cascade | Every component reading theme context re-renders on toggle | Use CSS attribute (`data-theme`) on `<html>` element instead of React context — CSS switches are instantaneous, no re-render | Immediately visible if context is used |
| Large inline style objects on triage cards | `ProtocolTriage.jsx` computes style objects inline with `triageResult.priority` — object created on every render | Extract to a `getPriorityStyle(priority)` memoized helper | Every triage step update |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Triage color used as sole visual indicator of priority | Colorblind clinicians (5% of males) cannot distinguish red from green | Always pair color with text label (existing PT-BR labels satisfy this) and consider adding a priority icon |
| Toast auto-dismisses during sensor data entry | Clinician misses error while focused on vital signs input | Error toasts do not auto-dismiss; include explicit close action |
| Keyboard shortcuts active during text input fields | Number key shortcuts fire when clinician types patient age or notes | Disable shortcuts when focus is inside an `<input>` or `<textarea>` |
| Focus not managed after triage step advances | Screen reader users lose context when question changes without focus moving | Move focus to new question heading or first interactive element on step change |
| Dark mode default in bright clinical environment | Reduced contrast for vital signs in well-lit ED room | Default to light mode; respect OS preference only as a starting point, not permanent setting |
| "Softer palette" applied to triage result display | Priority assignment looks subtle/muted — clinicians may not notice severity | Triage result card retains full-saturation MTS color as primary visual signal; softness is for chrome only |

---

## "Looks Done But Isn't" Checklist

- [ ] **MTS priority colors:** Both the background color AND text color (black for yellow) are preserved after any design token refactor — verify all five priorities render correctly.
- [ ] **Dark mode:** All five MTS priority colors tested in dark mode — check contrast ratios, not just visual appearance on developer screen.
- [ ] **Toast notifications:** All 5 existing `alert()` call sites replaced, and the toast container is at app root level (not inside a component that can unmount mid-triage).
- [ ] **Amplify Authenticator:** Login screen visually verified after every design system CSS change — it is not covered by component tests and breaks silently.
- [ ] **Keyboard shortcuts:** Shortcuts disabled when any text input has focus — test by tabbing into a sensor input field and pressing a shortcut key.
- [ ] **ARIA/accessibility:** Each interactive element reachable and activatable by keyboard alone, not just screen-readable.
- [ ] **Design token scoping:** No `--triax-*` token names collide with `--amplify-*` namespace — verify with `grep -r 'var(--amplify' src/`.
- [ ] **Dark mode FOUC:** Hard refresh on a user with dark preference set — no white flash before React loads.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| MTS colors changed mid-migration | LOW if caught early, HIGH if shipped | Revert token values to exact hex values from MTS standard; audit all triage result renders |
| Hybrid inline + design system state | HIGH | Complete file-by-file migration in a dedicated PR; no partial rollback possible |
| Amplify Authenticator broken by CSS | MEDIUM | Roll back Amplify minor version; re-scope design system CSS to avoid `:root` conflicts |
| Dark mode FOUC shipped to production | LOW | Add blocking inline script to `index.html`; deploy is a one-file change |
| Toast container inside triage component (unmounts mid-session) | MEDIUM | Move container to App.jsx root; refactor all toast dispatch calls |
| Global keyboard listeners leaking | MEDIUM | Audit `window.addEventListener` calls, add `removeEventListener` cleanup in `useEffect` return |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| MTS colors broken by design system | Foundation — design token definition | Render all five priority results in both themes; check hex values are unchanged |
| Inline style specificity conflicts | Foundation — migration rule established | No file has both `style={{` static values and design system classes simultaneously |
| Amplify Authenticator CSS conflicts | Foundation — global CSS scoping | Login screen visual regression check after every global style change |
| Dark mode FOUC | Dark mode phase (first step) | Hard refresh with dark OS preference; no flash |
| Clinical setting defaults | Dark mode phase | Light mode is default; user preference persisted in localStorage |
| Color blindness / WCAG 1.4.1 | Accessibility phase | Automated WCAG check passes; Portuguese text labels present on triage result |
| ARIA without semantic HTML | Accessibility phase | Each interactive element keyboard-navigable without ARIA first |
| Keyboard shortcut conflicts | Keyboard shortcuts phase | Shortcuts tested in a screen reader; disabled during input focus |
| Toast accessibility | Toast/notifications phase | Error toasts use `role="alert"`; minimum 8s dismiss; tested with screen reader |

---

## Sources

- Official Amplify UI theming docs: https://ui.docs.amplify.aws/react/theming
- Amplify CSS variables reference: https://ui.docs.amplify.aws/react/theming/css-variables
- Amplify Authenticator customization: https://ui.docs.amplify.aws/react/connected-components/authenticator/customization
- GitHub issue: Amplify UI custom CSS data attributes missing in v6.x: https://github.com/aws-amplify/amplify-ui/issues/4977
- Dark mode in React (FOUC prevention, localStorage pattern): https://www.joshwcomeau.com/react/dark-mode/
- Dark mode vs light mode for medical device UIs: https://www.emergobyul.com/news/dark-mode-vs-light-mode-medical-device-uis
- Evaluating dark mode for clinical platforms: https://www.mynkis.com/articles/evaluating-dark-mode-clinical-digital-platforms
- WCAG color contrast requirements: https://webaim.org/articles/contrast/
- WebAIM 2024: color contrast is #1 accessibility violation (83.6% of websites): https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025
- WCAG 1.4.1 (color not sole means): implied by https://www.w3.org/WAI/standards-guidelines/wcag/
- Healthcare WCAG compliance deadline (May 2026): https://www.mcdermottlaw.com/insights/may-2026-deadline-hhs-imposes-accessibility-standards-for-healthcare-company-websites-mobile-apps-kiosks/
- React accessibility keyboard shortcuts: https://dev.to/lico/react-overriding-browsers-keyboard-shortcuts-19bf
- Screen reader shortcut conflicts: https://frontendmasters.com/courses/react-accessibility/focus-trapping-keyboard-shortcuts/
- React-Toastify accessibility: https://fkhadra.github.io/react-toastify/accessibility/
- ARIA live region best practices: https://react-spectrum.adobe.com/react-aria/useToast.html
- CSS specificity and inline style conflicts: https://coreui.io/blog/how-to-use-inline-styles-in-react/
- CSS cascade layers for migration: https://www.smashingmagazine.com/2025/09/integrating-css-cascade-layers-existing-project/
- Design tokens and CSS variables guide: https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/
- Manchester Triage System color levels: https://www.researchgate.net/figure/Manchester-Triage-Scale-levels-colour-codes-and-times-to-assessment_tbl1_26702675
- React 19 upgrade guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide

---
*Pitfalls research for: UI/UX overhaul — clinical triage React SPA (inline-style migration, design system, dark mode, accessibility, healthcare color)*
*Researched: 2026-04-07*
