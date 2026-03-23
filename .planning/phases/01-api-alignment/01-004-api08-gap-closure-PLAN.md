---
phase: 01-api-alignment
plan: 004
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ProtocolTriage.jsx
  - .planning/REQUIREMENTS.md
autonomous: true
gap_closure: true
requirements:
  - API-01
  - API-02
  - API-03
  - API-04
  - API-05
  - API-06
  - API-07
  - API-08

must_haves:
  truths:
    - "checkProtocolSuggestion throws on non-2xx response from /protocol-suggest instead of silently parsing error body"
    - "handlePatientSubmit does not advance to chat stage when /patient-info returns non-2xx"
    - "REQUIREMENTS.md traceability table reflects actual completion status of all Phase 1 requirements"
  artifacts:
    - path: "src/components/ProtocolTriage.jsx"
      provides: "response.ok guards on /protocol-suggest and /patient-info fetches"
      contains: "if (!response.ok)"
    - path: ".planning/REQUIREMENTS.md"
      provides: "Updated traceability table"
      contains: "[x] **API-01**"
  key_links:
    - from: "src/components/ProtocolTriage.jsx"
      to: "/protocol-suggest"
      via: "response.ok guard before response.json()"
      pattern: "if \\(!response\\.ok\\)"
    - from: "src/components/ProtocolTriage.jsx"
      to: "/patient-info"
      via: "response.ok guard before state updates"
      pattern: "if \\(!response\\.ok\\)"
---

<objective>
Close the two response.ok gaps identified in 01-VERIFICATION.md that block full API-08 compliance, and update the REQUIREMENTS.md traceability table to reflect the actual completion status of Phase 1 requirements.

Purpose: Without response.ok guards, a failed /protocol-suggest or /patient-info call silently advances the triage session into an inconsistent state — a patient safety concern in a clinical triage app.
Output: Patched ProtocolTriage.jsx with two response.ok guards; updated REQUIREMENTS.md traceability.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-api-alignment/01-VERIFICATION.md
@src/components/ProtocolTriage.jsx
@.planning/REQUIREMENTS.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add response.ok guards to checkProtocolSuggestion and handlePatientSubmit</name>
  <files>src/components/ProtocolTriage.jsx</files>
  <read_first>
    - src/components/ProtocolTriage.jsx (full file — understand current error handling patterns, especially lines 376-417 for handlePatientSubmit and lines 494-530 for checkProtocolSuggestion)
  </read_first>
  <action>
Two changes in src/components/ProtocolTriage.jsx:

**Change 1 — checkProtocolSuggestion (around line 505):**

Current code:
```javascript
const data = await response.json();
```

Replace with:
```javascript
if (!response.ok) {
    throw new Error(`Erro na sugestao de protocolo: ${response.status}`);
}
const data = await response.json();
```

The throw will be caught by the existing try/catch in the calling function (handleSend or whichever invokes checkProtocolSuggestion). The catch block already calls `console.error` and the flow will stop instead of silently parsing an error body as a valid ProtocolSuggestResponse.

**Change 2 — handlePatientSubmit (around line 381-396):**

Current code (line 381):
```javascript
await fetch(`${API_URL}/patient-info`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
        session_id: sessionId,
        name: data.name,
        age: data.age,
        sex: data.sex,
        patient_code: data.patient_code,
        birth_date: data.birth_date,
        ticket_number: data.ticket_number,
        insurance: data.insurance,
        visit_id: data.visit_id,
        same: data.same
    })
});
```

Replace the bare `await fetch(...)` with:
```javascript
const patientResponse = await fetch(`${API_URL}/patient-info`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
        session_id: sessionId,
        name: data.name,
        age: data.age,
        sex: data.sex,
        patient_code: data.patient_code,
        birth_date: data.birth_date,
        ticket_number: data.ticket_number,
        insurance: data.insurance,
        visit_id: data.visit_id,
        same: data.same
    })
});
if (!patientResponse.ok) {
    throw new Error(`Erro ao registrar paciente: ${patientResponse.status}`);
}
```

The throw will be caught by the existing `catch (e)` block at line 411, which already calls `alert("Erro ao iniciar sessao. Tente novamente.")` and sets loading false. This means `setPatientInfo(data)` and `setIsPatientInfoSubmitted(true)` at lines 409-410 will NOT execute on failure — which is the correct behavior.

