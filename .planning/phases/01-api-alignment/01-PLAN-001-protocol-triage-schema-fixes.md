---
phase: 1
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ProtocolTriage.jsx
requirements: [API-01, API-03, API-08]
autonomous: true
must_haves:
  truths:
    - "POST /patient-info receives flat fields (session_id, name, age, sex, ...) not wrapped in a patient_info object"
    - "POST /protocol-suggest sends prompt field in request body"
    - "POST /session-finish is called after triage completes and the session is saved to S3"
  artifacts:
    - path: "src/components/ProtocolTriage.jsx"
      provides: "Fixed API call schemas and session finalization"
      contains: "session-finish"
  key_links:
    - from: "src/components/ProtocolTriage.jsx"
      to: "/patient-info"
      via: "fetch POST with flat body"
      pattern: "JSON\\.stringify\\(\\{\\s*session_id.*name.*age"
    - from: "src/components/ProtocolTriage.jsx"
      to: "/protocol-suggest"
      via: "fetch POST with prompt field"
      pattern: "prompt:"
    - from: "src/components/ProtocolTriage.jsx"
      to: "/session-finish"
      via: "fetch POST after triage complete"
      pattern: "session-finish"
---

<objective>
Fix request body schemas for /patient-info and /protocol-suggest to match openapi.yaml v1.1.0, and add the missing POST /session-finish call that finalizes the triage session.

Purpose: The frontend currently wraps patient-info fields in a nested object (API rejects or ignores them), omits the required `prompt` field from protocol-suggest, and never calls session-finish (so sessions are never persisted to S3).

Output: ProtocolTriage.jsx with corrected API call bodies and a new session finalization step.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@openapi.yaml
@src/components/ProtocolTriage.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix /patient-info and /protocol-suggest request bodies</name>
  <files>src/components/ProtocolTriage.jsx</files>
  <read_first>
    - src/components/ProtocolTriage.jsx (current API call implementations)
    - openapi.yaml (canonical schema definitions: PatientInfoRequest lines 846-891, ProtocolSuggestRequest lines 949-971)
  </read_first>
  <action>
**Fix 1 — /patient-info request body (around line 384):**

The current code wraps fields in a `patient_info` object:
```js
body: JSON.stringify({
    session_id: sessionId,
    patient_info: { name: data.name, age: data.age, ... }
})
```

The openapi.yaml `PatientInfoRequest` schema requires FLAT fields. Change to:
```js
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
```

**Fix 2 — /protocol-suggest request body (around line 501):**

The current code sends `{ session_id, node_id }` but the openapi.yaml `ProtocolSuggestRequest` schema lists `prompt` as required. The spec says "At least one of prompt or session_id must be non-empty" and prompt is in the `required` array.

Change the `checkProtocolSuggestion` function to accept and send the prompt text. The prompt should come from the user's most recent message (the complaint text). Update the call site in `handleSendMessage` (around line 477) to pass the user's message as the prompt.

Updated request body:
```js
body: JSON.stringify({
    prompt: promptText || "",
    session_id: sessionId,
    node_id: currentNode ? currentNode.id : undefined
})
```

Where `promptText` is passed as a parameter to `checkProtocolSuggestion`. Update the function signature from `checkProtocolSuggestion(headers)` to `checkProtocolSuggestion(headers, promptText)` and update the call site at line ~477 to pass `userMsg`:
```js
await checkProtocolSuggestion(headers, userMsg);
```
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -n "patient_info:" src/components/ProtocolTriage.jsx | grep -v "patientInfo\|patient_info?\|patient_info\." | head -5; echo "---"; grep -n "prompt:" src/components/ProtocolTriage.jsx | head -5; echo "---"; grep -c "session-finish\|patient-info\|protocol-suggest" src/components/ProtocolTriage.jsx</automated>
  </verify>
  <acceptance_criteria>
    - The /patient-info fetch body does NOT contain a nested `patient_info: {` wrapper — fields (name, age, sex, patient_code, birth_date, ticket_number, insurance, visit_id, same) are at the top level alongside session_id
    - The /protocol-suggest fetch body contains `prompt:` as a field
    - `checkProtocolSuggestion` function signature includes a `promptText` parameter
    - The call to `checkProtocolSuggestion` in `handleSendMessage` passes `userMsg` as the second argument
  </acceptance_criteria>
  <done>Both request bodies match their openapi.yaml schemas: /patient-info sends flat fields, /protocol-suggest includes the required prompt field</done>
