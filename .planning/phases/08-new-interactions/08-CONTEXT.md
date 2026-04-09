# Phase 8: New Interactions - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Clinicians have a dark mode toggle persisted across sessions, keyboard shortcuts for triage answers, and a voice recording UI that shows real-time feedback before submission. No new triage logic — these are interaction and UX improvements on top of the existing migrated component system.

**Requirements:** DSGN-03, INTR-02, INTR-03

</domain>

<decisions>
## Implementation Decisions

### Dark mode toggle
- **D-01:** Toggle lives in the Header bar (`.header-right` section), accessible from every page without navigation.
- **D-02:** Sun/moon icon button — single click toggles between light and dark. Compact, no switch component needed.
- **D-03:** Animated transition (~200ms crossfade) when switching modes — smooth, not jarring. CSS `transition` on `background-color`, `color`, and `border-color` properties on `[data-app-theme]`.
- **D-04:** First-visit default detects OS preference via `prefers-color-scheme` media query. If OS is dark, app starts in dark mode. Subsequent visits use `localStorage.triax-theme`.
- **D-05:** FOUC script in `index.html` already reads `localStorage.triax-theme` — update it to also check `prefers-color-scheme` when no localStorage value exists.
- **D-06:** Dark mode tokens are 100% defined in `tokens.css` (lines 145-181) — no new token work needed. MTS clinical colors remain immutable across both modes.
- **D-07:** State managed via a `ThemeContext` provider (same pattern as `UserContext` and `ToastProvider`). Exposes `theme` and `toggleTheme`. Updates both `data-app-theme` attribute and `localStorage`.

### Keyboard shortcuts
- **D-08:** No modifier keys for triage answers — bare keys (`Y` for Sim, `N` for Nao) for fastest possible input. Automatically suppressed when focus is inside `<input>`, `<textarea>`, or `<select>` elements (`e.target.tagName` check).
- **D-09:** `Esc` cancels active voice recording (modifier-free, standard convention).
- **D-10:** `R` toggles voice recording on/off during active triage (mnemonic: Record).
- **D-11:** Shortcuts only active during triage session — when `currentNode?.yesNo` is true (yes/no question pending) for Y/N, when in ProtocolTriage route for R/Esc.
- **D-12:** Discoverable via hint labels on buttons — e.g., "Sim (Y)" and "Nao (N)" on the yes/no buttons, mic button shows "(R)". Low-overhead, no separate cheat sheet.
- **D-13:** Visual feedback when shortcut fires — brief highlight/pulse on the corresponding button (~150ms) so clinician sees the action registered without looking at chat.
- **D-14:** Global `keydown` listener attached in ProtocolTriage via `useEffect` — cleaned up on unmount. Not a global app-level listener.

### Voice recording UI
- **D-15:** Inline expansion — when recording starts, the text input area transforms to show recording controls. The input field is replaced (not overlaid) while recording is active. Returns to normal input when recording stops.
- **D-16:** Oscilloscope-style waveform visualization — real-time audio amplitude from `ScriptProcessor.onaudioprocess` event's `getChannelData(0)`. Canvas element renders the waveform.
- **D-17:** Layout: transcript preview is the primary element (larger, centered), waveform and elapsed timer are secondary (smaller, to the side). Clinician's focus is on what's being transcribed, not the audio signal.
- **D-18:** Elapsed timer starts at 0:00 when recording begins, counts up in seconds. Simple `setInterval` with `useState`.
- **D-19:** Live transcript preview shows `partialTranscript` (updating in real-time) + accumulated `finalTranscript` — both already exposed by `useTranscribe` hook.
- **D-20:** Auto-populate for review: when recording stops, the transcript populates the text input. Clinician reviews and confirms before sending — no auto-send. This matches current behavior and avoids patient safety risk from incorrect transcriptions being sent without review.
- **D-21:** Waveform taps into existing `audioContextRef` and `processorRef` from `useTranscribe.js` — no new AudioContext needed. Expose the audio data via a callback or ref that the waveform component reads.
- **D-22:** Recording state uses the existing `isRecording` from `useTranscribe` hook — no duplicate state.

### Claude's Discretion
- Waveform canvas dimensions, line color, and rendering approach (requestAnimationFrame loop)
- Exact transition timing curves for dark mode crossfade
- Recording-to-input transition animation
- Whether ThemeContext lives in `src/contexts/ThemeContext.jsx` or is co-located with the toggle
- How to expose audio data from useTranscribe to the waveform (callback ref vs. shared ref vs. new hook)
- Exact button highlight animation for keyboard shortcut feedback
- Recording UI component structure (single component vs. sub-components)

</decisions>

<specifics>
## Specific Ideas

