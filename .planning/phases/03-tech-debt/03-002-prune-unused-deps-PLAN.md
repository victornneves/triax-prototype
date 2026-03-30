---
phase: 03-tech-debt
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
autonomous: true
requirements: [DEBT-03]

must_haves:
  truths:
    - "jspdf is not listed in package.json dependencies"
    - "html2canvas is not listed in package.json dependencies"
    - "Production bundle does not include jspdf or html2canvas code"
    - "npm install completes without errors after removal"
  artifacts:
    - path: "package.json"
      provides: "Clean dependency list without unused packages"
    - path: "package-lock.json"
      provides: "Updated lockfile reflecting removals"
  key_links: []
---

<objective>
Remove the unused `jspdf` and `html2canvas` packages from the project dependencies.

Purpose: These packages are listed in package.json but never imported in any source file. PDF downloads are handled server-side via the `/history/{id}/pdf` API endpoint. Removing them reduces bundle size and eliminates unnecessary dependency maintenance.
Output: Updated package.json and package-lock.json with both packages removed.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-tech-debt/03-CONTEXT.md

@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove jspdf and html2canvas dependencies</name>
  <files>package.json, package-lock.json</files>
  <read_first>
    - package.json (verify jspdf and html2canvas are listed, confirm no other references)
  </read_first>
  <action>
    Per D-09 and D-10:

    1. Verify zero import statements reference either package:
       ```bash
       grep -rn "import.*jspdf\|import.*html2canvas\|require.*jspdf\|require.*html2canvas" src/
       ```
       This should return nothing. If it returns results, STOP and report.

    2. Run: `npm uninstall jspdf html2canvas`
       This removes both from package.json dependencies AND updates package-lock.json in one command.

    3. Verify removal by reading package.json — neither `"jspdf"` nor `"html2canvas"` should appear in the dependencies object.

    4. Run `npm run build` to confirm the Vite production build still succeeds without these packages.

    Per D-11: No source file imports need updating — confirmed zero import statements reference either package.
  </action>
  <verify>
    <automated>
      ! grep -q '"jspdf"' package.json && \
      ! grep -q '"html2canvas"' package.json && \
      npm run build --silent 2>&1 | tail -1 && \
      echo "PASS" || echo "FAIL"
    </automated>
  </verify>
  <acceptance_criteria>
    - package.json does NOT contain the string `"jspdf"`
    - package.json does NOT contain the string `"html2canvas"`
    - `npm run build` exits with code 0 (production build succeeds)
    - No source file in src/ imports jspdf or html2canvas
  </acceptance_criteria>
  <done>Both packages removed from package.json and package-lock.json, build succeeds</done>
</task>

</tasks>

<verification>
1. `grep "jspdf\|html2canvas" package.json` — should return nothing
2. `npm run build` — should succeed
3. `npm ls jspdf html2canvas 2>&1` — should report "not found" or empty
</verification>

<success_criteria>
- Zero references to jspdf or html2canvas in package.json
- Production build succeeds without these packages
</success_criteria>

<output>
After completion, create `.planning/phases/03-tech-debt/03-002-prune-unused-deps-SUMMARY.md`
</output>
