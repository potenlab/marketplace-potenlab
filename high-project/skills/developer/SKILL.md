---
name: developer
description: "Orchestrates coder agents to execute phase tasks. Analyzes progress.json to determine parallel execution. Usage: /developer [phase] - if no phase specified, asks user. Spawns multiple agents for independent tasks. Triggers on: develop, developer, start phase, execute phase, build phase."
---

# Developer Skill

Orchestrate coder agents to execute tasks for a specific phase. Analyzes task dependencies to spawn agents in parallel when possible.

---

## CRITICAL: You Must Spawn Agents

**This skill REQUIRES spawning coder agents using the Task tool.**

```
Task tool call:
  subagent_type: "developer"
  description: "Execute task X.X"
  prompt: "Execute task X.X from docs/progress.json..."
```

**For parallel execution, send MULTIPLE Task tool calls in ONE message.**

---

## Usage

```
/developer 1      → Develop Phase 1
/developer 2      → Develop Phase 2
/developer        → Ask which phase to develop
```

---

## Workflow

```
/developer [phase?]
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  1. VALIDATE: Check docs/progress.json exists                │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  2. PHASE: Get phase from args OR ask user                   │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  3. ANALYZE: Read phase tasks, find parallelizable groups    │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  4. SPAWN: Launch coder agents (parallel if possible)    │
│                                                              │
│     Independent tasks? → Spawn multiple agents               │
│     Sequential tasks?  → Spawn one agent                     │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  5. REPORT: Summary of completed tasks                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 1: Validate Plans

**Check required files exist:**

```
Glob: docs/progress.json
Glob: docs/dev-plan.md
```

**If missing:**
```
Report: "No plans found. Run /plan-project first."
STOP
```

---

## Step 2: Get Phase

### If phase provided in args:
```
User: /developer 1
→ phase = 1
→ Proceed to Step 3
```

### If NO phase provided:
```
User: /developer

Read: docs/progress.json
→ Extract available phases
→ Show progress per phase
→ Ask user which phase
```

**Ask Question:**
```
AskUserQuestion:
  question: "Which phase do you want to develop?"
  header: "Phase"
  options:
    - label: "Phase 0: Foundation (X/Y done)"
      description: "Setup, config, design tokens"
    - label: "Phase 1: Backend Core (X/Y done)"
      description: "Schema, migrations, RLS"
    - label: "Phase 2: UI Components (X/Y done)"
      description: "Shared components, layouts"
    - label: "Phase 3: Features (X/Y done)"
      description: "Feature implementations"
```

---

## Step 3: Analyze Phase Tasks

**Read progress.json and extract phase tasks:**

```
Read: docs/progress.json

Find phase by ID (e.g., "phase-1")
Extract all tasks with passed: false
Analyze dependencies (blockedBy)
```

### Dependency Analysis

**Build task groups for parallel execution:**

```
Group 1: Tasks with NO dependencies (can run parallel)
Group 2: Tasks depending on Group 1 (run after Group 1)
Group 3: Tasks depending on Group 2 (run after Group 2)
...
```

**Example:**
```
Phase 1 Tasks:
- 1.1: Setup Supabase (no deps)        → Group 1
- 1.2: Create users table (deps: 1.1)  → Group 2
- 1.3: Create posts table (deps: 1.1)  → Group 2
- 1.4: Create RLS policies (deps: 1.2, 1.3) → Group 3

Execution:
Wave 1: [1.1] - 1 agent
Wave 2: [1.2, 1.3] - 2 agents parallel
Wave 3: [1.4] - 1 agent
```

---

## Step 4: Spawn Developer Agents

### Parallel Spawning Rules

| Scenario | Agents to Spawn |
|----------|-----------------|
| 1 independent task | 1 agent |
| 2 independent tasks | 2 agents parallel |
| 3+ independent tasks | 3 agents parallel (max) |
| All sequential | 1 agent for all tasks |

### CRITICAL: Use Task Tool to Spawn Agents

**You MUST use the Task tool with subagent_type="developer" to spawn agents.**

### Wave 1: Single Task Example
```
[Task Tool Call]
subagent_type: coder
description: "Execute task 1.1"
prompt: "Execute task 1.1 from docs/progress.json. Update passed: true when done."
```

### Wave 2: Two Tasks Parallel Example
```
[Single message with 2 Task tool calls - PARALLEL]

