---
phase: 02-auth-security
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - src/contexts/UserContext.jsx
  - src/components/RequireAdmin.jsx
  - src/App.jsx
autonomous: true
requirements:
  - AUTH-02
  - AUTH-03

must_haves:
  truths:
    - "When fetchAuthSession() fails, the user sees a full-screen error message in Portuguese instead of a broken app"
    - "When fetchAuthSession() returns no token, the user sees the same full-screen error"
    - "A non-admin user navigating to /admin/users is redirected to / without ever seeing the AdminUsers component"
    - "While user profile is loading, /admin/users shows a loading indicator (not a flash redirect)"
  artifacts:
    - path: "src/contexts/UserContext.jsx"
      provides: "Auth error detection on fetchAuthSession failure"
      contains: "setError"
    - path: "src/components/RequireAdmin.jsx"
      provides: "Route-level admin guard component"
      contains: "RequireAdmin"
    - path: "src/App.jsx"
      provides: "Full-screen auth error UI and RequireAdmin-wrapped admin route"
      contains: "RequireAdmin"
  key_links:
    - from: "src/App.jsx"
      to: "src/contexts/UserContext.jsx"
      via: "useUser() hook reading error state"
      pattern: "useUser.*error"
    - from: "src/App.jsx"
      to: "src/components/RequireAdmin.jsx"
      via: "import and JSX wrapping admin route"
      pattern: "RequireAdmin"
    - from: "src/components/RequireAdmin.jsx"
      to: "src/contexts/UserContext.jsx"
      via: "useUser() hook reading userProfile and loading"
      pattern: "useUser"
---

<objective>
Make auth failures visible and protect the admin route at the routing layer.

Purpose: Currently, if `fetchAuthSession()` fails or returns no token, API calls silently proceed without an Authorization header -- the user sees broken behavior with no explanation. Additionally, the admin route is only guarded inside the `AdminUsers` component, meaning the component renders briefly before redirecting non-admins.

Output: UserContext that catches auth failures and sets error state; App.jsx that renders a full-screen PT-BR error when auth fails; RequireAdmin component that blocks non-admin access at the route level.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-auth-security/02-CONTEXT.md
@src/contexts/UserContext.jsx
@src/App.jsx
@src/pages/AdminUsers.jsx
</context>

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/contexts/UserContext.jsx (current exports):
```javascript
// UserContext provides: { userProfile, loading, error, refreshProfile }
export const UserProvider = ({ children }) => { ... };
export const useUser = () => useContext(UserContext);
```

From src/App.jsx (current structure):
```javascript
// App wraps: Authenticator > UserProvider > BrowserRouter > Routes
// signOut comes from Authenticator render prop
```

