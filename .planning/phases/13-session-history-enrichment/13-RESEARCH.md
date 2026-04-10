# Phase 13: Session History Enrichment - Research

**Researched:** 2026-04-10
**Domain:** React table rendering, shared utility extraction, REST API migration (S3-key pattern → session-id pattern)
**Confidence:** HIGH

## Summary

All data needed for the enriched history list already exists in the `GET /history` API response. The endpoint returns full `HistorySession` objects including `patient_info.name`, `triage_result` (with priority color/label), `stats.duration_seconds`, `session_id`, and `created_at`. The current `HistoryPage.jsx` discards this data and renders only `item.key` (S3 path) and `item.lastModified` — a legacy pattern from before DynamoDB migration.

The migration has two parallel tracks: (1) update the list-rendering JSX and table columns to consume the rich fields, and (2) migrate `handleSelectSession` from `GET /history?key=...` to `GET /history/{session_id}`. Both are self-contained to `HistoryPage.jsx` and `HistoryPage.css`. The only cross-file change is extracting `PRIORITY_MAP` + `resolvePriority()` from `Profile.jsx` into a shared `src/utils/priority.js`.

The priority badge CSS infrastructure already exists globally in `App.css` (`.priority-badge`, `.priority-{color}`). The compact table-badge variant exists in `Profile.css` (`.profile-table__priority-badge`). The planner should adapt the compact pattern for `HistoryPage` under the `history-page__` BEM namespace rather than importing Profile-scoped classes.

**Primary recommendation:** Migrate HistoryPage table rendering to consume `data.sessions` rich fields, extract `resolvePriority` to `src/utils/priority.js`, replace the 3-column S3 table with a 4-column enriched table, and migrate `handleSelectSession` to `GET /history/{session_id}`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `GET /history` already returns full `HistorySession` objects. This phase migrates list rendering to use the rich fields — NO backend changes needed.

**D-02:** Profile.jsx already consumes the same endpoint fields. Use Profile's patterns as reference.

**D-03:** Use a compact colored pill badge (`priority-badge` + `priority-{color}` classes) in each row. Extract `resolvePriority` from Profile.jsx into a shared utility so both HistoryPage and Profile use the same logic. The `resolvePriorityBanner` function in HistoryPage stays for the detail view banner.

**D-04:** Badge shows Portuguese priority label (Vermelho, Laranja, Amarelo, Verde, Azul).

**D-05:** Show `patient_info.name`. Fallback text: "Paciente anon." when null/undefined.

**D-06:** No age/sex in the list row — detail panel only. Just the name.

**D-07:** Show `stats.duration_seconds` formatted as "Xmin Ys" (e.g., "8min 32s"). If null/missing, show "—".

**D-08:** No start/end timestamps in the list row.

**D-09:** Replace 3-column table (Data, Hora, ID) with 4 enriched columns: Data/Hora (combined), Paciente, Prioridade, Duração. Remove the truncated session ID column.

**D-10:** Use `item.created_at` instead of `item.lastModified` for date/time. Use `item.session_id` instead of parsing `item.key` for active-row comparison.

**D-11:** Migrate `handleSelectSession` from `?key=...` to `GET /history/{session_id}` — the proper REST endpoint.

### Claude's Discretion

- Column widths and responsive behavior
- Loading skeleton vs spinner during detail fetch
- Sort order of sessions (currently unsorted in HistoryPage; Profile sorts by `created_at` desc)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HIST-01 | History list shows MTS priority color badge for each session | `resolvePriority()` from Profile.jsx; global `.priority-badge` + `.priority-{color}` in App.css; compact sizing pattern in Profile.css |
| HIST-02 | History list shows patient name preview and session duration | `patient_info.name` present in list response (openapi.yaml §HistoryListResponse); `stats.duration_seconds` integer in `SessionStats` schema |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component rendering and state | Project constraint — no change |
| React Router DOM | 7.12.0 | Navigation (useNavigate — already in use) | Project constraint — no change |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | All needed patterns already exist in the project | No new dependencies needed |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed except:
```
src/
├── utils/
│   ├── auth.js                  # Already exists
│   └── priority.js              # NEW — extract from Profile.jsx
├── components/
│   ├── HistoryPage.jsx          # MODIFY — primary change target
│   └── HistoryPage.css          # MODIFY — new column classes
├── pages/
│   └── Profile.jsx              # MODIFY — import from utils/priority.js
```