Do NOT modify any other fetch calls in this file. The remaining fetch calls without response.ok checks (e.g., /transcription calls) are in scope for Phase 4 FRAG-01, not this gap closure.
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -n "if (!response.ok)" src/components/ProtocolTriage.jsx | head -10 && grep -n "if (!patientResponse.ok)" src/components/ProtocolTriage.jsx | head -5</automated>
  </verify>
  <acceptance_criteria>
    - src/components/ProtocolTriage.jsx contains `if (!response.ok)` inside checkProtocolSuggestion, appearing BEFORE the `const data = await response.json()` line
    - src/components/ProtocolTriage.jsx contains `if (!patientResponse.ok)` inside handlePatientSubmit, appearing AFTER the fetch call and BEFORE `setPatientInfo(data)`
    - The error messages contain Portuguese text: "Erro na sugestao de protocolo" and "Erro ao registrar paciente"
    - No other fetch calls in the file are modified (grep for "if (!response.ok)" should return exactly 1 match from checkProtocolSuggestion; grep for "if (!patientResponse.ok)" should return exactly 1 match from handlePatientSubmit)
    - The app still builds: `npx vite build` exits 0
  </acceptance_criteria>
  <done>checkProtocolSuggestion throws on non-2xx from /protocol-suggest; handlePatientSubmit does not advance to chat on non-2xx from /patient-info; app builds without errors</done>
</task>

<task type="auto">
  <name>Task 2: Update REQUIREMENTS.md traceability table</name>
  <files>.planning/REQUIREMENTS.md</files>
  <read_first>
    - .planning/REQUIREMENTS.md (read the Traceability section at the bottom, lines 63-84)
    - .planning/phases/01-api-alignment/01-VERIFICATION.md (read Requirements Coverage table, lines 84-93, for evidence)
  </read_first>
  <action>
In .planning/REQUIREMENTS.md, update the Traceability table (starting around line 64):

1. Change API-01 from `Pending` to `Complete`:
   - Old: `| API-01 | Phase 1 | Pending |`
   - New: `| API-01 | Phase 1 | Complete |`

2. Change API-03 from `Pending` to `Complete`:
   - Old: `| API-03 | Phase 1 | Pending |`
   - New: `| API-03 | Phase 1 | Complete |`

3. Change API-08 from `Pending` to `Complete`:
   - Old: `| API-08 | Phase 1 | Pending |`
   - New: `| API-08 | Phase 1 | Complete |`

4. Also update the checkbox lines at the top of the file:
   - Change `- [ ] **API-01**:` to `- [x] **API-01**:`  (line 10)
   - Change `- [ ] **API-03**:` to `- [x] **API-03**:`  (line 12)
   - Change `- [ ] **API-08**:` to `- [x] **API-08**:`  (line 17)

Do NOT change any other lines. API-02, API-04, API-05, API-06, API-07 are already marked Complete — leave them as-is.
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -E "API-0[1-8]" .planning/REQUIREMENTS.md</automated>
  </verify>
  <acceptance_criteria>
    - .planning/REQUIREMENTS.md line for API-01 contains `[x] **API-01**` (checkbox checked)
    - .planning/REQUIREMENTS.md line for API-03 contains `[x] **API-03**` (checkbox checked)
    - .planning/REQUIREMENTS.md line for API-08 contains `[x] **API-08**` (checkbox checked)
    - Traceability table row for API-01 contains `| Complete |`
    - Traceability table row for API-03 contains `| Complete |`
    - Traceability table row for API-08 contains `| Complete |`
    - All 8 API requirements (API-01 through API-08) now show Complete in the traceability table
  </acceptance_criteria>
  <done>All Phase 1 API requirements are marked Complete in both the checkbox list and the traceability table</done>
</task>

</tasks>

<verification>
1. `npx vite build` in project root exits 0 (no build errors from the ProtocolTriage.jsx changes)
2. `grep -c "if (!response.ok)" src/components/ProtocolTriage.jsx` returns at least 1
3. `grep -c "if (!patientResponse.ok)" src/components/ProtocolTriage.jsx` returns 1
4. `grep "Pending" .planning/REQUIREMENTS.md` returns NO lines containing API-01, API-03, or API-08
</verification>

<success_criteria>
- Both response.ok guards are present in ProtocolTriage.jsx
- A non-2xx from /protocol-suggest causes checkProtocolSuggestion to throw (caught by existing try/catch)
- A non-2xx from /patient-info prevents setIsPatientInfoSubmitted(true) from executing
- All 8 Phase 1 requirements marked Complete in REQUIREMENTS.md
- App builds cleanly with `npx vite build`
</success_criteria>

<output>
After completion, create `.planning/phases/01-api-alignment/01-004-SUMMARY.md`
</output>
