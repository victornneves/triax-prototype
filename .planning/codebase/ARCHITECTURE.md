# ARCHITECTURE.md — System Architecture

## Pattern
Single Page Application (SPA). No backend code in this repository — the frontend communicates with an external REST API via `VITE_API_URL`.

## Application Layers

```
Browser SPA (this repo)
  └── Amplify Authenticator (auth gate — wraps entire app)
        └── UserProvider (React Context — global user profile)
              └── BrowserRouter
                    └── Routes
                          ├── / → ProtocolTriage (main triage workflow)
                          ├── /history → HistoryPage (session list + detail)
                          ├── /profile → Profile (personal history)
                          └── /admin/users → AdminUsers (user management)

External Systems
  ├── AWS Cognito (authentication, token issuance)
  ├── AWS S3 (session storage — managed by backend)
  ├── AWS Transcribe Streaming (real-time speech-to-text via browser mic)
  └── REST API (VITE_API_URL) — AI protocol triage backend
```

## Entry Points
- `index.html` — Vite HTML entry, mounts `<div id="root">`
- `src/main.jsx` — React root render with `StrictMode`
- `src/App.jsx` — Amplify.configure + Authenticator + routing

## Data Flow — Triage Session

```
1. User logs in via Amplify Authenticator (Cognito)
2. UserContext fetches /me → stores user profile (role, name)
3. ProtocolTriage shows PatientForm
4. On patient submit: POST /patient-info → session created
5. Complaint text (or voice via AWS Transcribe) → POST /suggest_protocol
6. API returns suggested protocol → user confirms
7. Protocol traversal: POST /traverse → iterate through nodes
8. At sensor nodes: user enters vitals → included in traversal payload
9. Triage completes → POST /end_session → result displayed
10. Session persisted to S3 by backend; accessible via /history
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
