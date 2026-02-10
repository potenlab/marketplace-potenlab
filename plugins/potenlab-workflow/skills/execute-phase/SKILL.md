---
name: execute-phase
description: "Executes all tasks in a specific phase by spawning small-coder and high-coder agents in parallel based on progress.json complexity classification. Accepts phase number as argument (/execute-phase 3) or asks via AskUserQuestion. Spawns multiple agents simultaneously — one per task. Updates progress.json after completion. Triggers on: execute phase, run phase, build phase, develop phase, start phase."
user-invocable: true
---

# Execute Phase Skill

Execute all pending tasks in a specific development phase by spawning the right coder agents in parallel.

---

## How It Works

```
/execute-phase [phase_number]
      |
      v
+----------------------------------------------------------+
|  STEP 1: Get phase number                                 |
|  - From argument: /execute-phase 3                        |
|  - OR from AskUserQuestion if not provided                |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Read progress.json                               |
|  - Find the target phase                                  |
|  - Filter tasks: status === "pending"                     |
|  - Filter tasks: blocked_by is empty (not blocked)        |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: Group tasks by agent type                        |
|                                                           |
|  complexity: "low"  → small-coder (Sonnet — fast)         |
|  complexity: "high" → high-coder  (Opus — deep)           |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 4: Spawn ALL agents in PARALLEL                     |
|                                                           |
|  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       |
|  │ small-coder │  │ small-coder │  │ high-coder  │       |
|  │  Task 2.1   │  │  Task 2.3   │  │  Task 2.2   │       |
|  └─────────────┘  └─────────────┘  └─────────────┘       |
|                                                           |
|  One agent per task — all run simultaneously              |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 5: Update progress.json                             |
|  - Mark completed tasks as "completed"                    |
|  - Update phase progress ("3/5")                          |
|  - Recalculate summary counts                             |
|  - Remove completed IDs from blocked_by arrays            |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 6: Report results                                   |
+----------------------------------------------------------+
```

---

## Step 1: Get Phase Number

### Option A: From arguments

If the user provides a phase number:
```
/execute-phase 0
/execute-phase 3
/execute-phase 5
```

Extract the phase number directly. **Do NOT ask questions — proceed to Step 2.**

### Option B: No argument provided

If the user invokes with no argument (`/execute-phase`), you MUST use AskUserQuestion:

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

If the project has more phases (4, 5, etc.), include them. Read progress.json first to determine which phases exist, then build the options dynamically.

**If all tasks in the selected phase are already completed or blocked:**

```
AskUserQuestion:
  question: "All tasks in Phase {N} are {completed/blocked}. What would you like to do?"
  header: "Phase Status"
  options:
    - label: "Pick another phase"
      description: "Choose a different phase to execute"
    - label: "Re-run completed tasks"
      description: "Force re-execution of already completed tasks"
    - label: "Show blocked tasks"
      description: "See which tasks are blocked and why"
```

---

## Step 2: Read progress.json and Analyze Phase

### 2.1 Locate and read progress.json

```
Glob: **/progress.json
Read: [found path]
```

**If progress.json does NOT exist:**
> `progress.json` not found. Run `/complete-plan` first to generate the task tracker.

**STOP. Do NOT proceed.**

### 2.2 Find the target phase

Parse progress.json and locate the phase object matching the requested phase number.

**If the phase does NOT exist:**
> Phase {N} does not exist in progress.json. Available phases: {list phases}.

**STOP.**

### 2.3 Filter executable tasks

From the target phase, collect tasks that meet ALL criteria:

```
executable_tasks = phase.tasks.filter(task =>
  task.status === "pending" AND
  task.blocked_by.length === 0
)
```

**Categorize the results:**

| Scenario | Action |
|----------|--------|
| `executable_tasks` is empty, all tasks `completed` | Report "Phase {N} is already complete." STOP. |
| `executable_tasks` is empty, some tasks `blocked` | Report which tasks are blocked and by what. STOP. |
| `executable_tasks` has tasks | Proceed to Step 3. |

### 2.4 Report blocked tasks (if any)

If some tasks in the phase are blocked, list them:

```markdown
### Blocked Tasks (will not be executed)

| Task | Blocked By | Reason |
|------|------------|--------|
| {id} {name} | {blocked_by IDs} | Dependencies not yet completed |
```

