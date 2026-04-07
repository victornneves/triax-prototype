---
phase: 02-auth-security
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/aws-config.js
  - .env_sample
autonomous: true
requirements:
  - AUTH-01

must_haves:
  truths:
    - "aws-config.js contains zero hardcoded Cognito IDs or S3 bucket names"
    - ".env_sample documents all four new VITE_* vars needed to run the app"
    - "App still loads and configures Amplify correctly when env vars are set"
  artifacts:
    - path: "src/aws-config.js"
      provides: "Amplify configuration reading from env vars"
      contains: "import.meta.env.VITE_"
    - path: ".env_sample"
      provides: "Template for all required env vars"
      contains: "VITE_USER_POOL_ID"
  key_links:
    - from: "src/aws-config.js"
      to: ".env"
      via: "import.meta.env.VITE_* reads"
      pattern: "import\\.meta\\.env\\.VITE_"
---

<objective>
Move all hardcoded AWS resource IDs out of source code into environment variables.

Purpose: Cognito User Pool ID, Client ID, Identity Pool ID, and S3 bucket name are currently hardcoded in `src/aws-config.js`. This is a security and deployment concern -- different environments (dev, staging, prod) need different values, and resource IDs should not be committed to source control.

Output: Updated `src/aws-config.js` reading from `VITE_*` env vars, updated `.env_sample` with all required vars documented.
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
@src/aws-config.js
@.env_sample
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace hardcoded values in aws-config.js with VITE_* env vars</name>
  <files>src/aws-config.js</files>
  <read_first>
    - src/aws-config.js (current hardcoded values to replace)
    - .env_sample (existing env var names to stay consistent with)
  </read_first>
  <action>
Rewrite `src/aws-config.js` to read four values from environment variables per D-01:

Replace each hardcoded value with its corresponding `import.meta.env.VITE_*` read:
- `userPoolId: 'sa-east-1_Jw98XU6oe'` becomes `userPoolId: import.meta.env.VITE_USER_POOL_ID`
- `userPoolClientId: '2jqbrs353aipm3pd034ei9sph8'` becomes `userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID`
- `identityPoolId: 'sa-east-1:c098c9c8-4f64-44a4-8e20-72d34e21e68f'` becomes `identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID`
- S3 bucket `'storagestack-aitriagedevsessionbucketec01eff9-m7nvints9cab'` becomes `bucket: import.meta.env.VITE_S3_BUCKET`

Per D-03, keep ALL non-secret config hardcoded:
- `region: 'sa-east-1'` stays hardcoded
- `loginWith: { email: true }` stays hardcoded
- `signUpVerificationMethod: 'code'` stays hardcoded
- `userAttributes: { email: { required: true } }` stays hardcoded
- `allowGuestAccess: true` stays hardcoded
- `passwordFormat: { minLength: 8, ... }` stays hardcoded

The export shape (`export default awsConfig`) must NOT change -- all downstream imports remain valid.
  </action>
  <verify>
    <automated>grep -c "import.meta.env.VITE_" src/aws-config.js | grep -q "4" && grep -cE "sa-east-1_Jw98|2jqbrs353|c098c9c8|storagestack-" src/aws-config.js | grep -q "0" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <acceptance_criteria>
    - src/aws-config.js contains exactly 4 occurrences of `import.meta.env.VITE_`
    - src/aws-config.js contains zero occurrences of `sa-east-1_Jw98XU6oe` (old userPoolId)
    - src/aws-config.js contains zero occurrences of `2jqbrs353aipm3pd034ei9sph8` (old clientId)
    - src/aws-config.js contains zero occurrences of `c098c9c8-4f64-44a4-8e20-72d34e21e68f` (old identityPoolId)
    - src/aws-config.js contains zero occurrences of `storagestack-` (old bucket)
    - src/aws-config.js still contains `region: 'sa-east-1'` hardcoded
    - src/aws-config.js still contains `export default awsConfig`
    - src/aws-config.js still contains `loginWith`, `passwordFormat`, `allowGuestAccess` hardcoded
  </acceptance_criteria>
  <done>All four resource IDs read from VITE_* env vars; non-secret config remains hardcoded; export shape unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Update .env_sample with all required VITE_* vars</name>
  <files>.env_sample</files>
  <read_first>
    - .env_sample (current content to preserve existing vars)
    - src/aws-config.js (after Task 1 -- to confirm var names match)
  </read_first>
  <action>
Update `.env_sample` to include all required environment variables per D-02.

Current content has:
```
VITE_API_URL=https://...
VITE_AWS_REGION=sa-east-1
VITE_IDENTITY_POOL_ID=sa-east-1:...
```

Add the three new vars (VITE_IDENTITY_POOL_ID already exists). Final `.env_sample` should contain:
```
VITE_API_URL=https://...
VITE_AWS_REGION=sa-east-1
VITE_USER_POOL_ID=sa-east-1_...
VITE_USER_POOL_CLIENT_ID=...
VITE_IDENTITY_POOL_ID=sa-east-1:...
VITE_S3_BUCKET=...
```

Use placeholder values (with `...`) -- do NOT put real credentials in the sample file. Group the Cognito vars together, then S3 bucket after.
  </action>
  <verify>
    <automated>grep -c "VITE_USER_POOL_ID\|VITE_USER_POOL_CLIENT_ID\|VITE_IDENTITY_POOL_ID\|VITE_S3_BUCKET" .env_sample | grep -q "4" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <acceptance_criteria>
    - .env_sample contains `VITE_USER_POOL_ID=`
    - .env_sample contains `VITE_USER_POOL_CLIENT_ID=`
    - .env_sample contains `VITE_IDENTITY_POOL_ID=` (already existed, still present)
    - .env_sample contains `VITE_S3_BUCKET=`
    - .env_sample still contains `VITE_API_URL=`
    - .env_sample still contains `VITE_AWS_REGION=`
    - .env_sample does NOT contain the actual value `sa-east-1_Jw98XU6oe`
  </acceptance_criteria>
  <done>.env_sample documents all six VITE_* vars needed to run the app, with placeholder values.</done>
</task>

</tasks>

<verification>
- `grep -c "import.meta.env.VITE_" src/aws-config.js` returns 4
- `grep -E "sa-east-1_Jw98|2jqbrs353|c098c9c8|storagestack-" src/aws-config.js` returns nothing (no hardcoded IDs)
- `grep "export default awsConfig" src/aws-config.js` returns a match (export shape preserved)
- `grep -c "VITE_" .env_sample` returns 6 (API_URL, AWS_REGION, USER_POOL_ID, USER_POOL_CLIENT_ID, IDENTITY_POOL_ID, S3_BUCKET)
- `npx vite build` completes without import errors (env vars may be undefined but build should not fail)
</verification>

<success_criteria>
- Zero hardcoded AWS resource IDs in src/aws-config.js
- All six VITE_* env vars documented in .env_sample
- aws-config.js export shape unchanged (no downstream breakage)
</success_criteria>

<output>
After completion, create `.planning/phases/02-auth-security/02-001-env-config-SUMMARY.md`
</output>
