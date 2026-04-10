# Phase 14: Discoverability - Research

**Researched:** 2026-04-10
**Domain:** React UI component — popover help legend for keyboard shortcuts
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** A small `?` help icon/button in the chat input bar area that reveals a shortcut legend on hover/focus. Not a persistent floating panel.
- **D-02:** Legend content: Y (Sim), N (Nao), R (Gravar), Esc (Parar gravacao), Shift+Enter (Nova linha). Five entries total.
- **D-03:** Dedicated `ShortcutLegend` component — do NOT reuse the existing `Tooltip` component. Legend needs a multi-row table/grid layout. Trigger can follow Tooltip's hover/focus pattern.
- **D-04:** The `?` trigger sits in the `chat-input-bar` div, between the mic button and the send button (or after the send button). Visible whenever `chat-input-bar` renders (not during recording mode).
- **D-05:** Legend popover opens above the trigger, positioned to avoid clipping against the right edge.
- **D-06:** Trigger always visible during active triage. Legend appears on hover and on focus (keyboard accessible). No auto-dismiss, no "show once then hide."
- **D-07:** No `?` keyboard shortcut to toggle the legend — would conflict with Shift+/ on international keyboards.
- **D-08:** `?` icon: secondary text color, small (font-size-sm), no background. On hover: primary color. Same visual weight as existing `.shortcut-hint` spans.
- **D-09:** Legend popover: `--color-surface` background, `--shadow-md` elevation, `--radius-md` corners, `--color-border` outline.
- **D-10:** Each shortcut row: key badge (keyboard-key style — border, slight background, monospace) + action label in PT-BR. Compact, ~200px wide.
- **D-11:** Dark mode: popover inherits semantic tokens automatically — no special dark mode work needed.

### Claude's Discretion
- Exact pixel dimensions of the legend popover
- Whether to use a `<kbd>` element or a styled `<span>` for key badges
- Animation on popover show/hide (subtle fade or none)
- Z-index value (must be above chat content but below any modal)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | Keyboard shortcuts (Y/N/R/Esc) are discoverable via help legend or tooltip | ShortcutLegend component with `?` trigger in chat-input-bar; hover/focus reveal pattern matches existing Tooltip precedent |
</phase_requirements>

---

## Summary

Phase 14 is a single, tightly scoped UI component: a `ShortcutLegend` that surfaces the Y/N/R/Esc/Shift+Enter keybindings in a compact popover triggered by a `?` button in the `chat-input-bar`. All architectural decisions are locked — no alternatives to research. The investigation confirms that the implementation path is straightforward, all required design tokens exist, and the Tooltip component provides a precise hover/focus pattern to mirror.

The only technical decisions left open to Claude's discretion are: `<kbd>` vs styled `<span>` for key badges, fade animation vs none, and the exact z-index. All three have clear answers given the codebase context.

**Primary recommendation:** Build `ShortcutLegend` as a self-contained component file (`src/components/ui/ShortcutLegend.jsx` + `ShortcutLegend.css`) using local `useState` for visibility and `getBoundingClientRect()` for "pop above trigger" positioning — identical to how `Tooltip` works, but wider and with a grid layout.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component, `useState` for visibility | Already in project |
| CSS custom properties | — | Token-backed styling | All project styling uses `var(--)` tokens |

No new libraries needed. This phase is pure React + CSS.

**Installation:** None required.

---

## Architecture Patterns

### Component File Placement
```
src/components/ui/
├── ShortcutLegend.jsx    # new — trigger button + popover
├── ShortcutLegend.css    # new — legend-specific styles
├── Tooltip.jsx           # reference only (do not modify)
└── Tooltip.css           # reference only (do not modify)
```

New styles for `.shortcut-legend-*` classes go in `ShortcutLegend.css`. The trigger insertion into `ProtocolTriage.jsx` is a 3-line import + render change.

