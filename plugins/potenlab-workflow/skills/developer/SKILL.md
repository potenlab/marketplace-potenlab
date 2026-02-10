---
name: developer
description: "Post-completion development skill for adjustments and changes after all phases are done. Accepts change requests from arguments (/developer fix the login button) or via AskUserQuestion. Analyzes existing code and plans, creates change tasks in docs/changes.json, spawns small-coder and high-coder agents in parallel, and tracks all results in changes.json. Triggers on: developer, dev, adjust, change, fix, tweak, modify, post-dev."
user-invocable: true
---

# Developer Skill

Handle post-completion adjustments by analyzing change requests, creating tracked tasks in `changes.json`, and spawning coder agents in parallel.

---

## When to Use

Use `/developer` when:
- All phases are **already completed** via `/execute-phase`
- You need **adjustments, fixes, or tweaks** to existing code
- You want changes **tracked separately** from the original progress.json

Use `/execute-phase` instead when:
- You're still building the initial project phases
- Tasks come from progress.json

---

## How It Works

```
/developer [change description]
      |
      v
+----------------------------------------------------------+
|  STEP 1: Get change request                               |
|  - From argument: /developer fix the login button         |
|  - OR from AskUserQuestion if not provided                |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Read project context                             |
|  - docs/progress.json (understand what was built)         |
|  - docs/dev-plan.md (original plan)                       |
|  - docs/frontend-plan.md (component specs)                |
|  - docs/backend-plan.md (schema specs)                    |
|  - Scan existing codebase (src/**)                        |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: Analyze & create change tasks                    |
|  - Break the request into concrete tasks                  |
|  - Classify each: low (small-coder) / high (high-coder)  |
|  - Identify affected files                                |
|  - Determine dependencies between change tasks            |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 4: Write docs/changes.json                          |
|  - Create or APPEND to changes.json                       |
|  - Each change request = a new "batch"                    |
|  - Tasks inside the batch have IDs like "C1.1", "C1.2"   |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 5: Spawn agents in PARALLEL                         |
|                                                           |
|  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       |
|  │ small-coder │  │ high-coder  │  │ small-coder │       |
|  │  Task C1.1  │  │  Task C1.2  │  │  Task C1.3  │       |
|  └─────────────┘  └─────────────┘  └─────────────┘       |
|                                                           |
|  One agent per task — all run simultaneously              |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 6: Update changes.json with results                 |
|  - Mark completed / blocked tasks                         |
|  - Recalculate batch and global summary                   |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 7: Report results                                   |
+----------------------------------------------------------+
```

---

## Step 1: Get Change Request

### Option A: From arguments

If the user provides a description:
```
/developer fix the login button hover state
/developer add dark mode toggle to settings
/developer refactor the user card to use the new design tokens
/developer the sidebar collapses incorrectly on mobile
```

Extract the change request directly. **Do NOT ask questions — proceed to Step 2.**

### Option B: No argument provided

If the user invokes with no argument (`/developer`), you MUST use AskUserQuestion:

```
AskUserQuestion:
  question: "What change or adjustment do you need?"
  header: "Change Type"
  options:
    - label: "Bug fix"
      description: "Something is broken or behaving incorrectly"
    - label: "UI/UX adjustment"
      description: "Visual or interaction changes"
    - label: "Feature tweak"
      description: "Modify existing functionality"
    - label: "I'll describe it"
      description: "Provide detailed description"
```

Then follow up to get specifics:

```
AskUserQuestion:
  question: "Describe the change you need. Be specific about what should happen."
  header: "Details"
  options:
    - label: "I'll type it out"
      description: "Let me describe the change in detail"
```

### Question Rules
- Maximum **2 questions** to gather the change request
- If the user provided arguments, ask **ZERO questions**
- Capture the full request as `{change_request}`

---

## Step 2: Read Project Context

Read all available context to understand the current state of the project:

```
Glob: **/progress.json
Read: [found path] — understand what was built and task structure

Glob: **/dev-plan.md
Read: [found path] — original plan and architecture

Glob: **/frontend-plan.md
Read: [found path] — component specs, file paths, patterns

Glob: **/backend-plan.md
Read: [found path] — schema, queries, RLS policies

Glob: **/changes.json
Read: [found path] — previous change batches (if any)
```

