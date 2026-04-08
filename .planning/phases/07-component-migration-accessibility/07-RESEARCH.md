# Phase 7: Component Migration + Accessibility - Research

**Researched:** 2026-04-08
**Domain:** CSS token migration, WCAG 2.1 AA accessibility, form UX (validation, masking, tooltips), responsive sidebar
**Confidence:** HIGH

## Summary

Phase 7 is a migration and hardening phase. No new features. Six components must have all inline styles replaced with co-located token-backed CSS files (same pattern as Header.jsx/Header.css). All nine requirements — accessibility contrast, semantic HTML, focus indicators, responsive sensor panel, global status bar, and four form improvements — work on top of the existing token system from Phase 5/6.

The design token foundation (`tokens.css`) is solid but missing radius, shadow, and transition primitives that migrated components will need. Five new tokens must be added before migration begins. The primary accessibility finding is that `#adb5bd` (#2.07:1) and `#868e96` (#3.32:1) appear as body/label text on white backgrounds across multiple components and fail WCAG AA — they must be replaced with `--color-gray-600` (#57534e, 7.63:1) or `--color-gray-500` (#78716c, 4.80:1). The `--color-text-muted` token itself maps to `--color-gray-400` (#a8a29e, 2.52:1) and must never be used on text that needs to pass AA; it is only appropriate for purely decorative content or large-text contexts.

Input masking uses `react-imask` 7.6.1 (current registry version), which is not yet in `package.json` — it must be installed. The existing tooltip portal in ProtocolTriage (lines 1470–1499) is the canonical pattern for `Tooltip.jsx`. Focus trapping in TriageDetailsModal can be implemented with native DOM techniques (no new library needed) given the modal is a single, well-bounded component.

**Primary recommendation:** Add tokens first, migrate components in order (AdminUsers → RequireAdmin → Profile → HistoryPage → TriageDetailsModal → ProtocolTriage), then apply global accessibility and form work. Each component migration is one atomic commit — no partial migrations.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Inline style migration strategy**
- D-01: File-by-file atomic migration — each component gets a co-located `.css` file (same pattern as Header.css). Never mix inline styles and token classes in the same file; full swap per component in one commit.
- D-02: Migration order by complexity: AdminUsers (23 inline) → RequireAdmin (1) → Profile (39) → HistoryPage (48) → TriageDetailsModal (77) → ProtocolTriage (108). Smallest first to build the CSS extraction pattern, heaviest last.
- D-03: App.jsx's 6 inline styles migrate into existing App.css — no new file needed.
- D-04: Extract common patterns into shared utility classes in `index.css` (e.g., `.container`, `.page-title`, `.card`) only when 3+ components share the exact same pattern. No premature abstractions.
- D-05: Add `--radius-sm` (0.25rem), `--radius-md` (0.5rem), `--radius-lg` (0.75rem), `--shadow-sm`, `--shadow-md`, and `--transition-fast` (150ms) tokens to `tokens.css` — needed for migrated components.

**Sensor panel responsive behavior (LAYT-01)**
- D-06: Sensor panel is a `<aside>` element positioned as a sidebar on desktop (≥768px) and collapses to a toggleable drawer on mobile (<768px).
- D-07: On desktop: sensor panel is always visible alongside the chat column. On mobile: collapsed by default, toggle button (pill-shaped, fixed bottom-right) expands it as a slide-up overlay.
- D-08: Collapse/expand uses CSS transitions (max-height or transform) — no JS animation library. State managed via `useState` in ProtocolTriage.
- D-09: When collapsed on mobile, show a compact "vitals summary" strip (e.g., "SpO2: 98% | FC: 80 | T: 36.5°C") so clinicians see current values without expanding.

**Global status bar (LAYT-02)**
- D-10: Thin bar below Header showing: session ID (truncated), selected protocol name, and connection indicator (green dot = online). Only visible during active triage session (ProtocolTriage route).
- D-11: Implemented as a `StatusBar.jsx` component in `src/components/ui/`, rendered conditionally in ProtocolTriage. Uses token-backed CSS.
- D-12: Connection status uses `navigator.onLine` + `online`/`offline` event listeners. Green dot = connected, red dot = disconnected with "Sem conexão" text.

**Semantic HTML + ARIA (A11Y-02)**
- D-13: All form labels converted from styled `<div>` to `<label htmlFor={id}>`. Every input gets a unique `id` and its label gets matching `htmlFor`.
- D-14: Header profile `<div onClick>` converted to `<button>` or `<Link>`.
- D-15: Modal uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title. Focus trapped inside modal when open.
- D-16: Tables in HistoryPage, Profile, AdminUsers get `<caption>` elements and `scope="col"` on header cells.

**Focus indicators (A11Y-03)**
- D-17: Global `:focus-visible` style in `index.css`: `outline: 2px solid var(--color-primary); outline-offset: 2px`. Applies to all interactive elements (inputs, buttons, links, selects).
- D-18: Remove browser default `outline: 4px auto -webkit-focus-ring-color` in favor of consistent token-backed focus ring.
- D-19: Dark mode focus ring uses same `--color-primary` token (already has dark override).

**Contrast compliance (A11Y-01)**
- D-20: Audit all hardcoded hex values (`#666`, `#555`, `#999`, etc.) and replace with token references that meet 4.5:1 ratio. `--color-text-secondary` and `--color-text-muted` must be validated.
- D-21: MTS priority badge text colors checked — `--mts-yellow` background gets `--mts-yellow-text: #000000` (already exists from Phase 5).
- D-22: All new CSS uses semantic tokens only — no raw hex values in component CSS files.

**Form validation (FORM-01)**
- D-23: Custom validation logic — no library. Validation runs on blur for individual fields and on submit for the full form.
- D-24: Error state: red border (`--color-feedback-error-text`), inline error message below field, `aria-invalid="true"` + `aria-describedby` pointing to error message element.
- D-25: Required fields: `name` and `age` (already required). Show asterisk (*) indicator next to label.
- D-26: Validation rules: name (non-empty), age (1-150 integer), birth_date (valid DD/MM/YYYY), CPF (11 digits), blood_pressure (systolic/diastolic in range).

**Age auto-calculation (FORM-02)**
- D-27: When birth_date is filled and valid (DD/MM/AAAA), auto-calculate and populate age field. Age field remains editable (clinician override).
- D-28: Calculation uses simple year subtraction with month/day adjustment — no date library needed.

**Contextual help tooltips (FORM-03)**
- D-29: Small info icon (ⓘ) next to each form label. Hover/focus shows tooltip with field description and expected format.
- D-30: Reuse the existing tooltip pattern from ProtocolTriage sensor tooltips (lines 1470-1499) — extract into a shared `Tooltip.jsx` component in `src/components/ui/`.
- D-31: Tooltip content is static PT-BR strings defined inline per field. No i18n.

**Input masking (FORM-04)**
- D-32: Use `react-imask` 7 (per STATE.md decision — react-input-mask archived Dec 2025).
- D-33: Masked fields: birth_date (DD/MM/AAAA), CPF (000.000.000-00), blood_pressure systolic/diastolic (3-digit numbers).
- D-34: Masking is visual formatting only — stored values remain unformatted for API compatibility.

### Claude's Discretion
- Exact breakpoint values beyond 768px threshold
- Tooltip positioning logic (above/below/auto)
- Specific validation error message wording (PT-BR)
- How to structure ProtocolTriage.css given the file's 1500 LOC
- Whether to split ProtocolTriage into sub-components during migration or keep monolithic
- Exact compact vitals summary format on mobile
- StatusBar layout and styling details

### Deferred Ideas (OUT OF SCOPE)
- Splitting ProtocolTriage.jsx into sub-components (PatientForm, ChatPanel, SensorPanel) — valuable refactor but scope creep for a migration phase.
- Page-level route transitions — deferred from Phase 6, still not needed for migration.
- Additional UI primitives (Card, Input, Badge) as standalone components — only create if 3+ components need them during migration. Otherwise inline the patterns.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| A11Y-01 | All text and interactive elements meet WCAG 2.1 AA contrast ratio (4.5:1 minimum) | Contrast audit completed — identified `#adb5bd` (2.07:1) and `#868e96` (3.32:1) as failing. Token replacements mapped. |
| A11Y-02 | All interactive elements use semantic HTML (button, nav, label) with appropriate ARIA attributes | Pattern for `role="dialog"`, `aria-labelledby`, `aria-invalid`, `aria-describedby` documented. Focus trap approach (native DOM) documented. |
| A11Y-03 | All focusable elements have visible, high-contrast focus indicators for keyboard navigation | `:focus-visible` global rule pattern confirmed; existing browser default must be removed. |
| LAYT-01 | Sensor/vitals panel collapses on narrow screens and can be toggled on wider screens | CSS max-height transition approach documented. `<aside>` element. `useState` toggle. Compact summary strip on collapse. |
| LAYT-02 | Global status bar displays current session ID, selected protocol, and connection status | `navigator.onLine` API confirmed. `StatusBar.jsx` in `src/components/ui/`. Event listener pattern documented. |
| FORM-01 | Required form fields show inline validation feedback on blur/submit | Custom validation, error state pattern (border + inline message + aria-invalid + aria-describedby) documented. |
| FORM-02 | Patient age is auto-calculated from birth date input | Age calculation algorithm (no library) documented. Birth date input connection to age field state documented. |
| FORM-03 | All form fields have contextual help tooltips explaining purpose and expected values | Existing tooltip portal (ProtocolTriage lines 1470–1499) documented. Extraction to shared `Tooltip.jsx` pattern defined. |
| FORM-04 | Date, CPF, and blood pressure fields use input masking with auto-formatting | `react-imask` 7.6.1 API confirmed. `IMaskInput` component with `onAccept`/`unmask` props. Install command documented. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-imask | 7.6.1 (current) | Input masking for CPF, date, BP fields | Replaces archived react-input-mask; IMask ecosystem standard; explicitly decided in STATE.md |
| CSS custom properties | native | Design token delivery | Already established in tokens.css Phase 5 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| navigator.onLine | browser native | Connection status for StatusBar | StatusBar D-12 — no polyfill needed for Amplify SPA target |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-imask | react-input-mask | react-input-mask archived Dec 2025 — do not use |
| react-imask | vanilla IMask + useRef | More boilerplate, same result; IMaskInput component is simpler |
| CSS max-height transition | JS animation / framer-motion | No new libraries per project constraint; CSS-only satisfies the requirement |
| Native focus trap (useRef + keydown) | focus-trap-react library | Native approach is 15 lines for a bounded modal; library is unnecessary complexity here |

**Installation:**
```bash
npm install react-imask
```

**Version verification:** Confirmed against npm registry — `npm view react-imask version` returns `7.6.1` as of 2026-04-08.

---

## Architecture Patterns

### Recommended Project Structure (Phase 7 additions)
```
src/
├── styles/
│   └── tokens.css          # ADD: --radius-sm/md/lg, --shadow-sm/md, --transition-fast
├── components/
│   ├── Header.jsx           # Reference: already migrated (Phase 5)
│   ├── Header.css           # Reference: co-located CSS pattern to replicate
│   ├── HistoryPage.jsx      # MIGRATE: add HistoryPage.css
│   ├── HistoryPage.css      # NEW
│   ├── ProtocolTriage.jsx   # MIGRATE: add ProtocolTriage.css, form validation, masking, sensor responsive
│   ├── ProtocolTriage.css   # NEW
│   ├── RequireAdmin.jsx     # MIGRATE: 1 inline style only
│   ├── RequireAdmin.css     # NEW (minimal)
│   ├── TriageDetailsModal.jsx  # MIGRATE: add TriageDetailsModal.css, modal ARIA
│   ├── TriageDetailsModal.css  # NEW
│   └── ui/
│       ├── Button.jsx       # EXISTS (Phase 6)
│       ├── StatusBar.jsx    # NEW (LAYT-02)
│       ├── StatusBar.css    # NEW
│       ├── Toast.jsx        # EXISTS (Phase 6)
│       └── Tooltip.jsx      # NEW (FORM-03) — extracted from ProtocolTriage lines 1470-1499
│       └── Tooltip.css      # NEW
├── pages/
│   ├── AdminUsers.jsx       # MIGRATE: add AdminUsers.css
│   ├── AdminUsers.css       # NEW
│   ├── Profile.jsx          # MIGRATE: add Profile.css
│   └── Profile.css          # NEW
├── App.jsx                  # ADD: 6 inline styles move to App.css
├── App.css                  # UPDATE: receive App.jsx's 6 styles
└── index.css                # UPDATE: global :focus-visible, remove webkit default, shared utilities
```

### Pattern 1: Co-located CSS Migration (per component)
**What:** Extract all `style={{...}}` inline objects to a co-located `.css` file using token-backed classes.
**When to use:** Every component migration task (D-01 rule — atomic, per-file).
**Example:**
```jsx
// BEFORE (inline style — to be removed)
<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
  <h1 style={{ marginBottom: '2rem', color: '#212529' }}>Administração de Usuários</h1>

// AFTER (token-backed CSS class)
<div className="admin-page">
  <h1 className="admin-page__title">Administração de Usuários</h1>
```
```css
/* AdminUsers.css */
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}
.admin-page__title {
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
}
```

### Pattern 2: Global :focus-visible in index.css
**What:** Replace the existing WebKit default focus ring with a consistent token-backed one.
**When to use:** index.css update — applies globally to all interactive elements.
```css
/* index.css — REPLACE existing button:focus rule */

/* Remove WebKit default */
button:focus,
button:focus-visible {
  /* Remove the old: outline: 4px auto -webkit-focus-ring-color; */
}

/* Token-backed focus ring for ALL focusable elements */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Pattern 3: Form Field with Validation
**What:** Label with htmlFor/id binding, optional asterisk, tooltip trigger, masked input, error message.
**When to use:** All PatientForm fields (FORM-01, FORM-02, FORM-03, FORM-04).
```jsx
// Source: D-24, D-25, D-29 pattern
const [errors, setErrors] = useState({});

const handleBlur = (e) => {
  const { name, value } = e.target;
  const error = validateField(name, value);
  setErrors(prev => ({ ...prev, [name]: error }));
};

<div className="form-field">
  <label htmlFor="patient-name" className="form-label">
    Nome Completo <span className="form-required" aria-hidden="true">*</span>
    <Tooltip content="Nome completo do paciente conforme documento de identidade." />
  </label>
  <input
    id="patient-name"
    name="name"
    className={`form-input${errors.name ? ' form-input--error' : ''}`}
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? 'patient-name-error' : undefined}
    onBlur={handleBlur}
    ...
  />
  {errors.name && (
    <span id="patient-name-error" className="form-error" role="alert">
      {errors.name}
    </span>
  )}
