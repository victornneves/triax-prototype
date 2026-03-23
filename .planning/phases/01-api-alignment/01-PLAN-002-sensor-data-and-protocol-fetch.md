---
phase: 1
plan: 002
type: execute
wave: 2
depends_on: [001]
files_modified:
  - src/components/ProtocolTriage.jsx
requirements: [API-04, API-07]
autonomous: true
must_haves:
  truths:
    - "Vital signs are submitted via POST /sensor-data as a dedicated call before traversal"
    - "Protocol definition is fetched via GET /protocol/{protocol_name} after user confirms the suggested protocol"
    - "Existing POST /protocol-traverse and POST /transcription calls remain functional with correct schemas"
  artifacts:
    - path: "src/components/ProtocolTriage.jsx"
      provides: "Dedicated sensor-data and protocol-fetch API calls"
      contains: "sensor-data"
  key_links:
    - from: "src/components/ProtocolTriage.jsx"
      to: "/sensor-data"
      via: "fetch POST with sensor readings + session_id"
      pattern: "sensor-data"
    - from: "src/components/ProtocolTriage.jsx"
      to: "/protocol/"
      via: "fetch GET with protocol name path param"
      pattern: "protocol/"
---

<objective>
Add dedicated POST /sensor-data call for vital sign submission and GET /protocol/{protocol_name} call for fetching protocol definitions before traversal.

Purpose: Currently sensors are only embedded inline in the traversal payload (no dedicated persistence), and the protocol definition is never fetched from the API. The openapi.yaml contract specifies both as distinct endpoints.

Output: ProtocolTriage.jsx with two new API call sites properly integrated into the triage workflow.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-api-alignment/01-001-SUMMARY.md
@openapi.yaml
@src/components/ProtocolTriage.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dedicated POST /sensor-data call</name>
  <files>src/components/ProtocolTriage.jsx</files>
  <read_first>
    - src/components/ProtocolTriage.jsx (handleSendSensors function around line 703, traverseTree function around line 552, SENSOR_CONFIG at top of file)
    - openapi.yaml (SensorDataRequest schema lines 893-936, /sensor-data endpoint lines 351-398)
  </read_first>
  <action>
The openapi.yaml defines `POST /sensor-data` with a `SensorDataRequest` schema:
```
Required: [session_id]
Optional: blood_glucose (number), blood_pressure (string "sys/dia"), gcs (integer 3-15),
          heart_rate (integer), oxygen_saturation (integer 0-100), pain_scale (integer 0-10),
          respiratory_rate (integer), temperature (number)
```

**Step 1: Create a `submitSensorData` async function** (place near `handleSendSensors`, around line 703):

```js
const submitSensorData = async (headers, sensors) => {
    // Build the payload matching SensorDataRequest schema
    const payload = { session_id: sessionId };

    // Map frontend sensor keys to API schema keys
    if (sensors.blood_glucose) payload.blood_glucose = parseFloat(sensors.blood_glucose);
    if (sensors.bp_systolic && sensors.bp_diastolic) {
        payload.blood_pressure = `${sensors.bp_systolic}/${sensors.bp_diastolic}`;
    }
    if (sensors.gcs) payload.gcs = parseInt(sensors.gcs, 10);
    if (sensors.heart_rate) payload.heart_rate = parseInt(sensors.heart_rate, 10);
    if (sensors.oxygen_saturation) payload.oxygen_saturation = parseInt(sensors.oxygen_saturation, 10);
    if (sensors.pain_scale) payload.pain_scale = parseInt(sensors.pain_scale, 10);
    if (sensors.respiratory_rate) payload.respiratory_rate = parseInt(sensors.respiratory_rate, 10);
    if (sensors.temperature) payload.temperature = parseFloat(sensors.temperature);

    // Only call if we have at least one sensor value beyond session_id
    if (Object.keys(payload).length <= 1) return;

    try {
        const response = await fetch(`${API_URL}/sensor-data`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            console.error("sensor-data submission failed:", response.status);
        } else {
            const data = await response.json();
            console.log("Sensor data saved. Features:", data.features);
        }
    } catch (err) {
        console.error("Error submitting sensor data:", err);
    }
};
```

**Step 2: Call `submitSensorData` in `handleSendSensors`** (around line 703). Add it BEFORE the `traverseTree` call so sensors are persisted independently:

```js
const handleSendSensors = () => {
    console.log("handleSendSensors triggered. Inputs:", sensorInputs);
    setLoading(true);
    setMissingSensors([]);
    getAuthHeaders()
        .then(async (h) => {
            // Submit sensor data as dedicated call (API-04)
            await submitSensorData(h, sensorInputs);
            // Then proceed with traversal (sensors also included in traverse payload)
            await traverseTree(h);
        })
        .catch(e => {
            console.error("Error sending sensors:", e);
            setLoading(false);
        });
};
```

Note: Sensors continue to be included in the traverse payload as well (the backend accepts them in both places). The dedicated /sensor-data call ensures they are independently persisted and feature-extracted.
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -n "sensor-data" src/components/ProtocolTriage.jsx; echo "---"; grep -n "submitSensorData" src/components/ProtocolTriage.jsx</automated>
  </verify>
  <acceptance_criteria>
    - `src/components/ProtocolTriage.jsx` contains a `submitSensorData` function
    - The function calls `fetch(\`\${API_URL}/sensor-data\``
    - The request body includes `session_id` and sensor fields matching `SensorDataRequest` schema (blood_glucose, blood_pressure, gcs, heart_rate, oxygen_saturation, pain_scale, respiratory_rate, temperature)
    - `submitSensorData` is called in `handleSendSensors` before `traverseTree`
    - Sensor values are parsed to correct types: parseFloat for blood_glucose and temperature, parseInt for integer fields
    - grep for `sensor-data` returns at least 1 match
    - grep for `submitSensorData` returns at least 3 matches (definition + fetch + call site)
  </acceptance_criteria>
  <done>Vital signs are submitted via POST /sensor-data as a dedicated call, independent of the traversal payload</done>