### Pattern 1: Hover/Focus Reveal (mirror of Tooltip)
**What:** Local `useState(false)` for visibility. `onMouseEnter`/`onFocus` → show. `onMouseLeave`/`onBlur` → hide. `getBoundingClientRect()` on the trigger ref calculates position.

**When to use:** Any time a secondary info panel anchors to a small icon button. This is the established Tooltip pattern — ShortcutLegend follows it exactly.

**Example (from Tooltip.jsx — verified by direct read):**
```jsx
// Source: src/components/ui/Tooltip.jsx
const show = () => {
  const rect = triggerRef.current.getBoundingClientRect();
  const flip = rect.top < 80;
  setPosition({
    x: rect.left + rect.width / 2,
    y: flip ? rect.bottom + 8 : rect.top - 8,
    flip
  });
  setVisible(true);
};
const hide = () => setVisible(false);
```

For `ShortcutLegend`, the popover is always "above" (D-05 locks direction), but right-edge clipping needs a right-align instead of center-align. Use `rect.right` as anchor and `right: calc(100vw - rect.right)` via `position: fixed`.

### Pattern 2: Key Badge Styling
**What:** Each row is `<kbd>` element + text label. `<kbd>` is the HTML-semantic choice for keyboard keys — screen readers announce it as keyboard input, which is correct here.

**When to use:** Whenever displaying a physical keyboard key in documentation/UI. `<kbd>` over styled `<span>` because it carries semantic meaning and is recognized by AT.

**Example:**
```jsx
// ShortcutLegend row pattern
<div className="shortcut-legend-row">
  <kbd className="shortcut-legend-key">Y</kbd>
  <span className="shortcut-legend-label">Sim</span>
</div>
```

### Pattern 3: Self-Contained Visibility State
**What:** No state in ProtocolTriage. All `useState` lives inside `ShortcutLegend`. ProtocolTriage only renders `<ShortcutLegend />` in the `chat-input-bar` flex row.

**When to use:** When a UI affordance has no shared state with its parent. This keeps ProtocolTriage's growing state surface stable.

### Anti-Patterns to Avoid
- **Reusing Tooltip:** D-03 explicitly prohibits it. Tooltip renders `content` as a string in a single-line bubble. Legend needs a structured grid — forcing that into Tooltip would require prop-drilling a JSX element and overriding most of its CSS.
- **Absolute positioning relative to chat-input-bar:** The chat column has `overflow: hidden` on `.triage-chat-column`. An absolutely positioned popover inside it would be clipped. Use `position: fixed` with `getBoundingClientRect()` like Tooltip does.
- **Persistent/always-visible legend:** D-01 prohibits this. Clinical screens need every pixel.
- **Adding a `?` key listener:** D-07 prohibits this — Shift+/ conflict on international keyboards.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Popover positioning | Custom layout math | `getBoundingClientRect()` + `position: fixed` | Tooltip already solves this; copy the pattern |
| Dark mode support | Dark-specific CSS rules | Semantic tokens (`--color-surface`, `--color-border`) | D-11 — tokens auto-switch in dark mode |
| Key badge semantics | Styled `<div>` or `<span>` | `<kbd>` HTML element | Semantic HTML; AT reads it correctly |

**Key insight:** Everything needed already exists in the codebase — design tokens, hover/focus pattern, CSS conventions. This phase is composition, not invention.

---

## Common Pitfalls

### Pitfall 1: Popover Clipped by overflow:hidden
**What goes wrong:** Popover renders inside `.triage-chat-column` which has `overflow: hidden`. The popover is cut off at the column boundary.
**Why it happens:** Absolute positioning is relative to the nearest positioned ancestor — which is inside the clipped container.
**How to avoid:** Use `position: fixed` with coordinates from `getBoundingClientRect()`. This is exactly what Tooltip does (verified in `Tooltip.jsx`).
**Warning signs:** Popover appears truncated or invisible at the top of the chat column.

