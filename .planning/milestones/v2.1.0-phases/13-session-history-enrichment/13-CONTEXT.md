# Phase 13: Session History Enrichment - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The history list gives clinicians enough at-a-glance context to identify and navigate to any past session. Adds MTS priority color badge, patient name, and session duration to each history list row.

</domain>

<decisions>
## Implementation Decisions

### Data source — use existing API response fields
- **D-01:** The `GET /history` API already returns full `HistorySession` objects with `patient_info`, `triage_result`, `stats`, `session_id`, `created_at`. The HistoryPage currently ignores this data and only uses `item.key` + `item.lastModified` (S3 legacy pattern). This phase migrates the list rendering to use the rich fields — NO backend changes needed.
- **D-02:** Profile.jsx already consumes these same fields from the same endpoint. Use Profile's patterns as reference.

### Priority badge in list rows
- **D-03:** Use a compact colored pill badge (small `priority-badge` + `priority-{color}` classes) in each row. Reuse the existing `resolvePriority` function from Profile.jsx — extract it to a shared utility so both HistoryPage and Profile use the same logic. The `resolvePriorityBanner` function in HistoryPage stays for the detail view banner but the list uses the compact variant.
- **D-04:** Badge shows the Portuguese priority label (Vermelho, Laranja, Amarelo, Verde, Azul) — same as Profile page.

### Patient name in list rows
- **D-05:** Show `patient_info.name` in the list. Fallback text: "Paciente anon." when name is null/undefined — consistent with clinical context. Keep it concise for the table cell.
- **D-06:** No age/sex in the list row — that detail is in the detail panel. Just the name.

### Session duration in list rows
- **D-07:** Show `stats.duration_seconds` formatted as "Xmin Ys" (e.g., "8min 32s"). If duration_seconds is null or missing, show "—".
- **D-08:** No start/end timestamps in the list — those stay in the detail view.

### Table column restructure
- **D-09:** Replace the current 3-column table (Data, Hora, ID) with enriched columns: Data/Hora (combined), Paciente, Prioridade, Duração. The truncated session ID column is meaningless to clinicians — remove it.
- **D-10:** Use `item.created_at` instead of `item.lastModified` for the date/time column. Use `item.session_id` instead of parsing `item.key` for the active row comparison.

### Session selection migration
- **D-11:** Migrate `handleSelectSession` from S3-key-based lookup (`?key=...`) to session-id-based lookup using `GET /history/{session_id}` — the proper REST endpoint per openapi.yaml. This eliminates the fragile key parsing.

### Claude's Discretion
- Column widths and responsive behavior
- Loading skeleton vs spinner during detail fetch
- Sort order of sessions (currently not sorted in HistoryPage; Profile sorts by created_at desc)

</decisions>

<specifics>
## Specific Ideas

- Profile.jsx lines 9-38 already have `PRIORITY_MAP` and `resolvePriority()` — extract to shared utility
- Profile.jsx lines 110-141 show the table pattern with patient name, priority badge, and protocol columns — use as visual reference
- `profile-table__priority-badge` in Profile.css is the compact badge sizing (4px 8px padding, radius-sm, font-size-sm)
- HistoryPage detail view already uses `selectedSession.stats?.duration_seconds` — just surface it in the list too

</specifics>

<canonical_refs>
## Canonical References

### API contract
- `openapi.yaml` §HistoryListResponse (line 1303) — Confirms list returns full HistorySession objects
- `openapi.yaml` §HistorySession (line 1311) — Fields: session_id, created_at, patient_info, triage_result, stats
- `openapi.yaml` §/history (line 575) — List endpoint, role-scoped, DynamoDB-backed
- `openapi.yaml` §/history/{session_id} (line 641) — Detail endpoint for single session

### Existing patterns
- `src/pages/Profile.jsx` — Already renders same API response with priority badges and patient names
- `src/pages/Profile.css` §.profile-table__priority-badge — Compact badge sizing variant
- `src/App.css` §.priority-badge, §.priority-{color} — Global MTS priority badge classes

### Design system
- `src/styles/tokens.css` §MTS Priority Colors (line 48) — Immutable clinical color tokens
- `src/styles/tokens.css` §MTS Priority Tints (line 58) — Tint variants for backgrounds

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PRIORITY_MAP` + `resolvePriority()` in Profile.jsx: Exact logic needed for list badges — extract to `src/utils/priority.js`
- `.priority-badge` + `.priority-{color}` in App.css: Global badge classes, already used in HistoryPage detail view and Profile
- `.profile-table__priority-badge` in Profile.css: Compact badge sizing — adapt for HistoryPage list

### Established Patterns
- Token-backed CSS: All colors via `var(--mts-*)` and `var(--color-*)` — no raw hex values
- BEM naming: `history-page__` prefix for all new classes
- Portuguese UI strings: All user-facing text in pt-BR
- `getAuthHeaders()` from `src/utils/auth.js` for API calls

### Integration Points
- `HistoryPage.jsx` lines 59-77: `loadSessions` fetches `GET /history` — response already contains the needed data
- `HistoryPage.jsx` lines 79-100: `handleSelectSession` needs migration from S3 key to session ID
- `HistoryPage.jsx` lines 132-149: Table row rendering — primary change target
- `HistoryPage.css` lines 89-122: Table row styling — needs new column classes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-session-history-enrichment*
*Context gathered: 2026-04-10*
