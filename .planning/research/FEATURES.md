# Feature Research

**Domain:** Clinical emergency triage SPA — UI/UX overhaul of existing Manchester Triage System tool
**Researched:** 2026-04-07
**Confidence:** MEDIUM-HIGH (web research + codebase inspection; no healthcare-specific framework has canonical UX specs)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features clinicians will notice immediately if missing. Missing these makes the overhaul feel unfinished.

| Feature | Why Expected | Complexity | Existing Component | Notes |
|---------|--------------|------------|--------------------|-------|
| Design token / CSS variable system | Scattered inline styles are unmaintainable; dark mode is impossible without tokens | MEDIUM | None — 100% inline styles today | Migrate Bootstrap-like hex constants to `--color-*` vars on `:root`; enables dark mode as a theme toggle |
| Unified button variants (primary / secondary / danger) | Buttons currently have inconsistent padding, radius, and hover logic duplicated inline | LOW | All pages (multiple inline button impls) | Extract a `<Button>` component; 3 variants cover all existing uses |
| Toast notifications replacing `alert()` | `alert()` blocks UI thread, can't be styled, looks broken in ED-context | LOW | App-wide — at least 5 `alert()` calls found | `sonner` (48.6 KB gzip) is the current recommended library; smaller than react-toastify; integrates with shadcn ecosystem |
| WCAG 2.1 AA color contrast on all text | HHS requires WCAG 2.1 AA for healthcare apps by May 2026; 4.5:1 ratio minimum | MEDIUM | All components — inline colors rarely checked | Run automated audit with axe-core; `#6c757d` gray on white fails at small sizes |
| Semantic HTML and ARIA labels | Screen reader support; also required for keyboard navigation | MEDIUM | PatientForm inputs lack `<label>` associations in several places; no landmark roles | Add `<label htmlFor>`, `role="main"`, `aria-live` on triage chat area |
| Visible focus indicators | Keyboard navigation requires visible focus; currently `outline: none` inline in several places | LOW | Header nav, buttons | Remove `outline: none` overrides; use `focus-visible` CSS pseudo-class |
| Triage progress indicator | Decision tree can have 5-15+ nodes; clinicians have no sense of how far they are | MEDIUM | ProtocolTriage — no progress feedback today | Show step counter ("Pergunta 3 de ~8") or linear progress bar above the chat area; exact step count unavailable from API so use percentage from node depth |
| Responsive layout (tablet-first) | Emergency dept clinicians use tablets and workstation monitors; current layout breaks below ~900px | HIGH | ProtocolTriage has a fixed two-column layout with sensor panel | Collapsible sensor panel (slide in/out); single-column below 768px; sensor panel becomes bottom sheet on mobile |
| Auto-calculate age from birth_date | PatientForm has both `age` and `birth_date` fields; entering both is redundant and error-prone | LOW | PatientForm in ProtocolTriage.jsx | When `birth_date` is filled, auto-populate `age` in years; keep age editable for manual override |
| Contextual help tooltips on vital signs | Sensor panel shows 8 vital sign inputs; clinicians new to the system need reference ranges without leaving the flow | LOW | `SensorLabel` already has `onMouseEnter` tooltip logic | Tooltip already partially implemented — standardize the component and add keyboard trigger (`aria-describedby`) |

### Differentiators (Competitive Advantage)

Features that make Triax feel purpose-built for clinical triage, not just a generic form app.

