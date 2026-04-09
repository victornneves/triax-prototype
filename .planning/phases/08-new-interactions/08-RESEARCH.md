# Phase 8: New Interactions - Research

**Researched:** 2026-04-08
**Domain:** Dark mode toggle (ThemeContext + CSS tokens), keyboard shortcuts (keydown listeners), voice recording UI (Canvas waveform + elapsed timer + live transcript preview)
**Confidence:** HIGH — all findings grounded in existing codebase inspection, established project patterns, and well-known browser APIs

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dark mode toggle:**
- D-01: Toggle lives in the Header bar (`.header-right` section), accessible from every page without navigation.
- D-02: Sun/moon icon button — single click toggles between light and dark. Compact, no switch component needed.
- D-03: Animated transition (~200ms crossfade) when switching modes. CSS `transition` on `background-color`, `color`, and `border-color` properties on `[data-app-theme]`.
- D-04: First-visit default detects OS preference via `prefers-color-scheme` media query. If OS is dark, app starts in dark mode. Subsequent visits use `localStorage.triax-theme`.
- D-05: FOUC script in `index.html` already reads `localStorage.triax-theme` — update it to also check `prefers-color-scheme` when no localStorage value exists.
- D-06: Dark mode tokens are 100% defined in `tokens.css` (lines 145-181) — no new token work needed. MTS clinical colors remain immutable across both modes.
- D-07: State managed via a `ThemeContext` provider (same pattern as `UserContext` and `ToastProvider`). Exposes `theme` and `toggleTheme`. Updates both `data-app-theme` attribute and `localStorage`.

**Keyboard shortcuts:**
- D-08: No modifier keys for triage answers — bare keys (`Y` for Sim, `N` for Nao). Automatically suppressed when focus is inside `<input>`, `<textarea>`, or `<select>` elements (`e.target.tagName` check).
- D-09: `Esc` cancels active voice recording (modifier-free, standard convention).
- D-10: `R` toggles voice recording on/off during active triage (mnemonic: Record).
- D-11: Shortcuts only active during triage session — `currentNode?.yesNo` must be true for Y/N; in ProtocolTriage route for R/Esc.
- D-12: Discoverable via hint labels on buttons — e.g., "Sim (Y)" and "Nao (N)" on the yes/no buttons, mic button shows "(R)".
- D-13: Visual feedback when shortcut fires — brief highlight/pulse on the corresponding button (~150ms) so clinician sees the action registered.
- D-14: Global `keydown` listener attached in ProtocolTriage via `useEffect` — cleaned up on unmount. Not a global app-level listener.

**Voice recording UI:**
- D-15: Inline expansion — when recording starts, the text input area transforms to show recording controls. The input field is replaced (not overlaid) while recording is active.
- D-16: Oscilloscope-style waveform visualization — real-time audio amplitude from `ScriptProcessor.onaudioprocess` event's `getChannelData(0)`. Canvas element renders the waveform.
- D-17: Layout: transcript preview is the primary element (larger, centered), waveform and elapsed timer are secondary (smaller, to the side).
- D-18: Elapsed timer starts at 0:00 when recording begins, counts up in seconds. Simple `setInterval` with `useState`.
- D-19: Live transcript preview shows `partialTranscript` (updating in real-time) + accumulated `finalTranscript` — both already exposed by `useTranscribe` hook.
- D-20: Auto-populate for review: when recording stops, the transcript populates the text input. Clinician reviews and confirms before sending — no auto-send.
- D-21: Waveform taps into existing `audioContextRef` and `processorRef` from `useTranscribe.js` — no new AudioContext needed. Expose the audio data via a callback or ref that the waveform component reads.
- D-22: Recording state uses the existing `isRecording` from `useTranscribe` hook — no duplicate state.

### Claude's Discretion
- Waveform canvas dimensions, line color, and rendering approach (requestAnimationFrame loop)
- Exact transition timing curves for dark mode crossfade
- Recording-to-input transition animation
- Whether ThemeContext lives in `src/contexts/ThemeContext.jsx` or is co-located with the toggle
- How to expose audio data from useTranscribe to the waveform (callback ref vs. shared ref vs. new hook)
- Exact button highlight animation for keyboard shortcut feedback
- Recording UI component structure (single component vs. sub-components)

