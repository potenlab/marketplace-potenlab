---
name: complete-plan
description: "Finalizes the planning phase by spawning progress-creator agent to read all plan files (dev-plan.md, frontend-plan.md, backend-plan.md) and generate progress.json — the structured task tracker used by coder agents. Run this AFTER /plan has completed. Triggers on: complete plan, finalize plan, create progress, generate progress, progress json."
user-invocable: true
---

# Complete Plan Skill

Finalize the planning phase by generating `progress.json` from all existing plan files.

---

## When to Use

Run this skill **after** `/plan` has completed and all plan files exist:

```
docs/
├── ui-ux-plan.md        # Created by ui-ux-specialist
├── dev-plan.md          # Created by tech-lead-specialist (REQUIRED)
├── frontend-plan.md     # Created by frontend-specialist
└── backend-plan.md      # Created by backend-specialist
```

---

## Flow

```
/complete-plan
      |
      v
+----------------------------------------------------------+
|  STEP 1: Verify plan files exist                          |
|  - dev-plan.md MUST exist (abort if missing)              |
|  - frontend-plan.md (optional enrichment)                 |
|  - backend-plan.md (optional enrichment)                  |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Spawn progress-creator agent                     |
|  - Reads: dev-plan.md, frontend-plan.md, backend-plan.md  |
|  - Parses all phases and tasks                            |
|  - Classifies complexity (low/high)                       |
|  - Assigns agent (small-coder/high-coder)                 |
|  - Writes: docs/progress.json                             |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: Verify output and report                         |
+----------------------------------------------------------+
```

---

## Step 1: Verify Plan Files

Before spawning the agent, check that the required files exist.

```
Glob: **/dev-plan.md
Glob: **/frontend-plan.md
Glob: **/backend-plan.md
```

### If dev-plan.md is NOT found:

**STOP immediately.** Do NOT spawn the agent. Tell the user:

> `dev-plan.md` not found. Run `/plan` first to create all plan files, then run `/complete-plan`.

### If only frontend-plan.md or backend-plan.md is missing:

Proceed anyway — these are optional enrichment. Warn the user:

> Note: `[missing file]` was not found. progress.json will be generated from dev-plan.md only. The missing specialist plan won't be used for enrichment.

---

## Step 2: Spawn progress-creator Agent

```
Task:
  subagent_type: progress-creator
  description: "Generate progress.json"
  prompt: |
    Read all plan files and generate progress.json.

    REQUIRED — read this first:
    - docs/dev-plan.md

    OPTIONAL — read these for enrichment (if they exist):
    - docs/frontend-plan.md
    - docs/backend-plan.md

    Your job:
    1. Parse every phase and task from dev-plan.md
    2. Enrich tasks with file paths and details from specialist plans
    3. Classify each task as "low" or "high" complexity with a specific reason
    4. Assign agent: "small-coder" for low, "high-coder" for high
    5. Map dependencies between tasks
    6. Calculate summary counts

    Write the output to: docs/progress.json

    Use the Write tool to create the file. Return "Done: docs/progress.json" when complete.
```

**Wait for the agent to complete.**

---

## Step 3: Verify and Report

After the agent completes, verify the file was created:

```
Glob: docs/progress.json
```

If the file exists, report success:

```markdown
## Planning Complete

`progress.json` has been generated from your plan files.

### Output

| File | Location | Description |
|------|----------|-------------|
| progress.json | docs/progress.json | Task tracker with complexity classification and agent assignments |

### Source Files Used

| File | Status | Purpose |
|------|--------|---------|
| dev-plan.md | Read | Primary source — all phases and tasks |
| frontend-plan.md | [Read / Not found] | Enrichment — file paths, component specs |
| backend-plan.md | [Read / Not found] | Enrichment — migration files, table names |

### What's Inside progress.json

- All tasks from dev-plan.md with status tracking
- Complexity classification (`low` / `high`) for each task
- Agent assignment (`small-coder` / `high-coder`) based on complexity
- Dependencies and blocked_by tracking
- Summary counts (total, pending, completed, in_progress, blocked)

### Next Steps

1. Review `docs/progress.json` to verify task classifications
2. Run `/developer` to start executing tasks from the plan
```

If the file does NOT exist, report the error and ask the user to check the agent output.

---

## Error Handling

### dev-plan.md not found
```
STOP. Do not spawn any agents.
Tell user: "Run /plan first to generate all plan files."
```

### progress-creator agent fails
```
1. Report the error message
2. Check if dev-plan.md is valid markdown with proper headings (### X.Y format)
3. Suggest the user verify dev-plan.md structure
```

### progress.json already exists
```
Proceed normally — the agent will overwrite with a fresh generation.
All task statuses will reset to "pending".
Warn user: "Existing progress.json will be overwritten. Any completed task statuses will be reset."
```

---

## Execution Rules

### DO:
- ALWAYS verify dev-plan.md exists before spawning the agent
- ALWAYS check for frontend-plan.md and backend-plan.md (optional)
- ALWAYS warn if overwriting an existing progress.json
- ALWAYS verify progress.json was created after the agent finishes

### DO NOT:
- NEVER spawn progress-creator if dev-plan.md is missing
- NEVER pass file content in the agent prompt — use file paths only
- NEVER modify any plan files — this skill is read-only for plans
- NEVER manually create progress.json — let the agent do it

---

## Checklist

- [ ] dev-plan.md exists (REQUIRED)
- [ ] frontend-plan.md checked (optional)
- [ ] backend-plan.md checked (optional)
- [ ] User warned if overwriting existing progress.json
- [ ] progress-creator agent spawned
- [ ] docs/progress.json created
- [ ] Completion report shown to user
