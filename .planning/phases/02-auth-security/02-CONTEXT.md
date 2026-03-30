# Phase 2: Auth & Security - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden authentication headers, config sourcing, and admin route protection. Three concrete fixes:
1. Move all hardcoded AWS credentials and resource IDs out of source into env vars
2. Make auth failures explicit — no silent request without Authorization header
3. Block non-admin users from the admin route at the routing layer, not inside the component

Creating new features, refactoring shared auth helpers, or adding tests are out of scope (those are Phases 3 and future milestones).

</domain>

<decisions>
## Implementation Decisions

### AUTH-01: Env var scope
- **D-01:** Move all four values from `src/aws-config.js` to `VITE_*` env vars: `userPoolId`, `userPoolClientId`, `identityPoolId`, and the S3 bucket name
- **D-02:** All four values get corresponding entries added to `.env_sample` as new vars (3 Cognito vars are new; `VITE_IDENTITY_POOL_ID` already exists in sample)
- **D-03:** Non-secret config in `aws-config.js` (region, `loginWith`, `passwordFormat`, `signUpVerificationMethod`, `userAttributes`, `allowGuestAccess`) stays hardcoded — only credential/resource IDs move out

### AUTH-02: Auth failure behavior
- **D-04:** Centralize in `UserContext` — when `fetchAuthSession()` throws or returns no token, set the `error` state
- **D-05:** `App.jsx` renders a full-screen auth error UI (not the normal app layout) when `UserContext` exposes an auth error — user sees an explicit message, not a broken app
- **D-06:** The `getAuthHeaders` inline helpers in `ProtocolTriage` and `HistoryPage` do NOT need individual changes for this phase — the centralized `UserContext` guard is the fix scope here (per AUTH-02 requirement wording: "when fetchAuthSession() fails or returns no token")
- **D-07:** The full-screen error state is distinct from the Amplify `Authenticator` — it handles the case where the user IS authenticated in Cognito but the session token fetch fails at runtime

### AUTH-03: Admin route guard shape
- **D-08:** A `RequireAdmin` wrapper component lives in `src/components/RequireAdmin.jsx` (or inline in `App.jsx` — Claude's discretion on file placement)
- **D-09:** `RequireAdmin` reads `userProfile.effective_role` from `UserContext`; if `effective_role !== 'admin'`, renders `<Navigate to="/" replace />`
- **D-10:** While `userLoading` is true, `RequireAdmin` renders a loading state (not a redirect and not the admin component) — prevents flash of redirect during profile fetch
- **D-11:** Route in `App.jsx` becomes `<Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />` — `AdminUsers`'s internal `useEffect` redirect can be left or removed, Claude's discretion

### Claude's Discretion
- Exact wording of the full-screen auth error message (UI is in PT-BR)
- Whether `RequireAdmin` is a separate file or a small component defined inline in `App.jsx`
- Loading indicator style in `RequireAdmin` while `userLoading` is true

</decisions>

<specifics>
## Specific Ideas

- No specific UI references — standard inline-style error display consistent with the rest of the app
- Auth error screen should make clear the session expired / auth failed, not that the user is unauthorized (those are different states)

</specifics>

<canonical_refs>
## Canonical References

### Requirements
- `.planning/REQUIREMENTS.md` §Auth & Security — AUTH-01, AUTH-02, AUTH-03 definitions and acceptance criteria

### Existing code to modify
- `src/aws-config.js` — all four hardcoded values being moved to env vars (AUTH-01)
- `src/contexts/UserContext.jsx` — auth failure centralization; `error` state already exists but silent (AUTH-02)
- `src/App.jsx` — full-screen error render + `RequireAdmin` wrapping the admin route (AUTH-02, AUTH-03)
- `src/pages/AdminUsers.jsx` — `useEffect` redirect becomes redundant after route guard; Claude decides whether to remove it
- `.env_sample` — must be updated with the 3 new `VITE_*` vars for Cognito IDs + S3 bucket

### No external specs — requirements are fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `UserContext` (`src/contexts/UserContext.jsx`): already has `error` state and `loading` state — the auth error centralization builds directly on this; `App.jsx` already receives these via `useUser()`
- `Authenticator` wrapper in `App.jsx`: wraps the entire app — the full-screen auth error should render inside `Authenticator` (user is authenticated) but before the main layout, as a sibling branch to the normal app render

### Established Patterns
- Inline styles everywhere — the full-screen error state and `RequireAdmin` loading state should use inline styles, not new CSS classes
- All UI strings in PT-BR — auth error message must be in Portuguese
- `navigate('/')` already used in `AdminUsers` for redirect — `<Navigate to="/" replace />` is the React Router equivalent for component-level redirect

### Integration Points
- `App.jsx` renders `{({ signOut, user }) => (<UserProvider>...<Routes>...`  — the auth error branch needs to read from `UserContext`, which means `UserProvider` must be a parent; the error check goes inside the `UserProvider` tree
- `UserContext` `error` is currently set on API failure (`/me` endpoint) — after this phase it will also be set on `fetchAuthSession()` failure; consumers checking `error` should be aware both failure modes set the same state

</code_context>

<deferred>
## Deferred Ideas

- Hardening `getAuthHeaders` in individual components to throw on missing token — those call sites are addressed in Phase 4 (FRAG-01 response.ok guards) or Phase 3 (DEBT-01 shared auth utility)
- Adding token refresh logic — out of scope; Amplify handles session refresh transparently
- Audit logging for failed admin access attempts — future milestone concern

</deferred>

---

*Phase: 02-auth-security*
*Context gathered: 2026-03-30*