### Deferred Ideas (OUT OF SCOPE)
- Three-way theme option (light/dark/system)
- Keyboard shortcut cheat sheet / help overlay
- Audio frequency analysis (equalizer bars)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-03 | User can toggle between light and dark mode with preference persisted in localStorage | ThemeContext pattern, tokens.css dark overrides already complete, FOUC script update, `data-app-theme` attribute on `app-container` div |
| INTR-02 | Clinician can use keyboard shortcuts in triage flow (bare keys Y/N for yes/no, Esc to cancel recording, R to toggle recording) | `useEffect`/`keydown` pattern (ref: TriageDetailsModal), `handleSendMessage` already accepts `overrideText`, input-focus suppression via `e.target.tagName` |
| INTR-03 | Voice recording shows waveform animation, elapsed timer, and live transcript preview before sending | Canvas waveform from `processor.onaudioprocess` data, `setInterval` timer, `partialTranscript`+`finalTranscript` from `useTranscribe`, no auto-send |
</phase_requirements>

---

## Summary

Phase 8 delivers three interaction improvements on top of an already-complete token and component system. No new triage logic is involved. The dark mode infrastructure is 100% pre-built in `tokens.css` lines 145-181; the only remaining work is wiring a `ThemeContext` that writes `data-app-theme` to the `app-container` div and updates `localStorage`. The FOUC script in `index.html` needs a one-line extension to check `prefers-color-scheme` when no localStorage value exists.

Keyboard shortcuts are scoped entirely to `ProtocolTriage.jsx` via a `useEffect`-attached `keydown` listener, which is the exact pattern already used in `TriageDetailsModal.jsx`. The Y/N shortcuts call the existing `handleSendMessage('Sim'/'Nao')` function directly — no new logic needed, just an event listener with an input-focus guard. Visual feedback uses a short CSS class toggle (`.shortcut-active` with a 150ms animation) on the target button via a ref or dataset attribute.

The voice recording UI is the most structural change: the current mic button section in the `chat-input-bar` becomes a conditional render — normal input bar when not recording, and an expanded recording panel when `isRecording` is true. The waveform needs access to the raw audio data from `processor.onaudioprocess`. The cleanest approach (within discretion) is to add an `onAudioData` callback ref to `useTranscribe` that fires during `processor.onaudioprocess`, allowing the waveform canvas component to draw amplitude data without requiring a new `AudioContext`.

**Primary recommendation:** Wire ThemeContext first (touches App.jsx, Header.jsx, index.html), then keyboard shortcuts (scoped to ProtocolTriage, low risk), then recording UI (most structural, most isolated to the chat-input-bar section of ProtocolTriage).

---

## Standard Stack

### Core (no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Context, hooks, state | Already in project |
| CSS Custom Properties | N/A | Dark mode token switching | Already fully defined in tokens.css |
| Web Audio API (`ScriptProcessorNode`) | Browser native | Raw audio amplitude for waveform | Already used in `useTranscribe.js` |
| HTML Canvas API | Browser native | Waveform oscilloscope rendering | Standard, no library needed |
| `localStorage` | Browser native | Theme persistence | Already used in FOUC script |
| `prefers-color-scheme` media query | Browser native | OS preference detection on first visit | Standard CSS media query API |

### No New NPM Packages Required
All capabilities needed for this phase are already in the project or available as browser APIs. The waveform is a canvas draw loop. The timer is `setInterval`. The theme is CSS. No library installs needed.

---

## Architecture Patterns

### Recommended File Structure (new files only)
```
src/
├── contexts/
│   ├── UserContext.jsx          (existing)
│   └── ThemeContext.jsx         (NEW — ThemeProvider + useTheme)
├── components/
│   ├── Header.jsx               (MODIFY — add toggle button)
│   ├── Header.css               (MODIFY — add toggle button styles)
│   ├── ProtocolTriage.jsx       (MODIFY — keyboard shortcuts + recording UI)
│   └── ProtocolTriage.css       (MODIFY — recording panel styles)
├── useTranscribe.js             (MODIFY — expose onAudioData callback)
├── App.jsx                      (MODIFY — ThemeProvider wrapper, dynamic data-app-theme)
├── styles/
│   └── tokens.css               (NO CHANGE — dark tokens complete)
└── index.html                   (MODIFY — FOUC script gets prefers-color-scheme fallback)
```

### Pattern 1: ThemeContext — same shape as UserContext
**What:** React Context that holds `theme` ('light'|'dark') and `toggleTheme()`. On mount, reads `localStorage.triax-theme`. On toggle, updates both `localStorage` and the `data-app-theme` attribute on the `.app-container` div.

**When to use:** Any component that needs to read current theme or trigger a toggle.