Also scan the codebase to understand what files exist:

```
Glob: src/**/*.{ts,tsx}
```

**If progress.json does NOT exist:**

Warn the user but proceed anyway — changes.json can work independently:

> Note: `progress.json` not found. Operating without original task context. Changes will still be tracked in `changes.json`.

---

## Step 3: Analyze & Create Change Tasks

Break the user's change request into concrete, implementable tasks.

### 3.1 Identify affected areas

From the change request, determine:
- **Which files** need to be modified (grep/glob existing code)
- **Which domain** is affected (frontend, backend, fullstack)
- **What type** of change (bug fix, style change, logic change, new addition)

### 3.2 Break into tasks

Each distinct unit of work becomes a task. One task = one logical change.

**Examples:**

User request: "Fix the login button hover state and add a loading spinner"
```
Task C1.1: Fix login button hover state (1 file — low → small-coder)
Task C1.2: Add loading spinner to login button (1 file — low → small-coder)
```

User request: "Add dark mode toggle with persistent preference"
```
Task C1.1: Create dark mode Zustand store (1 file — low → small-coder)
Task C1.2: Add theme toggle component (1 file — low → small-coder)
Task C1.3: Wire dark mode across layout + providers + store (4 files — high → high-coder)
```

### 3.3 Classify complexity

Use the same rules as progress.json:

| Complexity | Criteria | Agent |
|------------|----------|-------|
| `low` | 1-2 files, single concern, no cross-file logic | `small-coder` |
| `high` | 3+ files, cross-file coordination, multi-concern | `high-coder` |

### 3.4 Determine dependencies

If tasks within the same batch depend on each other:
- Task C1.3 depends on C1.1 and C1.2 → `blocked_by: ["C1.1", "C1.2"]`
- Independent tasks have empty `blocked_by`

**Only spawn tasks where `blocked_by` is empty.** Blocked tasks wait for a re-run.

---

## Step 4: Write changes.json

### 4.1 Structure

If `changes.json` does NOT exist — create it fresh.
If `changes.json` ALREADY exists — read it and APPEND a new batch.

### 4.2 Batch numbering

Each invocation of `/developer` creates a new batch:
- First run: Batch `C1` with tasks `C1.1`, `C1.2`, ...
- Second run: Batch `C2` with tasks `C2.1`, `C2.2`, ...
- Nth run: Batch `CN` with tasks `CN.1`, `CN.2`, ...

If `changes.json` already has batches, find the highest batch number and increment.

### 4.3 Format

```json
{
  "project": "[from progress.json or dev-plan.md]",
  "generated": "[ISO date of first creation]",
  "last_updated": "[ISO date of latest update]",
  "summary": {
    "total_batches": 1,
    "total_tasks": 0,
    "completed": 0,
    "in_progress": 0,
    "pending": 0,
    "blocked": 0
  },
  "batches": [
    {
      "id": "C1",
      "request": "[user's original change request]",
      "created": "[ISO date]",
      "status": "in_progress",
      "progress": "0/3",
      "tasks": [
        {
          "id": "C1.1",
          "name": "Fix login button hover state",
          "type": "bug_fix",
          "priority": "high",
          "status": "pending",
          "complexity": "low",
          "estimated_files": 1,
          "complexity_reason": "Single file — src/components/ui/button.tsx hover style",
          "domain": "frontend",
          "agent": "small-coder",
          "dependencies": [],
          "blocked_by": [],
          "affected_files": [
            "src/components/ui/button.tsx"
          ],
          "output": [
            "src/components/ui/button.tsx (modified)"
          ],
          "verify": [
            "Button hover state shows correct color",
            "No regression on other button variants"
          ],
          "notes": ""
        },
        {
          "id": "C1.2",
          "name": "Add loading spinner to login",
          "type": "enhancement",
          "priority": "medium",
          "status": "pending",
          "complexity": "low",
          "estimated_files": 1,
          "complexity_reason": "Single file — add spinner state to login component",
          "domain": "frontend",
          "agent": "small-coder",
          "dependencies": [],
          "blocked_by": [],
          "affected_files": [
            "src/features/auth/components/login.auth.tsx"
          ],
          "output": [
            "src/features/auth/components/login.auth.tsx (modified)"
          ],
          "verify": [
            "Spinner shows during login API call",
            "Spinner hides after success or error"
          ],
          "notes": ""
        },
        {
          "id": "C1.3",
          "name": "Wire loading state with auth store",
          "type": "enhancement",
          "priority": "medium",
          "status": "pending",
          "complexity": "high",
          "estimated_files": 3,
          "complexity_reason": "Cross-file — auth store + login component + API hook coordination",
          "domain": "frontend",
          "agent": "high-coder",
          "dependencies": ["C1.1", "C1.2"],
          "blocked_by": ["C1.1", "C1.2"],
          "affected_files": [
            "src/stores/auth.store.ts",
            "src/features/auth/api/useAuth.ts",
            "src/features/auth/components/login.auth.tsx"
          ],
          "output": [
            "src/stores/auth.store.ts (modified)",
            "src/features/auth/api/useAuth.ts (modified)",
            "src/features/auth/components/login.auth.tsx (modified)"
          ],
          "verify": [
            "Loading state syncs between store and component",
            "No race conditions on rapid submit"
          ],
          "notes": "Depends on C1.1 and C1.2 being done first"
        }
      ]
    }
  ]
}
```

