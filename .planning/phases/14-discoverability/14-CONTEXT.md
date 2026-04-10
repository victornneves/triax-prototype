# Phase 14: Discoverability - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface keyboard shortcut legend so clinicians can find Y/N/R/Esc bindings during active triage. This is a single UI affordance — no new shortcuts, no new keybindings, no command palette.

**Requirements:** DISC-01
**Depends on:** Phase 11 (keyboard shortcuts must work before we teach users about them)

</domain>

<decisions>
## Implementation Decisions

### Legend trigger and format
- **D-01:** A small `?` help icon/button in the chat input bar area that reveals a shortcut legend on hover/focus. Not a persistent floating panel — clinical screens need every pixel; the legend is reference material, not a primary control.
- **D-02:** The legend content is a compact list of all active shortcuts: Y (Sim), N (Nao), R (Gravar), Esc (Parar gravacao), Shift+Enter (Nova linha). Five entries total.
- **D-03:** Use a dedicated `ShortcutLegend` component — do NOT reuse the existing `Tooltip` component. Tooltip is designed for single-line info text on a `?` icon trigger. The shortcut legend needs a multi-row table/grid layout that doesn't fit the Tooltip's content model. The trigger can follow Tooltip's hover/focus pattern, but the popover needs its own structure.

### Placement
- **D-04:** The `?` trigger sits in the `chat-input-bar` div, between the mic button and the send button (or after the send button). It must be visible whenever the chat input is visible — i.e., during active triage, not during recording mode (recording panel replaces input bar).
- **D-05:** The legend popover opens above the trigger (same direction as Tooltip's default), positioned to avoid clipping against the right edge of the chat column.

### Visibility behavior
- **D-06:** Trigger is always visible during active triage (whenever `chat-input-bar` renders). No auto-dismiss, no "show once then hide" — the `?` icon stays. Legend appears on hover and on focus (keyboard accessible).
- **D-07:** No `?` keyboard shortcut to toggle the legend — the icon hover/focus is sufficient. Adding a `?` key listener would conflict with Shift+/ on international keyboards.

### Visual style
- **D-08:** The `?` icon should be subtle — secondary text color, small (matches font-size-sm), no background. On hover: primary color. Same visual weight as the existing `shortcut-hint` spans.
- **D-09:** Legend popover uses token-backed styling: `--color-surface` background, `--shadow-md` elevation, `--radius-md` corners, `--color-border` outline. Matches the Tooltip visual language but is wider (multi-column content).
- **D-10:** Each shortcut row shows: key badge (styled like a keyboard key — border, slight background, monospace) + action label in PT-BR. Compact — no more than ~200px wide.
- **D-11:** Dark mode: popover inherits semantic tokens (surface, border, text) automatically — no special dark mode work needed.

### Claude's Discretion
- Exact pixel dimensions of the legend popover
- Whether to use a `<kbd>` element or a styled `<span>` for key badges
- Animation on popover show/hide (subtle fade or none)
- Z-index value (must be above chat content but below any modal)

</decisions>

<specifics>
## Specific Ideas

- The legend should feel like a cheat sheet — glanceable, not a tutorial. Think macOS menu bar shortcut hints.
- Key badges should look like physical keyboard keys (subtle border + slight gray background) to reinforce that these are keyboard actions.
- PT-BR labels for actions: "Sim", "Nao", "Gravar audio", "Parar gravacao", "Nova linha"

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Keyboard shortcut implementation
- `src/components/ProtocolTriage.jsx` lines 224-265 — Full keyboard shortcut handler (Y, N, R, Esc logic + form field suppression)
- `src/components/ProtocolTriage.jsx` lines 954-970 — Quick-reply buttons with inline `(Y)` `(N)` hints
- `src/components/ProtocolTriage.jsx` lines 1003-1034 — Chat input bar (where the `?` trigger goes)
- `src/components/ProtocolTriage.jsx` lines 994-998 — Recording stop button with inline `(Esc)` hint
- `src/components/ProtocolTriage.jsx` lines 1015-1025 — Mic button with inline `(R)` hint

### Existing Tooltip component (reference pattern, not for reuse)
- `src/components/ui/Tooltip.jsx` — Hover/focus trigger, portal positioning, ARIA describedby
- `src/components/ui/Tooltip.css` — Tooltip styling with design tokens

### CSS patterns
- `src/components/ProtocolTriage.css` lines 617-636 — `.shortcut-hint` and `.shortcut-active` styles
- `src/styles/tokens.css` — Design token definitions (spacing, color, radius, shadow)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Tooltip` component: Its hover/focus trigger pattern can be referenced, but the component itself shouldn't be reused (D-03). The legend needs a grid layout, not a text bubble.
- `.shortcut-hint` CSS class: Already styles inline shortcut text — the legend's key labels can share this visual language.
- Design tokens: All styling uses `var(--*)` tokens — the legend follows the same pattern.

### Established Patterns
- Hover/focus reveal: Tooltip uses `onMouseEnter`/`onMouseLeave` + `onFocus`/`onBlur` with `useRef` for positioning. ShortcutLegend follows the same event pattern.
- BEM naming: ProtocolTriage uses flat class names (`chat-input-bar`, `chat-send-btn`). The legend can use either flat or BEM — match the surrounding code.
- Portal positioning: Tooltip calculates position via `getBoundingClientRect()`. Legend can do the same, or use simpler absolute positioning since it's always in the same spot.

### Integration Points
- `chat-input-bar` div in ProtocolTriage.jsx (~line 1003): The `?` trigger button goes here as a sibling of mic/send buttons.
- `ProtocolTriage.css`: New styles for `.shortcut-legend-*` classes go here (or in a new `ShortcutLegend.css` if extracted to its own component file).
- No state changes to ProtocolTriage — the legend is self-contained (local `useState` for visibility, or pure CSS `:hover`/`:focus-within`).

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-discoverability*
*Context gathered: 2026-04-10*
