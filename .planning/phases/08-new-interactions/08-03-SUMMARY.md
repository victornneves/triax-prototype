---
phase: 08-new-interactions
plan: 03
subsystem: ui
tags: [react, canvas, requestAnimationFrame, audio, oscilloscope, transcription]

# Dependency graph
requires:
  - phase: 08-new-interactions-02
    provides: Keyboard shortcuts (Y/N/R/Esc) and shortcut-pulse animation classes in ProtocolTriage
provides:
  - audioDataCallbackRef exposed from useTranscribe for waveform visualization
  - Recording panel (oscilloscope canvas + elapsed timer + live transcript preview) that replaces chat-input-bar during recording
  - Recording panel CSS styles using design tokens (flex layout, transcript preview, controls column)
affects: [08-new-interactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "audioDataCallbackRef pattern: useRef(null) in hook, fire synchronously in onaudioprocess, wire in component useEffect — decouples audio pipeline from UI rendering"
    - "Canvas waveform via requestAnimationFrame: latestAudioRef holds last audio frame, draw loop reads it each rAF tick — avoids React state for high-frequency audio data"
    - "Conditional panel swap: isRecording ? <recording-panel> : <chat-input-bar> — full replacement, not overlay"

key-files:
  created: []
  modified:
    - src/useTranscribe.js
    - src/components/ProtocolTriage.jsx
    - src/components/ProtocolTriage.css

key-decisions:
  - "latestAudioRef holds audio frame (not React state) to avoid excessive re-renders from high-frequency onaudioprocess callbacks"
  - "Canvas getComputedStyle resolves --color-primary at draw start (not inline) since canvas ctx cannot use CSS vars"
  - "Canvas HTML attributes 280x120 with CSS 140x60 for 2x DPI sharpness on HiDPI screens"
  - "Recording panel replaces entire chat-input-bar area (per D-15) — not an overlay"
  - "formatTime formats as M:SS (e.g., 0:04) not MM:SS per UI-SPEC"

patterns-established:
  - "audioDataCallbackRef pattern for zero-React-state audio visualization"
  - "isRecording conditional render swaps entire input area (not toggle visibility)"

requirements-completed: [INTR-03]

# Metrics
duration: 8min
completed: 2026-04-09
---

# Phase 08 Plan 03: Voice Recording UI Summary

**Oscilloscope waveform canvas + elapsed timer + live transcript preview recording panel that replaces the text input bar during recording, wired via audioDataCallbackRef from useTranscribe**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-09T12:35:00Z
- **Completed:** 2026-04-09T12:43:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- useTranscribe now exposes audioDataCallbackRef — fires synchronously in onaudioprocess with raw float32 audio data, available for any consumer without polluting React state
- ProtocolTriage renders a full recording panel (waveform canvas + M:SS timer + transcript preview + Parar button) that replaces the chat-input-bar when isRecording is true
- Recording panel CSS uses flex row layout (transcript flex:1 | controls fixed 140px) with all colors backed by design tokens for automatic dark/light mode support

## Task Commits

Each task was committed atomically:

1. **Task 1: Expose audioDataCallbackRef and build recording panel** - `f9a8d50` (feat)
2. **Task 2: Add recording panel CSS styles** - `d62c368` (feat)

## Files Created/Modified

- `src/useTranscribe.js` — added audioDataCallbackRef ref, fires in onaudioprocess, added to return object
- `src/components/ProtocolTriage.jsx` — added canvasRef/rafRef/latestAudioRef/elapsedSeconds, wired audioDataCallbackRef, added rAF draw loop, elapsed timer, formatTime, conditional recording-panel vs chat-input-bar render
- `src/components/ProtocolTriage.css` — added .recording-panel and all sub-element styles (transcript, final, partial, placeholder, controls, waveform, timer, stop-btn)

## Decisions Made

- `latestAudioRef` holds the audio frame (not React state) — onaudioprocess fires ~43x/sec at 4096 buffer on 44.1kHz; React state would cause excessive re-renders
- Canvas `getComputedStyle` to resolve `--color-primary` at draw loop start — canvas 2D ctx cannot use CSS variables natively (pitfall documented in plan)
- Canvas HTML `width=280 height=120` with CSS `width: 140px; height: 60px` — 2x internal resolution for HiDPI sharpness
- Recording panel fully replaces the `chat-input-bar` div (not overlaid) — per D-15 design decision in plan
- `formatTime` produces `M:SS` (e.g., `0:04`, `1:32`) not zero-padded minutes — per UI-SPEC

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 08 wave 2 complete. All three plans (01, 02, 03) of phase 08 are now done.
- Voice recording UI is feature-complete: waveform, timer, transcript preview, stop button
- Transcript populates the text input on stop for clinician review before sending — no auto-send
- Ready for milestone review and merge to main

---
*Phase: 08-new-interactions*
*Completed: 2026-04-09*