### Pattern 1: Shared Priority Utility

**What:** Extract `PRIORITY_MAP` and `resolvePriority()` from `Profile.jsx` into `src/utils/priority.js` so HistoryPage can import and use the same logic without duplication.

**When to use:** Any component that needs to render an MTS priority badge from a `triage_result` object.

**Example:**
```javascript
// src/utils/priority.js
// Source: adapted from Profile.jsx lines 9-38 (verified in codebase)

const PRIORITY_MAP = {
    red:    { className: 'priority-badge priority-red',    label: 'Vermelho' },
    orange: { className: 'priority-badge priority-orange', label: 'Laranja'  },
    yellow: { className: 'priority-badge priority-yellow', label: 'Amarelo'  },
    green:  { className: 'priority-badge priority-green',  label: 'Verde'    },
    blue:   { className: 'priority-badge priority-blue',   label: 'Azul'     },
};

export function resolvePriority(triageResult) {
    const p = (
        triageResult?.prioridade ||
        triageResult?.cor ||
        triageResult?.priority ||
        ''
    ).toLowerCase();

    if (p.includes('red') || p.includes('vermelho'))    return { ...PRIORITY_MAP.red };
    if (p.includes('orange') || p.includes('laranja'))  return { ...PRIORITY_MAP.orange };
    if (p.includes('yellow') || p.includes('amarelo'))  return { ...PRIORITY_MAP.yellow };
    if (p.includes('green') || p.includes('verde'))     return { ...PRIORITY_MAP.green };
    if (p.includes('blue') || p.includes('azul'))       return { ...PRIORITY_MAP.blue };
    if (PRIORITY_MAP[p]) return PRIORITY_MAP[p];
    return {
        className: 'priority-badge priority-unknown',
        label: triageResult?.prioridade || p || 'N/A',
    };
}
```

After extraction, Profile.jsx replaces its local definition with:
```javascript
import { resolvePriority } from '../utils/priority';
```

### Pattern 2: Duration Formatter

**What:** A pure function to format `stats.duration_seconds` (integer) into "Xmin Ys" format per D-07.

**When to use:** In the list row for each session.

**Example:**
```javascript
// Source: D-07 from CONTEXT.md
function formatDuration(seconds) {
    if (seconds == null || seconds === undefined) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}min ${secs}s`;
}
```

This function can live inline in `HistoryPage.jsx` or in `src/utils/priority.js` — small enough to co-locate.

### Pattern 3: Active Row Comparison (Migration)

**What:** The current active-row detection parses the S3 key: `selectedSession?.session_id === item.key.split('/').pop().replace('.json', '')`. After migration, both sides use `session_id` directly.

**Before (line 133):**
```javascript
const isActive = selectedSession?.session_id === item.key.split('/').pop().replace('.json', '');
```

**After:**
```javascript
const isActive = selectedSession?.session_id === item.session_id;
```

### Pattern 4: handleSelectSession Migration

**What:** Replace the fragile `GET /history?key=<encoded_s3_key>` with `GET /history/{session_id}`.

**Before (HistoryPage.jsx lines 79-100):**
```javascript
const handleSelectSession = async (key) => {
    const encodedKey = encodeURIComponent(key);
    const response = await fetch(`${API_URL}/history?key=${encodedKey}`, ...);
    // called as: handleSelectSession(item.key)
};
```

**After:**
```javascript
const handleSelectSession = async (sessionId) => {
    const response = await fetch(`${API_URL}/history/${sessionId}`, ...);
    // called as: handleSelectSession(item.session_id)
};
```

Both the `?key=` and `/{session_id}` endpoints return the same `HistorySession` shape per openapi.yaml (verified: lines 602-638 vs 659-688). No consumer changes to `selectedSession` field access needed.

### Pattern 5: Enriched Table Columns

**What:** Replace the 3-column table (Data, Hora, ID) with 4-column enriched table.

**New `<thead>`:**
```jsx
<tr>
    <th scope="col">Data/Hora</th>
    <th scope="col">Paciente</th>
    <th scope="col">Prioridade</th>
    <th scope="col">Duração</th>
