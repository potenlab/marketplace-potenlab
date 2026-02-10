---
name: review-plan
description: "Reviews and edits all existing plan files based on user feedback. Accepts feedback from arguments (/review-plan change X to Y) or via AskUserQuestion. Same sequential flow as /plan (ui-ux -> tech-lead -> frontend+backend parallel) but EDITS existing plans instead of creating from scratch. Also updates progress.json if it exists. Triggers on: review plan, edit plan, update plan, change plan, revise plan, adjust plan."
user-invocable: true
---

# Review Plan Skill

Edit and update all existing plan files based on user feedback, following the same orchestration flow as `/plan`.

---

## How It Differs from /plan

| Aspect | /plan | /review-plan |
|--------|-------|-------------|
| Purpose | Create plans from scratch | Edit existing plans |
| Input | PRD file | User feedback + existing plans |
| Agent action | Write new files | Read existing files, apply changes, rewrite |
| progress.json | Not created (use /complete-plan) | Updated/regenerated if it exists |
| Prerequisite | PRD must exist | Plan files must exist |

---

## Flow

```
/review-plan [user feedback OR empty]
      |
      v
+----------------------------------------------------------+
|  STEP 1: Get review feedback                              |
|  - From arguments: /review-plan change auth to OAuth      |
|  - OR from AskUserQuestion if no arguments provided       |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 2: Verify existing plan files                       |
|  - docs/ui-ux-plan.md (REQUIRED)                         |
|  - docs/dev-plan.md (REQUIRED)                            |
|  - docs/frontend-plan.md (REQUIRED)                      |
|  - docs/backend-plan.md (REQUIRED)                        |
|  - docs/progress.json (optional — update if exists)       |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 3: ui-ux-specialist (SEQUENTIAL)                   |
|  - Reads: docs/ui-ux-plan.md + user feedback              |
|  - EDITS and rewrites: docs/ui-ux-plan.md                |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 4: tech-lead-specialist (SEQUENTIAL)               |
|  - Reads: updated docs/ui-ux-plan.md + user feedback      |
|  - EDITS and rewrites: docs/dev-plan.md                  |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 5: PARALLEL — frontend + backend specialists       |
|                                                           |
|  frontend-specialist                                      |
|  - Reads: updated docs/dev-plan.md + user feedback        |
|  - EDITS and rewrites: docs/frontend-plan.md             |
|                                                           |
|  backend-specialist                                       |
|  - Reads: updated docs/dev-plan.md + user feedback        |
|  - EDITS and rewrites: docs/backend-plan.md              |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 6: progress-creator (SEQUENTIAL, only if exists)   |
|  - Reads: updated dev-plan.md, frontend-plan.md,          |
|           backend-plan.md                                 |
|  - Rewrites: docs/progress.json                          |
+----------------------------------------------------------+
      |
      v
+----------------------------------------------------------+
|  STEP 7: Report changes                                   |
+----------------------------------------------------------+
```

---

## Step 1: Get Review Feedback

### Option A: Feedback from arguments

If the user invokes with arguments:
```
/review-plan change the auth flow to use OAuth instead of magic links
/review-plan add a dark mode toggle to the settings page
/review-plan remove the billing feature entirely
```

Extract the feedback directly from the arguments. **Do NOT ask questions — the user already told you what to change.** Proceed directly to Step 2.

### Option B: No arguments provided

If the user invokes with no arguments (`/review-plan`), you MUST use AskUserQuestion to gather feedback.

```
AskUserQuestion:
  question: "What changes would you like to make to the plan?"
  header: "Change Type"
  options:
    - label: "Add a feature"
      description: "Add a new feature or capability to the plan"
    - label: "Remove a feature"
      description: "Remove an existing feature from the plan"
    - label: "Change approach"
      description: "Modify how a feature is implemented"
    - label: "I'll describe it"
      description: "Provide detailed feedback in my own words"
```

Then follow up with a specific question based on their choice:

**If "Add a feature":**
```
AskUserQuestion:
  question: "What feature would you like to add? Describe it briefly."
  header: "New Feature"
  options:
    - label: "New page/screen"
      description: "Add a new page with its own route"
    - label: "New component/widget"
      description: "Add a new UI element to an existing page"
    - label: "New backend capability"
      description: "Add new tables, APIs, or data processing"
    - label: "I'll describe it"
      description: "Let me explain what I need"
```