### 4.4 Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Task ID with batch prefix (e.g., `"C1.1"`, `"C2.3"`) |
| `name` | `string` | Short description of the change |
| `type` | `string` | `"bug_fix"` \| `"enhancement"` \| `"refactor"` \| `"style"` \| `"new_feature"` |
| `priority` | `string` | `"critical"` \| `"high"` \| `"medium"` \| `"low"` |
| `status` | `string` | `"pending"` \| `"in_progress"` \| `"completed"` \| `"blocked"` |
| `complexity` | `string` | `"low"` \| `"high"` — determines agent |
| `estimated_files` | `number` | How many files this task modifies |
| `complexity_reason` | `string` | Short specific sentence explaining WHY |
| `domain` | `string` | `"frontend"` \| `"backend"` \| `"fullstack"` |
| `agent` | `string` | `"small-coder"` \| `"high-coder"` — derived from complexity |
| `dependencies` | `string[]` | Task IDs that must complete first |
| `blocked_by` | `string[]` | Same as dependencies, updated at runtime |
| `affected_files` | `string[]` | Files that will be MODIFIED (not created) |
| `output` | `string[]` | Files modified or created with annotation |
| `verify` | `string[]` | Concrete verification steps |
| `notes` | `string` | Additional context |

### 4.5 Write the file

```
Write: docs/changes.json
```

---

## Step 5: Spawn Agents in PARALLEL

**Same parallel spawning mechanism as `/execute-phase`.**

### 5.1 Filter executable tasks

```
executable_tasks = batch.tasks.filter(task =>
  task.status === "pending" AND
  task.blocked_by.length === 0
)
```

If some tasks are blocked by other tasks in the same batch, only spawn the unblocked ones. Blocked tasks are reported and will need a re-run after dependencies complete.

### 5.2 Report execution plan

```markdown
### Execution Plan — Batch {batch_id}

**Change request:** {change_request}

| Task | Complexity | Agent | Files | Reason |
|------|-----------|-------|-------|--------|
| {id} {name} | low | small-coder | {estimated_files} | {complexity_reason} |
| {id} {name} | high | high-coder | {estimated_files} | {complexity_reason} |

**Spawning:** {executable_count} agents ({small_count} small-coder, {high_count} high-coder)
**Blocked:** {blocked_count} tasks waiting on dependencies
```

### 5.3 Spawn ALL agents in a SINGLE message

For EACH executable task, use the appropriate agent:

#### small-coder prompt (for `complexity: "low"`):

