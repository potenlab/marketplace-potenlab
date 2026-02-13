---
name: potenlab:execute-phase
description: Execute all tasks in a phase with parallel coder agents
argument-hint: "<phase-number>"
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
Execute all pending tasks in a specific development phase by spawning the right coder agents (potenlab-small-coder / potenlab-high-coder) in parallel based on progress.json complexity classification.
</objective>

<execution_context>
Read and apply rules from @{{POTENLAB_HOME}}/CLAUDE.md before proceeding.
</execution_context>

<process>

## How It Works

```
/potenlab:execute-phase [phase_number]
      |
      v
  STEP 1: Get phase number (from arg or AskUserQuestion)
      |
      v
  STEP 2: Read progress.json, filter executable tasks
      |
      v
  STEP 3: Group tasks by complexity (low → potenlab-small-coder, high → potenlab-high-coder)
      |
      v
  STEP 4: Spawn ALL agents in PARALLEL (one per task)
      |
      v
  STEP 5: Update progress.json with results
      |
      v
  STEP 6: Report results
```

---

## Step 1: Get Phase Number

### Option A: From arguments

If the user provides a phase number:
```
/potenlab:execute-phase 0
/potenlab:execute-phase 3
```

Extract the phase number directly. **Do NOT ask questions — proceed to Step 2.**

### Option B: No argument provided

If the user invokes with no argument, you MUST use AskUserQuestion:

```
AskUserQuestion:
  question: "Which phase would you like to execute?"
  header: "Phase"
  options:
    - label: "Phase 0: Foundation"
      description: "Project setup, design tokens, config files"
    - label: "Phase 1: Backend"
      description: "Database schema, migrations, RLS policies"
    - label: "Phase 2: Shared UI"
      description: "Shared components in src/components/"
    - label: "Phase 3: Features"
      description: "Feature modules in src/features/"
```

Read progress.json first to determine which phases exist, then build the options dynamically.

---

## Step 2: Read progress.json and Analyze Phase

### 2.1 Locate and read progress.json

```
Glob: **/progress.json
Read: [found path]
```

**If progress.json does NOT exist:**
> `progress.json` not found. Run `/potenlab:complete-plan` first to generate the task tracker.

**STOP. Do NOT proceed.**

### 2.2 Find the target phase

Parse progress.json and locate the phase object matching the requested phase number.

### 2.3 Filter executable tasks

From the target phase, collect tasks that meet ALL criteria:

```
executable_tasks = phase.tasks.filter(task =>
  task.status === "pending" AND
  task.blocked_by.length === 0
)
```

---

## Step 3: Group Tasks by Agent Type

Split `executable_tasks` into two groups based on progress.json classification:

```
small_tasks = executable_tasks.filter(t => t.complexity === "low")
  → Each spawns a potenlab-small-coder agent

high_tasks = executable_tasks.filter(t => t.complexity === "high")
  → Each spawns a potenlab-high-coder agent
```

Report the execution plan before spawning.

---

## Step 4: Spawn ALL Agents in PARALLEL

**CRITICAL: Spawn ALL agents in a SINGLE message with multiple Task tool calls.**

Every task gets its own agent. Multiple potenlab-small-coders and multiple potenlab-high-coders run simultaneously.

### Agent Prompt Template — potenlab-small-coder

For EACH task where `complexity === "low"`:

```
Task:
  subagent_type: potenlab-small-coder
  description: "Task {task.id}: {task.name}"
  prompt: |
    Execute task {task.id}: {task.name}

    Read ALL plan files first (MANDATORY):
    - docs/dev-plan.md (single source of truth — find task {task.id})
    - docs/frontend-plan.md (component specs if frontend task)
    - docs/backend-plan.md (schema specs if backend task)
    - docs/ui-ux-plan.md (design context)
    - docs/progress.json (task details and dependencies)

    Task details from progress.json:
    - ID: {task.id}
    - Name: {task.name}
    - Domain: {task.domain}
    - Output files: {task.output}
    - Verify steps: {task.verify}
    - Notes: {task.notes}

    Instructions:
    1. Read ALL plans to understand full project context
    2. Find task {task.id} in dev-plan.md for Output, Behavior, Verify details
    3. Check the specialist plan for detailed specs
    4. Check existing code to understand what already exists
    5. Implement the task — write clean, minimal code
    6. Verify against the Verify steps from dev-plan.md

    IMPORTANT:
    - This is a SMALL task (1-2 files). If it seems bigger, report back and do NOT implement.
    - Do NOT update progress.json — the orchestrator handles that.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list]"
    If blocked or too large, return: "BLOCKED: {task.id} — {reason}"
```

### Agent Prompt Template — potenlab-high-coder

For EACH task where `complexity === "high"`:

```
Task:
  subagent_type: potenlab-high-coder
  description: "Task {task.id}: {task.name}"
  prompt: |
    Execute task {task.id}: {task.name}

    Read ALL plan files first (MANDATORY):
    - docs/dev-plan.md (single source of truth — find task {task.id})
    - docs/frontend-plan.md (component specs if frontend task)
    - docs/backend-plan.md (schema specs if backend task)
    - docs/ui-ux-plan.md (design context)
    - docs/progress.json (task details and dependencies)

    Task details from progress.json:
    - ID: {task.id}
    - Name: {task.name}
    - Domain: {task.domain}
    - Estimated files: {task.estimated_files}
    - Output files: {task.output}
    - Verify steps: {task.verify}
    - Notes: {task.notes}

    Instructions:
    1. Read ALL plans to understand full project context
    2. Find task {task.id} in dev-plan.md for Output, Behavior, Verify details
    3. Check the specialist plan for detailed specs
    4. Check existing code to understand what already exists
    5. Plan the implementation order: Types → API → Logic → Components → Integration
    6. Implement all files for this task
    7. Self-review: check types, imports, circular deps, cross-feature leaks
    8. Verify against the Verify steps from dev-plan.md

    IMPORTANT:
    - This is a COMPLEX task (3+ files, cross-file coordination). Take your time.
    - Do NOT update progress.json — the orchestrator handles that.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list]"
    If blocked, return: "BLOCKED: {task.id} — {reason}"
```

**Wait for ALL agents to complete before proceeding to Step 5.**

---

## Step 5: Update progress.json

After all agents complete, update progress.json:

1. Mark completed tasks as `"completed"`
2. Mark blocked tasks as `"blocked"` with reason in notes
3. Remove completed task IDs from ALL `blocked_by` arrays across ALL phases
4. Update phase progress count
5. Recalculate summary counts
6. Write updated progress.json

---

## Step 6: Report Results

Report with a table of results per task, summary counts, phase progress, newly unblocked tasks, and next steps.

---

## Execution Rules

### DO:
- ALWAYS read progress.json before spawning any agents
- ALWAYS check `blocked_by` is empty before including a task
- ALWAYS spawn ALL executable tasks in ONE message (maximum parallelism)
- ALWAYS use potenlab-small-coder for `complexity: "low"` and potenlab-high-coder for `complexity: "high"`
- ALWAYS update progress.json after all agents complete
- ALWAYS remove completed task IDs from blocked_by arrays across ALL phases

### DO NOT:
- NEVER execute tasks where `blocked_by` is non-empty
- NEVER execute tasks where `status` is already `"completed"`
- NEVER spawn a potenlab-high-coder for a low-complexity task
- NEVER spawn a potenlab-small-coder for a high-complexity task
- NEVER let agents update progress.json — only the orchestrator does that
- NEVER proceed without progress.json

</process>