</task>

<task type="auto">
  <name>Task 2: Add POST /session-finish call after triage completes</name>
  <files>src/components/ProtocolTriage.jsx</files>
  <read_first>
    - src/components/ProtocolTriage.jsx (handleTraversalResponse function around line 612, and the triage result rendering around line 778)
    - openapi.yaml (SessionFinishResponse around lines 535-569, SessionIdRequest around lines 839-844)
  </read_first>
  <action>
When triage completes (status === 'complete' in `handleTraversalResponse`, around line 634), the app sets the result and report but never tells the backend to finalize the session. Add a `POST /session-finish` call.

**Step 1: Create a `finishSession` async function** (place it near `handleTraversalResponse`, around line 694):

```js
const finishSession = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/session-finish`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ session_id: sessionId })
        });
        if (!response.ok) {
            console.error("session-finish failed:", response.status);
        } else {
            const data = await response.json();
            console.log("Session finished, S3 key:", data.s3_key);
        }
    } catch (err) {
        console.error("Error finishing session:", err);
    }
};
```

**Step 2: Call `finishSession()` in the `status === 'complete'` branch** of `handleTraversalResponse` (around line 634), after setting triageResult and triageReport:

```js
if (data.status === 'complete') {
    setCurrentNode(data.result);
    setTriageResult(data.result);
    if (data.report) {
        setTriageReport(data.report);
    }
    addMessage('system', `Triagem Completa! Prioridade: ${data.result.text} (${data.result.priority})`);
    // Finalize session on backend (fire-and-forget)
    finishSession();
```

Also call `finishSession()` in the `next_node` branch when a final assignment is detected (around line 652, where `next.type === 'assignment'`):

```js
if (next && next.type === 'assignment') {
    setTriageResult(next);
    if (data.report) {
        setTriageReport(data.report);
    }
    addMessage('system', `Triagem Completa! Prioridade: ${next.text} (${next.priority})`);
    finishSession();
```

The call is fire-and-forget (no await needed in the render path) since the user already sees the result. Errors are logged to console.
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -n "session-finish" src/components/ProtocolTriage.jsx; echo "---"; grep -c "finishSession" src/components/ProtocolTriage.jsx</automated>
  </verify>
  <acceptance_criteria>
    - `src/components/ProtocolTriage.jsx` contains a `finishSession` function that calls `fetch(\`\${API_URL}/session-finish\``
    - The request body is `JSON.stringify({ session_id: sessionId })`
    - `finishSession()` is called in the `data.status === 'complete'` branch of `handleTraversalResponse`
    - `finishSession()` is called in the `next.type === 'assignment'` branch of `handleTraversalResponse`
    - grep for `session-finish` returns at least 1 match
    - grep for `finishSession` returns at least 4 matches (definition + fetch URL + two call sites)
  </acceptance_criteria>
  <done>POST /session-finish is called whenever triage reaches a final result, persisting the session report to S3</done>
</task>

</tasks>

<verification>
1. `grep -n "patient_info:" src/components/ProtocolTriage.jsx` — should NOT show a nested object wrapper in the fetch body (only `patientInfo` state references remain)
2. `grep -n "prompt:" src/components/ProtocolTriage.jsx` — should show the prompt field in protocol-suggest body
3. `grep -n "session-finish" src/components/ProtocolTriage.jsx` — should show at least 1 match
4. `npm run build` completes without errors
</verification>

<success_criteria>
- /patient-info sends flat PatientInfoRequest fields per openapi.yaml
- /protocol-suggest sends required prompt field per openapi.yaml ProtocolSuggestRequest
- POST /session-finish is called on triage completion with { session_id }
- App builds without errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-api-alignment/01-001-SUMMARY.md`
</output>