[Task Tool Call 1]
subagent_type: coder
description: "Execute task 1.2"
prompt: "Execute task 1.2 from docs/progress.json. Update passed: true when done."

[Task Tool Call 2]
subagent_type: coder
description: "Execute task 1.3"
prompt: "Execute task 1.3 from docs/progress.json. Update passed: true when done."
```

### Wave 3: Three Tasks Parallel Example
```
[Single message with 3 Task tool calls - PARALLEL]

[Task Tool Call 1]
subagent_type: coder
description: "Execute task 2.1"
prompt: "Execute task 2.1 from docs/progress.json. Update passed: true when done."

[Task Tool Call 2]
subagent_type: coder
description: "Execute task 2.2"
prompt: "Execute task 2.2 from docs/progress.json. Update passed: true when done."

[Task Tool Call 3]
subagent_type: coder
description: "Execute tasks 2.3, 2.4"
prompt: "Execute tasks 2.3, 2.4 from docs/progress.json. Update each to passed: true when done."
```

### Sequential Tasks (One Agent)
```
[Task Tool Call]
subagent_type: coder
description: "Execute phase 1 tasks"
prompt: "Execute these tasks in order: 1.1, 1.2, 1.3, 1.4 from docs/progress.json. Update each to passed: true when done."
```

---

## Step 5: Report Completion

```markdown
## Phase {X} Development Complete

### Execution Summary
- **Wave 1:** 1 agent → Task 1.1 ✓
- **Wave 2:** 2 agents → Tasks 1.2, 1.3 ✓
- **Wave 3:** 1 agent → Task 1.4 ✓

### Tasks Completed
| ID | Name | Status |
|----|------|--------|
| 1.1 | Setup Supabase | ✓ passed |
| 1.2 | Create users table | ✓ passed |
| 1.3 | Create posts table | ✓ passed |
| 1.4 | Create RLS policies | ✓ passed |

### Progress Update
- **Phase 1:** 4/4 complete (100%)
- **Overall:** 8/20 complete (40%)

### Next Steps
Run `/developer 2` to develop Phase 2
```

---

## Parallel Execution Examples

### Example 1: All Independent Tasks
```
Phase 0 Tasks:
- 0.1: Setup project (no deps)
- 0.2: Install dependencies (no deps)
- 0.3: Configure ESLint (no deps)

Analysis: All independent → Spawn 3 agents parallel

[Task Call 1: developer] → Task 0.1
[Task Call 2: developer] → Task 0.2
[Task Call 3: developer] → Task 0.3
```

### Example 2: Mixed Dependencies
```
Phase 2 Tasks:
- 2.1: Design tokens (no deps)
- 2.2: Button component (deps: 2.1)
- 2.3: Card component (deps: 2.1)
- 2.4: Form component (deps: 2.2)

Analysis:
Wave 1: [2.1] → 1 agent
Wave 2: [2.2, 2.3] → 2 agents parallel
Wave 3: [2.4] → 1 agent
```

### Example 3: Fully Sequential
```
Phase 1 Tasks:
- 1.1: Create migration (no deps)
- 1.2: Run migration (deps: 1.1)
- 1.3: Create RLS (deps: 1.2)
- 1.4: Test queries (deps: 1.3)

Analysis: All sequential → 1 agent per wave (or 1 agent for all)

Option A: 4 waves, 1 agent each
Option B: 1 agent handles all sequentially