These tasks will be skipped. Only unblocked pending tasks will be executed.

---

## Step 3: Group Tasks by Agent Type

Split `executable_tasks` into two groups based on progress.json classification:

```
small_tasks = executable_tasks.filter(t => t.complexity === "low")
  → Each spawns a small-coder agent

high_tasks = executable_tasks.filter(t => t.complexity === "high")
  → Each spawns a high-coder agent
```

### Report the execution plan before spawning:

```markdown
### Execution Plan — Phase {N}: {name}

| Task | Complexity | Agent | Files | Reason |
|------|-----------|-------|-------|--------|
| {id} {name} | low | small-coder | {estimated_files} | {complexity_reason} |
| {id} {name} | high | high-coder | {estimated_files} | {complexity_reason} |

**Total agents to spawn:** {count}
- small-coder: {small_count}
- high-coder: {high_count}
```

---

## Step 4: Spawn ALL Agents in PARALLEL

**CRITICAL: Spawn ALL agents in a SINGLE message with multiple Task tool calls.**

Every task gets its own agent. Multiple small-coders and multiple high-coders run simultaneously.

### Agent Prompt Template — small-coder

For EACH task where `complexity === "low"`:

```
Task:
  subagent_type: small-coder
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
    3. Check the specialist plan (frontend-plan.md or backend-plan.md) for detailed specs
    4. Check existing code to understand what already exists
    5. Implement the task — write clean, minimal code
    6. Verify against the Verify steps from dev-plan.md

    IMPORTANT:
    - This is a SMALL task (1-2 files). If it seems bigger, report back and do NOT implement.
    - Do NOT update progress.json — the orchestrator handles that.
    - Follow existing code patterns and project structure.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list of files created/modified]"
    If the task is blocked or too large, return: "BLOCKED: {task.id} — {reason}"
```

### Agent Prompt Template — high-coder

For EACH task where `complexity === "high"`:

```
Task:
  subagent_type: high-coder
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
    3. Check the specialist plan (frontend-plan.md or backend-plan.md) for detailed specs
    4. Check existing code to understand what already exists
    5. Plan the implementation order: Types → API → Logic → Components → Integration
    6. Implement all files for this task
    7. Self-review: check types, imports, circular deps, cross-feature leaks
    8. Verify against the Verify steps from dev-plan.md

    IMPORTANT:
    - This is a COMPLEX task (3+ files, cross-file coordination). Take your time.
    - Do NOT update progress.json — the orchestrator handles that.
    - Handle all states: loading, error, empty.
    - Follow Bulletproof React structure strictly.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list of files created/modified]"
    If the task is blocked or has issues, return: "BLOCKED: {task.id} — {reason}"
```

### Parallel Execution Example

For a phase with 5 tasks (3 low, 2 high), spawn 5 agents in ONE message:

```
[Single message with 5 Task tool calls]

Task 1: small-coder → Task 2.1 (design tokens)
Task 2: small-coder → Task 2.3 (button component)
Task 3: small-coder → Task 2.5 (input component)
Task 4: high-coder  → Task 2.2 (navigation system)
Task 5: high-coder  → Task 2.4 (form layout system)
```

**Wait for ALL agents to complete before proceeding to Step 5.**

---

## Step 5: Update progress.json

After all agents complete, update progress.json:

### 5.1 Read current progress.json

```
Read: docs/progress.json
```

### 5.2 Process agent results

For each agent that returned:

```
IF result starts with "COMPLETED:"
  → Set task.status = "completed"
  → Add to completed_tasks list

IF result starts with "BLOCKED:"
  → Set task.status = "blocked"
  → Add the reason to task.notes
  → Add to blocked_tasks list
```

### 5.3 Update blocked_by arrays

For every completed task ID, remove it from ALL `blocked_by` arrays across ALL phases:

```
for each completed_task_id:
  for each phase in progress.json:
    for each task in phase.tasks:
      task.blocked_by = task.blocked_by.filter(id => id !== completed_task_id)
```

### 5.4 Update phase progress

```
completed_count = phase.tasks.filter(t => t.status === "completed").length
total_count = phase.tasks.length
phase.progress = "{completed_count}/{total_count}"

if all tasks completed → phase.status = "completed"
if any task in_progress → phase.status = "in_progress"
if any task blocked and none in_progress → phase.status = "blocked"
```

