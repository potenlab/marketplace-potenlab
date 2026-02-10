---
name: run-test-phase
description: "Runs Vitest tests for a specific phase chosen by the user. Reads test-plan.md to identify phases, asks user which phase to run via AskUserQuestion, executes only those test files, and generates test.result.json (replaced on every run). Uses qa-specialist to analyze failures. Triggers on: run test phase, test phase, run phase test, test specific phase."
user-invocable: true
---

# Run Test Phase Skill

Run Vitest tests for a specific phase from `test-plan.md`, collect results, and generate `test.result.json`.

---

## When to Use

Use `/run-test-phase` when:
- You want to run tests for **one specific phase** only
- You want to **focus** on a subset of the test suite
- You want faster feedback on a specific area after changes

Do NOT use when:
- You want to run ALL tests → use `/run-test-all`
- You want to generate tests (not run them) → use `/generate-test`

---

## How It Works

```
/run-test-phase [phase]
      |
      v
+----------------------------------------------------------+
|  STEP 1: Read test-plan.md                                |
|  - Parse all phases and their features/test files         |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Get phase choice                                 |
|  - From argument: /run-test-phase 1                       |
|  - OR from AskUserQuestion with phase list                |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: Resolve test files for the chosen phase          |
|  - Map phase → features → test files                      |
|  - src/features/{name}/**/*.test.ts                       |
|  - src/tests/**/{name}*.test.ts                           |
|  - supabase/**/{name}*.test.ts                            |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 4: Run vitest with file filter                      |
|  - npx vitest run {file1} {file2} ... --reporter=json     |
|  - Capture results for selected files only                |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 5: Parse results & generate test.result.json        |
|  - Replaces previous test.result.json entirely            |
|  - Scoped to the chosen phase                             |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 6: Analyze failures (if any)                        |
|  - Spawn qa-specialist for failure analysis               |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 7: Report results                                   |
+----------------------------------------------------------+
```

---

## Step 1: Read test-plan.md

```
Glob: **/test-plan.md OR **/test.plan.md
Read: [found path]
```

Parse the test plan to extract:
- **Phase list** with names (e.g., "Phase 1: Auth", "Phase 2: Orders")
- **Features per phase** (e.g., Phase 1 → auth, profiles)
- **Test files per feature** (mapped from the feature name)

**If test-plan.md does NOT exist:**
> `test-plan.md` not found. Cannot determine phases. Use `/run-test-all` to run everything, or create a test-plan.md first.

**STOP. Do NOT proceed.**

---

## Step 2: Get Phase Choice

### Option A: From arguments

If the user provides a phase:
```
/run-test-phase 1           → Run Phase 1 tests
/run-test-phase auth        → Run tests for the auth phase/feature
/run-test-phase 3           → Run Phase 3 tests
```

Extract the phase directly. **Do NOT ask questions — proceed to Step 3.**

### Option B: No argument provided

Read test-plan.md to build the phase list dynamically, then ask:

```
AskUserQuestion:
  question: "Which phase do you want to run tests for?"
  header: "Test Phase"
  options:
    - label: "Phase 1: {name}"
      description: "{feature_count} features, {test_count} test files"
    - label: "Phase 2: {name}"
      description: "{feature_count} features, {test_count} test files"
    - label: "Phase 3: {name}"
      description: "{feature_count} features, {test_count} test files"
```

Build options from the actual phases found in test-plan.md. Show up to 4 phases. If more exist, add "Other" for custom input.

### Question Rules
- Maximum **1 question** to get the phase
- If arguments provided, ask **ZERO questions**
- Capture as `{chosen_phase}`

---

## Step 3: Resolve Test Files for the Chosen Phase

### 3.1 Map phase to features

From test-plan.md, extract the features belonging to the chosen phase:

```
Phase 1: Auth → features: [auth, profiles]
Phase 2: Orders → features: [orders, payments, invoices]
```

### 3.2 Find test files for those features

For each feature in the phase, search for test files:

```
Glob: src/features/{feature}/**/*.test.ts
Glob: src/tests/**/{feature}*.test.ts
Glob: src/tests/rls/{feature}*.test.ts
Glob: src/tests/constraints/{feature}*.test.ts
Glob: supabase/**/{feature}*.test.ts
```

Collect ALL matching test files into `{phase_test_files}`.

### 3.3 Validate

**If no test files found for the chosen phase:**
> No test files found for Phase {N}. Features: {feature_list}.
> Run `/generate-test {feature}` to generate tests first.

**STOP.**

Report discovery:

```markdown
### Phase {N}: {name} — Test Files

| Feature | Test Files |
|---------|-----------|
| {feature} | {file1}, {file2} |
| {feature} | {file1} |
| **Total** | **{total_files} files** |
```

---

## Step 4: Run Vitest with File Filter

### 4.1 Check Supabase local is running

```bash
npx supabase status
```

If not running, warn and ask (same as /run-test-all):

```
AskUserQuestion:
  question: "Supabase local doesn't seem to be running. Proceed anyway?"
  header: "Supabase"
  options:
    - label: "Run tests anyway"
      description: "Some tests may fail due to missing database connection"
    - label: "Stop — I'll start Supabase first"
      description: "I'll run npx supabase start and come back"
```

### 4.2 Execute vitest for specific files

Run ONLY the phase's test files:

```bash
npx vitest run {file1} {file2} {file3} --reporter=json --reporter=default --outputFile=docs/vitest-raw-output.json 2>&1
```

If the file list is very long (>10 files), use a glob pattern instead:

```bash
npx vitest run "src/features/{feature1}/**/*.test.ts" "src/features/{feature2}/**/*.test.ts" --reporter=json --reporter=default --outputFile=docs/vitest-raw-output.json 2>&1
```

### 4.3 If vitest is not installed

```
STOP. Tell user:
"Vitest is not installed. Run: npm install -D vitest"
```

---

## Step 5: Parse Results & Generate test.result.json

### 5.1 Read raw output

```
Read: docs/vitest-raw-output.json
```

### 5.2 Build test.result.json

**ALWAYS replace the file entirely — never append.**

```json
{
  "generated": "2026-02-10T12:00:00.000Z",
  "command": "run-test-phase",
  "scope": {
    "phase": "Phase 1: Auth",
    "phase_number": 1,
    "features": ["auth", "profiles"]
  },
  "duration_ms": 4567,
  "summary": {
    "total_suites": 4,
    "passed_suites": 3,
    "failed_suites": 1,
    "total_tests": 35,
    "passed": 32,
    "failed": 2,
    "skipped": 1,
    "pass_rate": "91.4%"
  },
  "by_feature": {
    "auth": {
      "suites": 2,
      "tests": 20,
      "passed": 18,
      "failed": 2,
      "skipped": 0
    },
    "profiles": {
      "suites": 2,
      "tests": 15,
      "passed": 14,
      "failed": 0,
      "skipped": 1
    }
  },
  "suites": [
    {
      "file": "src/features/auth/api/auth.test.ts",
      "feature": "auth",
      "status": "fail",
      "duration_ms": 1234,
      "tests": {
        "total": 12,
        "passed": 10,
        "failed": 2,
        "skipped": 0
      },
      "failures": [
        {
          "name": "Auth CRUD > should create user with valid data",
          "error": "Expected null, received { code: '23502', message: '...' }",
          "line": 45
        },
        {
          "name": "Auth RLS > should deny other user access",
          "error": "Expected 0, received 1",
          "line": 78
        }
      ]
    },
    {
      "file": "src/features/auth/api/auth-rls.test.ts",
      "feature": "auth",
      "status": "pass",
      "duration_ms": 890,
      "tests": {
        "total": 8,
        "passed": 8,
        "failed": 0,
        "skipped": 0
      },
      "failures": []
    },
    {
      "file": "src/features/profiles/api/profiles.test.ts",
      "feature": "profiles",
      "status": "pass",
      "duration_ms": 678,
      "tests": {
        "total": 15,
        "passed": 14,
        "failed": 0,
        "skipped": 1
      },
      "failures": []
    }
  ]
}
```

### 5.3 Write test.result.json

```
Write: docs/test.result.json
```

### 5.4 Clean up raw output

```bash
rm docs/vitest-raw-output.json
```

---

## Step 6: Analyze Failures (if any)

**If ALL tests passed → skip this step.**

If there are failures, spawn a qa-specialist agent:

```
Task:
  subagent_type: qa-specialist
  description: "Analyze Phase {N} test failures"
  prompt: |
    Analyze the following test failures from Phase {N}: {phase_name}.

    Read context:
    - docs/test.result.json (test results with failure details)
    - references/vitest-best-practices.md (testing rules)
    - The failing test files (read each one)
    - The source files being tested (read each one)
    - backend-plan.md (schema and RLS context for this phase)

    For each failure:
    1. Read the failing test file and the line that failed
    2. Read the source code being tested
    3. Determine root cause:
       - Is the test wrong? (assertion mismatch, wrong expectation)
       - Is the source code wrong? (bug in implementation)
       - Is the schema wrong? (missing column, wrong constraint)
       - Is RLS wrong? (policy too permissive or too restrictive)
       - Is test data wrong? (missing seed data, wrong setup)
    4. Provide a specific fix recommendation

    Return a structured analysis:

    FAILURE ANALYSIS:
    ---
    Test: {test name}
    File: {file path}:{line}
    Feature: {feature name}
    Root Cause: {test_bug | source_bug | schema_issue | rls_issue | data_issue}
    Explanation: {what went wrong}
    Fix: {specific action to fix it}
    ---
    [repeat for each failure]

    SUMMARY:
    - {N} test bugs (fix the test)
    - {N} source bugs (fix the implementation)
    - {N} schema issues (fix the migration)
    - {N} RLS issues (fix the policy)
    - {N} data issues (fix seed/setup)

    Do NOT modify any files. Analysis only.
```

---

## Step 7: Report Results

```markdown
## Test Results — Phase {N}: {name}

**Run at:** {timestamp}
**Duration:** {duration_ms}ms
**Scope:** Phase {N} — {feature_list}
**Command:** `npx vitest run {files}`

### Summary

| Metric | Count |
|--------|-------|
| Test Suites | {total_suites} |
| Passed Suites | {passed_suites} |
| Failed Suites | {failed_suites} |
| Total Tests | {total_tests} |
| Passed | {passed} |
| Failed | {failed} |
| Skipped | {skipped} |
| **Pass Rate** | **{pass_rate}** |

### Results by Feature

| Feature | Suites | Tests | Passed | Failed | Status |
|---------|--------|-------|--------|--------|--------|
| {feature} | {suites} | {tests} | {passed} | {failed} | {pass/fail} |
| {feature} | {suites} | {tests} | {passed} | {failed} | {pass/fail} |

### Failures (if any)

| Test | File | Feature | Root Cause | Fix |
|------|------|---------|------------|-----|
| {test name} | {file}:{line} | {feature} | {cause} | {fix} |

### Output

- **test.result.json:** `docs/test.result.json` (replaced)

### Next Steps

1. Fix failing tests using the failure analysis above
2. Re-run this phase: `/run-test-phase {N}`
3. Run all tests: `/run-test-all`
4. Run a different phase: `/run-test-phase`
5. Generate more tests: `/generate-test {feature}`
```

---

## Error Handling

### test-plan.md not found
```
STOP. Tell user:
"test-plan.md not found. Cannot determine phases.
Use /run-test-all to run everything, or create a test-plan.md first."
```

### Phase not found in test-plan.md
```
Tell user: "Phase {N} not found in test-plan.md. Available phases: {list}."
Use AskUserQuestion to let them pick a valid phase.
```

### No test files for chosen phase
```
Tell user: "No test files found for Phase {N} features: {list}.
Run /generate-test {feature} to generate tests first."
STOP.
```

### Supabase not running
```
Warn and ask if user wants to proceed or start Supabase first.
```

### Vitest not installed
```
STOP. Tell user: "Vitest not installed. Run: npm install -D vitest"
```

### Some tests crash (not fail, crash)
```
1. Report which test file crashed
2. Still process results from files that completed
3. Mark crashed suites in test.result.json with status: "error"
4. Suggest checking the test file for syntax errors
```

---

## Execution Rules

### DO:
- ALWAYS read test-plan.md to determine phase-to-feature mapping
- ALWAYS ask user which phase via AskUserQuestion if not provided
- ALWAYS run ONLY the test files belonging to the chosen phase
- ALWAYS replace test.result.json entirely (never append)
- ALWAYS check Supabase local status before running
- ALWAYS group results by feature within the phase
- ALWAYS spawn qa-specialist for failure analysis when tests fail
- ALWAYS clean up raw vitest output after parsing
- ALWAYS show which features/files were included in the run

### DO NOT:
- NEVER run ALL tests — only the chosen phase's tests
- NEVER append to test.result.json — always replace
- NEVER modify test files or source files during a test run
- NEVER skip asking for phase if no argument provided
- NEVER proceed without test-plan.md (can't determine phases)
- NEVER ignore failures — always analyze them

---

## Checklist

- [ ] test-plan.md read and phases extracted
- [ ] Phase chosen (from argument or AskUserQuestion)
- [ ] Features for phase identified
- [ ] Test files resolved for all features in phase
- [ ] Supabase local status checked
- [ ] Vitest executed with file filter and JSON reporter
- [ ] Raw results parsed
- [ ] test.result.json generated and written (replacing previous)
- [ ] Failures analyzed by qa-specialist (if any)
- [ ] Results reported with per-feature breakdown and next steps
