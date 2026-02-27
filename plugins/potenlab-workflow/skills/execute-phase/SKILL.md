---
name: execute-phase
description: "Executes all tasks in a specific phase using wave-based parallel execution (max 4 agents per wave). Spawns small-coder and high-coder agents based on progress.json complexity. Updates progress.json after EACH wave so completed tasks immediately unblock dependents. Accepts phase number as argument (/execute-phase 3) or asks via AskUserQuestion. Triggers on: execute phase, run phase, build phase, develop phase, start phase."
user-invocable: true
---

# Execute Phase Skill

Execute all pending tasks in a specific development phase using **wave-based parallel execution** (max 4 agents per wave).

---

## How It Works

```
/execute-phase [phase_number]
      |
      v
  STEP 1: Get phase number (from arg or AskUserQuestion)
      |
      v
  STEP 2: Read progress.json, filter executable tasks
      |
      v
  STEP 3: Group tasks by complexity → assign agent types → plan waves
      |
      v
  STEP 4: WAVE LOOP (max 4 agents per wave)
      |
      |   ┌───────────────────────────────────────────┐
      |   │  4a. Take next batch (up to 4 tasks)      │
      |   │  4b. Spawn agents in parallel (1 message)  │
      |   │  4c. Wait for all agents in wave           │
      |   │  4d. Update progress.json IMMEDIATELY      │
      |   │  4e. Re-filter: find newly unblocked tasks │
      |   │  4f. If more tasks → loop back to 4a       │
      |   └───────────────────────────────────────────┘
      |
      v
  STEP 5: Final report (all waves combined)
```

### Why Waves?

```
BEFORE (all at once):
  10 agents spawn → context limit reached → phase fails

AFTER (wave-based, max 4):
  Wave 1: [agent][agent][agent][agent] → update progress.json
  Wave 2: [agent][agent][agent]        → update progress.json (includes newly unblocked)
  Wave 3: [agent][agent][agent]        → update progress.json
  Done. All tasks completed across 3 manageable waves.
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

## Step 3: Group Tasks by Agent Type and Plan Waves

Split `executable_tasks` into two groups based on progress.json classification:

```
small_tasks = executable_tasks.filter(t => t.complexity === "low")
  → Each spawns a potenlab-small-coder agent

high_tasks = executable_tasks.filter(t => t.complexity === "high")
  → Each spawns a potenlab-high-coder agent
```

### Combine and chunk into waves of max 4:

```
all_executable = [...high_tasks, ...small_tasks]  // high-complexity first (longer running)
total_waves = Math.ceil(all_executable.length / 4)
```

### Report the execution plan before spawning:

```markdown
### Execution Plan — Phase {N}: {name}

| Task | Complexity | Agent | Files | Reason | Wave |
|------|-----------|-------|-------|--------|------|
| {id} {name} | high | potenlab-high-coder | {estimated_files} | {complexity_reason} | 1 |
| {id} {name} | low | potenlab-small-coder | {estimated_files} | {complexity_reason} | 1 |
| {id} {name} | low | potenlab-small-coder | {estimated_files} | {complexity_reason} | 1 |
| {id} {name} | low | potenlab-small-coder | {estimated_files} | {complexity_reason} | 1 |
| {id} {name} | low | potenlab-small-coder | {estimated_files} | {complexity_reason} | 2 |

**Total tasks:** {count} across {wave_count} wave(s)
**Max parallel agents per wave:** 4
- potenlab-small-coder: {small_count}
- potenlab-high-coder: {high_count}
```

---

## Step 4: Wave-Based Parallel Execution

**CRITICAL: Max 4 agents per wave. Update progress.json AFTER EACH wave. Re-filter between waves.**

### 4.0 Initialize wave tracking

```
all_wave_results = []       // accumulate results across all waves
wave_number = 0
```

### 4.1 Wave Loop

**Repeat the following until no more executable tasks remain:**

#### 4.1a — Filter executable tasks (re-read progress.json each iteration)

```
Read: docs/progress.json   // MUST re-read — previous wave may have changed it

executable_tasks = phase.tasks.filter(task =>
  task.status === "pending" AND
  task.blocked_by.length === 0
)

IF executable_tasks is empty → EXIT loop, go to Step 5
```

#### 4.1b — Take the next batch (max 4)

```
wave_number += 1
wave_batch = executable_tasks.slice(0, 4)   // take up to 4
```

#### 4.1c — Report wave start

```markdown
### Wave {wave_number} — Spawning {wave_batch.length} agent(s)

