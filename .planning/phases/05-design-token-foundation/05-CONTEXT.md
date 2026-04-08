# Phase 5: Design Token Foundation - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

The app gets a CSS custom property token system that gates all subsequent visual work, with `--mts-*` clinical colors protected, provider stack updated, and Amplify coexistence confirmed. At least one component (Header) is migrated to demonstrate the token system. No new features — this is infrastructure for Phases 6-8.

</domain>

<decisions>
## Implementation Decisions

### Color palette feel
- **D-01:** Warm-professional aesthetic — slightly warm grays, soft teal accents, approachable without being playful (think Notion/Linear mood, not hospital-sterile)
- **D-02:** Soft teal as primary action color (buttons, links, active states), replacing Bootstrap blue `#0d6efd`
- **D-03:** Neutral surround for MTS priority colors — cards and backgrounds stay warm gray/white so priority badges are the only saturated elements on screen
- **D-04:** UI feedback states (error, warning, success) use separate muted variants distinct from MTS clinical colors — no ambiguity between "form validation error" and "MTS red priority"

### Token structure
- **D-05:** Two-layer system: primitives (raw values like `--color-teal-500`) and semantics (intent like `--color-primary: var(--color-teal-500)`). No component-level token layer.
- **D-06:** Include both light and dark mode shells — light with final values, dark (`[data-theme="dark"]`) with placeholder/estimated values. Toggle doesn't ship until Phase 8, but structure is ready.
- **D-07:** Tokens cover colors, spacing (`--spacing-xs` through `--spacing-xl`), and typography (`--font-size-sm/md/lg`). Complete foundation, not color-only.
- **D-08:** Single file at `src/styles/tokens.css` — no splitting by concern. Appropriate for app size (~3,400 LOC).

### Proof-of-concept migration
- **D-09:** Header.jsx is the migration target — high visibility (every page), isolated from triage logic, moderate complexity (23 inline color references)
- **D-10:** Full CSS extraction — Header's inline styles move to co-located `src/components/Header.css` with token-backed classes. Sets the reference pattern for Phase 7 migration.
- **D-11:** Light visual refresh of Header using the new warm-professional palette (soft teal primary, warm grays). Not pixel-identical to v1.1.0, but a deliberate, polished application of the new design direction.

### Claude's Discretion
- Specific teal/gray hex values for the palette
- Token naming conventions (prefix scheme, scale numbering)
- Dark mode placeholder values
- Spacing and typography scale values
- How to structure the `[data-app-theme]` scoping alongside Amplify styles
- FOUC-prevention script implementation details

</decisions>

<specifics>
## Specific Ideas

- Warm-professional mood reference: Notion, Linear — clean, approachable, not clinical-sterile
- MTS badges should be the only saturated color on screen — everything else is muted
- Clinicians shouldn't confuse UI feedback colors with triage priority colors

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current styling baseline
- `src/App.css` — Current MTS priority badge colors (`.priority-red` through `.priority-blue`), step-container styles, error class
- `src/index.css` — Vite default theme, typing/pulse animations, current `:root` font/color declarations
- `src/App.jsx` — Amplify Authenticator wrapper, `@aws-amplify/ui-react/styles.css` import, inline styles to preserve
- `index.html` — Entry point where FOUC-prevention blocking script must be added

### Migration target
- `src/components/Header.jsx` — Proof-of-concept migration component; read for current inline styles and structure

### Prior decisions
- `.planning/STATE.md` §Accumulated Context > Decisions — Locked decisions: immutable `--mts-*`, `[data-app-theme]` scoping, yellow text companion token, FOUC prevention approach

### Requirements
- `.planning/REQUIREMENTS.md` — DSGN-01 (CSS tokens with immutable `--mts-*`), DSGN-02 (soft palette replacing Bootstrap hex)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.priority-*` classes in `App.css`: Current MTS color definitions — values will be preserved as `--mts-*` tokens
- `:root` block in `index.css`: Existing CSS variable insertion point, though current values are Vite defaults to be replaced
- Animations in `index.css` (`@keyframes typing`, `pulse-missing`, `fadeIn`): Keep as-is, these don't need tokenizing

### Established Patterns
- Amplify Authenticator imports its own stylesheet (`@aws-amplify/ui-react/styles.css`) — token CSS must not interfere with Amplify's scoped styles
- `color-scheme: light dark` in current `:root` — will be replaced by explicit `[data-theme]` selector approach
- All components use inline `style={{}}` — Header migration will be the first to break this pattern

### Integration Points
- `src/main.jsx` or `src/App.jsx`: Where `tokens.css` import will be added (must load before component styles)
- `index.html`: FOUC-prevention script placement (before React mount)
- `src/components/Header.jsx` → new `src/components/Header.css`: First co-located CSS file

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-design-token-foundation*
*Context gathered: 2026-04-07*