### Pitfall 2: Focus Trap — onBlur fires when clicking inside popover
**What goes wrong:** If the `?` trigger's `onBlur` hides the popover, clicking a row inside the popover (if it were interactive) would close it before the click registers.
**Why it happens:** `blur` fires before `mousedown` on the new target.
**How to avoid:** The legend is read-only (no interactive rows) so this isn't a real risk here. The hide-on-blur pattern from Tooltip is safe.
**Warning signs:** Only applies if legend rows become interactive in the future.

### Pitfall 3: Right-Edge Clipping
**What goes wrong:** `?` button is rightmost in the input bar. A center-anchored popover extends off-screen to the right.
**Why it happens:** Tooltip centers on the trigger (transform: translate(-50%, -100%)). A rightmost trigger + centered popover = right overflow.
**How to avoid:** Right-align the popover. Use `right: calc(100vw - {rect.right}px)` with `position: fixed` so the popover's right edge aligns with the trigger's right edge.
**Warning signs:** Popover partially invisible on narrow viewports or when sidebar is visible.

### Pitfall 4: Z-Index Conflict
**What goes wrong:** Legend appears behind other elements.
**Why it happens:** Z-index stacking context.
**How to avoid:** Existing z-index ceiling in this view is `z-index: 201` (mobile overlay at `.triage-sensors-column`). Modal is `z-index: 1000`, Toast is `z-index: 1100`, Tooltip is `z-index: 9999`. The legend popover should be `z-index: 500` — above the triage view overlays (201) but well below modals (1000) and toasts (1100). No conflict.
**Warning signs:** Legend renders visually behind the quick-reply buttons or chat messages.

---

## Code Examples

Verified patterns from direct codebase reads:

### Trigger Button (follows D-08 styling)
```jsx
// Source: direct read of src/components/ui/Tooltip.jsx + tokens.css
<button
  type="button"
  ref={triggerRef}
  className="shortcut-legend-trigger"
  aria-label="Atalhos do teclado"
  aria-expanded={visible}
  onMouseEnter={show}
  onFocus={show}
  onMouseLeave={hide}
  onBlur={hide}
>
  ?
</button>
```

### Trigger CSS (follows D-08 — secondary text, primary on hover)
```css
/* Source: pattern from Tooltip.css + tokens.css */
.shortcut-legend-trigger {
  background: none;
  border: none;
  padding: 0 var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  cursor: help;
  line-height: 1;
  vertical-align: middle;
  font-weight: 600;
}

.shortcut-legend-trigger:hover,
.shortcut-legend-trigger:focus-visible {
  color: var(--color-primary);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Popover CSS (follows D-09, D-10)
```css
/* Source: tokens.css verified — all var() names confirmed */
.shortcut-legend-popover {
  position: fixed;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-sm) var(--spacing-md);
  z-index: 500;
  min-width: 180px;
  max-width: 220px;
}

.shortcut-legend-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 3px 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.shortcut-legend-key {
  display: inline-block;
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  background-color: var(--color-surface-muted);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  padding: 1px 5px;
  min-width: 28px;
  text-align: center;
  line-height: 1.5;
}
```

### Integration into chat-input-bar (ProtocolTriage.jsx)
```jsx
// Source: ProtocolTriage.jsx lines 1003-1034 — direct read
// Insert <ShortcutLegend /> between mic button and send button
<div className="chat-input-bar">
  <textarea ... />
  <button className="chat-mic-btn" ...>
    ...
    <span className="shortcut-hint">(R)</span>
  </button>
  <ShortcutLegend />   {/* NEW */}
  <button className="chat-send-btn" ...>Enviar</button>
</div>
```

### Right-align popover positioning
```jsx
// Avoids right-edge clipping (Pitfall 3)
const show = () => {
  const rect = triggerRef.current.getBoundingClientRect();
  setPosition({
    right: window.innerWidth - rect.right,
    bottom: window.innerHeight - rect.top + 8,
  });
  setVisible(true);
};