| Task | Agent |
|------|-------|
| {id} {name} | {agent_type} |
```

#### 4.1d — Spawn wave agents in PARALLEL (single message, max 4 Task calls)

Spawn all agents for THIS wave in ONE message with multiple Task tool calls:

**Agent Prompt Template — potenlab-small-coder**

For EACH task in wave where `complexity === "low"`:

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
    3. Check the specialist plan (frontend-plan.md or backend-plan.md) for detailed specs
    4. Check existing code to understand what already exists
    5. Implement the task — write clean, minimal code
    6. Verify against the Verify steps from dev-plan.md

    IMPORTANT:
    - This is a SMALL task (1-2 files). If it seems bigger, report back and do NOT implement.
    - Do NOT update progress.json — the orchestrator handles that after each wave.
    - Follow existing code patterns and project structure.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list of files created/modified]"
    If the task is blocked or too large, return: "BLOCKED: {task.id} — {reason}"
```

**Agent Prompt Template — potenlab-high-coder**

For EACH task in wave where `complexity === "high"`:

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
    3. Check the specialist plan (frontend-plan.md or backend-plan.md) for detailed specs
    4. Check existing code to understand what already exists
    5. Plan the implementation order: Types → API → Logic → Components → Integration
    6. Implement all files for this task
    7. Self-review: check types, imports, circular deps, cross-feature leaks
    8. Verify against the Verify steps from dev-plan.md

    IMPORTANT:
    - This is a COMPLEX task (3+ files, cross-file coordination). Take your time.
    - Do NOT update progress.json — the orchestrator handles that after each wave.
    - Handle all states: loading, error, empty.
    - Follow Bulletproof React structure strictly.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list of files created/modified]"
    If the task is blocked or has issues, return: "BLOCKED: {task.id} — {reason}"
```

**Example — spawning a wave of 4:**

```
[Single message with 4 Task tool calls]

Task 1: potenlab-high-coder  → Task 2.1 (navigation system)
Task 2: potenlab-small-coder → Task 2.2 (design tokens)
Task 3: potenlab-small-coder → Task 2.3 (button component)
Task 4: potenlab-small-coder → Task 2.4 (input component)
```

**Wait for ALL agents in this wave to complete before continuing.**

#### 4.1e — Update progress.json IMMEDIATELY after wave completes

**This is the key difference from the old approach.** After EACH wave:

1. **Read** current progress.json (fresh read)
2. **Process** agent results from this wave:
   ```
   IF result starts with "COMPLETED:"
     → Set task.status = "completed"

   IF result starts with "BLOCKED:"
     → Set task.status = "blocked"
     → Add reason to task.notes
   ```
3. **Remove** completed task IDs from ALL `blocked_by` arrays across ALL phases:
   ```
   for each completed_task_id in this wave:
     for each phase in progress.json:
       for each task in phase.tasks:
         task.blocked_by = task.blocked_by.filter(id => id !== completed_task_id)
   ```
4. **Update** phase progress count:
   ```
   completed_count = phase.tasks.filter(t => t.status === "completed").length
   phase.progress = "{completed_count}/{total_count}"

   if all tasks completed → phase.status = "completed"
   else → phase.status = "in_progress"
   ```
5. **Recalculate** summary counts:
   ```
   summary.total = count of ALL tasks across ALL phases
   summary.completed = count where status === "completed"
   summary.in_progress = count where status === "in_progress"
   summary.pending = count where status === "pending"
   summary.blocked = count where status === "blocked"
   ```
6. **Write** updated progress.json:
   ```
   Write: docs/progress.json
   ```

**WHY:** Updating after each wave means tasks completed in Wave 1 immediately unblock tasks for Wave 2. No waiting until the entire phase finishes.

#### 4.1f — Collect wave results and report wave completion

```
all_wave_results.push(...wave_results)
```

Report wave summary inline:
```markdown
Wave {N} complete: {completed}/{total} tasks succeeded. progress.json updated.
```

#### 4.1g — Loop back to 4.1a

Go back to step 4.1a to re-filter executable tasks. The progress.json update in 4.1e may have:
- Unblocked new tasks within this phase (dependencies resolved)
- Changed the set of executable tasks

**If no more executable tasks exist → exit the loop and proceed to Step 5.**

### Wave Execution Example

Phase has 10 tasks: 6 pending (unblocked), 4 blocked by others:

```
Wave 1 (4 agents):
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ high-coder  │  │ small-coder │  │ small-coder │  │ small-coder │
  │  Task 2.1   │  │  Task 2.2   │  │  Task 2.3   │  │  Task 2.4   │
  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
         └────────────────┴────────────────┴────────────────┘
                                   │
                      Update progress.json ← IMMEDIATE
                      (2.1, 2.2, 2.3, 2.4 now "completed")
                      (tasks blocked_by these IDs → unblocked)
                                   │
                                   v
