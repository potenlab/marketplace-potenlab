---
name: plan-project
description: "Orchestrates sequential project planning. First validates user intent via AskUserQuestion (MANDATORY), then spawns ui-ux-specialist to create ui-ux-plan.md, then tech-lead-specialist to create dev-plan.md from ui-ux-plan.md, then spawns frontend-specialist and backend-specialist in parallel to create their detailed plans from dev-plan.md, then spawns qa-specialist to create test-plan.md from dev-plan.md and backend-plan.md. Triggers on: plan, create plan, plan project, project plan, full plan, prd to plan."
user-invocable: true
---

# Plan Skill

Orchestrate a complete project planning workflow with sequential agent handoff and parallel specialist execution.

---

## Orchestration Flow

```
/plan
  |
  v
+----------------------------------------------------------+
|  STEP 1: AskUserQuestion (MANDATORY)                     |
|  - Validate user intent                                   |
|  - Locate PRD / gather project description                |
|  - Clarify scope, tech stack, priorities                  |
+----------------------------------------------------------+
  |
  v
+----------------------------------------------------------+
|  STEP 2: Ensure /docs directory                           |
+----------------------------------------------------------+
  |
  v
+----------------------------------------------------------+
|  STEP 3: ui-ux-specialist (SEQUENTIAL)                   |
|  - Reads PRD                                              |
|  - Writes: docs/ui-ux-plan.md                            |
+----------------------------------------------------------+
  |
  v
+----------------------------------------------------------+
|  STEP 4: tech-lead-specialist (SEQUENTIAL)               |
|  - Reads: docs/ui-ux-plan.md                             |
|  - Writes: docs/dev-plan.md                              |
+----------------------------------------------------------+
  |
  v
+----------------------------------------------------------+
|  STEP 5: PARALLEL — frontend + backend specialists       |
|                                                           |
|  frontend-specialist ──Read──> docs/dev-plan.md           |
|                      ──Write─> docs/frontend-plan.md      |
|                                                           |
|  backend-specialist  ──Read──> docs/dev-plan.md           |
|                      ──Write─> docs/backend-plan.md       |
+----------------------------------------------------------+
  |
  v
+----------------------------------------------------------+
|  STEP 6: qa-specialist (SEQUENTIAL)                      |
|  - Reads: docs/dev-plan.md + docs/backend-plan.md        |
|  - Writes: docs/test-plan.md                             |
+----------------------------------------------------------+
  |
  v
+----------------------------------------------------------+
|  STEP 7: Report completion with file summary              |
+----------------------------------------------------------+
```

---

## Step 1: Validate User Intent (MANDATORY)

**You MUST use AskUserQuestion before spawning any agents. Never skip this step.**

### 1.1 Locate PRD

Search for the PRD file first:

```
Glob: **/prd.md
Glob: **/PRD.md
Glob: docs/prd.md
```

### 1.2 Ask User — Project Scope

**ALWAYS ask this question regardless of PRD existence.**

```
AskUserQuestion:
  question: "What would you like to plan? Please confirm the scope."
  header: "Plan Scope"
  options:
    - label: "Full project from PRD"
      description: "Plan the entire project from the PRD file"
    - label: "Specific feature only"
      description: "Plan a single feature or module"
    - label: "I'll describe it now"
      description: "No PRD — I'll describe what to plan"
```

### 1.3 Ask User — PRD Location (if not found automatically)

```
AskUserQuestion:
  question: "Where is your PRD file located?"
  header: "PRD Path"
  options:
    - label: "docs/prd.md (Recommended)"
      description: "Standard location in docs folder"
    - label: "prd.md (root)"
      description: "In the project root directory"
    - label: "I'll provide the path"
      description: "Enter a custom file path"
```

### 1.4 Ask User — UI/UX Priority