From src/pages/AdminUsers.jsx (current guard pattern):
```javascript
// Uses: const { userProfile, loading: userLoading } = useUser();
// Guard: useEffect redirect when effective_role !== 'admin'
// Fallback: if (userProfile?.effective_role !== 'admin') return null;
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Harden UserContext to catch auth session failures</name>
  <files>src/contexts/UserContext.jsx</files>
  <read_first>
    - src/contexts/UserContext.jsx (current error handling flow -- must understand what setError already covers)
  </read_first>
  <action>
Modify `fetchUserProfile` in `src/contexts/UserContext.jsx` per D-04 to explicitly catch `fetchAuthSession()` failures and missing token.

Current code calls `fetchAuthSession()` and checks `session.tokens?.idToken?.toString()`. When no token exists, it silently returns (sets loading false, no error). When `fetchAuthSession()` throws, the generic catch sets error but with a generic message.

Changes to make:

1. After `const session = await fetchAuthSession();`, check for missing token explicitly:
```javascript
const token = session.tokens?.idToken?.toString();
if (!token) {
    setError(new Error('AUTH_SESSION_FAILED'));
    setLoading(false);
    return;
}
```

2. In the catch block, ensure the error is set with a distinguishable marker:
```javascript
} catch (err) {
    console.error("Error fetching user profile:", err);
    setError(err);
}
```

The catch block already sets `setError(err)` so it handles `fetchAuthSession()` throwing. The key change is step 1: when `fetchAuthSession()` succeeds but returns no token, we now set an error instead of silently continuing.

Do NOT change the export shape. Do NOT change how `refreshProfile` works. Do NOT touch the `/me` API call logic -- if the `/me` call fails, that error path is already handled.
  </action>
  <verify>
    <automated>grep -n "AUTH_SESSION_FAILED" src/contexts/UserContext.jsx | grep -q "setError" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <acceptance_criteria>
    - src/contexts/UserContext.jsx contains the string `AUTH_SESSION_FAILED`
    - src/contexts/UserContext.jsx contains `setError(new Error('AUTH_SESSION_FAILED'))` on the no-token path
    - src/contexts/UserContext.jsx still contains `export const UserProvider`
    - src/contexts/UserContext.jsx still contains `export const useUser`
    - src/contexts/UserContext.jsx still calls `fetchAuthSession` from `aws-amplify/auth`
    - The early return on no-token now sets error state instead of silently returning
  </acceptance_criteria>
  <done>When fetchAuthSession() returns no token, UserContext sets error state with AUTH_SESSION_FAILED marker. When fetchAuthSession() throws, the existing catch block sets error state. Both paths are now explicit.</done>
</task>

<task type="auto">
  <name>Task 2: Create RequireAdmin component and wire auth error + admin guard into App.jsx</name>
  <files>src/components/RequireAdmin.jsx, src/App.jsx</files>
  <read_first>
    - src/App.jsx (current structure -- Authenticator > UserProvider > BrowserRouter > Routes)
    - src/contexts/UserContext.jsx (after Task 1 -- confirm error state shape)
    - src/pages/AdminUsers.jsx (current guard pattern to understand what becomes redundant)
  </read_first>
  <action>
**Part A: Create `src/components/RequireAdmin.jsx`** per D-08, D-09, D-10.

Create a new file with a functional component that:
1. Imports `useUser` from `../contexts/UserContext`
2. Imports `Navigate` from `react-router-dom`
3. Reads `const { userProfile, loading } = useUser();`
4. While `loading` is true, renders a centered loading indicator using inline styles:
   ```jsx
   if (loading) {
       return (
           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem' }}>
               <p>Carregando...</p>
           </div>
       );
   }
   ```
5. If `userProfile?.effective_role !== 'admin'`, renders `<Navigate to="/" replace />`
6. Otherwise renders `{children}`

Export as default: `export default RequireAdmin;`

**Part B: Wire auth error display and RequireAdmin into `src/App.jsx`** per D-05, D-07, D-11.

1. Add import for `RequireAdmin`:
   ```javascript
   import RequireAdmin from './components/RequireAdmin';
   ```

2. Create an inner component (inside App or as a separate function) that reads UserContext and conditionally renders the error screen. This component must be rendered INSIDE `UserProvider` (so `useUser()` works) but wraps the `BrowserRouter`. Name it `AppContent` or similar:

   ```jsx
   function AppContent({ signOut }) {
       const { error } = useUser();

       if (error) {
           return (
               <div style={{
                   display: 'flex', flexDirection: 'column', justifyContent: 'center',
                   alignItems: 'center', height: '100vh', padding: '2rem',
                   backgroundColor: '#f8f9fa', textAlign: 'center'
               }}>
                   <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>Erro de Autenticacao</h1>
                   <p style={{ fontSize: '1.1rem', color: '#333', marginBottom: '1.5rem' }}>
                       Sua sessao expirou ou ocorreu um erro de autenticacao.
                       Por favor, tente novamente.
                   </p>
                   <button
                       onClick={signOut}
                       style={{
                           padding: '0.75rem 1.5rem', backgroundColor: '#dc3545',
                           color: 'white', border: 'none', borderRadius: '4px',
                           cursor: 'pointer', fontSize: '1rem'
                       }}
                   >
                       Sair e tentar novamente
                   </button>
               </div>
           );
       }

       return (
           <BrowserRouter>
               <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                   <Header signOut={signOut} />
                   <main style={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: '#f8f9fa' }}>
                       <Routes>
                           <Route path="/" element={<ProtocolTriage />} />
                           <Route path="/history" element={<HistoryPage />} />
                           <Route path="/profile" element={<Profile />} />
                           <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
                       </Routes>
                   </main>
               </div>
           </BrowserRouter>
       );
   }
   ```

3. Update the main `App` function to use `AppContent`:
   ```jsx
   function App() {
       return (
           <Authenticator>
               {({ signOut, user }) => (
                   <UserProvider>
                       <AppContent signOut={signOut} />
                   </UserProvider>
               )}
           </Authenticator>
       );
   }
   ```

The key structural change: `useUser()` is called inside `AppContent` which is a child of `UserProvider`. The error check intercepts before `BrowserRouter` renders. Per D-07, this is distinct from the Amplify Authenticator -- it handles runtime session token failures, not Cognito sign-in failures.

Per D-11, the admin route wraps `AdminUsers` with `RequireAdmin`. The `AdminUsers` internal useEffect redirect becomes redundant -- leave it in place (harmless, and removal is at Claude's discretion per D-11; keeping it is safer as a defense-in-depth measure).
  </action>
  <verify>
    <automated>grep -q "RequireAdmin" src/App.jsx && grep -q "RequireAdmin" src/components/RequireAdmin.jsx && grep -q "Erro de Autenticacao" src/App.jsx && grep -q "effective_role" src/components/RequireAdmin.jsx && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <acceptance_criteria>
    - src/components/RequireAdmin.jsx exists and contains `export default RequireAdmin`
    - src/components/RequireAdmin.jsx contains `useUser` import from `../contexts/UserContext`
    - src/components/RequireAdmin.jsx contains `Navigate` import from `react-router-dom`
    - src/components/RequireAdmin.jsx contains `effective_role !== 'admin'`
    - src/components/RequireAdmin.jsx contains `Carregando` (loading text in PT-BR)
    - src/App.jsx contains `import RequireAdmin from './components/RequireAdmin'`
    - src/App.jsx contains `<RequireAdmin>` wrapping the admin route
    - src/App.jsx contains `Erro de Autenticacao` (error heading in PT-BR)
    - src/App.jsx contains `useUser` call to read error state
    - src/App.jsx contains `signOut` in the error screen button onClick
    - src/App.jsx still contains `<Authenticator>` as the outermost wrapper
    - src/App.jsx still contains `<UserProvider>` wrapping the app content
  </acceptance_criteria>
  <done>Full-screen auth error renders when UserContext has an error (AUTH-02). Admin route is wrapped with RequireAdmin that checks effective_role before rendering AdminUsers (AUTH-03). Non-admins get Navigate to="/" replace. Loading state shows "Carregando..." while profile loads.</done>
</task>

</tasks>

<verification>
- `grep "RequireAdmin" src/App.jsx` shows import and usage in route
- `grep "Erro de Autenticacao" src/App.jsx` confirms PT-BR error UI exists
- `grep "AUTH_SESSION_FAILED" src/contexts/UserContext.jsx` confirms auth failure detection
- `grep "effective_role.*admin" src/components/RequireAdmin.jsx` confirms role check
- `grep "Navigate" src/components/RequireAdmin.jsx` confirms redirect for non-admins
- `grep "Carregando" src/components/RequireAdmin.jsx` confirms loading state
- `npx vite build` completes without errors
</verification>

<success_criteria>
- Auth failures (no token or fetchAuthSession throw) produce a visible full-screen error in PT-BR with a sign-out button
- /admin/users route is guarded by RequireAdmin -- non-admins never see AdminUsers content
- Loading state prevents flash-redirect while profile is being fetched
- All UI strings are in Portuguese (PT-BR)
</success_criteria>

<output>
After completion, create `.planning/phases/02-auth-security/02-002-auth-error-admin-guard-SUMMARY.md`
</output>