</div>
```

### Pattern 4: IMaskInput for Masked Fields
**What:** Replace plain `<input>` with `IMaskInput` for date/CPF/BP fields. Store unmasked value via `unmask={true}`.
**When to use:** birth_date, CPF, bp_systolic, bp_diastolic fields (D-32, D-33, D-34).
```jsx
// Source: react-imask 7.6.1 README
import { IMaskInput } from 'react-imask';

// Date: DD/MM/AAAA
<IMaskInput
  id="birth-date"
  name="birth_date"
  mask="00/00/0000"
  unmask={false}           // Store masked value (DD/MM/AAAA) for display + age calc
  value={formData.birth_date}
  onAccept={(value) => {
    setFormData(prev => ({ ...prev, birth_date: value }));
    // Trigger age auto-calc here
  }}
  placeholder="DD/MM/AAAA"
  className="form-input"
/>

// CPF: 000.000.000-00
<IMaskInput
  id="cpf"
  name="cpf"
  mask="000.000.000-00"
  unmask={true}            // Store unmasked digits for API
  onAccept={(unmaskedValue) => setFormData(prev => ({ ...prev, cpf: unmaskedValue }))}
  className="form-input"
/>

// BP — each of systolic/diastolic is a plain 3-digit number input (no mask needed)
// react-imask Number mask if needed: mask={Number} min={0} max={300}
```

### Pattern 5: Age Auto-Calculation from Birth Date
**What:** When a valid DD/MM/AAAA date is accepted by the mask, compute age.
**When to use:** birth_date `onAccept` callback (FORM-02, D-27, D-28).
```js
// Source: D-28 — no library, simple arithmetic
function calcAgeFromDDMMYYYY(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length !== 10) return null;
  const [dd, mm, yyyy] = ddmmyyyy.split('/').map(Number);
  if (!dd || !mm || !yyyy) return null;
  const today = new Date();
  let age = today.getFullYear() - yyyy;
  const monthDiff = today.getMonth() + 1 - mm;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dd)) age--;
  return age >= 1 && age <= 150 ? String(age) : null;
}