**Key implementation detail:** `data-app-theme` is currently a hardcoded prop on the `app-container` div in `App.jsx` line 42. ThemeContext must control this attribute. Options:
1. Pass `theme` from ThemeContext into `AppContent` and set `data-app-theme={theme}` on the div — clean, JSX-native.
2. Use a `ref` on the div and set `ref.current.dataset.appTheme` imperatively — avoids re-render but messier.

Option 1 is cleaner and consistent with how the existing UserContext pattern works. The re-render is acceptable since theme changes are infrequent user actions.

**Example (ThemeContext.jsx pattern, derived from UserContext.jsx):**
```jsx
// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        try {
            const stored = localStorage.getItem('triax-theme');
            if (stored) return stored;
            // OS preference detection (D-04)
            return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
        } catch {
            return 'light';
        }
    });

    useEffect(() => {
        localStorage.setItem('triax-theme', theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
```

### Pattern 2: Provider wrapping order in App.jsx
**Current stack (inside Authenticator):**
```jsx
<ToastProvider>
  <UserProvider>
    <AppContent signOut={signOut} />
  </UserProvider>
</ToastProvider>
```

**After adding ThemeProvider:**
```jsx
<ThemeProvider>
  <ToastProvider>
    <UserProvider>
      <AppContent signOut={signOut} />
    </UserProvider>
  </ToastProvider>
</ThemeProvider>
```

ThemeProvider goes outermost because it needs to be available to all components including Header (which lives inside AppContent). It does not depend on auth session, so it can safely wrap the Authenticator children.

**Critical:** `data-app-theme` on the `app-container` div in `AppContent` becomes `data-app-theme={theme}` where `theme` is consumed via `useTheme()`. The FOUC script on `documentElement` is a separate early-read for flash prevention only — it does not need to stay in sync with React state; it just prevents a white flash before React hydrates.

### Pattern 3: FOUC script update (index.html)
**Current FOUC script reads only localStorage:**
```js
var t = localStorage.getItem('triax-theme') || 'light';
document.documentElement.setAttribute('data-app-theme', t);
```

**Updated to check OS preference when no localStorage value (D-05):**
```js
(function() {
    try {
        var stored = localStorage.getItem('triax-theme');
        var t = stored
            ? stored
            : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-app-theme', t);
    } catch(e) {
        document.documentElement.setAttribute('data-app-theme', 'light');
    }
})();
```

**Note:** The FOUC script sets `data-app-theme` on `<html>` (documentElement). ThemeContext sets it on the `.app-container` div. This is intentional: the FOUC script fires before React, so it needs a target that exists. Once React hydrates, the `.app-container` div's attribute takes over for token scoping. Since tokens are scoped to `[data-app-theme]` (not `html[data-app-theme]`), both work — but the React-controlled div is the canonical runtime source of truth. The FOUC script only prevents a visible flash; it does not participate in ongoing toggle logic.

### Pattern 4: Dark mode CSS transition (D-03)
**What:** All token-backed properties smoothly crossfade when `data-app-theme` changes. Add to `[data-app-theme]` rule in tokens.css or App.css:

```css
[data-app-theme] {
    transition:
        background-color 200ms ease,
        color 200ms ease,
        border-color 200ms ease;
}
```

**Caution:** This transition on the root container can be performance-expensive if applied to deeply nested elements. Apply only to the `[data-app-theme]` container (the `.app-container` div), not to every child. Child elements inherit the transition through CSS cascade; they do not each need it declared.