```
AskUserQuestion:
  question: "What is the UI/UX priority for this project?"
  header: "UI Priority"
  options:
    - label: "Speed to market (Recommended)"
      description: "Use shadcn defaults, minimal customization"
    - label: "Custom brand design"
      description: "Detailed design system, unique visual identity"
    - label: "Accessibility first"
      description: "WCAG AAA compliance, inclusive design"
```

### 1.5 Ask User — Tech Stack (if not specified in PRD)

```
AskUserQuestion:
  question: "What tech stack should we use?"
  header: "Tech Stack"
  options:
    - label: "Next.js + Supabase (Recommended)"
      description: "Full-stack React with Postgres backend"
    - label: "React + Express + PostgreSQL"
      description: "Traditional stack with Node backend"
    - label: "Already specified in PRD"
      description: "Use what's defined in the PRD"
```

### Question Rules

- **MANDATORY:** You MUST ask at least the Plan Scope question (1.2) before proceeding
- Ask a maximum of **5 questions total**
- Skip questions that are already answered in the PRD
- Track: `questionsAsked` (start at 0, stop at 5)
- Do NOT proceed to Step 2 until user has answered

---

## Step 2: Ensure /docs Directory

Before spawning agents, ensure the output directory exists:

```
Bash: mkdir -p docs
```

---

## Step 3: Spawn ui-ux-specialist (SEQUENTIAL)

**This agent runs FIRST, alone. It creates the design foundation that all other plans depend on.**

```
Task:
  subagent_type: ui-ux-specialist
  description: "Create UI/UX plan"
  prompt: |
    Read the PRD at: {prd_path}

    User preferences:
    - UI Priority: {ui_priority from Step 1.4}
    - Tech Stack: {tech_stack from Step 1.5}
    - Scope: {scope from Step 1.2}

    Write your complete ui-ux-plan.md to: docs/ui-ux-plan.md

    Include:
    - User research and personas
    - Information architecture
    - User flows
    - Design system (colors, typography, spacing)
    - Component library specifications
    - Wireframes for all key pages
    - Accessibility checklist (WCAG 2.1 AA minimum)
    - Micro-interactions and animation guidelines
    - Implementation guidelines for developer handoff

    Write the file using the Write tool. Return "Done: docs/ui-ux-plan.md" when complete.
```

**Wait for this agent to complete before proceeding to Step 4.**

After the agent completes, verify the file was created:

```
Glob: docs/ui-ux-plan.md
```

If the file does not exist, report the error and stop. Do NOT proceed.

---

## Step 4: Spawn tech-lead-specialist (SEQUENTIAL)

**This agent runs SECOND. It reads ui-ux-plan.md and creates the single source of truth dev-plan.md.**

```
Task:
  subagent_type: tech-lead-specialist
  description: "Create dev plan from UI/UX"
  prompt: |
    Read the UI/UX plan at: docs/ui-ux-plan.md
    Also read the PRD at: {prd_path}

    Create dev-plan.md as the SINGLE SOURCE OF TRUTH for this project.

    Translate the design decisions, wireframes, component specs, and accessibility
    requirements from ui-ux-plan.md into a minimal, phased development checklist.

    Phases:
    - Phase 0: Foundation (project setup, design tokens)
    - Phase 1: Backend (schema, API, RLS)
    - Phase 2: Shared UI (src/components/)
    - Phase 3: Features (src/features/)
    - Phase 4: Integration (routing, API wiring)
    - Phase 5: Polish (a11y, animations)

    Every task must have:
    - Output: file paths or artifacts
    - Behavior: how it works
    - Verify: concrete check steps

    Write the file to: docs/dev-plan.md
    Do NOT create progress.json — that is handled separately.

    Write the file using the Write tool. Return "Done: docs/dev-plan.md" when complete.
```

**Wait for this agent to complete before proceeding to Step 5.**

After the agent completes, verify the file was created:

```
Glob: docs/dev-plan.md
```

If the file does not exist, report the error and stop. Do NOT proceed.

---

