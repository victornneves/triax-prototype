# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- JavaScript (JSX) ES2020+ - All application source code in `src/`

**Secondary:**
- CSS - Styling via `src/App.css`, `src/index.css`
- YAML - API contract definition via `openapi.yaml`

## Runtime

**Environment:**
- Node.js v22.19.0

**Package Manager:**
- npm 10.9.3
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 - UI component framework; all components in `src/components/` and `src/pages/`
- React DOM 19.2.0 - Browser rendering, entry at `src/main.jsx`
- React Router DOM 7.12.0 - Client-side routing; routes defined in `src/App.jsx`

**Testing:**
- Not detected

**Build/Dev:**
- Vite 7.2.4 - Dev server and production bundler; config at `vite.config.js`
- `@vitejs/plugin-react` 5.1.1 - Vite plugin for React/JSX support

## Key Dependencies

**Critical:**
- `aws-amplify` 6.15.9 - AWS Amplify core; configured in `src/App.jsx` via `Amplify.configure(awsConfig)`
- `@aws-amplify/ui-react` 6.13.2 - Pre-built Amplify UI components; `Authenticator` wraps entire app in `src/App.jsx`
- `@aws-sdk/client-transcribe-streaming` 3.971.0 - AWS Transcribe Streaming SDK; used in `src/useTranscribe.js` for real-time speech-to-text
- `@aws-sdk/client-cognito-identity` 3.971.0 - Cognito Identity client; used in `src/useTranscribe.js` for credential resolution
- `@aws-sdk/credential-provider-cognito-identity` 3.971.0 - Provides temporary AWS credentials via Cognito Identity Pool; used in `src/useTranscribe.js`

**Infrastructure:**
- `jspdf` 4.2.0 - PDF generation library; imported as dependency but PDF downloads are handled server-side via `${API_URL}/history/{id}/pdf` endpoint
- `html2canvas` 1.4.1 - HTML-to-canvas screenshot library; imported as dependency, likely for PDF rendering support

## Configuration

**Environment:**
- Configured via `.env` file (present, contents not read)
- Sample template available at `.env_sample`
- Required env vars (from `.env_sample`):
  - `VITE_API_URL` - Backend REST API base URL (AWS API Gateway)
  - `VITE_AWS_REGION` - AWS region (e.g., `sa-east-1`)
  - `VITE_IDENTITY_POOL_ID` - Cognito Identity Pool ID for Transcribe credentials
- All vars accessed via `import.meta.env.VITE_*` (Vite convention)
- AWS Cognito config (User Pool, Client ID, Identity Pool) is hardcoded in `src/aws-config.js`

**Build:**
- `vite.config.js` - Minimal config using `@vitejs/plugin-react` plugin only
- No path aliases configured
- Output directory: `dist/` (default Vite)

## Platform Requirements

**Development:**
- Node.js v22+
- npm 10+
- `.env` file with all three `VITE_*` vars set

**Production:**
- Static SPA deployment (Vite build produces `dist/`)
- No SSR
- Region: `sa-east-1` (São Paulo, AWS)
- Backend: AWS API Gateway at `https://o7267hgyxl.execute-api.sa-east-1.amazonaws.com`

---

*Stack analysis: 2026-03-23*