</tr>
```

**New `<tbody>` row pattern:**
```jsx
{sessions.map((item) => {
    const priority = resolvePriority(item.triage_result || {});
    const isActive = selectedSession?.session_id === item.session_id;
    return (
        <tr
            key={item.session_id}
            onClick={() => handleSelectSession(item.session_id)}
            className={`history-page__session-row${isActive ? ' history-page__session-row--active' : ''}`}
        >
            <td className="history-page__session-date">
                {item.created_at
                    ? new Date(item.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
                    : '—'}
            </td>
            <td className="history-page__session-patient">
                {item.patient_info?.name || 'Paciente anon.'}
            </td>
            <td className="history-page__session-priority">
                <span className={`${priority.className} history-page__priority-pill`}>
                    {priority.label}
                </span>
            </td>
            <td className="history-page__session-duration">
                {formatDuration(item.stats?.duration_seconds)}
            </td>
        </tr>
    );
})}
```

**Key:** Use `item.session_id` as the React `key` instead of `item.key` (S3 path).

### Pattern 6: Compact Badge CSS (New history-page Variant)

**What:** The global `.priority-badge` in App.css uses large sizing (1rem padding, 1.5rem font) — appropriate for triage result banners, not for table rows. Profile.css has `.profile-table__priority-badge` as a compact override. HistoryPage needs its own BEM-namespaced variant.

**New CSS in HistoryPage.css:**
```css
/* Compact priority pill for list rows — overrides App.css .priority-badge sizing */
.history-page__priority-pill {
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    display: inline-block;
}

/* Yellow badge needs dark text for contrast (same as App.css rule) */
.history-page__priority-pill.priority-yellow {
    color: var(--mts-yellow-text);
}
```

The className from `resolvePriority()` includes `priority-badge priority-{color}` — the `history-page__priority-pill` modifier class stacks on top to override the sizing without needing to change the utility function.

### Anti-Patterns to Avoid

- **Using `item.key` or `item.lastModified` after migration:** These S3-pattern fields may not exist once the backend is fully on DynamoDB. Use `item.session_id` and `item.created_at`.
- **Importing Profile.css classes into HistoryPage:** Cross-component CSS imports break the BEM namespace. Add a new `.history-page__priority-pill` class to `HistoryPage.css` instead.
- **Raw hex values in new CSS:** All colors must go through `var(--mts-*)` or `var(--color-*)` tokens per project conventions.
- **Keeping `resolvePriority` duplicated:** After extraction, delete the local copy from Profile.jsx. Two implementations will drift.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Priority color resolution | Custom switch/if chain per component | `resolvePriority()` from `src/utils/priority.js` | Already handles all 5 MTS colors + bilingual string matching (English/PT-BR). Rolling a new one risks missing edge cases. |
| Date/time formatting | Custom date string manipulation | `Date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })` | Already used in Profile.jsx and HistoryPage detail view — consistent with existing pattern. |
| CSS badge sizing | New utility class | Stack `history-page__priority-pill` on existing `priority-badge priority-{color}` | The color definitions are global; only the sizing needs overriding. |

**Key insight:** Everything needed exists — the work is wiring it together and cleaning up the S3 legacy pattern.

---

## Common Pitfalls

### Pitfall 1: `item.key` vs `item.session_id` confusion

**What goes wrong:** After migration, code accidentally still references `item.key` (the S3 object path, e.g., `sessions/sess_abc123/report.json`). The `onClick` calls `handleSelectSession(item.key)` instead of `handleSelectSession(item.session_id)`, causing the fetch to use an S3 key as a session ID and returning 404.

**Why it happens:** The API continues to return `key` and `lastModified` fields alongside the new fields (the `?key=` query parameter still works per openapi.yaml line 592-599). It looks like it "works" during list loading but fails on row click.

**How to avoid:** Change every reference to `item.key` and `item.lastModified` in a single edit. Remove the `key`-based parsing from `isActive` comparison in the same pass.

**Warning signs:** Click on a history row shows "Erro ao carregar detalhes da sessão" toast; `console.error` shows a 404 or a session object with `key` property missing `session_id`.

### Pitfall 2: Yellow badge unreadable text

**What goes wrong:** The compact badge for "Amarelo" (yellow priority) renders black-on-yellow correctly in the existing global `.priority-yellow` rule, but only if the `color` override (`var(--mts-yellow-text)`) is preserved or re-applied in the compact variant.

**Why it happens:** The compact variant CSS overrides `.priority-badge` sizing but doesn't re-assert `color`. If the specificity is wrong, the white `color` from `.priority-badge` wins over the yellow's `color: var(--mts-yellow-text)` rule.

**How to avoid:** Add explicit `color: var(--mts-yellow-text)` to the `.history-page__priority-pill.priority-yellow` selector in `HistoryPage.css`. Verify visually after implementation.

**Warning signs:** Yellow badge shows white text on yellow background — fails WCAG contrast.

### Pitfall 3: `resolvePriority(null)` crashes

**What goes wrong:** A session in the list has `triage_result: null` (session started but never completed, or partial data). Calling `resolvePriority(null)` causes a TypeError because the function accesses `.prioridade` on null.

**Why it happens:** The current Profile.jsx line 111 already guards: `resolvePriority(item.triage_result || {})`. The new HistoryPage code must use the same guard.

**How to avoid:** Always call `resolvePriority(item.triage_result || {})`. The `TriageResult` schema in openapi.yaml is `nullable: true` (line 1476). The existing `resolvePriority` in Profile.jsx uses optional chaining (`triageResult?.prioridade`) — preserve this in the extracted utility.

**Warning signs:** List renders blank then crashes; React error boundary (if added) catches a TypeError.

### Pitfall 4: Sort order regression

**What goes wrong:** Profile.jsx sorts sessions by `created_at` desc (lines 58-63) before rendering. The current HistoryPage does not sort — it renders in API response order. After migration, if the planner decides to add sorting, the list must not accidentally sort in ascending order (oldest-first), which would confuse clinicians looking for recent sessions.

**Why it happens:** Sorting logic is easy to reverse (dateA - dateB vs dateB - dateA).

**How to avoid:** Mirror Profile.jsx's sort: `(a, b) => new Date(b.created_at) - new Date(a.created_at)` (newest first). Apply at `setSessions()` time in `loadSessions`.

---

## Code Examples

### formatDuration utility
```javascript
// Source: derived from D-07 in CONTEXT.md (design decision, no external library)
function formatDuration(seconds) {
    if (seconds == null) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}min ${secs}s`;
}
// Examples: 512 → "8min 32s", 45 → "45s", null → "—"
```