**If "Remove a feature":**
```
AskUserQuestion:
  question: "Which feature should be removed?"
  header: "Remove"
  options:
    - label: "I'll specify it"
      description: "Let me name the feature to remove"
```

**If "Change approach":**
```
AskUserQuestion:
  question: "What would you like to change?"
  header: "Change"
  options:
    - label: "UI/UX design"
      description: "Change layout, colors, components, user flows"
    - label: "Backend/database"
      description: "Change schema, APIs, data model"
    - label: "Tech stack"
      description: "Change frameworks, libraries, tools"
    - label: "I'll describe it"
      description: "Let me explain the change"
```

### Question Rules
- Maximum **3 questions** to gather feedback
- If the user provided arguments, ask **ZERO questions** — use their input directly
- Capture the full feedback as `{user_feedback}` for all agent prompts

---

## Step 2: Verify Existing Plan Files

Check that required plan files exist:

```
Glob: **/ui-ux-plan.md
Glob: **/dev-plan.md
Glob: **/frontend-plan.md
Glob: **/backend-plan.md
Glob: **/progress.json
```

### If any REQUIRED file is missing:

Tell the user which files are missing and suggest running `/plan` first:

> Missing: `[file]`. Run `/plan` first to create all plan files, then use `/review-plan` to edit them.

**STOP. Do NOT proceed with partial plans.**

### Track progress.json existence:

```
has_progress_json = true/false
```

If `progress.json` exists, it will be regenerated in Step 6.

---

## Step 3: Spawn ui-ux-specialist — EDIT Mode (SEQUENTIAL)

```
Task:
  subagent_type: ui-ux-specialist
  description: "Edit UI/UX plan"
  prompt: |
    You are in REVIEW/EDIT mode — NOT creating from scratch.

    Read the EXISTING plan:
    - docs/ui-ux-plan.md

    User feedback to apply:
    ---
    {user_feedback}
    ---

    Instructions:
    1. Read docs/ui-ux-plan.md completely
    2. Identify which sections are affected by the user's feedback
    3. Apply the requested changes to those sections
    4. Keep all UNAFFECTED sections exactly as they are — do not rewrite unchanged content
    5. Add a "## Revision Log" section at the bottom with:
       - Date of revision
       - Summary of what changed
    6. Write the updated file back to: docs/ui-ux-plan.md

    IMPORTANT:
    - This is an EDIT, not a rewrite. Preserve existing work.
    - Only change what the user asked to change.
    - If the feedback doesn't affect UI/UX (e.g., only backend changes), make no changes and return "No UI/UX changes needed."

    Write the file using the Write tool. Return "Done: docs/ui-ux-plan.md [summary of changes]" when complete.
```

**Wait for completion before proceeding.**

Verify:
```
Glob: docs/ui-ux-plan.md
```

---

## Step 4: Spawn tech-lead-specialist — EDIT Mode (SEQUENTIAL)

```
Task:
  subagent_type: tech-lead-specialist
  description: "Edit dev plan"
  prompt: |
    You are in REVIEW/EDIT mode — NOT creating from scratch.

    Read the EXISTING plans:
    - docs/dev-plan.md (your output — edit this)
    - docs/ui-ux-plan.md (may have been updated in previous step)

    User feedback to apply:
    ---
    {user_feedback}
    ---

    Instructions:
    1. Read docs/dev-plan.md completely
    2. Read docs/ui-ux-plan.md to see if it was updated
    3. Identify which phases and tasks are affected by:
       a. The user's direct feedback
       b. Any changes propagated from the updated ui-ux-plan.md
    4. Apply changes:
       - ADD new tasks if the feedback introduces new work
       - REMOVE tasks if the feedback eliminates features
       - MODIFY tasks if the feedback changes approach or scope
       - UPDATE dependencies if task structure changed
    5. Keep all UNAFFECTED phases and tasks exactly as they are
    6. Add a "## Revision Log" section at the bottom with:
       - Date of revision
       - Summary of what changed (tasks added, removed, modified)
    7. Write the updated file back to: docs/dev-plan.md

    IMPORTANT:
    - This is an EDIT, not a rewrite. Preserve existing work.
    - Task IDs must remain consistent for any unchanged tasks.
    - New tasks get the next available ID in their phase (e.g., if 3.1 and 3.2 exist, new task is 3.3).
    - Removed tasks should be deleted entirely, not marked as removed.
    - Do NOT create progress.json — that is handled separately.

    Write the file using the Write tool. Return "Done: docs/dev-plan.md [summary of changes]" when complete.
```