// In onAccept for birth_date:
const age = calcAgeFromDDMMYYYY(maskedValue);
if (age !== null) setFormData(prev => ({ ...prev, age }));
```

### Pattern 6: Tooltip Component (extracted from ProtocolTriage)
**What:** Info icon that shows a fixed-position tooltip portal on hover/focus.
**When to use:** Every form field label (FORM-03). Extracted from ProtocolTriage lines 1470-1499.
```jsx
// src/components/ui/Tooltip.jsx
import { useState } from 'react';
import './Tooltip.css';

export function Tooltip({ content }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const show = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
    setVisible(true);
  };

  return (
    <>
      <button
        type="button"
        className="tooltip-trigger"
        aria-label="Mais informações"
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={() => setVisible(false)}
        onBlur={() => setVisible(false)}
      >
        ⓘ
      </button>
      {visible && (
        <div
          className="tooltip-portal"
          role="tooltip"
          style={{ top: pos.y - 8, left: pos.x }}
        >
          {content}
        </div>
      )}
    </>
  );
}
```

### Pattern 7: Modal Accessibility (TriageDetailsModal)
**What:** Add role/aria attributes and keyboard focus trap to existing modal.
**When to use:** TriageDetailsModal migration (A11Y-02, D-15).
```jsx
// Focus trap — native DOM, no library
const modalRef = useRef(null);

