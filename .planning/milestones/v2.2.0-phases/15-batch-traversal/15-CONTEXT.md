# Phase 15: Batch Traversal - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Switch protocol traversal from sequential to batch mode by default. Add `batch: true` to all `/protocol-traverse` calls, handle the three batch response shapes (`complete`, `ask_user`, `missing_sensors`), and deprecate the `next_node` sequential handler as a fallback path.

</domain>

<decisions>
## Implementation Decisions

### Batch flag injection
- **D-01:** Add `batch: true` to the payload object inside `traverseTree` — all call sites (initial, ask_user follow-ups, sensor resubmissions) get it automatically
- **D-02:** The flag is stateless on the backend; no per-call variation needed

### Deprecation of next_node handler
- **D-03:** The `next_node` branch in `handleTraversalResponse` gets a deprecation code comment and a `console.warn` on entry
- **D-04:** The warn includes diagnostic context: batch flag state from the payload and `next_node_id` from the response — enough to diagnose backend issues during pilot
- **D-05:** No user-visible signal (toast, chat message) — a `next_node` response is a performance degradation, not a failure; the sequential path still completes correctly
- **D-06:** If telemetry is added later, this warn is a natural hook point for structured logging (`batch_fallback_detected`)

### Claude's Discretion
- Exact wording of deprecation comment and console.warn message
- Whether to extract the batch flag as a constant or inline it

</decisions>

<specifics>
## Specific Ideas

- The `next_node` receiving despite `batch: true` would indicate a backend bug (batch key dropped by API Gateway, or code regression) — not expected with the current backend, but the warn provides observability
- Sequential response is still functionally correct — it just evaluates one level instead of all remaining

</specifics>

<canonical_refs>
## Canonical References

### API contract
- `openapi.yaml` §/protocol-traverse — Batch mode documentation, request schema (`batch` boolean field), response shapes discriminated by `status`, and the explicit statement that `next_node` is never returned in batch mode

### Requirements
- `.planning/REQUIREMENTS.md` §v2.2.0 — BATCH-01 (batch flag default) and BATCH-02 (next_node deprecation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `traverseTree` function (ProtocolTriage.jsx:555-614): Single function handles all traversal calls — adding `batch: true` to its payload object covers all 3 call sites automatically
- `handleTraversalResponse` (ProtocolTriage.jsx:616-701): Already handles `complete`, `ask_user`, `missing_sensors` correctly — no changes needed for batch response shapes

### Established Patterns
- Payload construction at lines 566-575: object spread with sensor data — `batch: true` fits naturally as another field
- Console logging: existing `console.warn` pattern for retry logic (lines 595, 607) — deprecation warn follows the same style

### Integration Points
- `traverseTree` payload (line 566): where `batch: true` gets added
- `handleTraversalResponse` `next_node` branch (line 649): where deprecation comment and console.warn get added
- Three call sites that invoke `traverseTree`: line 551 (initial), line 403 (ask_user follow-up), line 739 (sensor resubmission) — all covered by the single payload change

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-batch-traversal*
*Context gathered: 2026-04-12*
