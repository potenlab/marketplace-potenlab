---
name: verify-test
description: "Verifies and updates tests after code changes. Detects what changed (git diff, changes.json), compares against test-plan.md, then spawns qa-specialist agents to update test-plan.md and edit/create test files in /features, /tests, /supabase. Use after /developer or manual changes to keep tests in sync. Triggers on: verify test, verify tests, sync tests, update tests, check tests, test verify."
user-invocable: true
---

# Verify Test Skill

Detect code changes, compare against `test-plan.md`, and update both the test plan and test files to stay in sync.

---

## When to Use

Use `/verify-test` when:
- You just ran `/developer` and made changes to features
- You manually edited source code and need tests updated
- You want to ensure `test-plan.md` reflects current behavior
- You need to keep test files in sync with changed source code

Do NOT use when:
- You want to generate tests from scratch → use `/generate-test`
- You want to run existing tests → use `/run-test-all` or `/run-test-phase`
- No changes have been made since last test generation

---

## How It Works

```
/verify-test [scope]
      |
      v
+----------------------------------------------------------+
|  STEP 1: Detect changes                                   |
|  - Read changes.json (if exists)                          |
|  - Run git diff for modified files                        |
|  - Identify affected features                             |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Read context                                     |
|  - test-plan.md (current test scenarios)                  |
|  - vitest-best-practices.md (testing rules)               |
|  - backend-plan.md (schema, RLS context)                  |
|  - Existing test files for affected features              |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: Analyze divergence                               |
|  - Compare changed source vs test-plan.md                 |
|  - Identify: new behavior, removed behavior, changed      |
|    behavior, new features without tests                   |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 4: Update test-plan.md                              |
|  - Add new scenarios for new behavior                     |
|  - Update existing scenarios for changed behavior         |
|  - Mark removed scenarios as deprecated                   |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 5: Spawn qa-specialist agents in PARALLEL           |
|  - One agent per affected feature                         |
|  - Each agent EDITS existing test files                   |
|  - Creates NEW test files only for new features           |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 6: Report changes                                   |
|  - List all modified test files                           |
|  - List all test-plan.md updates                          |
|  - Suggest running /run-test-all to validate              |
+----------------------------------------------------------+
```

---

## Step 1: Detect Changes

### 1.1 Read changes.json (if exists)

```
Glob: **/changes.json
Read: [found path]
```

Extract from changes.json:
- **Recent batches** — look at batches with `status: "completed"` or `"in_progress"`
- **Affected files** — collect all `affected_files` and `output` arrays
- **Change types** — `bug_fix`, `enhancement`, `refactor`, `new_feature`

### 1.2 Run git diff

```bash
git diff --name-only HEAD~5
```

Collect modified files. Filter to source files only:
- `src/features/**/*.ts` / `*.tsx`
- `supabase/**/*.sql`
- `src/lib/**/*.ts`

Ignore test files themselves — we are updating those, not reading changes from them.

### 1.3 Identify affected features

Map changed files to features:

```
src/features/auth/api/auth-queries.ts  → feature: auth
src/features/orders/types/order.ts     → feature: orders
supabase/migrations/20240101_add_col.sql → feature: (parse from migration)
```

Build `{affected_features}` list.

### 1.4 Accept scope override

If the user provides a scope:
```
/verify-test auth        → Only verify auth feature tests
/verify-test all         → Verify all features (re-scan everything)
```

Extract scope directly. **Do NOT ask questions — proceed to Step 2.**

### 1.5 No argument and no changes.json

If no argument provided AND no changes.json exists, use git diff:

```bash
git diff --name-only HEAD~5
```

If git diff also shows no changes:
> No changes detected. Nothing to verify.
> Make changes first with `/developer`, or specify a feature: `/verify-test auth`

**STOP.**

If git diff shows changes, use those as the affected files.

### 1.6 Report detected changes

```markdown
### Detected Changes

| Source | Files Changed |
|--------|--------------|
| changes.json | {count} files across {batch_count} batches |
| git diff | {count} modified files |
| **Affected Features** | **{feature_list}** |
```

---

## Step 2: Read Context (MANDATORY)

### 2.1 Read test-plan.md

```
Glob: **/test-plan.md OR **/test.plan.md
Read: [found path]
```

Extract current test scenarios for the affected features.

**If test-plan.md does NOT exist:**
> `test-plan.md` not found. Cannot compare changes. Use `/generate-test` to create tests from scratch.

**STOP. Do NOT proceed.**

### 2.2 Read vitest best practices

```
Read: references/vitest-best-practices.md
```

### 2.3 Read backend context

```
Glob: **/backend-plan.md
Read: [found path]
```

### 2.4 Read changed source files

For each file in `{affected_files}`, read the current version:

```
Read: src/features/{feature}/api/{file}.ts
Read: src/features/{feature}/types/{file}.ts
Read: src/features/{feature}/hooks/{file}.ts
```

### 2.5 Read existing test files for affected features

```
Glob: src/features/{feature}/**/*.test.ts
Glob: src/tests/**/{feature}*.test.ts
Glob: src/tests/rls/{feature}*.test.ts
Glob: src/tests/constraints/{feature}*.test.ts
Glob: supabase/**/{feature}*.test.ts
```