Wave 2 (2 remaining + 2 newly unblocked = 4 agents):
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ small-coder │  │ high-coder  │  │ small-coder │  │ small-coder │
  │  Task 2.5   │  │  Task 2.6   │  │  Task 2.7*  │  │  Task 2.8*  │
  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
         └────────────────┴────────────────┴────────────────┘
                                   │                    * = was blocked,
                      Update progress.json    now unblocked by Wave 1
                                   │
                                   v
Wave 3 (2 remaining newly unblocked):
  ┌─────────────┐  ┌─────────────┐
  │ small-coder │  │ high-coder  │
  │  Task 2.9*  │  │  Task 2.10* │
  └──────┬──────┘  └──────┬──────┘
         └────────────────┘
                  │
     Update progress.json
                  │
                  v
       All tasks done → Step 5
```

---

## Step 5: Final Report (All Waves Combined)

After the wave loop exits (no more executable tasks), report combined results:

```markdown
## Phase {N}: {name} — Execution Complete

### Results by Wave

#### Wave 1
| Task | Agent | Status | Files |
|------|-------|--------|-------|
| {id} {name} | potenlab-small-coder | Completed | {files list} |
| {id} {name} | potenlab-high-coder | Completed | {files list} |

#### Wave 2
| Task | Agent | Status | Files |
|------|-------|--------|-------|
| {id} {name} | potenlab-small-coder | Completed | {files list} |
| {id} {name} | potenlab-small-coder | Blocked | {reason} |

### Summary

| Metric | Count |
|--------|-------|
| Total waves | {wave_count} |
| Total tasks executed | {count} |
| Completed | {completed_count} |
| Blocked | {blocked_count} |
| Total agents spawned | {total_agents} |
| potenlab-small-coder | {small_count} |
| potenlab-high-coder | {high_count} |

### Phase Progress

Phase {N}: {completed}/{total} tasks complete

### Newly Unblocked Tasks (across all phases)

| Task | Phase | Was Blocked By |
|------|-------|---------------|
| {id} {name} | {phase} | {previously blocked by completed tasks} |

### Next Steps

1. Review the implemented code for each completed task
2. Run `/execute-phase {N}` again if any tasks remain pending
3. Run `/execute-phase {next_phase}` to continue with the next phase
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
3. Other agents' results in this wave are still valid — process them normally
4. The task will be retried in the next wave (or next /execute-phase run)
```

### Agent reports BLOCKED
```
1. Mark task as "blocked" in progress.json
2. Add the reason to task.notes
3. Report to user which task was blocked and why
4. Continue with next wave — don't stop the entire phase
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
- ALWAYS limit each wave to a maximum of 4 agents
- ALWAYS update progress.json AFTER EACH WAVE (not after the entire phase)
- ALWAYS re-read progress.json and re-filter executable tasks between waves
- ALWAYS use potenlab-small-coder for `complexity: "low"` and potenlab-high-coder for `complexity: "high"`
- ALWAYS remove completed task IDs from blocked_by arrays across ALL phases after each wave
- ALWAYS report newly unblocked tasks so the user knows what's available next
- ALWAYS ask for phase number via AskUserQuestion if not provided in arguments

### DO NOT:
- NEVER spawn more than 4 agents in a single wave
- NEVER execute tasks where `blocked_by` is non-empty
- NEVER execute tasks where `status` is already `"completed"`
- NEVER spawn a potenlab-high-coder for a low-complexity task (wastes resources)
- NEVER spawn a potenlab-small-coder for a high-complexity task (will fail or produce poor results)
- NEVER let agents update progress.json — only the orchestrator does that (after each wave)
- NEVER proceed without progress.json
- NEVER skip reporting blocked tasks — the user needs to know
- NEVER assume a phase number — always get it from user arguments or AskUserQuestion
- NEVER wait until the entire phase finishes to update progress.json — update after EACH wave

---

## Checklist

- [ ] Phase number obtained (from argument or AskUserQuestion)
- [ ] progress.json read and parsed
- [ ] Target phase found
- [ ] Tasks filtered: pending + not blocked
- [ ] Tasks grouped by complexity (low → potenlab-small-coder, high → potenlab-high-coder)
- [ ] Execution plan reported to user (with wave assignments)
- [ ] Wave loop started
- [ ] Each wave spawns max 4 agents in a single parallel message
- [ ] progress.json updated IMMEDIATELY after each wave completes
- [ ] blocked_by arrays cleared for completed tasks (across ALL phases)
- [ ] Executable tasks re-filtered between waves (picks up newly unblocked)
- [ ] Final report shows results grouped by wave
- [ ] Newly unblocked tasks reported
