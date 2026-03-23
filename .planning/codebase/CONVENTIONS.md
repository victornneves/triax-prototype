# CONVENTIONS.md — Code Conventions

## Language
- JavaScript with JSX (no TypeScript)
- ES Modules throughout (`import`/`export`)
- No PropTypes declarations

## Component Style
- Functional components only — no class components
- Hooks for state and side effects (`useState`, `useEffect`, `useCallback`, `useRef`)
- Inline styles are the dominant styling approach (no CSS modules, no Tailwind)
- Some global styles in `App.css` and `index.css`
- Bootstrap-like color tokens used inline (e.g. `#dc3545`, `#198754`, `#0d6efd`)

## Naming
- Components: PascalCase (e.g. `ProtocolTriage`, `PatientForm`)
- Hooks: `use` prefix camelCase (e.g. `useTranscribe`, `useUser`)
- Event handlers: `handle` prefix (e.g. `handleSubmit`, `handleSelectSession`)
- State setters follow React convention (`setLoading`, `setSessions`)
- Async auth helper: `getAuthHeaders` — duplicated across 5 files

## API Call Pattern
Every component independently fetches auth tokens and calls the REST API:
```js
const getAuthHeaders = async () => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};
```
This pattern is duplicated in: `ProtocolTriage.jsx`, `HistoryPage.jsx`, `Profile.jsx`, `AdminUsers.jsx`, `UserContext.jsx`.

## Error Handling
- `try/catch` blocks around all async operations
- Errors logged to `console.error` but generally not shown to users
- Some `alert()` calls for user-facing errors (e.g. PDF download failure)
- No global error boundary

## State Initialization
- Loading booleans initialized to `true` then set `false` in `finally`
- List state initialized to empty arrays `[]`
- Session ID generated at component mount: `'session-' + Date.now() + '-' + Math.floor(Math.random() * 1000)`

## Imports
- React not imported in most files (JSX transform handles it)
- Explicit `React` import only where needed (e.g. `import React, { ... }`)
- AWS SDK clients instantiated inline or via refs (no singleton modules)

## Brazilian Portuguese
- All UI strings are in Portuguese (pt-BR)
- Medical terminology: clinical triage context (Glasgow, SpO2, PA = blood pressure, FC = heart rate)
- Console logs mix English and Portuguese

## Environment Variables
- Accessed via `import.meta.env.VITE_*`
- API URL: `const API_URL = import.meta.env.VITE_API_URL;` — defined at module top level in each file

## No Patterns
- No global HTTP client / axios / fetch wrapper
- No form validation library
- No i18n library (strings hardcoded in PT-BR)
- No CSS-in-JS library
