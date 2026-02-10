---
name: run-test-all
description: "Runs ALL Vitest tests across /features, /tests, and /supabase directories. Executes tests via npx vitest run, collects results, and generates test.result.json (replaced on every run). Uses qa-specialist to analyze failures and provide actionable feedback. Triggers on: run test all, run all tests, test all, vitest all, run tests."
user-invocable: true
---

# Run Test All Skill

Run every Vitest test file in the project, collect results, and generate `test.result.json`.

---

## When to Use

Use `/run-test-all` when:
- You want to run **every test** in the project
- You want a **test.result.json** report of all pass/fail results
- You want to verify the full test suite after changes

Do NOT use when:
- You want to run only a specific phase → use `/run-test-phase`
- You want to generate tests (not run them) → use `/generate-test`

---

## How It Works

```
/run-test-all
      |
      v
+----------------------------------------------------------+
|  STEP 1: Discover all test files                          |
|  - src/features/**/*.test.ts                              |
|  - src/tests/**/*.test.ts                                 |
|  - supabase/**/*.test.ts                                  |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Read test-plan.md for context                    |
|  - Map test files to phases/features                      |
|  - Understand expected behavior per test                  |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: Run vitest                                       |
|  - npx vitest run --reporter=json --outputFile=...        |
|  - Capture all results (pass, fail, skip, duration)       |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 4: Parse results & generate test.result.json        |
|  - Replaces previous test.result.json entirely            |
|  - Structured by feature/phase with pass/fail counts      |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 5: Analyze failures (if any)                        |
|  - Spawn qa-specialist to analyze failing tests           |
|  - Provide actionable fix suggestions                     |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 6: Report results                                   |
+----------------------------------------------------------+
```

---

## Step 1: Discover All Test Files

Find every test file in the project:

```
Glob: src/features/**/*.test.ts
Glob: src/tests/**/*.test.ts
Glob: supabase/**/*.test.ts
```

**If no test files found:**
> No test files found. Run `/generate-test` first to generate test files from test-plan.md.

**STOP. Do NOT proceed.**

Report discovery:

```markdown
### Test Files Found

| Directory | Files |
|-----------|-------|
| src/features/ | {count} |
| src/tests/ | {count} |
| supabase/ | {count} |
| **Total** | **{total}** |
```

---

## Step 2: Read test-plan.md for Context

```
Glob: **/test-plan.md OR **/test.plan.md
Read: [found path]
```

Extract the phase-to-feature mapping so results can be grouped by phase in test.result.json.

If test-plan.md does not exist, warn but proceed:
> test-plan.md not found. Results will be grouped by directory only, not by phase.

---

## Step 3: Run Vitest

### 3.1 Check Supabase local is running

```bash
npx supabase status
```

If Supabase is NOT running, warn:
> **Warning:** Supabase local does not appear to be running. Tests that connect to the database will fail.
> Start it with: `npx supabase start`

Ask the user:

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

### 3.2 Execute vitest

Run ALL tests with JSON reporter:

```bash
npx vitest run --reporter=json --reporter=default --outputFile=docs/vitest-raw-output.json 2>&1
```

Capture:
- Exit code (0 = all pass, 1 = some failures)
- JSON output for structured parsing
- Console output for human-readable summary

### 3.3 If vitest is not installed

```
STOP. Tell user:
"Vitest is not installed. Run: npm install -D vitest"
```

---

## Step 4: Parse Results & Generate test.result.json

### 4.1 Read the raw vitest JSON output

```
Read: docs/vitest-raw-output.json
```

### 4.2 Parse and structure results

Build `test.result.json` with this structure:

```json
{
  "generated": "2026-02-10T12:00:00.000Z",
  "command": "run-test-all",
  "scope": "all",
  "duration_ms": 12345,
  "summary": {
    "total_suites": 10,
    "passed_suites": 8,
    "failed_suites": 2,
    "total_tests": 85,
    "passed": 78,
    "failed": 5,
    "skipped": 2,
    "pass_rate": "91.8%"
  },
  "by_directory": {
    "src/features": {
      "suites": 6,
      "tests": 50,
      "passed": 47,
      "failed": 3,
      "skipped": 0
    },
    "src/tests": {
      "suites": 3,
      "tests": 25,
      "passed": 23,
      "failed": 2,
      "skipped": 0
    },
    "supabase": {
      "suites": 1,
      "tests": 10,
      "passed": 8,
      "failed": 0,
      "skipped": 2
    }
  },
  "by_phase": {
    "Phase 1: Auth": {
      "suites": 2,
      "tests": 20,
      "passed": 18,
      "failed": 2,
      "features": ["auth"]
    },
    "Phase 2: Orders": {
      "suites": 3,
      "tests": 30,
      "passed": 28,
      "failed": 2,
      "features": ["orders", "payments"]
    }
  },
  "suites": [
    {
      "file": "src/features/auth/api/auth.test.ts",
      "status": "fail",
      "duration_ms": 1234,
      "tests": {
        "total": 15,
        "passed": 13,
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
      "file": "src/features/orders/api/orders.test.ts",
      "status": "pass",
      "duration_ms": 890,
      "tests": {
        "total": 20,
        "passed": 20,
        "failed": 0,
        "skipped": 0
      },
      "failures": []
    }
  ]
}
```

### 4.3 Write test.result.json

**ALWAYS replace the file entirely — never append.**

```
Write: docs/test.result.json
```

### 4.4 Clean up raw output

```bash
rm docs/vitest-raw-output.json
```

---

## Step 5: Analyze Failures (if any)

**If ALL tests passed → skip this step.**

If there are failures, spawn a qa-specialist agent to analyze:

```
Task:
  subagent_type: qa-specialist
  description: "Analyze test failures"
  prompt: |
    Analyze the following test failures and provide actionable fixes.

    Read context:
    - docs/test.result.json (test results with failure details)
    - references/vitest-best-practices.md (testing rules)
    - The failing test files (read each one)
    - The source files being tested (read each one)

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

## Step 6: Report Results

```markdown
## Test Results — All Tests

**Run at:** {timestamp}
**Duration:** {duration_ms}ms
**Command:** `npx vitest run`

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

### Results by Directory

| Directory | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| src/features/ | {tests} | {passed} | {failed} | {pass/fail} |
| src/tests/ | {tests} | {passed} | {failed} | {pass/fail} |
| supabase/ | {tests} | {passed} | {failed} | {pass/fail} |

### Results by Phase

| Phase | Features | Tests | Passed | Failed |
|-------|----------|-------|--------|--------|
| Phase 1: Auth | auth | {tests} | {passed} | {failed} |
| Phase 2: Orders | orders, payments | {tests} | {passed} | {failed} |

### Failures (if any)

| Test | File | Root Cause | Fix |
|------|------|------------|-----|
| {test name} | {file}:{line} | {cause} | {fix recommendation} |

### Output

- **test.result.json:** `docs/test.result.json` (replaced)

### Next Steps

1. Fix failing tests using the failure analysis above
2. Re-run: `/run-test-all` to verify fixes
3. Run specific phase: `/run-test-phase` to focus on one area
4. Generate more tests: `/generate-test {feature}`
```

---

## Execution Rules

### DO:
- ALWAYS discover test files before running
- ALWAYS run vitest with JSON reporter for structured output
- ALWAYS replace test.result.json entirely (never append)
- ALWAYS check if Supabase local is running before executing
- ALWAYS group results by directory AND by phase (if test-plan.md exists)
- ALWAYS spawn qa-specialist for failure analysis when tests fail
- ALWAYS clean up raw vitest output after parsing
- ALWAYS report pass rate prominently

### DO NOT:
- NEVER append to test.result.json — always replace
- NEVER skip running tests and generate fake results
- NEVER modify test files during a test run
- NEVER modify source code during a test run
- NEVER ignore test failures — always analyze them
- NEVER run tests without checking for test files first

---

## Checklist

- [ ] Test files discovered across all directories
- [ ] test-plan.md read for phase mapping (if exists)
- [ ] Supabase local status checked
- [ ] Vitest executed with JSON reporter
- [ ] Raw results parsed
- [ ] test.result.json generated and written (replacing previous)
- [ ] Failures analyzed by qa-specialist (if any)
- [ ] Results reported with pass rate and next steps