**IMPORTANT: Suppress transition on FOUC.** If the FOUC script sets a theme before React loads, adding `transition` to `[data-app-theme]` could cause a flash-of-transition on page load (the opposite of what's intended). The conventional solution is to add a `.no-transition` class during page load and remove it after React mounts:
```jsx
// In ThemeProvider, after mount:
useEffect(() => {
    document.body.classList.remove('no-transition');
}, []);
```
With matching CSS:
```css
.no-transition * { transition: none !important; }
```
This is discretionary — for the pilot, the FOUC flash is minor and this optimization can be deferred if it adds complexity.

### Pattern 5: Keyboard shortcut listener — scoped useEffect in ProtocolTriage
**What:** Global `keydown` event listener on `document` (or `window`), attached in ProtocolTriage's `useEffect` and cleaned up on unmount. This is the exact pattern used in `TriageDetailsModal.jsx` lines 46-48.

**Input focus guard (D-08):** Check `document.activeElement.tagName` or `e.target.tagName` before firing:
```js
const SUPPRESSED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

const handleKeyDown = (e) => {
    if (SUPPRESSED_TAGS.has(document.activeElement.tagName)) return;

    if (currentNode?.yesNo && !loading) {
        if (e.key === 'y' || e.key === 'Y') {
            e.preventDefault();
            triggerShortcutFeedback('sim');
            handleSendMessage('Sim');
            return;
        }
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            triggerShortcutFeedback('nao');
            handleSendMessage('Não');
            return;
        }
    }

    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleToggleRecording();
        return;
    }

    if (e.key === 'Escape' && isRecording) {
        e.preventDefault();
        stopRecording();
        return;
    }
};

useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
}, [currentNode, loading, isRecording]); // deps ensure stale closure doesn't capture old state
```

**Stale closure risk:** The `handleKeyDown` function captures `currentNode`, `loading`, and `isRecording` from closure. The dependency array on `useEffect` must include all values used inside. Alternatively, use refs for these values to avoid re-registering the listener on every state change.

### Pattern 6: Shortcut visual feedback (D-13)
**What:** Brief highlight/pulse on the Y/N or R button when the shortcut fires (~150ms). Use a `useState` flag per button or a single `activeShortcut` state value ('sim' | 'nao' | null).

```jsx
const [activeShortcut, setActiveShortcut] = useState(null);

const triggerShortcutFeedback = (key) => {
    setActiveShortcut(key);
    setTimeout(() => setActiveShortcut(null), 150);
};
```

Apply to buttons as a modifier class:
```jsx
<button
    className={`chat-quick-reply-btn${activeShortcut === 'sim' ? ' chat-quick-reply-btn--active' : ''}`}
    onClick={() => handleSendMessage('Sim')}
>
    Sim (Y)
</button>
```

CSS:
```css
.chat-quick-reply-btn--active {
    box-shadow: 0 0 0 3px var(--color-primary);
    transform: scale(0.97);
    transition: box-shadow 150ms ease, transform 150ms ease;
}
```

### Pattern 7: Waveform — Canvas + requestAnimationFrame + audio data from useTranscribe
**What:** A `<canvas>` element draws an oscilloscope-style waveform by reading audio amplitude data captured during `processor.onaudioprocess`.

**Audio data exposure strategy (discretion area):** The cleanest option is to add an `onAudioData` callback prop to `useTranscribe`'s returned API — a ref that the consumer can set:

```js
// In useTranscribe.js — add to returned object:
const audioDataCallbackRef = useRef(null);

// In processor.onaudioprocess:
processor.onaudioprocess = (event) => {
    if (!runningRef.current) return;
    const float32 = event.inputBuffer.getChannelData(0);
    const copy = new Float32Array(float32.length);
    copy.set(float32);
    queue.push(copy);
    // NEW: fire callback for waveform visualization
    if (audioDataCallbackRef.current) {
        audioDataCallbackRef.current(float32);
    }
};

// Returned from hook:
return {
    isRecording, error, finalTranscript, partialTranscript,
    start, stop, reset,
    audioDataCallbackRef,  // consumer sets this to receive audio frames
};
```

**Canvas draw loop:**
```jsx
// WaveformCanvas.jsx (or inline in recording panel)
const canvasRef = useRef(null);
const rafRef = useRef(null);
const latestAudioRef = useRef(new Float32Array(0));

// Register callback on useTranscribe
useEffect(() => {
    audioDataCallbackRef.current = (data) => {
        latestAudioRef.current = data;
    };
    return () => { audioDataCallbackRef.current = null; };
}, [audioDataCallbackRef]);

// Draw loop
useEffect(() => {
    if (!isRecording) {
        cancelAnimationFrame(rafRef.current);
        return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
        const data = latestAudioRef.current;
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'var(--color-primary)'; // Note: CSS vars don't work in canvas ctx — use computed value
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const sliceWidth = W / data.length;
        let x = 0;
        for (let i = 0; i < data.length; i++) {
            const v = data[i] * 0.5 + 0.5; // normalize 0..1
            const y = v * H;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
}, [isRecording]);
```

**CSS variable caveat:** Canvas `ctx.strokeStyle` cannot use CSS custom properties (e.g., `var(--color-primary)`). Use `getComputedStyle` to resolve the value, or hardcode a color value. For the waveform, a hardcoded teal is acceptable since it's a decorative indicator:
```js
ctx.strokeStyle = '#14b8a6'; // var(--color-teal-500) resolved value
```

### Pattern 8: Elapsed timer (D-18)
**Simple setInterval pattern:**
```jsx
const [elapsedSeconds, setElapsedSeconds] = useState(0);

useEffect(() => {
    if (!isRecording) {
        setElapsedSeconds(0);
        return;
    }
    const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
}, [isRecording]);

// Format display:
const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
```

### Pattern 9: Recording UI — conditional render in chat-input-bar (D-15)
**What:** When `isRecording` is true, replace the `chat-input-bar` contents with a recording panel. When false, show the normal input bar.

```jsx
{isRecording ? (
    <div className="recording-panel">
        <div className="recording-panel__transcript">
            {finalTranscript && <span>{finalTranscript}</span>}
            {partialTranscript && <span className="recording-panel__partial">{partialTranscript}</span>}
            {!finalTranscript && !partialTranscript && (
                <span className="recording-panel__placeholder">Ouvindo...</span>
            )}
        </div>
        <div className="recording-panel__controls">
            <canvas ref={canvasRef} className="recording-panel__waveform" width={120} height={36} />
            <span className="recording-panel__timer">{formatTime(elapsedSeconds)}</span>
            <button onClick={stopRecording} className="recording-panel__stop-btn">
                Parar
            </button>
        </div>
    </div>
) : (
    <div className="chat-input-bar">
        {/* existing input + mic + send */}
    </div>
)}
```

### Anti-Patterns to Avoid
- **Applying CSS transition to every element individually:** Only the `[data-app-theme]` container needs the transition declaration. Children inherit.
- **Adding `data-app-theme` to multiple elements:** One canonical element (`app-container` div) is the source of truth. The FOUC script on `documentElement` is a pre-hydration workaround only.
- **Registering a global keydown listener at the App level:** Keep it in ProtocolTriage so it is only active when the component is mounted. Follows D-14.
- **Auto-sending transcript on recording stop:** Explicitly blocked by D-20 — patient safety risk. Always populate input for clinician review.
- **Using `display: none` to toggle recording UI:** Prefer conditional rendering (`{isRecording ? ... : ...}`) so the normal input's state is cleanly reset.
- **Stale closure on keydown handler:** Without correct deps in `useEffect`, `currentNode` and `loading` captured in the handler will be stale. Either list them as deps or use refs.
- **New AudioContext in the waveform component:** The context already exists in `useTranscribe`. Adding a second one wastes resources. Per D-21, tap into `processorRef`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme storage | Custom theme persistence logic | `localStorage.getItem/setItem('triax-theme')` | Single key, already used by FOUC script — consistency |
| OS preference detection | Device detection library | `window.matchMedia('(prefers-color-scheme: dark)')` | Browser native, zero bytes |
| Waveform visualization | External charting library | HTML Canvas + requestAnimationFrame | Canvas draw loop is ~30 lines; any library adds weight for a decorative indicator |
| Elapsed timer | Luxon / date-fns | `setInterval` + `useState` | Counter from 0, no date math needed |
| Keyboard shortcut library | hotkeys-js, mousetrap | `document.addEventListener('keydown', ...)` | 4 shortcuts, no chord sequences, no library warranted |
| Real-time audio capture | New AudioContext | Reuse `useTranscribe`'s existing `processorRef` | AudioContext already open; creating a second one risks resource contention |

**Key insight:** This phase is entirely built from existing browser primitives and existing project infrastructure. The token system, audio pipeline, and component patterns are all pre-built. Every task is wiring, not building.

---

## Common Pitfalls

### Pitfall 1: FOUC on theme switch (not the initial load — the toggle)
**What goes wrong:** When the user clicks the toggle and ThemeContext updates `data-app-theme`, if the CSS transition is not applied before the attribute change, the switch is instant/jarring.
**Why it happens:** CSS transitions only apply to transitions between existing styles. If the transition property isn't declared before the attribute changes, there's nothing to interpolate.
**How to avoid:** The `transition` rule must be on `[data-app-theme]` in the base CSS before any theme change fires. Ensure the transition declaration is in `tokens.css` or `App.css` in the initial stylesheet load.
**Warning signs:** Clicking toggle causes instant color switch with no animation.

### Pitfall 2: Initial page load flash of transition
**What goes wrong:** The FOUC script sets `data-app-theme` on the HTML element before CSS loads. When the stylesheet with the `transition` declaration loads, the browser may animate from the FOUC-applied theme to the React-applied theme.
**Why it happens:** The CSS transition fires when the element's properties change — including the initial application of properties after the stylesheet loads.
**How to avoid:** The `.no-transition` / `transition: none !important` pattern during mount (described in Pattern 4). For the pilot, this may be acceptable to defer if the flash is imperceptible in practice.
**Warning signs:** On hard reload, a brief flash/fade is visible before the UI settles.

### Pitfall 3: Stale closure in keydown handler
**What goes wrong:** Y/N shortcuts fire but use stale `currentNode` or `loading` values — either firing when they shouldn't or not firing when they should.
**Why it happens:** The `useEffect` that attaches the listener captures the values of `currentNode` and `loading` at registration time. If the deps array is missing or incorrect, the handler is never re-registered with fresh values.
**How to avoid:** Include `currentNode`, `loading`, and `isRecording` in the `useEffect` dependency array. Or store these in refs that are always current, and read refs inside the handler.
**Warning signs:** Y shortcut fires when `currentNode.yesNo` is false, or does not fire when it should be true.

### Pitfall 4: Canvas strokeStyle doesn't accept CSS variables
**What goes wrong:** `ctx.strokeStyle = 'var(--color-primary)'` renders as black (invalid color falls back to black) instead of teal.
**Why it happens:** Canvas API operates on resolved values; CSS custom properties are not resolved in the Canvas 2D context.
**How to avoid:** Use the resolved primitive value directly: `'#14b8a6'` (teal-500). Alternatively: `getComputedStyle(canvasRef.current).getPropertyValue('--color-teal-500').trim()` — but this is overkill for a decorative waveform.
**Warning signs:** Waveform renders as a black line.

### Pitfall 5: Two AudioContexts causing resource contention
**What goes wrong:** A second `new AudioContext()` created for the waveform component operates alongside the one in `useTranscribe`, consuming extra memory and potentially hitting the browser's AudioContext limit (Chrome: 6 max).
**Why it happens:** The waveform is implemented as a standalone component that doesn't know about the existing context.
**How to avoid:** Per D-21, expose `audioDataCallbackRef` from `useTranscribe` and let the waveform subscribe to already-processed audio data. Never create a new AudioContext in the waveform component.
**Warning signs:** Browser console warning about AudioContext limit; potential memory leak on session restart.

### Pitfall 6: `data-app-theme` attribute on wrong element
**What goes wrong:** Changing `data-app-theme` on `<html>` (documentElement) instead of `.app-container` div causes the Amplify Authenticator (which renders outside `.app-container`) to pick up the theme tokens, possibly breaking the auth screen.
**Why it happens:** The FOUC script sets it on `<html>` because the div doesn't exist yet. This tempts developers to reuse the same target.
**How to avoid:** The FOUC script on `<html>` is a pre-hydration one-shot. After React mounts, `data-app-theme` on `.app-container` is the runtime canonical. ThemeContext must target the `.app-container` div. The `<html>` attribute from FOUC can remain — it is harmless since tokens are scoped to `[data-app-theme]` within the app container ancestry — but ThemeContext should not write to `documentElement`.
**Warning signs:** Amplify auth screen changes appearance when dark mode is enabled.

### Pitfall 7: Recording panel losing inputText on toggle
**What goes wrong:** When the user switches from recording back to input mode, any text they had typed before starting recording is lost.
**Why it happens:** The input panel is conditionally rendered, so if `inputText` state is not preserved, it resets.
**How to avoid:** The existing `textBeforeRecording` state already handles this (ProtocolTriage.jsx line 424). The transcript-to-input population in the `useEffect` at line 427-433 already combines `textBeforeRecording + finalTranscript + partialTranscript`. Ensure this logic is not disrupted by the recording panel refactor.
**Warning signs:** After stopping recording, the previously-typed text does not appear in the input.

---

## Code Examples

### ThemeContext full pattern
```jsx
// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        try {
            const stored = localStorage.getItem('triax-theme');
            if (stored) return stored;
            return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });

    useEffect(() => {
        try { localStorage.setItem('triax-theme', theme); } catch { /* quota */ }
    }, [theme]);

    const toggleTheme = () =>
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
```

### App.jsx — dynamic data-app-theme
```jsx
// AppContent receives theme from context
function AppContent({ signOut }) {
    const { error } = useUser();
    const { theme } = useTheme();
    // ...
    return (
        <BrowserRouter>
            <div className="app-container" data-app-theme={theme}>
                {/* ... */}
            </div>
        </BrowserRouter>
    );
}

// App wraps ThemeProvider outermost
function App() {
    return (
        <Authenticator>
            {({ signOut }) => (
                <ThemeProvider>
                    <ToastProvider>
                        <UserProvider>
                            <AppContent signOut={signOut} />
                        </UserProvider>
                    </ToastProvider>
                </ThemeProvider>
            )}
        </Authenticator>
    );
}
```

### Header toggle button
```jsx
// In Header.jsx — add to header-right div
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ signOut }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <header className="app-header">
            {/* ... existing left/nav ... */}
            <div className="header-right">
                {/* existing items */}
                <button
                    onClick={toggleTheme}
                    className="header-theme-btn"
                    aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                    title={isDark ? 'Modo claro' : 'Modo escuro'}
                >
                    {isDark ? '☀' : '☾'}
                </button>
                {/* signout button */}
            </div>
        </header>
    );
};
```

### FOUC script with OS preference fallback
```html
<script>
  (function() {
    try {
      var stored = localStorage.getItem('triax-theme');
      var t = stored
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-app-theme', t);
    } catch(e) {
      document.documentElement.setAttribute('data-app-theme', 'light');
    }
  })();
</script>
```

### useTranscribe.js — audioDataCallbackRef addition
```js
// Add to useTranscribe hook body:
const audioDataCallbackRef = useRef(null);

// In processor.onaudioprocess (after line 83 in current file):
if (audioDataCallbackRef.current) {
    audioDataCallbackRef.current(float32);
}

// Add to return object:
return {
    isRecording, error, finalTranscript, partialTranscript,
    start, stop, reset,
    audioDataCallbackRef,
};
```

---

## Integration Points Summary

| File | What Changes | Scope |
|------|-------------|-------|
| `index.html` | FOUC script: add `prefers-color-scheme` check | 3-line change |
| `src/contexts/ThemeContext.jsx` | NEW — ThemeProvider + useTheme | ~30 lines |
| `src/App.jsx` | Import ThemeProvider, wrap app, pass `data-app-theme={theme}` | 4-line change |
| `src/components/Header.jsx` | Import useTheme, add toggle button | ~10 lines |
| `src/components/Header.css` | Add `.header-theme-btn` styles | ~15 lines |
| `src/styles/tokens.css` OR `src/App.css` | Add `transition` rule to `[data-app-theme]` | 5-line addition |
| `src/useTranscribe.js` | Add `audioDataCallbackRef` + call it in onaudioprocess | 6-line addition |
| `src/components/ProtocolTriage.jsx` | Keyboard shortcut `useEffect`, recording panel conditional render, shortcut feedback state | ~80-100 lines added/modified |
| `src/components/ProtocolTriage.css` | Recording panel styles, shortcut feedback CSS | ~60 lines |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — per REQUIREMENTS.md "Test suite: Zero coverage is known risk; adding tests is a future milestone" |
| Config file | None |
| Quick run command | `npm run build` (Vite build catches syntax/import errors) |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| DSGN-03 | Toggle switches data-app-theme attribute | manual | `npm run build` | Verify in browser: toggle fires, attribute changes, localStorage updated |
| DSGN-03 | Theme persists across reload | manual | N/A | Set dark, reload page, verify dark mode active |
| DSGN-03 | OS preference detection on first visit | manual | N/A | Clear localStorage, emulate `prefers-color-scheme: dark` in DevTools |
| INTR-02 | Y/N shortcuts fire handleSendMessage | manual | `npm run build` | Verify in browser during active triage with yesNo node |
| INTR-02 | Shortcuts suppressed inside input fields | manual | N/A | Focus text input, press Y — must not fire |
| INTR-02 | R toggles recording | manual | N/A | Press R during triage, verify mic activates |
| INTR-02 | Esc cancels recording | manual | N/A | Start recording, press Esc, verify stops |
| INTR-03 | Waveform appears during recording | manual | N/A | Start recording, verify canvas waveform animates |
| INTR-03 | Elapsed timer counts up | manual | N/A | Start recording, verify 0:00 → 0:01 → ... |
| INTR-03 | Live transcript preview shows | manual | N/A | Speak while recording, verify partialTranscript displays |
| INTR-03 | No auto-send on stop | manual | N/A | Stop recording, verify transcript in input, not sent |

### Sampling Rate
- **Per task commit:** `npm run build` — catches import errors and syntax issues
- **Per wave merge:** `npm run build` + manual browser smoke test
- **Phase gate:** Full manual verification of all 11 behaviors before `/gsd:verify-work`

### Wave 0 Gaps
None — no test framework setup needed. Project explicitly defers test suite to a future milestone.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS class toggle for theming (`.dark-mode` class) | CSS custom property + `[data-attr]` scoping | ~2021 | Tokens mean no per-component dark overrides; one attribute change cascades everywhere |
| `prefers-color-scheme` as primary theme driver | `localStorage` as primary, OS as first-visit fallback | Common pattern 2022+ | User preference overrides OS preference; predictable across sessions |
| ScriptProcessorNode (deprecated spec) | AudioWorklet (replacement) | Proposed 2017, wide support 2020+ | **useTranscribe.js uses ScriptProcessorNode** — it works but is deprecated. Phase 8 does not migrate this (Out of Scope per REQUIREMENTS.md). Do not change the audio pipeline. |
| `hotkeys-js` / `mousetrap` for shortcuts | Plain `addEventListener('keydown')` | Always simpler for simple cases | For 4 shortcuts with no chord sequences, libraries add no value |

**Deprecated/outdated:**
- `ScriptProcessorNode`: Deprecated in Web Audio API spec. Still functional in all browsers. Migration to AudioWorklet is explicitly Out of Scope for this milestone.

---

## Open Questions

1. **Sun/moon icon implementation**
   - What we know: D-02 specifies sun/moon icon button. No icon library is in the project.
   - What's unclear: Whether to use Unicode characters (☀/☾), inline SVG, or emoji.
   - Recommendation: Unicode characters are zero-dependency and sufficient for a compact button. Use `aria-label` for screen reader description. If the visual quality is insufficient, inline SVG is the next step — but this is discretionary.

2. **CSS transition suppression on initial load**
   - What we know: The `.no-transition` pattern is standard but adds setup code.
   - What's unclear: Whether the FOUC → React hydration flash is perceptible in practice on this app.
   - Recommendation: Implement the recording panel and shortcuts first. Test the theme transition in the browser. If the initial flash is noticeable, add the `.no-transition` guard. Defer it otherwise.

3. **`data-app-theme` on `<html>` vs `.app-container`**
   - What we know: FOUC script writes to `<html>`; ThemeContext writes to `.app-container`. Tokens are scoped to `[data-app-theme]` which matches both.
   - What's unclear: Whether the `<html>` attribute set by FOUC will cause a visible flash when React's `data-app-theme={theme}` first renders (momentary double-attribute state).
   - Recommendation: On React mount, ThemeContext could clear `document.documentElement.removeAttribute('data-app-theme')` to make `.app-container` the sole authority. This is a 1-line addition to ThemeProvider's mount effect and is the clean approach.

---

## Sources

### Primary (HIGH confidence)
- `/home/victor/Git/triax-prototype/src/useTranscribe.js` — Full hook inspected; `audioContextRef`, `processorRef`, `processor.onaudioprocess` at lines 62-85; all returned values confirmed
- `/home/victor/Git/triax-prototype/src/styles/tokens.css` — Dark mode tokens confirmed complete at lines 145-181; no new token work required
- `/home/victor/Git/triax-prototype/src/contexts/UserContext.jsx` — ThemeContext template pattern confirmed
- `/home/victor/Git/triax-prototype/src/components/ui/ToastProvider.jsx` — Provider nesting pattern confirmed
- `/home/victor/Git/triax-prototype/src/App.jsx` — `data-app-theme="light"` hardcoded at line 42; provider stack confirmed
- `/home/victor/Git/triax-prototype/index.html` — FOUC script at lines 8-16 confirmed; localStorage read only, no OS fallback
- `/home/victor/Git/triax-prototype/src/components/TriageDetailsModal.jsx` lines 26-51 — keydown addEventListener/removeEventListener cleanup pattern confirmed
- `/home/victor/Git/triax-prototype/src/components/ProtocolTriage.jsx` — `handleSendMessage` signature at line 541; yes/no buttons at lines 1131-1148; mic section at lines 1161-1187; existing transcribe state at lines 413-444 confirmed
- `/home/victor/Git/triax-prototype/src/index.css` lines 70-78 — `.animate-fade-in` + `fadeIn` keyframe confirmed
- `/home/victor/Git/triax-prototype/.planning/REQUIREMENTS.md` — Test suite out of scope confirmed; DSGN-03/INTR-02/INTR-03 requirements confirmed

### Secondary (MEDIUM confidence)
- MDN Web Audio API docs — ScriptProcessorNode `onaudioprocess` event, `getChannelData(0)` API — well-known, stable
- MDN Canvas 2D API — `ctx.strokeStyle` does not resolve CSS custom properties — confirmed behavior
- MDN `window.matchMedia` — `prefers-color-scheme` query support — universal in 2024+

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; all browser APIs and existing infrastructure
- Architecture: HIGH — patterns derived directly from existing codebase files
- Pitfalls: HIGH — all grounded in specific code inspection (known stale closure risk, canvas CSS var limitation, FOUC script target conflict)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain; no fast-moving dependencies involved)