## Step 5: Spawn frontend-specialist + backend-specialist (PARALLEL)

**These two agents run IN PARALLEL. Both read dev-plan.md and write their own specialist plans.**

**CRITICAL: Spawn both agents in a SINGLE message with two Task tool calls.**

```
[Single message with 2 Task tool calls]

Task 1: frontend-specialist
  subagent_type: frontend-specialist
  description: "Create frontend plan"
  prompt: |
    Read the dev plan at: docs/dev-plan.md
    Also read the UI/UX plan at: docs/ui-ux-plan.md for design context.

    Create frontend-plan.md with detailed component specifications:
    - Exact file paths following Bulletproof React structure
    - TypeScript interfaces and props for every component
    - shadcn component discovery and mapping
    - Business components (features/) vs styled components (components/) separation
    - Data fetching hooks with React Query
    - State management approach
    - Performance checklist (Vercel React best practices)
    - Accessibility checklist
    - Component index table

    Write the file to: docs/frontend-plan.md
    Write the file using the Write tool. Return "Done: docs/frontend-plan.md" when complete.

Task 2: backend-specialist
  subagent_type: backend-specialist
  description: "Create backend plan"
  prompt: |
    Read the dev plan at: docs/dev-plan.md
    Also read the UI/UX plan at: docs/ui-ux-plan.md for user flow context.

    Create backend-plan.md with detailed backend specifications:
    - Table definitions with columns, types, constraints, defaults
    - Migration SQL (copy-paste ready)
    - RLS policies with concrete SQL
    - Index specifications (especially FK indexes)
    - Query specifications for each frontend feature
    - Connection strategy (pooling, timeouts)
    - Schema diagram
    - Migration execution order
    - Anti-patterns to avoid

    Write the file to: docs/backend-plan.md
    Write the file using the Write tool. Return "Done: docs/backend-plan.md" when complete.
```

**Wait for BOTH agents to complete before proceeding to Step 6.**

After both agents complete, verify the files were created:

```
Glob: docs/frontend-plan.md
Glob: docs/backend-plan.md
```

If either file does not exist, report which failed. The other's output is still valid. Proceed to Step 6 regardless — qa-specialist only requires dev-plan.md (backend-plan.md is optional enrichment).

---

## Step 6: Spawn qa-specialist (SEQUENTIAL) — Generate Test Plan

**This agent reads dev-plan.md and backend-plan.md to create a comprehensive test plan that maps every feature to testable scenarios.**