useEffect(() => {
  const modal = modalRef.current;
  if (!modal) return;
  // Save previously focused element
  const previousFocus = document.activeElement;
  // Focus first focusable element in modal
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  focusable[0]?.focus();

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  };
  modal.addEventListener('keydown', handleKeyDown);
  return () => {
    modal.removeEventListener('keydown', handleKeyDown);
    previousFocus?.focus(); // Restore focus on close
  };
}, []);

// JSX
<div
  ref={modalRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  className="modal-overlay"
>
  <div className="modal-content">
    <h2 id="modal-title">Detalhes da Triagem</h2>
    ...
  </div>
</div>
```

### Pattern 8: Responsive Sensor Panel (LAYT-01)
**What:** `<aside>` sidebar on desktop, slide-up overlay on mobile.
**When to use:** ProtocolTriage sensor panel restructure (D-06 through D-09).
```jsx
// State in ProtocolTriage
const [sensorPanelOpen, setSensorPanelOpen] = useState(false);

// JSX structure
<div className="triage-layout">
  <section className="triage-chat"> ... </section>
  <aside className={`triage-sensors${sensorPanelOpen ? ' triage-sensors--open' : ''}`}>
    {/* Compact vitals strip (mobile only, always visible) */}
    <div className="sensors-summary">SpO2: {sensorInputs.oxygen_saturation || '—'} | FC: ...</div>
    {/* Full panel */}
    <div className="sensors-content"> ... </div>
  </aside>
  {/* Toggle button — mobile only */}
  <button
    className="sensors-toggle"
    onClick={() => setSensorPanelOpen(o => !o)}
    aria-expanded={sensorPanelOpen}
    aria-controls="sensor-panel"
  >
    Sinais Vitais
  </button>
</div>
```
```css
/* ProtocolTriage.css — responsive layout */
.triage-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.triage-sensors {
  width: 280px;
  flex-shrink: 0;
  /* Desktop: always visible */
}

.sensors-toggle { display: none; }

@media (max-width: 768px) {
  .triage-layout { position: relative; }
  .triage-sensors {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    z-index: 200;
  }
  .triage-sensors--open { max-height: 70vh; }
  .sensors-toggle {
    display: block;
    position: fixed;
    bottom: var(--spacing-md);
    right: var(--spacing-md);
    z-index: 201;
  }
}
```

### Pattern 9: StatusBar Component (LAYT-02)
**What:** Thin info bar below Header, online/offline indicator via browser events.
**When to use:** Rendered inside ProtocolTriage (or App.jsx route wrapper), visible only during active session.
```jsx
// src/components/ui/StatusBar.jsx
import { useState, useEffect } from 'react';
import './StatusBar.css';

export function StatusBar({ sessionId, protocolName }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="status-bar" role="status" aria-live="polite">
      <span className="status-bar__session">
        Sessão: {sessionId ? sessionId.slice(-8) : '—'}
      </span>
      <span className="status-bar__protocol">
        {protocolName || 'Selecionar protocolo'}
      </span>
      <span className={`status-bar__connection status-bar__connection--${online ? 'online' : 'offline'}`}>
        {online ? 'Online' : 'Sem conexão'}
      </span>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Partial migration:** Never leave a component with mixed inline styles and CSS classes. Full swap per file, one commit.
- **`--color-text-muted` for body text:** `--color-gray-400` (#a8a29e) is 2.52:1 on white — only use for decorative/placeholder text, never for meaningful body copy.
- **New raw hex values in component CSS:** All new CSS must reference semantic tokens. Zero raw hex values.
- **`onChange` instead of `onAccept` for IMaskInput:** IMaskInput fires `onAccept` when the mask value changes, not `onChange`. Using `onChange` will capture the raw DOM event, not the masked string.
- **Focus trap without cleanup:** Must restore `previousFocus` on modal close, otherwise keyboard users lose their navigation position.
- **`aria-live` on every status:** Only StatusBar and error messages need live regions. Do not add to static content.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input masking for CPF/date/BP | Custom regex + keydown handlers | `react-imask` IMaskInput | Cursor management, delete/backspace, paste, mobile keyboard — all handled by the library |
| Age calculation | Date library import | 10-line arithmetic function | No library needed; D-28 explicitly locks this |
| Focus trap | focus-trap-react | Native DOM querySelectorAll + keydown | Modal is bounded; 15-line native solution avoids a new dependency |
| CSS collapse animation | JS requestAnimationFrame | CSS `max-height` transition | Constraint from D-08 — no JS animation library |
| Connection status | WebSocket ping / fetch probe | `navigator.onLine` + events | Sufficient for the indicator requirement; real network probe is overkill |

**Key insight:** This phase's complexity is in volume (259 inline styles across 7 files), not in algorithmic novelty. Every hard problem (masking, validation, tooltips) is either handled by one library or already exists in the codebase.

---

## Contrast Audit Findings

### Failing Colors (must be replaced in migrated CSS)

| Hardcoded Value | Contrast on White | Verdict | Replace With | New Contrast |
|-----------------|-------------------|---------|--------------|-------------|
| `#adb5bd` | 2.07:1 | FAIL AA | `--color-text-secondary` (`#57534e`) | 7.63:1 |
| `#868e96` | 3.32:1 | FAIL AA (body text) | `--color-gray-500` (`#78716c`) | 4.80:1 |
| `#999` | 2.85:1 | FAIL AA | `--color-text-secondary` | 7.63:1 |
| `--color-text-muted` (`#a8a29e`) | 2.52:1 | FAIL AA | Only for placeholder/decorative — not body text |

### Passing Colors (safe to map to tokens)

| Hardcoded Value | Contrast | Token Mapping |
|-----------------|----------|---------------|
| `#495057` | 8.18:1 | `--color-text-primary` (use gray-900 which is even stronger) |
| `#6c757d` | 4.69:1 | `--color-text-secondary` is safer at 7.63:1 |
| `#212529` | ~16:1 | `--color-text-primary` |
| `#333` | ~12:1 | `--color-text-primary` |
| `#666` | 5.74:1 | `--color-text-secondary` |
| `#055160` | 8.93:1 | Keep or map to `--color-primary` darkened |

### Specific Files with Failing Colors

| File | Failing Color | Context |
|------|---------------|---------|
| AdminUsers.jsx | `#adb5bd` | "Carregando..." loading state, "Nenhum usuário" empty state, "Visualizar" cell |
| AdminUsers.jsx | `#868e96` | User email sub-text (0.8rem) |
| Profile.jsx | `#adb5bd` | Loading / empty state text |
| Profile.jsx | `#868e96` | Date sub-text (0.8rem) |
| HistoryPage.jsx | `#999` | Date sub-text (0.75rem), empty state |
| TriageDetailsModal.jsx | `#adb5bd` | Tab inactive color |
| TriageDetailsModal.jsx | `#868e96` | Label uppercase text (0.7rem–0.8rem) — multiple instances |
| ProtocolTriage.jsx | `#666` | Sensor hint text (0.75rem) — marginally passes at 5.74:1 but maps to `--color-text-secondary` |

---

## New Tokens Required (Pre-Migration Task)

Add to `src/styles/tokens.css` primitive + semantic layers:

```css
/* In :root — primitive layer */
--radius-sm:  0.25rem;
--radius-md:  0.5rem;
--radius-lg:  0.75rem;
--shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-md:  0 4px 12px rgba(0, 0, 0, 0.10);
--transition-fast: 150ms ease;
```

These are referenced by all migrated component CSS files. They are not semantic (no light/dark override needed).

---

## Common Pitfalls

### Pitfall 1: `--color-text-muted` used as body text
**What goes wrong:** Text fails WCAG AA. `--color-gray-400` (#a8a29e) is 2.52:1 on white.
**Why it happens:** Name sounds like "secondary/muted text" but the token is only safe for decorative use.
**How to avoid:** Reserve `--color-text-muted` strictly for placeholder text and disabled-state labels. Use `--color-text-secondary` for all secondary body copy.
**Warning signs:** Any text marked as "loading..." or "empty state" using muted color.

### Pitfall 2: IMaskInput `onChange` vs `onAccept`
**What goes wrong:** Value is always empty or shows the raw DOM event object.
**Why it happens:** `IMaskInput` is not a standard controlled input; it uses `onAccept` as its change event.
**How to avoid:** Always use `onAccept={(value, maskRef) => ...}`. The `unmask` prop controls whether `value` is masked or raw.
**Warning signs:** `console.log` of the value shows `[object Object]` or empty string.

### Pitfall 3: Max-height transition collapse lag
**What goes wrong:** Collapse animation feels slow/delayed because `max-height` is set much higher than actual content height.
**Why it happens:** CSS transition applies to the `max-height` range (e.g., 0 to 70vh), but content is only 300px tall — the first 400px of animation shows no change.
**How to avoid:** Set `max-height` to a value close to the realistic content height (e.g., `60vh` for the sensor panel, not `9999px`). Accept the minor easing mismatch.
**Warning signs:** Panel "jumps" open instantly but closes slowly, or vice versa.

### Pitfall 4: Focus trap leaks outside modal
**What goes wrong:** Tab key escapes the modal and focuses elements behind the overlay.
**Why it happens:** `querySelectorAll` for focusable elements runs once at mount but the modal may have dynamic content (tabs).
**How to avoid:** Re-query focusable elements inside the Tab handler on each keydown, not once at mount. Or scope to the modal ref.

### Pitfall 5: `aria-invalid` without `aria-describedby`
**What goes wrong:** Screen readers announce the field is invalid but don't say why.
**Why it happens:** `aria-invalid="true"` is set but the error message element's ID is not connected.
**How to avoid:** Always pair `aria-invalid="true"` with `aria-describedby="field-name-error"` pointing to the error `<span>` element's `id`. Only set `aria-describedby` when the error actually exists (conditional attribute).

### Pitfall 6: ProtocolTriage.css scope collision
**What goes wrong:** Generic class names in ProtocolTriage.css clash with other components.
**Why it happens:** ProtocolTriage has 108 inline styles — many will become classes. Without namespacing, `.form-input` in ProtocolTriage.css may conflict with utility classes in index.css.
**How to avoid:** Namespace all ProtocolTriage classes with a component prefix (`.triage-`, `.patient-form-`, `.sensor-`) or use BEM. Match the pattern from Header.css (`.app-header`, `.header-nav`, etc.).

### Pitfall 7: CPF stored value loses formatting on re-render
**What goes wrong:** After setting state with unmasked CPF digits, the masked display disappears.
**Why it happens:** Controlled `IMaskInput` uses `value` prop; if you store the unmasked digits and pass them back as `value`, the mask may not re-apply on re-render.
**How to avoid:** For CPF with `unmask={true}`, store the unmasked value in state. Pass it back via `value`. IMask will re-mask it from the unmasked digits. If visual display breaks, check that the `mask` prop is stable (not recreated on each render).

---

## Code Examples

### Token additions in tokens.css
```css
/* Source: D-05 from CONTEXT.md, placed in :root primitive layer */
:root {
  /* --- Border radius scale --- */
  --radius-sm:  0.25rem;
  --radius-md:  0.5rem;
  --radius-lg:  0.75rem;

  /* --- Shadow scale --- */
  --shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md:  0 4px 12px rgba(0, 0, 0, 0.10);

  /* --- Transition speed --- */
  --transition-fast: 150ms ease;
}
```

### Global focus-visible replacement in index.css
```css
/* Source: D-17, D-18 from CONTEXT.md */
/* REMOVE the existing button:focus rule */
button:focus,
button:focus-visible {
  /* DELETE: outline: 4px auto -webkit-focus-ring-color; */
}

/* ADD global focus-visible */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Table semantic HTML (HistoryPage, Profile, AdminUsers)
```jsx
/* Source: D-16 from CONTEXT.md */
<table>
  <caption>Lista de usuários do sistema</caption>
  <thead>
    <tr>
      <th scope="col">Usuário</th>
      <th scope="col">Tenant</th>
      <th scope="col">Funções (Roles)</th>
      <th scope="col">Status / Detalhes</th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-input-mask | react-imask | Dec 2025 (archived) | react-imask is the drop-in successor; API differs (onAccept not onChange) |
| `:focus` ring | `:focus-visible` | CSS spec 2022, broad browser support 2023 | Hides focus ring for mouse users, shows only for keyboard — correct UX |
| `outline: 0` to remove focus | Keep outline, style it properly | WCAG enforcement increased 2023+ | Never remove focus outline; replace with token-backed 2px ring |
| `role="dialog"` alone | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` | ARIA 1.1 best practice | `aria-modal` prevents VoiceOver from navigating outside the modal |

**Deprecated/outdated:**
- `react-input-mask`: archived Dec 2025 — do not use
- `outline: 4px auto -webkit-focus-ring-color` in index.css: Chrome-specific, inconsistent across browsers — must be replaced
- `<div onClick>` as interactive elements: fails WCAG 4.1.2 — must be `<button>` or `<a>`

---

## Open Questions

1. **ProtocolTriage.css organization at 108 inline styles**
   - What we know: 1506 LOC file, monolithic, no sub-component split (deferred). 108 inline styles span patient form, chat, sensor panel, completion state.
   - What's unclear: Whether to organize ProtocolTriage.css by section (form section, chat section, sensor section) or flat BEM.
   - Recommendation: Organize ProtocolTriage.css in sections matching the component's render sections. Use prefixes: `.patient-form-*`, `.chat-*`, `.triage-sensors-*`, `.triage-complete-*`.

2. **IMaskInput controlled/uncontrolled mode for birth_date**
   - What we know: birth_date drives age auto-calc, so it needs to be controlled. `unmask={false}` returns masked string `DD/MM/AAAA`.
   - What's unclear: Whether passing `value={formData.birth_date}` back to `IMaskInput` with a masked string causes cursor-jump issues on re-render.
   - Recommendation: Use `unmask={false}` for birth_date (store masked DD/MM/AAAA, needed for display and parsing). Test cursor behavior in dev before finalizing.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no test infrastructure exists (explicitly in REQUIREMENTS.md "Out of Scope") |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| A11Y-01 | Zero contrast failures | Lighthouse/Axe browser audit | Manual: browser DevTools Lighthouse Accessibility audit | N/A |
| A11Y-02 | Semantic HTML + ARIA | Manual screen reader check | Manual: NVDA/VoiceOver tabbing through app | N/A |
| A11Y-03 | Visible focus indicators | Visual keyboard tabbing | Manual: Tab through each page, check outline visibility | N/A |
| LAYT-01 | Sensor panel collapses on mobile | Visual responsive check | Manual: Chrome DevTools mobile viewport | N/A |
| LAYT-02 | StatusBar shows session/protocol/connection | Visual check | Manual: start a triage session | N/A |
| FORM-01 | Inline validation on blur/submit | Interaction test | Manual: leave required field empty, blur, check error | N/A |
| FORM-02 | Age auto-fills from birth date | Interaction test | Manual: enter birth date, check age field | N/A |
| FORM-03 | Tooltips visible on hover/focus | Visual check | Manual: hover/tab to ⓘ icon | N/A |
| FORM-04 | Input masking formats as typed | Interaction test | Manual: type in CPF/date/BP fields | N/A |

### Wave 0 Gaps
None — no test infrastructure exists and adding a test suite is explicitly out of scope per REQUIREMENTS.md. Manual verification is the defined acceptance method for this project.

Axe DevTools browser extension is available for free and covers A11Y-01 in-browser — recommend using it at phase completion for the accessibility audit rather than relying only on Lighthouse.

---

## Sources

### Primary (HIGH confidence)
- React source code / project codebase — inline style count verified by file inspection
- `src/styles/tokens.css` (read directly) — confirmed existing tokens and gaps
- `src/index.css` (read directly) — confirmed existing focus rule to replace
- npm registry — `react-imask` version 7.6.1 confirmed via `npm view react-imask version`
- WCAG 2.1 contrast formula (W3C) — contrast calculations verified with Python

### Secondary (MEDIUM confidence)
- [react-imask npm page](https://www.npmjs.com/package/react-imask) — onAccept/unmask API confirmed
- [react-imask 7.6.1 API docs](https://imask.js.org/api/modules/react_imask.html) — IMaskInput props confirmed
- [WCAG 2.1 official spec](https://www.w3.org/TR/WCAG21/) — 4.5:1 ratio requirement
- [focus-trap modal accessibility (adropincalm.com)](https://adropincalm.com/blog/modal-focus-trap-in-javascript-and-react/) — native DOM focus trap pattern

### Tertiary (LOW confidence)
- [CSS max-height transition (codegenes.net)](https://www.codegenes.net/blog/animating-max-height-with-css-transitions/) — collapse animation timing pitfall

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-imask version confirmed from registry; all other stack is native CSS/browser APIs
- Architecture: HIGH — based on direct code inspection of all files to migrate
- Contrast audit: HIGH — calculated with W3C formula from actual hex values in source
- Pitfalls: MEDIUM — some (max-height timing, IMaskInput controlled mode) from web sources, single-source

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable stack; react-imask is unlikely to have breaking changes in 30 days)
