---
phase: 1
plan: 003
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HistoryPage.jsx
  - src/components/TriageDetailsModal.jsx
  - src/pages/Profile.jsx
requirements: [API-06]
autonomous: true
must_haves:
  truths:
    - "History views display triage_result.discriminador as the primary field, not classification"
    - "The old classification field is not referenced as a fallback in any history view"
    - "TriageDetailsModal reads discriminador from triage_result (not a separate details.discriminator path)"
  artifacts:
    - path: "src/components/HistoryPage.jsx"
      provides: "Primary discriminador display in session detail"
      contains: "discriminador"
    - path: "src/components/TriageDetailsModal.jsx"
      provides: "Primary discriminador display in modal"
      contains: "triageResult.discriminador"
    - path: "src/pages/Profile.jsx"
      provides: "History table with correct field references"
  key_links:
    - from: "src/components/HistoryPage.jsx"
      to: "triage_result.discriminador"
      via: "direct property access"
      pattern: "triage_result\\.discriminador"
    - from: "src/components/TriageDetailsModal.jsx"
      to: "triage_result.discriminador"
      via: "direct property access"
      pattern: "triageResult\\.discriminador"
---

<objective>
Make triage_result.discriminador the primary display field in all history views, removing fallbacks to the old classification field.

Purpose: The backend API (openapi.yaml v1.1.0) renamed triage_result.classification to triage_result.discriminador. The frontend still falls back to the old field name, which masks the migration and may display stale data.

Output: HistoryPage.jsx, TriageDetailsModal.jsx, and Profile.jsx all reference discriminador as the primary field.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@openapi.yaml
@src/components/HistoryPage.jsx
@src/components/TriageDetailsModal.jsx
@src/pages/Profile.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix discriminador in HistoryPage.jsx</name>
  <files>src/components/HistoryPage.jsx</files>
  <read_first>
    - src/components/HistoryPage.jsx (line 192 where discriminador/classification is displayed)
    - openapi.yaml (HistoryListResponse example lines 618-622 showing triage_result.discriminador)
  </read_first>
  <action>
On line 192 of HistoryPage.jsx, the session detail header currently reads:

```jsx
{selectedSession.triage_result?.discriminador || selectedSession.triage_result?.classification || 'Classificacao Desconhecida'}
```

Change to use `discriminador` as the sole field, removing the `classification` fallback:

```jsx
{selectedSession.triage_result?.discriminador || 'Discriminador Indisponivel'}
```

The fallback text changes from "Classificacao Desconhecida" to "Discriminador Indisponivel" to match the correct field name.

Per the openapi.yaml, the response schema uses `discriminador` exclusively. The old `classification` field no longer exists in API responses, so the fallback is dead code.
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -n "classification" src/components/HistoryPage.jsx; echo "EXIT:$?"; grep -n "discriminador" src/components/HistoryPage.jsx</automated>
  </verify>
  <acceptance_criteria>
    - `grep "classification" src/components/HistoryPage.jsx` returns NO matches (exit code 1)
    - `grep "discriminador" src/components/HistoryPage.jsx` returns at least 1 match
    - The display text for missing discriminador is "Discriminador Indisponivel" (not "Classificacao Desconhecida")
  </acceptance_criteria>
  <done>HistoryPage.jsx displays triage_result.discriminador as the primary field with no classification fallback</done>
</task>

<task type="auto">
  <name>Task 2: Fix discriminador in TriageDetailsModal.jsx and Profile.jsx</name>
  <files>src/components/TriageDetailsModal.jsx, src/pages/Profile.jsx</files>
  <read_first>
    - src/components/TriageDetailsModal.jsx (line 153 where discriminator variable is assigned)
    - src/pages/Profile.jsx (full file — check for any classification references)
    - openapi.yaml (HistorySession example lines 675-679 showing triage_result.discriminador)
  </read_first>
  <action>
**Fix 1 — TriageDetailsModal.jsx line 153:**

Current code:
```js
const discriminator = triageResult.discriminador || details?.discriminator;
```

The fallback `details?.discriminator` references a non-existent top-level field. The openapi.yaml places discriminador inside `triage_result`. Change to:

```js
const discriminator = triageResult.discriminador || 'Discriminador Indisponivel';
```

This removes the incorrect fallback path. The variable name `discriminator` (English) can stay since it is an internal JS variable, not a display string. The display already uses this variable at line 390 — no change needed there.

**Fix 2 — Profile.jsx:**

Scan Profile.jsx for any references to `classification` or `discriminator`/`discriminador` in the history table. The current Profile.jsx table (around line 126) shows:
```jsx
{item.triage_result?.fluxograma_sintoma || item.triage_result?.protocol?.replace(/_/g, ' ') || '-'}
```

This references `fluxograma_sintoma` (correct per API) and `protocol` (acceptable fallback). No `classification` reference exists in Profile.jsx — no changes needed for that file.

However, verify that Profile.jsx does not display a "discriminador" column. If users need to see the discriminador in the profile history table, that would be a new feature (out of scope for this cleanup). The current table columns (Data, Paciente, Protocolo, Prioridade, Acao) are fine.
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -n "classification\|details?\.discriminator" src/components/TriageDetailsModal.jsx; echo "EXIT:$?"; grep -n "discriminador" src/components/TriageDetailsModal.jsx; echo "---"; grep -n "classification" src/pages/Profile.jsx; echo "PROFILE_EXIT:$?"</automated>
  </verify>
  <acceptance_criteria>
    - `grep "details?.discriminator" src/components/TriageDetailsModal.jsx` returns NO matches
    - `grep "classification" src/components/TriageDetailsModal.jsx` returns NO matches
    - Line 153 (approximately) reads `const discriminator = triageResult.discriminador || 'Discriminador Indisponivel';`
    - `grep "classification" src/pages/Profile.jsx` returns NO matches (confirming no regression)
    - The display at line ~390 still uses the `discriminator` variable (no change needed)
  </acceptance_criteria>
  <done>TriageDetailsModal.jsx uses triage_result.discriminador as sole source; Profile.jsx confirmed clean of classification references</done>
</task>

</tasks>

<verification>
1. `grep -rn "classification" src/components/HistoryPage.jsx src/components/TriageDetailsModal.jsx src/pages/Profile.jsx` — should return NO matches
2. `grep -rn "discriminador" src/components/HistoryPage.jsx src/components/TriageDetailsModal.jsx` — should return matches in both files
3. `npm run build` completes without errors
</verification>

<success_criteria>
- No references to the old `classification` field remain in HistoryPage.jsx, TriageDetailsModal.jsx, or Profile.jsx
- triage_result.discriminador is the primary display field in all history views
- App builds without errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-api-alignment/01-003-SUMMARY.md`
</output>