// In JSX:
style={{
  right: position.right,
  bottom: position.bottom,
}}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline `title` attribute | Custom `Tooltip` component | Phase 7 | Styled, accessible, token-backed |
| Global styles | CSS custom properties (tokens) | Phase 7 | Dark mode automatic |

No deprecated patterns relevant to this phase.

---

## Open Questions

1. **Shift+Enter key badge display**
   - What we know: The shortcut is two keys. Displaying `Shift+Enter` in a single badge vs two separate `<kbd>` elements.
   - What's unclear: Which visual treatment fits the ~200px width constraint.
   - Recommendation: Use a single `<kbd>Shift+Enter</kbd>` badge — two-badge treatment is semantically precise but visually noisy for a compact legend. The single badge is glanceable and common in macOS-style cheat sheets (matches D-02 "cheat sheet" feel).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no test infrastructure exists in the project |
| Config file | None (no vitest.config.*, jest.config.*, pytest.ini found) |
| Quick run command | N/A |
| Full suite command | N/A |

No test files exist (`src/**/*.test.*` glob returns empty). No test scripts in `package.json`. The project has no automated test infrastructure.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | `?` button visible in chat-input-bar during active triage | manual-only | N/A — no test runner | ❌ |
| DISC-01 | Legend popover appears on hover of `?` button | manual-only | N/A — no test runner | ❌ |
| DISC-01 | Legend popover appears on keyboard focus of `?` button | manual-only | N/A — no test runner | ❌ |
| DISC-01 | Legend lists all 5 shortcuts with PT-BR labels | manual-only | N/A — no test runner | ❌ |
| DISC-01 | `?` button not visible during recording mode | manual-only | N/A — no test runner | ❌ |

**Manual-only justification:** No automated test framework installed. All DISC-01 validations are visual and interaction-based; they require a running browser. These are verified in the human UAT step of the phase gate.

### Sampling Rate
- **Per task commit:** Manual browser check — load triage screen, verify `?` visible, hover to show legend
- **Per wave merge:** Same manual check plus keyboard-only navigation test (Tab to `?`, press Enter/Space, verify legend appears)
- **Phase gate:** All manual checks green before `/gsd:verify-work`

### Wave 0 Gaps
None — no automated test infrastructure exists project-wide. Tests are out of scope per REQUIREMENTS.md (`Test suite — Known tech debt; separate milestone`). No Wave 0 setup needed; all validation is manual UAT.

---

## Sources

### Primary (HIGH confidence)
- Direct read: `src/components/ui/Tooltip.jsx` — hover/focus pattern, `getBoundingClientRect()`, portal approach, ARIA attributes
- Direct read: `src/components/ui/Tooltip.css` — trigger styling, portal styling, token usage, z-index: 9999
- Direct read: `src/styles/tokens.css` — all `var(--)` token names confirmed (surface, border, shadow-md, radius-md, text-muted, primary, font-size-sm, spacing-xs/sm/md)
- Direct read: `src/components/ProtocolTriage.jsx` lines 224-265 — keyboard shortcut handler (Y, N, R, Esc confirmed working)
- Direct read: `src/components/ProtocolTriage.jsx` lines 1003-1034 — chat-input-bar structure (exact insertion point for ShortcutLegend)
- Direct read: `src/components/ProtocolTriage.css` — z-index values (max 201 in triage view), chat-input-bar flex layout
- Direct read: `package.json` — no test framework installed

### Secondary (MEDIUM confidence)
- N/A — all findings are from direct codebase reads, no external sources needed

### Tertiary (LOW confidence)
- N/A

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all verified in existing codebase
- Architecture: HIGH — Tooltip pattern directly readable; chat-input-bar structure directly verified
- Pitfalls: HIGH — z-index values directly read from CSS; overflow:hidden confirmed in ProtocolTriage.css
- Validation: HIGH — absence of test infrastructure confirmed by package.json + file glob

**Research date:** 2026-04-10
**Valid until:** Stable — no external dependencies; valid until ProtocolTriage.jsx chat-input-bar structure changes