**Wait for completion before proceeding.**

Verify:
```
Glob: docs/dev-plan.md
```

---

## Step 5: Spawn frontend + backend Specialists — EDIT Mode (PARALLEL)

**CRITICAL: Spawn BOTH agents in a SINGLE message with two Task tool calls.**

```
[Single message with 2 Task tool calls]

Task 1: frontend-specialist
  subagent_type: frontend-specialist
  description: "Edit frontend plan"
  prompt: |
    You are in REVIEW/EDIT mode — NOT creating from scratch.

    Read the EXISTING plans:
    - docs/frontend-plan.md (your output — edit this)
    - docs/dev-plan.md (may have been updated — sync with it)
    - docs/ui-ux-plan.md (may have been updated — check design changes)

    User feedback to apply:
    ---
    {user_feedback}
    ---

    Instructions:
    1. Read docs/frontend-plan.md completely
    2. Read docs/dev-plan.md to see what tasks changed
    3. Read docs/ui-ux-plan.md to see if design specs changed
    4. Identify which component specs are affected by:
       a. The user's direct feedback
       b. Any tasks added/removed/modified in dev-plan.md
       c. Any design changes in ui-ux-plan.md
    5. Apply changes:
       - ADD new component specs for new tasks
       - REMOVE specs for deleted tasks
       - MODIFY specs where approach or design changed
       - UPDATE the Component Index table
    6. Keep all UNAFFECTED specs exactly as they are
    7. Add a "## Revision Log" section at the bottom with:
       - Date of revision
       - Summary of what changed
    8. Write the updated file back to: docs/frontend-plan.md

    IMPORTANT:
    - This is an EDIT, not a rewrite. Preserve existing work.
    - Maintain Bulletproof React structure in all new/modified specs.
    - If the feedback doesn't affect frontend, make no changes and return "No frontend changes needed."

    Write the file using the Write tool. Return "Done: docs/frontend-plan.md [summary of changes]" when complete.

Task 2: backend-specialist
  subagent_type: backend-specialist
  description: "Edit backend plan"
  prompt: |
    You are in REVIEW/EDIT mode — NOT creating from scratch.

    Read the EXISTING plans:
    - docs/backend-plan.md (your output — edit this)
    - docs/dev-plan.md (may have been updated — sync with it)

    User feedback to apply:
    ---
    {user_feedback}
    ---

    Instructions:
    1. Read docs/backend-plan.md completely
    2. Read docs/dev-plan.md to see what tasks changed
    3. Identify which schema, migration, or RLS specs are affected by:
       a. The user's direct feedback
       b. Any tasks added/removed/modified in dev-plan.md
    4. Apply changes:
       - ADD new table/migration specs for new backend tasks
       - REMOVE specs for deleted tasks
       - MODIFY schemas, RLS policies, or queries where approach changed
       - UPDATE migration order if table structure changed
       - UPDATE schema diagram
    5. Keep all UNAFFECTED specs exactly as they are
    6. Add a "## Revision Log" section at the bottom with:
       - Date of revision
       - Summary of what changed
    7. Write the updated file back to: docs/backend-plan.md

    IMPORTANT:
    - This is an EDIT, not a rewrite. Preserve existing work.
    - Maintain Supabase best practices in all new/modified specs.
    - If the feedback doesn't affect backend, make no changes and return "No backend changes needed."

    Write the file using the Write tool. Return "Done: docs/backend-plan.md [summary of changes]" when complete.
```

**Wait for BOTH agents to complete before proceeding.**

---

## Step 6: Update progress.json (CONDITIONAL)

**Only run this step if `progress.json` existed in Step 2.**

If `has_progress_json == true`:

```
Task:
  subagent_type: progress-creator
  description: "Update progress.json"
  prompt: |
    Read all UPDATED plan files and REGENERATE progress.json.

    REQUIRED — read this first:
    - docs/dev-plan.md (has been updated)

    OPTIONAL — read these for enrichment (if they exist):
    - docs/frontend-plan.md (may have been updated)
    - docs/backend-plan.md (may have been updated)

    Your job:
    1. Parse every phase and task from the UPDATED dev-plan.md
    2. Enrich tasks with file paths and details from specialist plans
    3. Classify each task as "low" or "high" complexity with a specific reason
    4. Assign agent: "small-coder" for low, "high-coder" for high
    5. Map dependencies between tasks
    6. Calculate summary counts
    7. All task statuses reset to "pending" (fresh regeneration)

    Write the output to: docs/progress.json

    Use the Write tool to create the file. Return "Done: docs/progress.json" when complete.
```

If `has_progress_json == false`:

Skip this step. Tell the user:

> `progress.json` was not found — skipping regeneration. Run `/complete-plan` to generate it when ready.

---

## Step 7: Report Changes

After all agents have completed, provide a summary:

```markdown
## Plan Review Complete

### Changes Applied

**User request:** {user_feedback}

### Files Updated

| # | File | Agent | Status |
|---|------|-------|--------|
| 1 | docs/ui-ux-plan.md | ui-ux-specialist | [Updated / No changes needed] |
| 2 | docs/dev-plan.md | tech-lead-specialist | [Updated / No changes needed] |
| 3 | docs/frontend-plan.md | frontend-specialist | [Updated / No changes needed] |
| 4 | docs/backend-plan.md | backend-specialist | [Updated / No changes needed] |
| 5 | docs/progress.json | progress-creator | [Regenerated / Skipped] |

### Execution Order

```
Step 1: Gathered user feedback
Step 2: Verified plan files exist
Step 3: ui-ux-specialist     -> edited docs/ui-ux-plan.md
Step 4: tech-lead-specialist -> edited docs/dev-plan.md
Step 5: frontend-specialist  -> edited docs/frontend-plan.md  } PARALLEL
        backend-specialist   -> edited docs/backend-plan.md   }
Step 6: progress-creator     -> regenerated docs/progress.json (if existed)
```

### What Changed

Each updated file has a **Revision Log** at the bottom documenting:
- Date of revision
- Summary of specific changes made

### Next Steps

1. Review the Revision Log in each updated file
2. If progress.json was regenerated, verify task classifications
3. Run `/developer` to continue executing tasks
```

---

## Error Handling

### Missing plan files
```
STOP. List which files are missing.
Tell user: "Run /plan first to create plan files."
```

### Agent reports "No changes needed"
```
This is valid — the user's feedback may not affect all domains.
Report which files were unchanged and why.
```

### Agent fails
```
1. Report which agent failed and the error
2. Other agents' changes are still valid
3. User can re-run /review-plan for the same feedback to retry
```

---

## Execution Rules

### DO:
- ALWAYS check for arguments first — skip AskUserQuestion if feedback is in arguments
- ALWAYS use AskUserQuestion if NO arguments are provided
- ALWAYS verify all 4 plan files exist before spawning any agents
- ALWAYS pass `{user_feedback}` to EVERY agent — they need context to know what changed
- ALWAYS run ui-ux first, then tech-lead, then frontend+backend in parallel
- ALWAYS update progress.json if it existed before the review
- ALWAYS tell agents this is EDIT mode, not creation from scratch
- ALWAYS ask agents to add a Revision Log

### DO NOT:
- NEVER rewrite plans from scratch — this is an edit operation
- NEVER skip the sequential order (ui-ux -> tech-lead -> frontend+backend)
- NEVER spawn frontend/backend before tech-lead completes
- NEVER ask more than 3 questions to gather feedback
- NEVER ask questions if the user provided arguments
- NEVER pass file content in prompts — use file paths only
- NEVER modify plan files yourself — let the agents do it

---

## Checklist

- [ ] User feedback captured (from arguments or AskUserQuestion)
- [ ] All 4 required plan files verified to exist
- [ ] progress.json existence tracked
- [ ] ui-ux-specialist spawned (edit mode) and completed
- [ ] tech-lead-specialist spawned (edit mode) and completed
- [ ] frontend + backend specialists spawned in parallel (edit mode) and completed
- [ ] progress.json regenerated (if it existed)
- [ ] Completion report shown with change summary
