<!-- GSD:project-start source:PROJECT.md -->
## Project

**Triax Prototype**

React SPA for clinical emergency triage using the Manchester Triage System (MTS). Clinicians log in, register a patient, capture the chief complaint (voice or text), and the app guides them through an AI-driven protocol decision tree — assigning a priority color (red → blue). The app is hosted on AWS Amplify and is currently in demos/pilot phase with stakeholders.

**Core Value:** Clinicians reach a triage priority decision faster and more consistently because the AI traverses the protocol decision tree for them.

### Constraints

- **Tech stack:** React 19 + Vite + AWS Amplify — no framework changes
- **Deployment target:** Static SPA (no SSR), Amplify builds from `main` branch
- **Branch strategy:** All work on `dev` branch; merge to `main` only at verified milestone checkpoints
- **No new features:** This milestone is strictly alignment + cleanup — no scope creep
- **Healthcare context:** Changes to triage logic require extra care — wrong priority assignment is a patient safety issue
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (JSX) ES2020+ - All application source code in `src/`
- CSS - Styling via `src/App.css`, `src/index.css`
- YAML - API contract definition via `openapi.yaml`
## Runtime
- Node.js v22.19.0
- npm 10.9.3
- Lockfile: `package-lock.json` present
## Frameworks
- React 19.2.0 - UI component framework; all components in `src/components/` and `src/pages/`
- React DOM 19.2.0 - Browser rendering, entry at `src/main.jsx`
- React Router DOM 7.12.0 - Client-side routing; routes defined in `src/App.jsx`
- Not detected
- Vite 7.2.4 - Dev server and production bundler; config at `vite.config.js`
- `@vitejs/plugin-react` 5.1.1 - Vite plugin for React/JSX support
## Key Dependencies
- `aws-amplify` 6.15.9 - AWS Amplify core; configured in `src/App.jsx` via `Amplify.configure(awsConfig)`
- `@aws-amplify/ui-react` 6.13.2 - Pre-built Amplify UI components; `Authenticator` wraps entire app in `src/App.jsx`
- `@aws-sdk/client-transcribe-streaming` 3.971.0 - AWS Transcribe Streaming SDK; used in `src/useTranscribe.js` for real-time speech-to-text
- `@aws-sdk/client-cognito-identity` 3.971.0 - Cognito Identity client; used in `src/useTranscribe.js` for credential resolution
- `@aws-sdk/credential-provider-cognito-identity` 3.971.0 - Provides temporary AWS credentials via Cognito Identity Pool; used in `src/useTranscribe.js`
- `jspdf` 4.2.0 - PDF generation library; imported as dependency but PDF downloads are handled server-side via `${API_URL}/history/{id}/pdf` endpoint
- `html2canvas` 1.4.1 - HTML-to-canvas screenshot library; imported as dependency, likely for PDF rendering support
## Configuration
- Configured via `.env` file (present, contents not read)
- Sample template available at `.env_sample`
- Required env vars (from `.env_sample`):
- All vars accessed via `import.meta.env.VITE_*` (Vite convention)
- AWS Cognito config (User Pool, Client ID, Identity Pool) is hardcoded in `src/aws-config.js`
- `vite.config.js` - Minimal config using `@vitejs/plugin-react` plugin only
- No path aliases configured
- Output directory: `dist/` (default Vite)
## Platform Requirements
- Node.js v22+
- npm 10+
- `.env` file with all three `VITE_*` vars set
- Static SPA deployment (Vite build produces `dist/`)
- No SSR
- Region: `sa-east-1` (São Paulo, AWS)
- Backend: AWS API Gateway at `https://o7267hgyxl.execute-api.sa-east-1.amazonaws.com`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

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
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
## Application Layers
```
```
## Entry Points
- `index.html` — Vite HTML entry, mounts `<div id="root">`
- `src/main.jsx` — React root render with `StrictMode`
- `src/App.jsx` — Amplify.configure + Authenticator + routing
## Data Flow — Triage Session
```
```
## State Management
- **No external state library** (no Redux, Zustand, etc.)
- `useState` / `useEffect` within each component
- `UserContext` (React Context) for cross-component user profile
- `useTranscribe` custom hook encapsulates AWS Transcribe streaming lifecycle
## Abstractions
- `src/useTranscribe.js` — custom hook: mic capture → PCM16 → Transcribe Streaming → transcript state
- `src/contexts/UserContext.jsx` — provides `userProfile`, `loading`, `error`, `refreshProfile`
- `src/aws-config.js` — static Amplify configuration object
## Auth Model
- Cognito User Pool handles sign-up/sign-in
- `fetchAuthSession()` fetches JWT id token on each API call
- `Authorization: Bearer <idToken>` header sent to REST API
- For Transcribe: Cognito Identity Pool provides temporary AWS credentials
- Admin guard in `AdminUsers` is **client-side only** (navigate + null render)
## API Endpoints Used
- `GET /me` — current user profile
- `POST /patient-info` — register patient
- `GET /protocol_names` — list available protocols
- `POST /suggest_protocol` — AI suggests protocol from complaint
- `POST /traverse` — advance protocol node
- `POST /end_session` — finalize triage
- `GET /history` — list sessions
- `GET /history/:session_id` — session detail
- `GET /history/:session_id/pdf` — download PDF report
- `GET /users` — admin: list all users
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
