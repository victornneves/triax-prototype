# STRUCTURE.md — Directory Layout

## Top-Level
```
triax-prototype/
├── src/                    # Application source code
├── public/                 # Static assets (vite.svg)
├── dist/                   # Build output (gitignored typically)
├── .planning/              # GSD planning documents
├── index.html              # Vite HTML entry point
├── package.json
├── vite.config.js
├── eslint.config.js
├── openapi.yaml            # OpenAPI spec for backend API
├── .env                    # Local env vars (not committed)
├── .env_sample             # Env var template
└── README.md
```

## Source Layout
```
src/
├── main.jsx                # React root mount
├── App.jsx                 # Root component: Amplify config, auth, routing
├── App.css                 # Global app styles
├── index.css               # Base/reset styles
├── aws-config.js           # Static AWS Amplify configuration
├── useTranscribe.js        # Custom hook: AWS Transcribe Streaming
│
├── components/             # Reusable/page-level UI components
│   ├── Header.jsx          # Top nav bar with role badge + sign out
│   ├── ProtocolTriage.jsx  # Main triage workflow (large god component ~400+ lines)
│   ├── HistoryPage.jsx     # Session history list with detail panel
│   └── TriageDetailsModal.jsx  # Triage session detail view (clinical + reasoning tabs)
│
├── pages/                  # Route-level pages (thinner wrappers)
│   ├── Profile.jsx         # User's own triage history
│   └── AdminUsers.jsx      # Admin: user management list
│
└── contexts/
    └── UserContext.jsx     # React context: user profile from /me
```

## Key File Roles

| File | Purpose |
|------|---------|
| `src/aws-config.js` | Amplify config (Cognito pool IDs, S3 bucket) — static, no env vars |
| `src/useTranscribe.js` | All AWS Transcribe logic isolated in one custom hook |
| `src/components/ProtocolTriage.jsx` | Core triage state machine, patient form, chat UI, sensor inputs |
| `src/contexts/UserContext.jsx` | Global user profile, role-based access data |
| `openapi.yaml` | Documents the backend REST API contract |
| `.env_sample` | Template: `VITE_API_URL`, `VITE_AWS_REGION`, `VITE_IDENTITY_POOL_ID` |

## Naming Conventions
- Components: PascalCase `.jsx` files
- Hooks: camelCase prefixed with `use` (e.g. `useTranscribe.js`)
- Contexts: PascalCase with `Context` suffix (`UserContext.jsx`)
- CSS: co-located with root-level components (`App.css`, `index.css`)
- No barrel files / index.js re-exports
- No test files exist anywhere in the project
