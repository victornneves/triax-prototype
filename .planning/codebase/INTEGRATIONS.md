# External Integrations

**Analysis Date:** 2026-03-23

## APIs & External Services

**Backend REST API (Custom):**
- AI Triage API - Core application backend for protocol suggestion, decision tree traversal, session management, and user administration
  - SDK/Client: Native `fetch` API with `Bearer` JWT token in `Authorization` header
  - Auth: Cognito `idToken` obtained via `fetchAuthSession()` from `aws-amplify/auth`
  - Base URL: `VITE_API_URL` env var; documented server `https://o7267hgyxl.execute-api.sa-east-1.amazonaws.com`
  - API contract: `openapi.yaml` (OpenAPI 3.0.0)
  - Endpoints consumed:
    - `GET /protocol_names` - List available triage protocols (`src/components/ProtocolTriage.jsx`)
    - `POST /protocol-suggest` - Suggest protocol from symptoms text (`src/components/ProtocolTriage.jsx`)
    - `POST /protocol-traverse` - Step through decision tree with sensor data (`src/components/ProtocolTriage.jsx`)
    - `POST /patient-info` - Submit patient demographics (`src/components/ProtocolTriage.jsx`)
    - `POST /transcription` - Submit/update transcription text (`src/components/ProtocolTriage.jsx`)
    - `POST /session-finish` - Finalize and persist session to S3 (`src/components/ProtocolTriage.jsx`)
    - `POST /session-features` - Retrieve extracted features for a session (`src/components/ProtocolTriage.jsx`)
    - `GET /history` - List past triage sessions (`src/components/HistoryPage.jsx`, `src/pages/Profile.jsx`)
    - `GET /history/{session_id}/pdf` - Download session PDF report (`src/components/HistoryPage.jsx`, `src/components/ProtocolTriage.jsx`, `src/components/TriageDetailsModal.jsx`)
    - `GET /me` - Get current user profile (`src/contexts/UserContext.jsx`)
    - `GET /users` - List all users, admin only (`src/pages/AdminUsers.jsx`)

**AWS Transcribe Streaming:**
- Real-time speech-to-text transcription in Brazilian Portuguese (`pt-BR`)
  - SDK/Client: `@aws-sdk/client-transcribe-streaming` via `TranscribeStreamingClient`
  - Auth: Temporary credentials from Cognito Identity Pool via `fromCognitoIdentityPool`
  - Implementation: `src/useTranscribe.js` - custom React hook streaming PCM16 audio from browser microphone
  - Region: `VITE_AWS_REGION` env var

## Data Storage

**Databases:**
- Not detected - no direct database client in the frontend

**File Storage:**
- AWS S3 - Session reports stored as JSON files
  - Bucket: `storagestack-aitriagedevsessionbucketec01eff9-m7nvints9cab`
  - Region: `sa-east-1`
  - Config: `src/aws-config.js` under `Storage.S3`
  - Access: Indirect via backend API (session save/retrieve endpoints); S3 config present in Amplify config but direct S3 SDK calls not observed in frontend source

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- AWS Cognito - Handles user sign-up, sign-in, verification, and session tokens
  - Implementation: `@aws-amplify/ui-react` `Authenticator` component wraps entire app in `src/App.jsx`; all routes require authentication
  - Config: `src/aws-config.js`
  - User Pool ID: `sa-east-1_Jw98XU6oe`
  - User Pool Client ID: `2jqbrs353aipm3pd034ei9sph8`
  - Identity Pool ID: `sa-east-1:c098c9c8-4f64-44a4-8e20-72d34e21e68f`
  - Login method: Email only
  - Guest access: Enabled (used for Transcribe credential resolution)
  - Password policy: min 8 chars, requires upper/lower/digits, no special chars required
  - Token usage: `idToken` as Bearer JWT for all API calls via `fetchAuthSession()` from `aws-amplify/auth`
  - Roles: `effective_role` field on `/me` response drives client-side authorization (`admin` vs default)

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- `console.log` / `console.error` scattered throughout source files; no structured logging library

## CI/CD & Deployment

**Hosting:**
- Static SPA (Vite build); deployment target not specified in repository
- Region context: AWS `sa-east-1`

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- `VITE_API_URL` - Backend API Gateway base URL
- `VITE_AWS_REGION` - AWS region for Transcribe client
- `VITE_IDENTITY_POOL_ID` - Cognito Identity Pool for Transcribe credentials

**Secrets location:**
- `.env` file at project root (present, gitignored)
- AWS Cognito pool/client IDs hardcoded in `src/aws-config.js` (not secrets per se but environment-specific config)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-03-23*