```
Task:
  subagent_type: qa-specialist
  description: "Create test plan"
  prompt: |
    You are generating a TEST PLAN document — NOT test code.

    Read these files first (MANDATORY):
    - docs/dev-plan.md (single source of truth — all phases and tasks)
    - docs/backend-plan.md (schema, RLS policies, constraints, queries)

    Also read if available:
    - docs/frontend-plan.md (component specs, data fetching patterns)

    Create docs/test-plan.md with the following structure:

    # Test Plan

    ## Overview
    - Project name and description (from dev-plan.md)
    - Testing approach: behavior-driven, Vitest + Supabase local
    - No UI/browser testing — database behavior only

    ## Test Infrastructure
    - Vitest configuration requirements
    - Supabase local setup (http://127.0.0.1:54321)
    - Shared test utilities needed (admin client, auth helpers)
    - Environment variables (SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

    ## Phase-by-Phase Test Scenarios

    For EACH phase in dev-plan.md that has backend/data tasks, create a section:

    ### Phase {N}: {name}

    For each feature/task with database interaction:

    #### {feature_name}
    - **Tables involved:** (from backend-plan.md)
    - **RLS policies:** (from backend-plan.md — list each policy)
    - **Test file:** tests/features/{name}/{name}.test.ts

    **CRUD Tests:**
    - [ ] Create with valid data → verify inserted
    - [ ] Create with missing required fields → expect error
    - [ ] Read own data → verify returned
    - [ ] Update own data → verify changed
    - [ ] Delete own data → verify removed

    **RLS Policy Tests:**
    - [ ] Owner can SELECT own rows
    - [ ] Other user CANNOT SELECT owner's rows
    - [ ] Owner can INSERT with own user_id
    - [ ] Owner CANNOT INSERT with other's user_id
    - [ ] Owner can UPDATE own rows
    - [ ] Other user CANNOT UPDATE owner's rows
    - [ ] Owner can DELETE own rows
    - [ ] Other user CANNOT DELETE owner's rows
    - [ ] Anon access (if applicable per policy)

    **Constraint Tests:**
    - [ ] NOT NULL violations for each required column
    - [ ] UNIQUE constraint violations (if applicable)
    - [ ] CHECK constraint violations (if applicable)
    - [ ] FK constraint violations (if applicable)

    **Edge Cases:**
    - [ ] Empty string inputs
    - [ ] Very long strings (boundary values)
    - [ ] Concurrent operations (if applicable)

    ## Test Priority Matrix

    | Feature | CRUD | RLS | Constraints | Edge Cases | Priority |
    |---------|------|-----|-------------|------------|----------|
    | {name}  | {count} | {count} | {count} | {count} | Critical/High/Medium |

    ## Summary
    - Total features to test
    - Total test scenarios
    - Estimated test files to generate

    ---

    IMPORTANT:
    - This is a PLAN document, not test code. Write markdown, not TypeScript.
    - Map every RLS policy from backend-plan.md to specific test scenarios.
    - Map every constraint from backend-plan.md to specific test scenarios.
    - Include ALL phases that have database/API tasks.
    - Skip purely frontend tasks (CSS, layout, design tokens) — they don't need behavior tests.
    - Each scenario should be a concrete, verifiable checkbox item.

    Write the file to: docs/test-plan.md
    Write the file using the Write tool. Return "Done: docs/test-plan.md" when complete.
```

**Wait for this agent to complete before proceeding to Step 7.**

After the agent completes, verify the file was created:

```
Glob: docs/test-plan.md
```

If the file does not exist, report the error but proceed to Step 7 (the other plan files are still valid).

---

## Step 7: Report Completion

After all agents have completed, provide a summary:

```markdown
## Project Planning Complete

### Plans Created

| # | File | Agent | Description |
|---|------|-------|-------------|
| 1 | docs/ui-ux-plan.md | ui-ux-specialist | Design system, wireframes, user flows, accessibility |
| 2 | docs/dev-plan.md | tech-lead-specialist | Single source of truth — phased development checklist |
| 3 | docs/frontend-plan.md | frontend-specialist | Component specs, file paths, props, patterns |
| 4 | docs/backend-plan.md | backend-specialist | Schema, migrations, RLS policies, queries |
| 5 | docs/test-plan.md | qa-specialist | Test scenarios mapped to features, RLS, constraints |

### Execution Order

```
Step 1: User validation (AskUserQuestion)
Step 2: ui-ux-specialist         -> docs/ui-ux-plan.md
Step 3: tech-lead-specialist     -> docs/dev-plan.md (from ui-ux-plan.md)
Step 4: frontend-specialist      -> docs/frontend-plan.md  } PARALLEL
        backend-specialist       -> docs/backend-plan.md   } (from dev-plan.md)
Step 5: qa-specialist            -> docs/test-plan.md (from dev-plan.md + backend-plan.md)
```

### File Tree

```
docs/
├── prd.md               # Source requirements (input)
├── ui-ux-plan.md         # Design system and UX strategy
├── dev-plan.md           # Single source of truth (phased tasks)
├── frontend-plan.md      # Frontend implementation guide
├── backend-plan.md       # Backend implementation guide
└── test-plan.md          # Test scenarios for /generate-test
```

### Next Steps

1. Review `docs/dev-plan.md` for the full task breakdown
2. Review `docs/frontend-plan.md` and `docs/backend-plan.md` for implementation details
3. Review `docs/test-plan.md` for test coverage mapping
4. Use `/complete-plan` to generate progress.json
5. Use `/generate-test` to generate .test.ts files from test-plan.md
```