### 5.5 Recalculate summary

```
summary.total = count of ALL tasks across ALL phases
summary.completed = count where status === "completed"
summary.in_progress = count where status === "in_progress"
summary.pending = count where status === "pending"
summary.blocked = count where status === "blocked"
```

### 5.6 Write updated progress.json

```
Write: docs/progress.json
```

---

## Step 6: Report Results

```markdown
## Phase {N}: {name} — Execution Complete

### Results

| Task | Agent | Status | Files |
|------|-------|--------|-------|
| {id} {name} | small-coder | Completed | {files list} |
| {id} {name} | high-coder | Completed | {files list} |
| {id} {name} | small-coder | Blocked | {reason} |

### Summary

| Metric | Count |
|--------|-------|
| Tasks executed | {count} |
| Completed | {completed_count} |
| Blocked | {blocked_count} |
| Agents spawned | {total_agents} |
| small-coder | {small_count} |
| high-coder | {high_count} |

### Phase Progress

```
Phase {N}: {completed}/{total} tasks complete
```

### progress.json Updated

- Completed tasks marked as "completed"
- blocked_by arrays updated across all phases
- Summary counts recalculated

### Newly Unblocked Tasks

| Task | Phase | Was Blocked By |
|------|-------|---------------|
| {id} {name} | {phase} | {previously blocked by completed tasks} |

### Next Steps

1. Review the implemented code for each completed task
2. Run `/execute-phase {next_phase}` to continue with the next phase
3. If any tasks were blocked, resolve dependencies and re-run this phase
```

---

## Error Handling

### progress.json not found
```
STOP. Tell user: "Run /complete-plan first to generate progress.json."
```

### Phase has no pending tasks
```
Report: "All tasks in Phase {N} are already completed or blocked."
Show task statuses. Suggest next phase or show blocked reasons.
```

### Agent fails (crashes, no response)
```
1. Mark that specific task as still "pending" (don't mark as completed)
2. Report which agent failed and for which task
3. Other agents' results are still valid — process them normally
4. Suggest re-running /execute-phase for the same phase to retry failed tasks
```

### Agent reports BLOCKED
```
1. Mark task as "blocked" in progress.json
2. Add the reason to task.notes
3. Report to user which task was blocked and why
4. Suggest resolving the blocker first
```

### All tasks in phase are blocked
```
Report which tasks are blocked and by which dependencies.
Show which phases/tasks need to complete first.
Suggest running the blocking phase first.
```

---

## Execution Rules

### DO:
- ALWAYS read progress.json before spawning any agents
- ALWAYS check `blocked_by` is empty before including a task
- ALWAYS spawn ALL executable tasks in ONE message (maximum parallelism)
- ALWAYS use small-coder for `complexity: "low"` and high-coder for `complexity: "high"`
- ALWAYS update progress.json after all agents complete
- ALWAYS remove completed task IDs from blocked_by arrays across ALL phases
- ALWAYS report newly unblocked tasks so the user knows what's available next
- ALWAYS ask for phase number via AskUserQuestion if not provided in arguments

### DO NOT:
- NEVER execute tasks where `blocked_by` is non-empty
- NEVER execute tasks where `status` is already `"completed"`
- NEVER spawn a high-coder for a low-complexity task (wastes resources)
- NEVER spawn a small-coder for a high-complexity task (will fail or produce poor results)
- NEVER let agents update progress.json — only the orchestrator does that
- NEVER proceed without progress.json
- NEVER skip reporting blocked tasks — the user needs to know
- NEVER assume a phase number — always get it from user arguments or AskUserQuestion

---

## Checklist

- [ ] Phase number obtained (from argument or AskUserQuestion)
- [ ] progress.json read and parsed
- [ ] Target phase found
- [ ] Tasks filtered: pending + not blocked
- [ ] Tasks grouped by complexity (low → small-coder, high → high-coder)
- [ ] Execution plan reported to user
- [ ] ALL agents spawned in a single parallel message
- [ ] All agent results collected
- [ ] progress.json updated (statuses, blocked_by, progress, summary)
- [ ] Results reported with newly unblocked tasks