### Date/time combined column
```javascript
// Source: consistent with Profile.jsx line 115 pattern (verified in codebase)
{item.created_at
    ? new Date(item.created_at).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'}
// Renders: "23/03/2026, 14:00"
```

### Priority badge in table row
```javascript
// Source: Profile.jsx lines 110-131 (verified in codebase), adapted for HistoryPage BEM namespace
const priority = resolvePriority(item.triage_result || {});
// ...
<span className={`${priority.className} history-page__priority-pill`}>
    {priority.label}
</span>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `GET /history?key=<s3_key>` for detail | `GET /history/{session_id}` | API migrated to DynamoDB (pre-phase-13) | Cleaner REST; session_id is now the stable identifier |
| S3 `key`/`lastModified` as display data | `session_id`, `created_at`, `patient_info`, `triage_result`, `stats` | API v2 DynamoDB migration | Rich fields now available; S3 metadata no longer needed |

**Deprecated/outdated:**
- `item.key` (S3 object path): Still returned by the API for backward compatibility, but should no longer be used for display or navigation logic.
- `item.lastModified` (S3 modification timestamp): Replaced by `item.created_at` (ISO 8601, set at session creation).

---

## Open Questions

1. **Does the API still return `key`/`lastModified` fields alongside the new fields?**
   - What we know: openapi.yaml `HistorySession` schema (line 1311) does not include `key` or `lastModified`. The list endpoint example (line 609-628) shows only the new fields.
   - What's unclear: Whether the real DynamoDB backend still injects these legacy fields. The `?key=` query param still exists in the spec (line 592), suggesting partial backward compat.
   - Recommendation: Migrate to `item.session_id` and `item.created_at` unconditionally. The code will still work even if the API returns legacy fields — we simply stop reading them.

2. **Sessions with no `triage_result` (incomplete sessions) in the list?**
   - What we know: `HistorySession.triage_result` is nullable (openapi.yaml line 1476). The `GET /history` endpoint returns "completed or in-progress" sessions (line 1313).
   - What's unclear: Whether in-progress sessions appear in the history list response.
   - Recommendation: Guard all `triage_result` accesses with `|| {}` and treat null/unknown priority gracefully (show "N/A" badge per `resolvePriority` fallback branch).

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in project (no vitest.config, no jest.config, no test scripts in package.json) |
| Config file | None — see Wave 0 |
| Quick run command | `npm run lint` (only automated check available) |
| Full suite command | `npm run build` (compilation + type-safety via JSX transform) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-01 | Priority badge renders correct color class from triage_result | manual-only | — | N/A |
| HIST-01 | `resolvePriority()` returns correct className/label for each MTS color | unit | N/A — no test framework | Wave 0 gap |
| HIST-02 | Patient name shows "Paciente anon." when null | manual-only | — | N/A |
| HIST-02 | `formatDuration(512)` returns "8min 32s"; `formatDuration(null)` returns "—" | unit | N/A — no test framework | Wave 0 gap |
| HIST-01+02 | History list row renders all 4 columns without crash | smoke | `npm run build` (build error check) | ✅ |

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run build`
- **Phase gate:** Build passes + manual visual verification of badge colors and fallback text before `/gsd:verify-work`