| Feature | Value Proposition | Complexity | Existing Component | Notes |
|---------|-------------------|------------|--------------------|-------|
| Dark mode with MTS priority color preservation | Night-shift use case; reduces eye strain on long shifts; industry research confirms dark UIs preferred in dimmed ED environments (ICU, night shifts) | HIGH | Entire app — no theming layer exists | Implement via CSS variable toggle (`data-theme="dark"` on `<html>`); MTS colors (red/orange/yellow/green/blue) must stay semantically unchanged in both modes; test at both themes |
| Voice recording waveform + timer + live transcription preview | Current voice capture gives zero feedback (no visual confirmation it's recording); clinicians may think it crashed | MEDIUM | `useTranscribe` hook captures audio but `ProtocolTriage` shows only a static button | Animate a bar waveform using `AnalyserNode` from existing `AudioContext`; show elapsed seconds; stream transcript text as it arrives from Transcribe |
| Keyboard-driven triage flow | In high-pressure environments, mouse-free operation is faster and reduces errors; clinical power users expect shortcuts | MEDIUM | None — all interactions are mouse-only today | Number keys (1/2) for yes/no answers; Enter to confirm; Esc to cancel voice; Tab navigation through sensor fields; add `aria-keyshortcuts` on interactive elements |
| Session summary timeline | Clinicians reviewing a session want to see the decision path taken, not just the result | MEDIUM | HistoryPage shows result; no decision path timeline | Show the sequence of questions answered with yes/no during active triage and in history detail view |
| Smart form defaults and validation feedback | `PatientForm` shows no validation state — required fields fail silently on submit | LOW | PatientForm — no validation feedback today | Highlight missing required fields inline on submit attempt; border turns red + error message below field; no modal blocking |
| Soft palette + clinical visual hierarchy | Current palette is raw Bootstrap hex (e.g., `#dc3545`, `#198754`) — high chroma, high contrast, appropriate for urgent alerts but fatiguing for continuous use | MEDIUM | All components — no design token layer | Introduce softer base palette (muted blues/grays) while keeping MTS priority colors at full saturation for triage result display only |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like improvements but create patient-safety risks or scope inflation.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Command palette (Ctrl+K) | Power-user pattern from dev tools; feels modern | Over-engineered for a tool used 1-2 screens at a time; adds cognitive overhead for clinical staff unfamiliar with developer UIs; PROJECT.md explicitly defers this | Simple keyboard shortcuts on active elements with a `?` help modal listing them |
| Real-time collaborative triage (multi-user) | Multiple clinicians may be in the same room | Requires backend session locking; scope is frontend-only; risk of conflicting triage decisions | Single-user sessions with clear clinician attribution in the header |
| Animated transitions between triage nodes | Feels polished and modern | Motion can cause disorientation in high-stress environments; introduces animation lag on triage decisions where speed is critical; WCAG `prefers-reduced-motion` compliance adds complexity | Instant transitions with subtle fade (100ms max) only; `prefers-reduced-motion` media query disables all animation |
| Inline PDF preview panel | Users want to see report before downloading | `jspdf`/`html2canvas` were already removed (v1.1.0); server generates PDF; embedding an iframe adds layout complexity and creates print-path divergence | Keep PDF download as-is; open in new tab via `target="_blank"` which the OS viewer handles |
| Auto-submit triage result on tree completion | One fewer click at the end of triage | A wrong click could auto-submit an incorrect priority; patient safety risk | Explicit "Finalizar Triagem" confirmation button; show result preview before confirm |
| Persistent localStorage theming without user preference | Dark mode toggle that remembers choice | If a shared device is used by multiple staff, one clinician's dark mode persists for the next — potentially causing misread MTS colors on screen handoff | Respect `prefers-color-scheme` media query as default; provide in-session toggle that resets to OS preference on next login |
| Swipe gestures for yes/no | Mobile-friendly interaction pattern | Clinical tablets often have gloves in use; swipe is unreliable; adds accidental activation risk on an irreversible clinical decision | Large tap-target yes/no buttons (min 48x48px per WCAG); keyboard 1/2 shortcuts as complement |
| Inline i18n / multilingual mode | Hospital may have non-PT staff | All strings hardcoded PT-BR; PROJECT.md defers i18n to future milestone; adding partial translations introduces inconsistent UI | Keep PT-BR; note i18n as future milestone requirement |

---

## Feature Dependencies

```
[CSS Variable Design Token System]
    └──enables──> [Dark Mode Toggle]
    └──enables──> [Soft Palette Overhaul]
    └──enables──> [Unified Button Variants]

[Unified Button Component]
    └──required by──> [Keyboard Shortcuts] (need consistent focusable targets)

[Toast Notification System]
    └──replaces──> [alert() calls] (5 call sites across app)
    └──required before──> [Form Validation Feedback] (share toast channel for submission errors)

[Voice Waveform + Timer]
    └──requires──> [useTranscribe hook] (already exists — reads AudioContext)
    └──enhances──> [Live Transcription Preview] (same transcript state stream)

[Triage Progress Indicator]
    └──requires──> [ProtocolTriage traverse API response] (node depth or step count from backend)

[ARIA Labels + Semantic HTML]
    └──required by──> [Keyboard Navigation / Focus Management]
    └──required for──> [WCAG 2.1 AA compliance]

[Session Summary Timeline]
    └──requires──> [existing /history/:session_id endpoint] (already returns decision path)
    └──enhances──> [Triage Progress Indicator] (same data model)

[Auto Age Calculation]
    └──requires──> [birth_date field in PatientForm] (already present)

[Responsive Layout]
    └──conflicts with──> [Fixed two-column ProtocolTriage layout] (requires layout refactor)
    └──requires──> [Collapsible Sensor Panel] (sensor panel must be hideable on small screens)
```

### Dependency Notes

- **Dark mode requires CSS tokens first:** Without a token layer, dark mode means touching every component — CSS variables make it a 2-line theme switch. This is the critical path dependency for the entire overhaul.
- **Toast system before form validation:** Both use the same notification channel; build once, use everywhere.
- **Voice waveform is additive:** `useTranscribe` already exposes `analyserNode` context; waveform is a rendering concern layered on top.
- **Responsive layout is an independent track:** Can be done in parallel with token system and toast system since it primarily touches layout structure, not color.
- **ARIA is pervasive but low-coupling:** Can be added incrementally component-by-component without blocking other work.

---

## MVP Definition

This is v2.0.0 (overhaul of an existing, functional product). "MVP" here means the minimum changes that make the product feel professionally designed and accessible.

### Launch With (v2.0.0)

- [ ] CSS variable design token system — gates dark mode and palette work; must be first
- [ ] Soft palette + unified button variants — visible to every stakeholder; makes the biggest first impression
- [ ] Toast notification system replacing `alert()` — eliminates the most jarring UX breakage today
- [ ] WCAG 2.1 AA contrast audit + fix — regulatory requirement; HHS deadline May 2026
- [ ] Semantic HTML + ARIA labels — required for keyboard navigation and screen readers
- [ ] Triage progress indicator — reduces the "am I lost?" cognitive load in the decision tree
- [ ] Voice recording feedback (waveform + timer + transcription preview) — the chief complaint capture is the first real interaction; it must signal it's working
- [ ] Auto age calculation from birth date — eliminates duplicate data entry; low effort, high polish signal
- [ ] Form validation feedback — silent failure on required fields is a data quality risk

### Add After Validation (v2.x)

- [ ] Dark mode toggle — foundation laid in v2.0.0; add toggle UI + `localStorage` after base palette ships; trigger: stakeholder request or user feedback
- [ ] Keyboard shortcuts (1/2 for yes/no, Esc to cancel) — valuable for power users; trigger: clinician feedback after v2.0.0 demo
- [ ] Responsive mobile layout — depends on clinician device usage data; pilot phase may be desktop-only; trigger: tablet/mobile usage confirmed
- [ ] Session summary timeline — enhances the history view; trigger: stakeholder request for audit trail visualization

### Future Consideration (v3+)

- [ ] i18n framework — PROJECT.md explicitly defers; trigger: multi-language hospital requirement
- [ ] AudioWorklet migration from ScriptProcessorNode — PROJECT.md explicitly defers; trigger: browser deprecation warning in production
- [ ] API response caching for /protocol_names and /me — PROJECT.md explicitly defers

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| CSS variable token system | HIGH (gates everything) | MEDIUM | P1 |
| Unified button + soft palette | HIGH (first impression) | LOW | P1 |
| Toast system (replace alert) | HIGH (removes jarring breakage) | LOW | P1 |
| WCAG 2.1 AA contrast | HIGH (regulatory + safety) | MEDIUM | P1 |
| Triage progress indicator | HIGH (reduces cognitive load) | MEDIUM | P1 |
| Voice waveform + feedback | HIGH (chief complaint is step 1) | MEDIUM | P1 |
| Semantic HTML + ARIA | HIGH (keyboard nav, screen readers) | MEDIUM | P1 |
| Auto age calculation | MEDIUM (quality-of-life) | LOW | P1 |
| Form validation feedback | MEDIUM (data quality) | LOW | P1 |
| Dark mode toggle | MEDIUM (night-shift ergonomics) | LOW (after tokens) | P2 |
| Keyboard shortcuts | MEDIUM (power users) | MEDIUM | P2 |
| Session summary timeline | MEDIUM (audit/review) | MEDIUM | P2 |
| Responsive / collapsible sensor panel | MEDIUM (tablet use) | HIGH | P2 |
| Contextual help tooltip standardization | LOW (already partially exists) | LOW | P2 |
| Smart defaults (pain slider starts at 0) | LOW | LOW | P3 |

**Priority key:**
- P1: Required for v2.0.0 to feel complete
- P2: Add in v2.x after stakeholder feedback
- P3: Nice to have, future milestone

---

## Healthcare-Specific UX Patterns (Research-Derived)

These are clinical-domain patterns that differ from generic web UX and should inform implementation decisions.

### Cognitive Load Reduction

Research from clinical decision support studies shows emergency physicians make ~4,000 mouse clicks in a 10-hour shift and see 2.4 patients/hour. Every extra click or visual distraction is a real burden.

**Pattern:** Minimize required interactions per triage node. Yes/no decisions should be one click (or one keypress). Vitals should not require tab-focus to enter every field sequentially — allow free entry in any order.

**Pattern:** Do not block the triage flow with modals. Validation errors and notifications must appear without stopping the clinician's current action. Toast (non-blocking) over modal (blocking) is the correct pattern for all non-critical feedback.

### MTS Priority Color Semantics

The five MTS priority colors (red = immediate, orange = very urgent, yellow = urgent, green = standard, blue = non-urgent) are a clinical standard. They carry patient-safety meaning that cannot be altered.

**Rule:** These colors must be applied exclusively to triage result displays and progress indicators related to urgency level. Using them for other UI states (error states, success messages) creates dangerous visual ambiguity. Use neutral grays and muted blues for general UI states.

### Dark Mode in Clinical Contexts

Industry sources (Emergo by UL, mynkis.com) indicate:
- Dark mode is appropriate as a preference option for night-shift and ICU contexts where screens are dimmed.
- Dark mode must not be the sole default — light mode is standard for clinical documentation.
- MTS priority colors may need adjusted saturation in dark mode to maintain contrast ratios.
- Data visualization (vital sign severity colors on sliders) needs re-validation in dark mode.

**Recommendation:** Implement dark mode as opt-in (CSS `prefers-color-scheme` as default; toggle stored in `localStorage` per session), not as forced default.

### Voice Input Feedback Requirements

In clinical environments where hands may be occupied and attention is divided, voice recording UI must give unambiguous state feedback. A silent button that is "recording" looks identical to a broken button.

**Required states:** idle → recording (animated waveform + elapsed timer) → processing (spinner) → result (transcript preview with edit option).

### Alert Hierarchy for Patient Safety

Toast notifications that auto-dismiss are appropriate for:
- Successful saves ("Triagem finalizada com sucesso")
- Non-critical errors that don't block flow ("Falha ao carregar histórico — tente novamente")

Modal/confirmation dialogs are appropriate for:
- Irreversible actions (finalizing a triage session, signing out mid-triage)
- Actions where wrong input = patient safety risk

`alert()` is never appropriate — it blocks the UI thread and cannot be styled to meet contrast requirements.

---

## Competitor / Reference Feature Analysis

| Feature | Epic ASAP (EHR triage) | TriageIQ | Infermedica | Our Approach |
|---------|------------------------|----------|-------------|--------------|
| Progress indicator | Step counter in header | Linear bar + step labels | Conversational (no explicit steps) | Step counter above chat + subtle linear bar |
| Vital sign capture | Structured form with ranges | Inline sliders | Not shown in triage flow | Existing slider panel — standardize labels and feedback |
| Priority color display | Full-screen banner at result | Color badge in corner | Color + label + explanation | Existing color result card — add label text + ARIA role |
| Voice input | Not present (type-only) | Not present | Not present | Existing AWS Transcribe — add waveform feedback |
| Dark mode | Light only (clinical standard) | Light only | Light only | Opt-in via toggle + CSS variables |
| Mobile responsiveness | Tablet-optimized | Responsive | Mobile-first | Collapsible sensor panel; P2 for v2.x |

---

## Sources

- [Healthcare UI Design 2026: Best Practices + Examples — Eleken](https://www.eleken.co/blog-posts/user-interface-design-for-healthcare-applications)
- [Design and User Experience in Digital Triage Software — Clearstep](https://content.clearstep.health/blog/maximizing-engagement-in-virtual-triage-the-role-of-design-and-ux)
- [Dark Mode vs Light Mode for Medical Device UIs — Emergo by UL](https://www.emergobyul.com/news/dark-mode-vs-light-mode-medical-device-uis)
- [Evaluating Dark Mode for Clinical Digital Platforms — mynkis.com](https://www.mynkis.com/articles/evaluating-dark-mode-clinical-digital-platforms)
- [Cognitive Load and the Emergency Physician — emDocs](https://www.emdocs.net/cognitiveload/)
- [JMIR: Impact of EHR Use on Cognitive Load and Burnout Among Clinicians](https://medinform.jmir.org/2024/1/e55499)
- [When better data meets better design: EHR data usability and cognitive load — npj Digital Medicine](https://www.nature.com/articles/s41746-025-02243-4)
- [Guide to Digital Accessibility in Healthcare — AudioEye](https://www.audioeye.com/post/guide-to-digital-accessibility-in-healthcare/)
- [WCAG 2.1 AA Healthcare Compliance 2026 — Pilot Digital](https://pilotdigital.com/blog/what-wcag-2-1aa-means-for-healthcare-organizations-in-2026/)
- [Comparing React Toast Libraries 2025 — LogRocket](https://blog.logrocket.com/react-toast-libraries-compared-2025/)
- [react-hot-toast vs Sonner — PkgPulse](https://www.pkgpulse.com/compare/sonner-vs-react-hot-toast)
- [PatternFly Progress Stepper Design Guidelines](https://www.patternfly.org/components/progress-stepper/design-guidelines/)
- [A Cognitive Task Analysis for Developing a CDSS for Emergency Triage — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0099176725001746)
- [UX Optimizations for Keyboard-Only Users — Smashing Magazine](https://www.smashingmagazine.com/2019/06/ux-optimizations-keyboard-only-assistive-technology-users/)
- [Use of Mobile Technologies to Streamline Pretriage Flow in the ED — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11193078/)
- [CSS Variables for React Devs — Josh W. Comeau](https://www.joshwcomeau.com/css/css-variables-for-react-devs/)

---

*Feature research for: Clinical emergency triage SPA — Manchester Triage System — v2.0.0 UI/UX Overhaul*
*Researched: 2026-04-07*
