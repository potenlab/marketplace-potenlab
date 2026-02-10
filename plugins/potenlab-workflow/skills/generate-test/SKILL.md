---
name: generate-test
description: "Generates Vitest test files from test-plan.md using the qa-specialist agent. Reads the test plan and vitest best practices, then spawns qa-specialist agents to produce .test.ts files for features, shared tests, and Supabase integration tests. Tests verify behavior via database operations and RLS policies — no UI testing. Triggers on: generate test, generate tests, create tests, write tests, test generation."
user-invocable: true
---

# Generate Test Skill

Generate Vitest test files from `test-plan.md` by spawning qa-specialist agents that produce behavior-driven tests against Supabase local.

---

## When to Use

Use `/generate-test` when:
- You have a **test-plan.md** with test scenarios defined
- You want to generate **.test.ts** files for feature behavior, RLS policies, and constraints
- Tests should run against **Supabase local** (not UI, not browser)

Do NOT use when:
- You need UI/component tests (use @testing-library/react directly)
- You need E2E browser tests (use Playwright directly)
- No test-plan.md exists yet (create one first)

---

## How It Works

```
/generate-test [scope]
      |
      v
+----------------------------------------------------------+
|  STEP 1: Get scope                                        |
|  - From argument: /generate-test auth                     |
|  - From argument: /generate-test all                      |
|  - OR from AskUserQuestion if not provided                |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Read context                                     |
|  - test-plan.md (primary input — test scenarios)          |
|  - references/vitest-best-practices.md (testing rules)    |
|  - backend-plan.md (schema, RLS, constraints)             |
|  - vitest.config.ts (existing test configuration)         |
|  - Existing .test.ts files (patterns and conventions)     |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: Plan test file generation                        |
|  - Group scenarios by feature / test category             |
|  - Determine output file paths                            |
|  - Identify test categories per file:                     |
|    CRUD | RLS | Constraints | Edge Cases                  |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 4: Spawn qa-specialist agents in PARALLEL           |
|                                                           |
|  ┌────────────────┐  ┌────────────────┐                   |
|  │ qa-specialist   │  │ qa-specialist   │                  |
|  │ Feature: auth   │  │ Feature: orders │                  |
|  │ → auth.test.ts  │  │ → orders.test.ts│                  |
|  └────────────────┘  └────────────────┘                   |
|                                                           |
|  One agent per feature/test-group — all run simultaneously|
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 5: Verify & report                                  |
|  - List all generated .test.ts files                      |
|  - Show test count per category                           |
|  - Suggest running: npx vitest run                        |
+----------------------------------------------------------+
```

---

## Step 1: Get Scope

### Option A: From arguments

If the user provides a scope:
```
/generate-test all           → Generate tests for ALL features in test-plan.md
/generate-test auth          → Generate tests for the auth feature only
/generate-test orders,users  → Generate tests for specific features
```

Extract the scope directly. **Do NOT ask questions — proceed to Step 2.**

### Option B: No argument provided

If the user invokes with no argument (`/generate-test`), you MUST use AskUserQuestion:

```
AskUserQuestion:
  question: "What scope of tests do you want to generate?"
  header: "Test Scope"
  options:
    - label: "All features (Recommended)"
      description: "Generate tests for every feature in test-plan.md"
    - label: "Specific feature"
      description: "I'll specify which feature(s) to test"
    - label: "RLS policies only"
      description: "Generate only RLS policy tests for all tables"
    - label: "CRUD only"
      description: "Generate only CRUD behavior tests"
```

If "Specific feature" is selected, follow up:

```
AskUserQuestion:
  question: "Which feature(s) should I generate tests for? (comma-separated)"
  header: "Features"
  options:
    - label: "I'll type it"
      description: "Let me specify the feature names"
```

### Question Rules
- Maximum **2 questions** to get the scope
- If arguments provided, ask **ZERO questions**
- Capture as `{test_scope}`