### Wave 0 Gaps
- No test framework is installed. Per `REQUIREMENTS.md` §Out of Scope: "Test suite — Known tech debt; separate milestone." Unit tests for `formatDuration` and `resolvePriority` are desirable but out of scope per project constraints.
- Manual verification is the required method for HIST-01 and HIST-02 given no test infrastructure.

*(No Wave 0 test scaffolding tasks needed — out of scope per project decision.)*

---

## Sources

### Primary (HIGH confidence)
- `/home/victor/Git/triax-prototype/src/components/HistoryPage.jsx` — Current implementation, S3 legacy pattern confirmed at lines 79-100 and 132-149
- `/home/victor/Git/triax-prototype/src/pages/Profile.jsx` — `PRIORITY_MAP` + `resolvePriority()` at lines 9-38; table pattern at lines 110-141
- `/home/victor/Git/triax-prototype/openapi.yaml` — `HistoryListResponse` (line 1303), `HistorySession` (line 1311), `SessionStats` (line 1591), `/history/{session_id}` endpoint (line 641)
- `/home/victor/Git/triax-prototype/src/App.css` — Global `.priority-badge` + `.priority-{color}` classes at lines 75-104
- `/home/victor/Git/triax-prototype/src/pages/Profile.css` — Compact badge `.profile-table__priority-badge` at lines 111-125
- `/home/victor/Git/triax-prototype/src/styles/tokens.css` — MTS color tokens at lines 48-53; `--mts-yellow-text` at line 51

### Secondary (MEDIUM confidence)
- `13-CONTEXT.md` (phase discussion output) — All locked decisions (D-01 through D-11) verified against actual source files

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new dependencies; all patterns exist in codebase
- Architecture: HIGH — Source files read directly; API contract verified in openapi.yaml
- Pitfalls: HIGH — Derived from reading the actual legacy code that will be removed

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable domain — no external dependencies)