Read each existing test file to understand current test coverage.

---

## Step 3: Analyze Divergence

Compare the changed source code against test-plan.md to identify:

### 3.1 Change categories

| Category | Description | Action |
|----------|-------------|--------|
| **New behavior** | New functions, endpoints, or columns added | Add scenarios to test-plan.md + generate new tests |
| **Changed behavior** | Existing logic modified (different validation, new fields) | Update scenarios in test-plan.md + edit existing tests |
| **Removed behavior** | Functions or fields deleted | Mark as deprecated in test-plan.md + remove related tests |
| **Schema changes** | New columns, changed constraints, new RLS policies | Update constraint/RLS tests |
| **New feature** | Entirely new feature directory added | Add new section to test-plan.md + generate full test suite |

### 3.2 Build change manifest

For each affected feature, create a change manifest:

```
Feature: auth
Changes:
  - ADDED: password reset function (src/features/auth/api/auth-queries.ts:45)
  - CHANGED: login validation now checks email format (src/features/auth/api/auth-queries.ts:12)
  - SCHEMA: added reset_token column to profiles (supabase/migrations/...)
Test Impact:
  - NEW: test password reset CRUD operations
  - UPDATE: update login test to include email format validation
  - NEW: test reset_token column constraints
```

---

## Step 4: Update test-plan.md

### 4.1 Determine test-plan.md edits

Based on the change manifest, determine what needs updating in test-plan.md:

- **New scenarios** → Add under the relevant feature/phase section
- **Changed scenarios** → Edit the existing scenario description and acceptance criteria
- **Removed scenarios** → Remove or mark as deprecated
- **New features** → Add an entirely new section

### 4.2 Edit test-plan.md

Use the Edit tool to make targeted changes to test-plan.md. **Do NOT rewrite the entire file.**

For each change:

```
Edit: [test-plan.md path]
  old_string: [existing scenario text]
  new_string: [updated scenario text]
```

For new scenarios, find the appropriate section and insert:

```
Edit: [test-plan.md path]
  old_string: [last scenario in the feature section]
  new_string: [last scenario + new scenarios appended]
```

### 4.3 Report test-plan.md updates

```markdown
### test-plan.md Updates

| Feature | Action | Scenarios |
|---------|--------|-----------|
| auth | Added | 3 new scenarios (password reset) |
| auth | Updated | 1 scenario (login validation) |
| orders | Removed | 1 deprecated scenario |
| **Total** | | **5 changes** |
```

---

## Step 5: Spawn QA Specialist Agents in PARALLEL

### 5.1 One agent per affected feature

For EACH affected feature, spawn a qa-specialist agent:

```
Task:
  subagent_type: qa-specialist
  description: "Verify tests: {feature_name}"
  prompt: |
    Update tests for the "{feature_name}" feature after code changes.

    === WHAT CHANGED ===

    {change_manifest for this feature}

    === CONTEXT — Read ALL of these first (MANDATORY) ===

    1. Read: references/vitest-best-practices.md
       Apply ALL rules: AAA pattern, strict assertions, parameterized tests.

    2. Read: [path to test-plan.md]
       Find the UPDATED "{feature_name}" section (just edited in Step 4).

    3. Read: [path to backend-plan.md]
       Find tables, RLS policies, and constraints for "{feature_name}".

    4. Read: src/test-utils/supabase.ts
       Use shared helpers: adminClient, createAuthClient, createTestUser, etc.

    5. Read the CHANGED source files:
       {list of changed source files for this feature}

    6. Read the EXISTING test files:
       {list of existing test files for this feature}

    === YOUR TASK ===

    Based on the change manifest above:

    **For CHANGED behavior:**
    - EDIT existing test files using the Edit tool
    - Update assertions, test data, and expectations to match new behavior
    - Do NOT delete tests that are still valid

    **For NEW behavior:**
    - ADD new describe/it blocks to existing test files
    - If no existing test file covers the new behavior, create a new test file

    **For REMOVED behavior:**
    - REMOVE test cases that test deleted functionality
    - Clean up any orphaned setup/teardown code

    **For SCHEMA changes:**
    - Update constraint tests for new/changed columns
    - Update RLS tests if policies changed
    - Add new constraint tests for new constraints

    === OUTPUT PATHS ===

    Edit existing files:
    - src/features/{feature_name}/api/{feature_name}.test.ts
    - src/tests/rls/{feature_name}*.test.ts
    - src/tests/constraints/{feature_name}*.test.ts

    Create new files ONLY if needed:
    - src/features/{feature_name}/api/{new_area}.test.ts

    === RULES ===

    - PREFER editing existing test files over creating new ones
    - Use the Edit tool for surgical changes — do NOT rewrite entire files
    - Follow AAA pattern, strict assertions (never toBeTruthy)
    - Use it.each for parameterized RLS role tests
    - Clean up test data in afterAll
    - Do NOT create, alter, or drop tables
    - Do NOT modify source code — only test files

    === RESPONSE FORMAT ===

    When done, return:
    "COMPLETED: {feature_name}
    Files edited: [{list}]
    Files created: [{list}]
    Tests added: {count}
    Tests updated: {count}
    Tests removed: {count}"

    If blocked, return:
    "BLOCKED: {feature_name} — {reason}"
```

