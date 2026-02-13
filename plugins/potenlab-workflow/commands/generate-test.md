---
name: potenlab:generate-test
description: Generate Vitest test files from test-plan.md
argument-hint: "[scope]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Generate Vitest test files from `test-plan.md` by spawning potenlab-qa-specialist agents that produce behavior-driven tests against Supabase local.
</objective>

<execution_context>
Read and apply rules from @{{POTENLAB_HOME}}/CLAUDE.md before proceeding.
</execution_context>

<process>

## When to Use

Use `/potenlab:generate-test` when:
- You have a **test-plan.md** with test scenarios defined
- You want to generate **.test.ts** files for feature behavior, RLS policies, and constraints
- Tests should run against **Supabase local** (not UI, not browser)

---

## How It Works

```
/potenlab:generate-test [scope]
      |
      v
  STEP 1: Get scope (all, specific features, rls-only, crud-only)
      |
      v
  STEP 2: Read context (test-plan.md, vitest-best-practices.md, backend-plan.md, vitest.config.ts)
      |
      v
  STEP 3: Plan test file generation (group by feature/test category)
      |
      v
  STEP 4: Generate shared Supabase test utilities FIRST (if needed)
      |
      v
  STEP 5: Spawn potenlab-qa-specialist agents in PARALLEL (one per feature)
      |
      v
  STEP 6: Verify & report
```

---

## Step 1: Get Scope

### Option A: From arguments

```
/potenlab:generate-test all          → Generate tests for ALL features
/potenlab:generate-test auth         → Generate tests for auth feature only
/potenlab:generate-test rls          → Generate only RLS policy tests
```

Extract scope directly. **Do NOT ask questions.**

### Option B: No argument

Use AskUserQuestion. Maximum **2 questions**.

---

## Step 2: Read Context (MANDATORY)

1. **test-plan.md** (primary input) — REQUIRED, STOP if missing
2. **references/vitest-best-practices.md** — testing rules
3. **backend-plan.md** — schema context
4. **vitest.config.ts** — existing config
5. **Existing .test.ts files** — patterns and conventions

---

## Step 3: Plan Test File Generation

Parse test-plan.md and group by feature. For each feature, identify test categories:
- **CRUD** — insert, select, update, delete
- **RLS** — access control per role (use `it.each`)
- **Constraints** — NOT NULL, UNIQUE, CHECK, FK violations
- **Edge Cases** — empty inputs, boundaries, concurrent ops

---

## Step 4: Generate Shared Test Utils First (if needed)

If `src/test-utils/supabase.ts` does NOT exist, spawn potenlab-qa-specialist to create it FIRST, then wait.

---

## Step 5: Spawn potenlab-qa-specialist Agents in PARALLEL

For EACH feature/test-group, spawn a potenlab-qa-specialist agent:

```
Task:
  subagent_type: potenlab-qa-specialist
  description: "Tests: {feature_name}"
  prompt: |
    Generate Vitest tests for the "{feature_name}" feature.

    Read ALL context first (MANDATORY):
    1. references/vitest-best-practices.md
    2. [path to test-plan.md] — find "{feature_name}" section
    3. [path to backend-plan.md] — tables, RLS, constraints
    4. src/test-utils/supabase.ts — shared helpers

    Write to: {output_path}

    Generate ALL applicable categories:
    1. CRUD Operations
    2. RLS Policies (use it.each for roles)
    3. Constraint Enforcement
    4. Edge Cases

    Rules: AAA pattern, strict assertions (never toBeTruthy), it.each for RLS,
    clean up in afterAll, no UI tests, no table creation.

    When done: "COMPLETED: {feature_name} | File: {output_path} | Tests: {count}"
```

**Spawn ALL feature agents in a SINGLE message.**

---

## Step 6: Verify & Report

List generated files, test counts by category, and suggest running `npx vitest run`.

---

## Execution Rules

### DO:
- ALWAYS read test-plan.md before spawning agents
- ALWAYS generate shared test utils FIRST if missing
- ALWAYS spawn feature test agents in a SINGLE parallel message
- ALWAYS use potenlab-qa-specialist as the agent type

### DO NOT:
- NEVER generate UI component tests
- NEVER let agents create or alter database tables
- NEVER proceed without test-plan.md

</process>