---

## Error Handling

### PRD Not Found
```
1. AskUserQuestion for the path
2. If still not found, ask user to create one
3. Do NOT proceed without a valid PRD or project description
```

### ui-ux-specialist Fails
```
1. Report the error
2. Do NOT proceed to tech-lead-specialist
3. Ask user to fix the issue and re-run /plan
```

### tech-lead-specialist Fails
```
1. Report the error
2. Do NOT proceed to frontend/backend specialists
3. Ask user to fix the issue and re-run
```

### frontend or backend Specialist Fails
```
1. Report which specialist failed
2. The other specialist's output is still valid
3. Proceed to qa-specialist (it only requires dev-plan.md; backend-plan.md is optional enrichment)
4. Ask user to re-run only the failed specialist later
```

### qa-specialist Fails
```
1. Report the error
2. All other plan files are still valid — proceed to report
3. User can manually create test-plan.md or re-run qa-specialist later
4. /generate-test will prompt for test-plan.md if missing
```

---

## Token Optimization

**File-based handoff — agents WRITE files, downstream agents READ files.**

```
CORRECT:
  ui-ux-specialist   ──Write──> docs/ui-ux-plan.md
  tech-lead          ──Read───> docs/ui-ux-plan.md
  tech-lead          ──Write──> docs/dev-plan.md
  frontend/backend   ──Read───> docs/dev-plan.md
  qa-specialist      ──Read───> docs/dev-plan.md + docs/backend-plan.md
  qa-specialist      ──Write──> docs/test-plan.md

WRONG:
  Agent A returns content → passed in Agent B prompt
```

**Rules:**
1. Each agent WRITES their plan to `docs/*.md` using the Write tool
2. Downstream agents READ those files using the Read tool
3. Prompts contain only file PATHS, never file CONTENT
4. Agents are independent — no content passed between them in prompts

---

## Execution Rules

### DO:
- ALWAYS ask at least one AskUserQuestion before spawning agents
- ALWAYS run ui-ux-specialist FIRST and ALONE
- ALWAYS wait for ui-ux-plan.md before spawning tech-lead
- ALWAYS wait for dev-plan.md before spawning frontend + backend
- ALWAYS spawn frontend + backend in PARALLEL (single message, two Task calls)
- ALWAYS wait for backend-plan.md before spawning qa-specialist
- ALWAYS verify output files exist after each agent completes
- ALWAYS ensure docs/ directory exists before any agent runs

### DO NOT:
- NEVER skip AskUserQuestion — user validation is mandatory
- NEVER spawn tech-lead before ui-ux-specialist completes
- NEVER spawn frontend/backend before tech-lead completes
- NEVER spawn qa-specialist before frontend/backend complete (needs backend-plan.md)
- NEVER pass file content in agent prompts — use file paths only
- NEVER proceed if a critical agent fails (ui-ux, tech-lead) — report and stop
- NEVER ask more than 5 questions total
- NEVER create files outside the docs/ directory

---

## Checklist

- [ ] AskUserQuestion called (at least Plan Scope question)
- [ ] User confirmed scope and preferences
- [ ] docs/ directory exists
- [ ] PRD located or project description captured
- [ ] ui-ux-specialist spawned and completed
- [ ] docs/ui-ux-plan.md exists
- [ ] tech-lead-specialist spawned and completed
- [ ] docs/dev-plan.md exists
- [ ] frontend-specialist + backend-specialist spawned in parallel
- [ ] docs/frontend-plan.md exists
- [ ] docs/backend-plan.md exists
- [ ] qa-specialist spawned and completed
- [ ] docs/test-plan.md exists
- [ ] Completion report shown to user