---

## Step 2: Read Context (MANDATORY)

### 2.1 Read test-plan.md (primary input)

```
Glob: **/test-plan.md OR **/test.plan.md
Read: [found path]
```

**If test-plan.md does NOT exist:**
> `test-plan.md` not found. Create a test plan first that defines test scenarios and acceptance criteria for each feature.

**STOP. Do NOT proceed.**

### 2.2 Read vitest best practices

```
Read: references/vitest-best-practices.md
```

Extract key rules to inject into agent prompts:
- AAA pattern, strict assertions, parameterized tests
- Test isolation, cleanup, async handling
- NEVER rules (no toBeTruthy, no shared state, no any)

### 2.3 Read backend context

```
Glob: **/backend-plan.md
Read: [found path] — schema definitions, RLS policies, constraints

Glob: **/dev-plan.md
Read: [found path] — feature context and business rules
```

### 2.4 Check existing test infrastructure

```
Glob: **/vitest.config.ts
Read: [found path] — check clearMocks, resetMocks, restoreMocks

Glob: **/test/setup.ts OR **/vitest.setup.ts
Read: [check for existing Supabase test helpers]

Glob: **/*.test.ts
[List existing test files to understand patterns]
```

If vitest.config.ts is missing `clearMocks: true`, `resetMocks: true`, `restoreMocks: true`:

> **Warning:** Global mock cleanup is not configured. Recommend adding to vitest.config.ts:
> ```ts
> test: { clearMocks: true, resetMocks: true, restoreMocks: true }
> ```

### 2.5 Check for shared test utilities

```
Glob: **/test-utils/** OR **/test/helpers/** OR **/test/setup.**
Read: [check if Supabase test client helpers already exist]
```

If NO shared test utilities exist, the first agent will generate them.

---

## Step 3: Plan Test File Generation

### 3.1 Parse test-plan.md

Extract test scenarios grouped by feature. For each feature, identify:
- **CRUD tests** — insert, select, update, delete operations
- **RLS tests** — access control per role (owner, other user, anon)
- **Constraint tests** — NOT NULL, UNIQUE, CHECK, FK violations
- **Edge case tests** — empty inputs, boundaries, concurrent operations

### 3.2 Determine output file paths

Map each feature/group to a test file:

| Test Category | Output Path |
|---------------|-------------|
| Feature behavior | `src/features/{name}/api/{name}.test.ts` |
| Shared test utils | `src/test-utils/supabase.ts` |
| Supabase RLS (cross-feature) | `src/tests/rls/{table}.test.ts` |
| Supabase constraints | `src/tests/constraints/{table}.test.ts` |

### 3.3 Filter by scope

```
IF test_scope === "all"
  → Generate ALL test files from test-plan.md

IF test_scope === specific feature(s)
  → Filter to only those features

IF test_scope === "rls"
  → Generate only RLS test files

IF test_scope === "crud"
  → Generate only CRUD test files
```

### 3.4 Check if shared test utils need generation

If `src/test-utils/supabase.ts` does NOT exist, add it as the FIRST task:

```
Task T0: Generate shared Supabase test utilities
  Output: src/test-utils/supabase.ts
  Contents: adminClient, createAuthClient, createTestUser, deleteTestUser
```

All other tasks depend on T0 if it needs to be created.

---

## Step 4: Spawn QA Specialist Agents in PARALLEL

### 4.1 Generate shared test utils first (if needed)

If `src/test-utils/supabase.ts` does not exist, spawn this FIRST and wait:

```
Task:
  subagent_type: qa-specialist
  description: "Generate shared Supabase test utilities"
  prompt: |
    Create shared Supabase test utilities at src/test-utils/supabase.ts

    Read first:
    - references/vitest-best-practices.md (testing rules)
    - backend-plan.md (schema context)

    Generate a file with:
    1. SUPABASE_URL and key constants (pointing to local: http://127.0.0.1:54321)
    2. adminClient (service role — for setup/teardown only)
    3. createAnonClient() — returns client with anon key
    4. createAuthClient(email, password) — signs in and returns authenticated client
    5. createTestUser(email, password) — creates user via admin API
    6. deleteTestUser(userId) — deletes user via admin API
    7. Type the client with Database generic from @/types/database

    Follow vitest-best-practices.md rules strictly.
    Do NOT create or alter any database tables.

    When done, return: "COMPLETED: test-utils | File: src/test-utils/supabase.ts"
```

**Wait for this to complete before spawning feature test agents.**

### 4.2 Spawn feature test agents in PARALLEL

For EACH feature/test-group, spawn a qa-specialist agent:

```
Task:
  subagent_type: qa-specialist
  description: "Tests: {feature_name}"
  prompt: |
    Generate Vitest tests for the "{feature_name}" feature.

    === CONTEXT — Read ALL of these first (MANDATORY) ===

    1. Read: references/vitest-best-practices.md
       Apply ALL rules: AAA pattern, strict assertions, parameterized tests,
       async/await, test isolation, cleanup. NEVER use toBeTruthy/toBeFalsy.

    2. Read: [path to test-plan.md]
       Find the "{feature_name}" section. Generate tests for EVERY scenario listed.

    3. Read: [path to backend-plan.md]
       Find the tables, RLS policies, and constraints for "{feature_name}".

    4. Read: src/test-utils/supabase.ts
       Use the shared helpers: adminClient, createAuthClient, createTestUser, etc.

    5. Check existing code:
       Glob: src/features/{feature_name}/**/*
       Understand the feature structure and types.

    === OUTPUT FILE ===

    Write to: {output_path}

    === TEST CATEGORIES (generate ALL that apply) ===

    1. CRUD Operations
       - Create with valid data → verify inserted row
       - Create with missing required fields → expect error
       - Read own data → verify returned rows
       - Update own data → verify changes persisted
       - Delete own data → verify row removed

    2. RLS Policies (use it.each for roles)
       - Owner can SELECT own rows
       - Other user CANNOT select owner's rows (empty result, not error)
       - Owner can INSERT with own user_id
       - Owner CANNOT insert with another user's user_id
       - Owner can UPDATE own rows
       - Other user CANNOT update owner's rows
       - Owner can DELETE own rows
       - Anon user has no access (if applicable)

    3. Constraint Enforcement
       - NOT NULL violations
       - UNIQUE constraint violations (Postgres code 23505)
       - CHECK constraint violations
       - FK constraint violations (Postgres code 23503)

    4. Edge Cases
       - Empty string inputs
       - Very long strings
       - Boundary values
       - Concurrent operations (if applicable)

    === RULES ===

    - Import helpers from src/test-utils/supabase.ts
    - Use AAA pattern (Arrange, Act, Assert) with blank line separation
    - Use strict assertions: toEqual, toBe, toBeNull — NEVER toBeTruthy
    - Use it.each for parameterized RLS role tests
    - Clean up ALL test data in afterAll (use adminClient to delete)
    - Type all Supabase responses with Database types
    - Do NOT create, alter, or drop tables
    - Do NOT import React or test UI components
    - Do NOT use Playwright or any browser testing
    - Every describe block: CRUD, RLS, Constraints, Edge Cases

    === RESPONSE FORMAT ===

    When done, return:
    "COMPLETED: {feature_name} | File: {output_path} | Tests: {count} | Categories: [CRUD, RLS, Constraints, EdgeCases]"

    If blocked, return:
    "BLOCKED: {feature_name} — {reason}"
```

**Spawn ALL feature agents in a SINGLE message for maximum parallelism.**

---

## Step 5: Verify & Report

After all agents complete:

### 5.1 Collect results

Parse each agent's response:
- `COMPLETED:` → record file path, test count, categories
- `BLOCKED:` → record reason

### 5.2 List generated files