Prefer Option B for fewer spawns
```

---

## The Job: How to Execute This Skill

**FOLLOW THESE STEPS EXACTLY:**

### Step A: Validate & Get Phase
```
1. Read docs/progress.json
2. If no phase arg → AskUserQuestion for phase
3. Extract pending tasks for that phase
```

### Step B: Analyze Dependencies
```
1. Group tasks by dependencies
2. Wave 1 = no dependencies
3. Wave 2 = depends on Wave 1
4. etc.
```

### Step C: Spawn Agents (THE CRITICAL PART)

**FOR EACH WAVE, USE TASK TOOL TO SPAWN DEVELOPER AGENTS:**

```
Wave with 1 task:
→ 1 Task tool call with subagent_type="developer"

Wave with 2 tasks:
→ 2 Task tool calls in SAME message (parallel)

Wave with 3+ tasks:
→ 3 Task tool calls in SAME message (parallel)
```

**EXAMPLE - Wave with 2 parallel tasks:**

You MUST send this as a single message with multiple tool calls:

<example_spawn>
I'll spawn 2 coder agents in parallel for Wave 2:

[Task Tool Call 1]
subagent_type: coder
description: "Execute task 1.2"
prompt: "Execute task 1.2 from docs/progress.json. Update passed: true when done."

[Task Tool Call 2]
subagent_type: coder
description: "Execute task 1.3"
prompt: "Execute task 1.3 from docs/progress.json. Update passed: true when done."
</example_spawn>

### Step D: Wait & Continue
```
1. Wait for all agents in current wave
2. Proceed to next wave
3. Repeat Step C for next wave
```

### Step E: Report
```
1. Show completed tasks
2. Show progress percentage
3. Suggest next phase
```

---

## Agent Prompts

### Single Task Prompt
```
coder agent:
"Phase {phase}: Execute task {id} - {name}.
Read docs/progress.json for details.
Follow docs/{source} for implementation.
Update progress.json when done."
```

### Multiple Tasks Prompt (Sequential)
```
coder agent:
"Phase {phase}: Execute these tasks in order:
- {id1}: {name1}
- {id2}: {name2}
- {id3}: {name3}

Read docs/progress.json for details.
Update each task to passed: true when complete."
```

---

## Error Handling

### No Pending Tasks
```
All tasks in Phase X are already passed: true.
→ Report: "Phase X already complete. Run /developer Y for next phase."
```

### Dependencies Not Met
```
Task depends on tasks from previous phase that aren't done.
→ Report: "Phase X has unmet dependencies. Complete Phase Y first."
→ Suggest: "Run /developer Y"
```

### Agent Fails
```
Developer agent reports failure.
→ Report which task failed
→ Keep task as passed: false
→ Ask user how to proceed
```

---

## Rules

1. **Always ask if no phase specified**
   - Show phase progress in question
   - Let user choose

2. **Analyze before spawning**
   - Read progress.json
   - Build dependency waves
   - Optimize for parallelism

3. **Max 3 parallel agents**
   - More than 3 adds overhead
   - Group remaining tasks

4. **Wave-based execution**
   - Complete one wave before next
   - Respect dependencies

5. **Minimal prompts**
   - Only pass task IDs
   - Agent reads files itself

6. **Report progress**
   - Show what completed
   - Update overall progress
   - Suggest next phase

---

## Quick Reference

```
/developer        → Ask which phase
/developer 0      → Phase 0: Foundation
/developer 1      → Phase 1: Backend Core
/developer 2      → Phase 2: UI Components
/developer 3      → Phase 3: Features
/developer 4      → Phase 4: Integration
/developer 5      → Phase 5: Polish
```

---

## Checklist

- [ ] docs/progress.json exists
- [ ] Phase specified or asked
- [ ] Tasks analyzed for dependencies
- [ ] Waves built for parallel execution
- [ ] Agents spawned (max 3 parallel)
- [ ] Each wave waits before next
- [ ] progress.json updated by agents
- [ ] Completion report shown