```
Task:
  subagent_type: small-coder
  description: "Change {task.id}: {task.name}"
  prompt: |
    Execute change task {task.id}: {task.name}

    Context — read ALL plan files first (MANDATORY):
    - docs/dev-plan.md (project architecture)
    - docs/frontend-plan.md (component specs)
    - docs/backend-plan.md (schema specs)
    - docs/ui-ux-plan.md (design context)
    - docs/progress.json (what was originally built)
    - docs/changes.json (current change tracking)

    Change details:
    - ID: {task.id}
    - Name: {task.name}
    - Type: {task.type}
    - Domain: {task.domain}
    - Affected files: {task.affected_files}
    - Verify steps: {task.verify}

    User's original request: "{change_request}"

    Instructions:
    1. Read ALL plans to understand the full project
    2. Read the affected files to understand current implementation
    3. Apply the change — modify existing code, don't rewrite from scratch
    4. Keep changes minimal and focused
    5. Verify against the verify steps

    IMPORTANT:
    - This is a SMALL change (1-2 files). If it seems bigger, report back.
    - Do NOT update changes.json — the orchestrator handles that.
    - Preserve existing code patterns and structure.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list of files modified]"
    If blocked or too large, return: "BLOCKED: {task.id} — {reason}"
```

#### high-coder prompt (for `complexity: "high"`):

```
Task:
  subagent_type: high-coder
  description: "Change {task.id}: {task.name}"
  prompt: |
    Execute change task {task.id}: {task.name}

    Context — read ALL plan files first (MANDATORY):
    - docs/dev-plan.md (project architecture)
    - docs/frontend-plan.md (component specs)
    - docs/backend-plan.md (schema specs)
    - docs/ui-ux-plan.md (design context)
    - docs/progress.json (what was originally built)
    - docs/changes.json (current change tracking)

    Change details:
    - ID: {task.id}
    - Name: {task.name}
    - Type: {task.type}
    - Domain: {task.domain}
    - Estimated files: {task.estimated_files}
    - Affected files: {task.affected_files}
    - Verify steps: {task.verify}

    User's original request: "{change_request}"

    Instructions:
    1. Read ALL plans to understand the full project
    2. Read ALL affected files to understand current implementation
    3. Plan the modification order across files
    4. Apply changes — modify existing code, maintain consistency across files
    5. Self-review: check types, imports, no regressions
    6. Verify against the verify steps

    IMPORTANT:
    - This is a COMPLEX change (3+ files, cross-file coordination).
    - Do NOT update changes.json — the orchestrator handles that.
    - Ensure no regressions in existing functionality.
    - Handle edge cases from the change.

    When done, return: "COMPLETED: {task.id} — {task.name} | Files: [list of files modified]"
    If blocked or has issues, return: "BLOCKED: {task.id} — {reason}"
```

**Wait for ALL agents to complete before proceeding to Step 6.**

---

## Step 6: Update changes.json

After all agents complete:

### 6.1 Read current changes.json

```
Read: docs/changes.json
```

### 6.2 Process agent results

```
IF result starts with "COMPLETED:"
  → Set task.status = "completed"

IF result starts with "BLOCKED:"
  → Set task.status = "blocked"
  → Add reason to task.notes
```

### 6.3 Update blocked_by within the batch

For completed tasks, remove their IDs from `blocked_by` arrays of other tasks in the same batch:

```
for each completed_task_id:
  for each task in batch.tasks:
    task.blocked_by = task.blocked_by.filter(id => id !== completed_task_id)
```

### 6.4 Update batch progress

```
completed_count = batch.tasks.filter(t => t.status === "completed").length
total_count = batch.tasks.length
batch.progress = "{completed_count}/{total_count}"

if all tasks completed → batch.status = "completed"
if any task still pending/blocked → batch.status = "in_progress"
```

### 6.5 Recalculate global summary

```
summary.total_batches = batches.length
summary.total_tasks = count of ALL tasks across ALL batches
summary.completed = count where status === "completed"
summary.in_progress = count where status === "in_progress"
summary.pending = count where status === "pending"
summary.blocked = count where status === "blocked"
```

### 6.6 Update timestamp and write

```
last_updated = [current ISO date]
Write: docs/changes.json
```

---

## Step 7: Report Results