**Spawn ALL feature agents in a SINGLE message for maximum parallelism.**

### 5.2 If shared test utils need updating

If changes affect the database schema (new tables, new columns used in test helpers), spawn an additional agent FIRST:

```
Task:
  subagent_type: qa-specialist
  description: "Update shared test utilities"
  prompt: |
    Update src/test-utils/supabase.ts to support new schema changes.

    Changes detected:
    {schema_changes}

    Read: src/test-utils/supabase.ts
    Read: references/vitest-best-practices.md

    Edit the file to add any new helper functions needed.
    Do NOT remove existing helpers that are still in use.

    Return: "COMPLETED: test-utils | Changes: {description}"
```

**Wait for this to complete before spawning feature agents.**

---

## Step 6: Report Changes

```markdown
## Test Verification Complete

**Triggered by:** {source — changes.json batch C3 / git diff / manual}
**Affected features:** {feature_list}
**Timestamp:** {ISO timestamp}

### test-plan.md Changes

| Feature | Scenarios Added | Scenarios Updated | Scenarios Removed |
|---------|----------------|-------------------|-------------------|
| {feature} | {count} | {count} | {count} |
| **Total** | **{total}** | **{total}** | **{total}** |

### Test File Changes

| Feature | File | Action | Tests +/- |
|---------|------|--------|-----------|
| {feature} | {file path} | Edited | +{added} / -{removed} |
| {feature} | {file path} | Created | +{count} |
| {feature} | {file path} | Edited | ~{updated} |

### Summary

| Metric | Count |
|--------|-------|
| Features verified | {feature_count} |
| Test files edited | {edited_count} |
| Test files created | {created_count} |
| Tests added | {added_count} |
| Tests updated | {updated_count} |
| Tests removed | {removed_count} |
| Agents spawned | {agent_count} |

### Next Steps

1. Run tests for affected features: `/run-test-phase {phase}`
2. Run all tests: `/run-test-all`
3. Review test-plan.md changes: `Read docs/test-plan.md`
4. Make more changes: `/developer {request}`
5. Re-verify after fixes: `/verify-test`
```

---

## Error Handling

### test-plan.md not found
```
STOP. Tell user:
"test-plan.md not found. Cannot compare changes against test plan.
Use /generate-test to create tests from scratch."
```

### No changes detected
```
Tell user:
"No changes detected (no changes.json, no git diff).
Make changes first with /developer, or specify a feature: /verify-test auth"
STOP.
```

### No existing tests for affected feature
```
Warn but proceed:
"No existing tests found for {feature}. Will generate new tests instead of editing.
Consider running /generate-test {feature} for a full test suite."

Spawn qa-specialist in GENERATE mode (like /generate-test) for that feature only.
```

### Shared test utils missing
```
Warn and generate first:
"src/test-utils/supabase.ts not found. Generating shared utilities first."

Spawn qa-specialist to create test utils (same as /generate-test Step 4.1).
Wait for completion before spawning feature agents.
```

### Agent fails
```
1. Report which feature's test verification failed
2. Other agents' results are still valid
3. Suggest re-running: /verify-test {failed_feature}
```

### changes.json has no completed batches
```
Fall back to git diff.
If git diff also empty, STOP with "No changes detected."
```

---

## Execution Rules

### DO:
- ALWAYS detect changes before doing anything (changes.json + git diff)
- ALWAYS read test-plan.md and compare against changes
- ALWAYS update test-plan.md BEFORE spawning test-editing agents
- ALWAYS use the Edit tool for surgical changes — never rewrite entire files
- ALWAYS spawn one qa-specialist per affected feature in parallel
- ALWAYS prefer editing existing test files over creating new ones
- ALWAYS report what was added, updated, and removed
- ALWAYS suggest running tests after verification

### DO NOT:
- NEVER rewrite test-plan.md from scratch — make targeted edits
- NEVER rewrite entire test files — use Edit for specific changes
- NEVER modify source code — only test files and test-plan.md
- NEVER proceed without test-plan.md
- NEVER generate tests for features that were NOT changed
- NEVER delete tests that are still valid (unchanged behavior)
- NEVER skip the divergence analysis step
- NEVER ignore schema changes — they affect constraint and RLS tests

---

## Checklist

- [ ] Changes detected (changes.json and/or git diff)
- [ ] Affected features identified
- [ ] test-plan.md read and current scenarios extracted
- [ ] Changed source files read
- [ ] Existing test files for affected features read
- [ ] Divergence analyzed (new, changed, removed, schema)
- [ ] test-plan.md updated with targeted edits
- [ ] Shared test utils updated (if schema changed)
- [ ] QA specialist agents spawned in parallel (one per feature)
- [ ] Agent results collected
- [ ] Changes reported with file-level detail
- [ ] Next steps provided (run tests to validate)