```
Glob: **/*.test.ts
[List all test files, including newly generated ones]
```

### 5.3 Report

```markdown
## Test Generation Complete

### Generated Test Files

| Feature | File | Tests | Categories |
|---------|------|-------|------------|
| test-utils | src/test-utils/supabase.ts | — | Shared helpers |
| {feature} | src/features/{name}/api/{name}.test.ts | {count} | CRUD, RLS, Constraints |
| {feature} | src/tests/rls/{table}.test.ts | {count} | RLS |

### Summary

| Metric | Count |
|--------|-------|
| Features tested | {feature_count} |
| Test files generated | {file_count} |
| Total test cases | {total_tests} |
| Agents spawned | {agent_count} |

### Test Categories Coverage

| Category | Tests |
|----------|-------|
| CRUD Operations | {count} |
| RLS Policies | {count} |
| Constraint Enforcement | {count} |
| Edge Cases | {count} |

### Run Tests

```bash
# Run all generated tests
npx vitest run

# Run specific feature tests
npx vitest run src/features/{name}/api/{name}.test.ts

# Run with coverage
npx vitest run --coverage

# Watch mode
npx vitest --watch
```

### Prerequisites

Ensure Supabase local is running:
```bash
npx supabase start
```

Ensure environment variables are set:
```bash
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```

### Next Steps

1. Start Supabase local: `npx supabase start`
2. Run tests: `npx vitest run`
3. Fix any failing tests (schema mismatches, missing seed data)
4. Add tests to CI pipeline
5. Use `/generate-test {feature}` to add tests for new features
```

---

## Error Handling

### test-plan.md not found
```
STOP. Tell user:
"test-plan.md not found. Create a test plan first that defines:
- Features to test
- Test scenarios per feature
- Acceptance criteria
- Tables and RLS policies involved"
```

### backend-plan.md not found
```
Warn but proceed:
"backend-plan.md not found. Tests will be generated from test-plan.md only.
RLS and constraint tests may be incomplete without schema context."
```

### No Supabase types found
```
Warn but proceed:
"Database types not found at @/types/database.
Tests will use generic types. Run 'npx supabase gen types typescript' to generate types."
```

### Agent fails
```
1. Report which feature's tests failed to generate
2. Other agents' results are still valid
3. Suggest re-running: /generate-test {failed_feature}
```

### vitest.config.ts not found
```
Warn and suggest:
"vitest.config.ts not found. Create one with:
export default defineConfig({
  test: {
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
  },
});"
```

---

## Execution Rules

### DO:
- ALWAYS read test-plan.md before spawning agents
- ALWAYS read references/vitest-best-practices.md and inject rules into agent prompts
- ALWAYS generate shared test utils FIRST if they don't exist
- ALWAYS spawn feature test agents in a SINGLE parallel message
- ALWAYS use qa-specialist as the agent type
- ALWAYS verify generated files exist after agents complete
- ALWAYS suggest running `npx vitest run` in the report
- ALWAYS check for existing test infrastructure before generating

### DO NOT:
- NEVER generate UI component tests — this is behavior-only
- NEVER use Playwright, Cypress, or browser testing agents
- NEVER let agents create or alter database tables
- NEVER proceed without test-plan.md
- NEVER spawn agents without injecting vitest best practices context
- NEVER generate tests without checking existing test patterns first
- NEVER skip the shared test utils generation step

---

## Checklist

- [ ] Scope obtained (from arguments or AskUserQuestion)
- [ ] test-plan.md read and parsed
- [ ] references/vitest-best-practices.md read
- [ ] backend-plan.md read (if exists)
- [ ] Existing test infrastructure checked (vitest.config, setup files, existing tests)
- [ ] Test files planned with output paths
- [ ] Shared test utils generated (if needed)
- [ ] ALL feature test agents spawned in parallel
- [ ] Agent results collected
- [ ] Generated files verified
- [ ] Results reported with run commands