```markdown
## Developer — Change Batch {batch_id} Complete

### Change Request
> {change_request}

### Results

| Task | Agent | Status | Files Modified |
|------|-------|--------|---------------|
| {id} {name} | small-coder | Completed | {files} |
| {id} {name} | high-coder | Completed | {files} |
| {id} {name} | small-coder | Blocked | {reason} |

### Batch Summary

| Metric | Count |
|--------|-------|
| Tasks in batch | {total} |
| Completed | {completed} |
| Blocked | {blocked} |
| Agents spawned | {total_agents} |
| small-coder | {small_count} |
| high-coder | {high_count} |

### Batch Progress
```
Batch {batch_id}: {completed}/{total} tasks
```

### Still Blocked (needs re-run)

| Task | Blocked By | Status |
|------|------------|--------|
| {id} {name} | {blocked_by} | Now unblocked — run `/developer` again |

### changes.json Updated

- Location: `docs/changes.json`
- Batch {batch_id} tracked with all task results
- Summary counts recalculated

### Next Steps

1. Review the modified files for correctness
2. If blocked tasks are now unblocked, run `/developer` again with the same request
3. Run `/developer` with a new request for additional changes
4. All change history is preserved in `docs/changes.json`
```

---

## Re-running for Blocked Tasks

When `/developer` is invoked and `changes.json` already has batches with blocked tasks that are now unblocked:

### Check for unblocked tasks first

Before creating a new batch, check if existing batches have tasks where:
- `status === "pending"` or `status === "blocked"`
- `blocked_by` is now empty (dependencies were completed in a previous run)

If found, execute those tasks first WITHOUT creating a new batch.

```
AskUserQuestion:
  question: "Found {N} unblocked tasks from batch {batch_id}. Execute them or start a new change?"
  header: "Pending Work"
  options:
    - label: "Execute unblocked tasks (Recommended)"
      description: "Finish pending work from batch {batch_id}"
    - label: "New change request"
      description: "Skip pending tasks and create a new batch"
    - label: "Both"
      description: "Execute pending tasks AND add new changes"
```

---

## Error Handling

### No plan files exist
```
Warn but proceed:
"No plan files found. changes.json will be created with limited context.
Consider running /plan first for a better development experience."
```

### Agent fails
```
1. Keep failed task as "pending" in changes.json
2. Report which agent failed and for which task
3. Other agents' results are still valid
4. Suggest re-running /developer to retry
```

### changes.json is corrupted
```
1. Attempt to parse
2. If unparseable, rename to changes.json.backup
3. Create fresh changes.json
4. Warn user about the backup
```

### Change request is too vague
```
Use AskUserQuestion to clarify:
"Your request is broad. Can you be more specific about what to change?"
```

---

## Execution Rules

### DO:
- ALWAYS read project context (plans, progress.json, existing code) before creating tasks
- ALWAYS create or append to changes.json — never modify progress.json
- ALWAYS use batch IDs with "C" prefix (C1, C2, C3...) to distinguish from progress.json
- ALWAYS spawn ALL unblocked tasks in a SINGLE parallel message
- ALWAYS update changes.json after agents complete
- ALWAYS check for previously blocked tasks before creating a new batch
- ALWAYS classify complexity using the same rules as progress.json
- ALWAYS ask via AskUserQuestion if no arguments provided
- ALWAYS scan existing code to identify affected files accurately

### DO NOT:
- NEVER modify progress.json — that tracks the original build
- NEVER execute blocked tasks (blocked_by is non-empty)
- NEVER spawn high-coder for low-complexity changes
- NEVER spawn small-coder for high-complexity changes
- NEVER let agents update changes.json
- NEVER create tasks without reading existing code first
- NEVER ask more than 2 questions to gather the change request
- NEVER overwrite existing batches — always append new ones

---

## Checklist

- [ ] Change request obtained (from arguments or AskUserQuestion)
- [ ] Project context read (plans, progress.json, codebase)
- [ ] Checked for previously blocked tasks in changes.json
- [ ] Change request analyzed and broken into tasks
- [ ] Each task classified: complexity, agent, affected files
- [ ] changes.json created or appended with new batch
- [ ] Unblocked tasks identified
- [ ] Execution plan shown to user
- [ ] ALL agents spawned in a single parallel message
- [ ] Agent results collected
- [ ] changes.json updated (statuses, blocked_by, summary)
- [ ] Results reported with next steps