</task>

<task type="auto">
  <name>Task 2: Add GET /protocol/{protocol_name} call after protocol confirmation</name>
  <files>src/components/ProtocolTriage.jsx</files>
  <read_first>
    - src/components/ProtocolTriage.jsx (confirmProtocol function around line 536, protocol_names fetch around line 337)
    - openapi.yaml (/protocol/{protocol_name} endpoint lines 79-106, ProtocolDetail schema — note: protocol_name param strips "protocol_" prefix)
  </read_first>
  <action>
The openapi.yaml defines `GET /protocol/{protocol_name}` (no auth required) which returns the full protocol definition JSON. The `protocol_name` path parameter uses the `protocol_id` from `/protocol_names` but with the `protocol_` prefix stripped (e.g., `protocol_dor_toracica` becomes `dor_toracica`).

**Step 1: Create a `fetchProtocolDefinition` async function** (place near `confirmProtocol`, around line 536):

```js
const fetchProtocolDefinition = async (protocolId) => {
    // Strip 'protocol_' prefix for the path parameter per openapi.yaml spec
    const protocolName = protocolId.replace(/^protocol_/, '');
    try {
        const response = await fetch(`${API_URL}/protocol/${protocolName}`);
        if (!response.ok) {
            console.error("Failed to fetch protocol definition:", response.status);
            return null;
        }
        const data = await response.json();
        console.log("Protocol definition loaded:", protocolName);
        return data;
    } catch (err) {
        console.error("Error fetching protocol definition:", err);
        return null;
    }
};
```

Note: This endpoint requires NO authentication (security: [] in openapi.yaml), so no auth headers needed.

**Step 2: Call `fetchProtocolDefinition` in `confirmProtocol`** (around line 536). Add it as a fire-and-forget call. Do NOT introduce any setTimeout — call `traverseTree` directly, preserving its existing invocation pattern:

```js
const confirmProtocol = (protocol) => {
    setSuggestedProtocol(protocol);
    protocolRef.current = protocol;
    setPendingProtocol(null);

    addMessage('system', `Protocolo Confirmado: ${protocol.text}`);
    setLoading(true);

    // Fire-and-forget protocol definition fetch (API-07)
    fetchProtocolDefinition(protocol.id);

    // Start traversal — keep the existing setTimeout + traverseTree call unchanged
    getAuthHeaders().then(headers => {
        setTimeout(() => traverseTree(headers, protocol.id.replace('protocol_', '')), 100);
    });
};
```

IMPORTANT: The existing `setTimeout(() => traverseTree(...), 100)` call is already present in the current codebase (line 548). Do NOT remove or modify it — this plan's scope is adding the `fetchProtocolDefinition` call, not restructuring the traversal timing. The `fetchProtocolDefinition` call is placed before `getAuthHeaders()` since it needs no auth, making it truly independent and non-blocking.
  </action>
  <verify>
    <automated>cd /home/victor/Git/triax-prototype && grep -n "fetchProtocolDefinition\|/protocol/" src/components/ProtocolTriage.jsx | head -10; echo "---"; grep -c "fetchProtocolDefinition" src/components/ProtocolTriage.jsx; echo "---"; grep -n "traverseTree" src/components/ProtocolTriage.jsx | head -10</automated>
  </verify>
  <acceptance_criteria>
    - `src/components/ProtocolTriage.jsx` contains a `fetchProtocolDefinition` function
    - The function calls `fetch(\`\${API_URL}/protocol/\${protocolName}\`)` with NO auth headers
    - The `protocolName` variable is derived by stripping the `protocol_` prefix from the protocol ID
    - `fetchProtocolDefinition` is called in `confirmProtocol` with `protocol.id`
    - The existing `traverseTree` call in `confirmProtocol` is unchanged (still called via getAuthHeaders().then with setTimeout)
    - After modification, the triage flow still advances: confirming a protocol triggers traversal (grep shows traverseTree call intact in confirmProtocol)
    - grep for `fetchProtocolDefinition` returns at least 3 matches (definition + fetch URL + call site)
  </acceptance_criteria>
  <done>Protocol definition is fetched via GET /protocol/{protocol_name} after user confirms the suggested protocol; existing traversal call remains intact and functional</done>
</task>

</tasks>

<verification>
1. `grep -n "sensor-data" src/components/ProtocolTriage.jsx` — at least 1 match
2. `grep -n "/protocol/" src/components/ProtocolTriage.jsx` — at least 1 match (the GET call, not the POST endpoints)
3. `grep -n "protocol-traverse\|/transcription" src/components/ProtocolTriage.jsx` — existing call sites for /protocol-traverse and /transcription survive modification
4. `grep -n "traverseTree" src/components/ProtocolTriage.jsx` — traverseTree call sites remain intact (at least 5 matches: definition + confirmProtocol + handleSendSensors + recursive calls)
5. `npm run build` completes without errors
</verification>

<success_criteria>
- POST /sensor-data is called with SensorDataRequest schema when clinician submits vital signs
- GET /protocol/{protocol_name} is called after protocol confirmation
- Existing traverse and transcription calls remain intact (verified by grep)
- App builds without errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-api-alignment/01-002-SUMMARY.md`
</output>