- Dark mode transition should feel smooth and polished — not a harsh flash between modes
- OS preference detection means clinicians working night shifts get dark mode automatically on first visit
- Keyboard shortcuts without modifiers prioritize speed — clinicians are under time pressure and shouldn't need key combos
- Waveform is secondary to transcript preview — clinicians care about what's being transcribed, not the raw audio signal
- Clinician must confirm before sending transcript — wrong transcription auto-sent during triage is a patient safety risk

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dark mode infrastructure (Phase 5 outputs)
- `src/styles/tokens.css` lines 145-181 — Complete dark mode token definitions under `[data-app-theme="dark"]`
- `index.html` lines 8-16 — FOUC prevention script reading `localStorage.triax-theme`, needs OS preference fallback
- `src/App.jsx` line 42 — Hardcoded `data-app-theme="light"` that must become dynamic
- `src/components/Header.jsx` — Toggle placement target; `.header-right` section
- `src/components/Header.css` — Already uses token-backed CSS, dark-mode ready

### Voice recording (existing implementation)
- `src/useTranscribe.js` — Full hook: exposes `isRecording`, `finalTranscript`, `partialTranscript`, `start`, `stop`, `reset`; AudioContext at lines 62-70; raw audio data at lines 78-85 via `processor.onaudioprocess`
- `src/components/ProtocolTriage.jsx` lines 414-444 — Current hook usage, `handleToggleRecording`, text concatenation logic
- `src/components/ProtocolTriage.jsx` lines 1161-1187 — Current mic button rendering

### Keyboard shortcut targets
- `src/components/ProtocolTriage.jsx` lines 1131-1148 — Yes/No buttons calling `handleSendMessage('Sim'/'Nao')`
- `src/components/ProtocolTriage.jsx` line 541 — `handleSendMessage()` function (the action shortcuts will invoke)
- `src/components/ProtocolTriage.jsx` line 1155 — Existing Enter key handler on text input (must coexist)

### Context patterns
- `src/contexts/UserContext.jsx` — Reference pattern for ThemeContext (createContext + Provider + useContext)
- `src/components/ui/ToastProvider.jsx` — Another Context provider pattern in the app

### Prior phase decisions
- `.planning/phases/05-design-token-foundation/05-CONTEXT.md` — Token structure (D-05..D-08), FOUC approach, `[data-app-theme]` scoping
- `.planning/phases/07-component-migration-accessibility/07-CONTEXT.md` — Focus-visible pattern (D-17..D-19), accessible interaction patterns
- `.planning/STATE.md` §Accumulated Context > Decisions — FOUC blocking script, immutable MTS colors, atomic migration
- `.planning/STATE.md` §Blockers/Concerns — macOS Alt+key conflict flagged for Phase 8 (resolved: using bare keys, no modifier)

### Requirements
- `.planning/REQUIREMENTS.md` — DSGN-03 (dark mode toggle + localStorage), INTR-02 (keyboard shortcuts, modifier+key, Esc cancel), INTR-03 (waveform, timer, live transcript)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useTranscribe` hook: Full audio pipeline (AudioContext, ScriptProcessor, AWS Transcribe streaming) — waveform visualization taps into existing `processor.onaudioprocess` data
- `UserContext` pattern: Provider + createContext + useContext — blueprint for ThemeContext
- `ToastProvider` pattern: App-level wrapper providing hook-based API — same approach for ThemeProvider
- Dark mode tokens in `tokens.css`: All semantic colors have dark overrides — no design work needed
- FOUC script in `index.html`: Already reads localStorage — extend with `prefers-color-scheme` check
- `TriageDetailsModal` keyboard handler (lines 27-48): Reference for `keydown` event listener pattern with cleanup
- `.animate-fade-in` class: Existing CSS animation utility — reference for shortcut pulse animation

### Established Patterns
- Co-located CSS: `Component.jsx` + `Component.css` — recording UI components follow this pattern
- `[data-app-theme]` scoping: All semantic tokens scoped here; dark mode just changes the attribute value
- Context providers wrap inside Authenticator (toasts, user) — ThemeProvider goes in same stack
- Atomic migration: No mixed approaches per file — full implementation per component

### Integration Points
- `src/App.jsx`: ThemeProvider wraps app; `data-app-theme` attribute becomes dynamic via ThemeContext
- `src/components/Header.jsx`: Dark mode toggle icon button added to `.header-right`
- `src/components/ProtocolTriage.jsx`: Keyboard listener via `useEffect`; recording UI replaces current mic button section; auto-send countdown after recording
- `src/useTranscribe.js`: May need to expose audio data ref/callback for waveform component to consume

</code_context>

<deferred>
## Deferred Ideas

- Three-way theme option (light/dark/system) — currently two-way with OS detection on first visit only. Could add explicit "follow system" option in a future settings phase.
- Keyboard shortcut cheat sheet / help overlay — discoverable hints on buttons are sufficient for pilot; a full overlay is over-engineered for 4 shortcuts.
- Audio frequency analysis (equalizer bars) — oscilloscope is simpler and sufficient for "recording active" feedback.

</deferred>

---

*Phase: 08-new-interactions*
*Context gathered: 2026-04-08*
