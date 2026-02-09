---
name: review-plan
description: "Orchestrates plan reviews based on user needs. Spawns frontend-reviewer and/or backend-reviewer as needed, then syncs changes with tech-reviewer. Usage: /review-plan [user needs]. Triggers on: review plan, review frontend, review backend, sync plans, update plan."
---

# Review Plan Skill

Orchestrate plan review workflow based on user-specified needs. Spawns appropriate reviewer agents (frontend-reviewer, backend-reviewer) based on what the user wants to review, then automatically syncs changes to dev-plan.md and progress.json via tech-reviewer.

---

## Usage

```
/review-plan [user needs description]
```

**Examples:**
```
/review-plan I want to change the sidebar component to a sheet for mobile
/review-plan optimize the database queries for user search
/review-plan simplify state management and update RLS policies
/review-plan review everything for performance issues
```

---

## Workflow

```
/review-plan [user needs]
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  1. Parse User Needs                                         │
│     - Detect: frontend keywords? backend keywords? both?     │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  2. Locate Plan Files                                        │
│     - Find: frontend-plan.md, backend-plan.md                │
│     - Find: dev-plan.md, progress.json                       │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  3. CONDITIONAL PARALLEL: Spawn Reviewers Based on Needs     │
│                                                              │
│  If frontend needs:                                          │
│    frontend-reviewer ──Edit──► docs/frontend-plan.md         │
│                                                              │
│  If backend needs:                                           │
│    backend-reviewer  ──Edit──► docs/backend-plan.md          │
│                                                              │
│  (Spawn both in parallel if both needed)                     │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  4. tech-reviewer (ALWAYS runs after reviewers complete)     │
│                                                              │
│  Read: docs/frontend-plan.md (if updated)                    │
│  Read: docs/backend-plan.md (if updated)                     │
│        │                                                     │
│        ▼                                                     │
│  Edit: docs/dev-plan.md                                      │
│  Edit: docs/progress.json                                    │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  5. Report: Summary of changes made                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 1: Parse User Needs

Analyze the user's input to determine which reviewers to spawn.

### Keyword Detection

**Frontend Keywords** (trigger frontend-reviewer):
- component, components
- sidebar, navigation, navbar, header, footer
- button, form, input, modal, dialog, sheet
- shadcn, UI, interface
- state, zustand, redux, context
- React, hook, hooks
- layout, responsive, mobile
- styling, tailwind, CSS
- re-render, performance (UI context)

**Backend Keywords** (trigger backend-reviewer):
- database, schema, table, column
- query, queries, SQL
- RLS, policy, policies, security
- index, indexes, indexing
- Supabase, Postgres, PostgreSQL
- API, endpoint, endpoints
- migration, migrations
- performance (DB context)
- connection, pooling

**Both Keywords** (trigger both reviewers):
- everything, all, full
- performance (general)
- optimize, optimization
- review (general)

### Detection Logic

```
userNeeds = [user input]

spawnFrontend = false
spawnBackend = false

# Check for explicit scope
if contains(userNeeds, "frontend"):
    spawnFrontend = true
if contains(userNeeds, "backend"):
    spawnBackend = true

# Check for frontend keywords
if contains_any(userNeeds, FRONTEND_KEYWORDS):
    spawnFrontend = true

# Check for backend keywords
if contains_any(userNeeds, BACKEND_KEYWORDS):
    spawnBackend = true

# Check for "both" keywords
if contains_any(userNeeds, BOTH_KEYWORDS):
    spawnFrontend = true
    spawnBackend = true

# Default: if unclear, ask user
if not spawnFrontend and not spawnBackend:
    AskUserQuestion → which scope?
```

---

## Step 2: Locate Plan Files

Find all relevant plan files:

```
# Find specialist plans
Glob: **/frontend-plan.md
Glob: **/backend-plan.md

# Find dev plans
Glob: **/dev-plan.md
Glob: **/progress.json
```

**Expected locations:**
- `docs/frontend-plan.md`
- `docs/backend-plan.md`
- `docs/dev-plan.md`
- `docs/progress.json`

### Missing Files Handling

If frontend-plan.md missing and frontend review requested:
```
AskUserQuestion:
  question: "frontend-plan.md not found. What should I do?"
  header: "Missing Plan"
  options:
    - label: "Run frontend-specialist first"
      description: "Create the plan before reviewing"
    - label: "Skip frontend review"
      description: "Only review backend"
    - label: "Provide custom path"
      description: "The file is in a different location"
```

Same logic for backend-plan.md.

---

## Step 3: Spawn Reviewer Agents (CONDITIONAL PARALLEL)

**CRITICAL: Only spawn reviewers that match user needs. Spawn in parallel if both needed.**

### Case A: Frontend Only

```
Task: frontend-reviewer
Prompt: |
  User needs: {userNeeds}

  Review and update: docs/frontend-plan.md

  Focus on what the user wants to change. Ask them questions
  to clarify their needs before making edits.
```

### Case B: Backend Only

```
Task: backend-reviewer
Prompt: |
  User needs: {userNeeds}

  Review and update: docs/backend-plan.md

  Focus on what the user wants to change. Ask them questions
  to clarify their needs before making edits.
```

### Case C: Both (PARALLEL)

```
[Single message with 2 Task tool calls]

Task 1: frontend-reviewer
Prompt: |
  User needs: {userNeeds}
  Review and update: docs/frontend-plan.md

Task 2: backend-reviewer
Prompt: |
  User needs: {userNeeds}
  Review and update: docs/backend-plan.md
```

---

## Step 4: Spawn Tech Reviewer

**ALWAYS runs after reviewer(s) complete to sync changes.**

```
Task: tech-reviewer
Prompt: |
  The following plans were just reviewed and updated:
  {list of updated plans}

  User's original needs: {userNeeds}

  Sync changes to:
  - docs/dev-plan.md
  - docs/progress.json

  Ask the user about any priority changes or task adjustments.
```

---

## Step 5: Report Completion

Provide summary of all changes:

```markdown
## Plan Review Complete!

### User Request
"{userNeeds}"

### Reviewers Spawned
| Reviewer | Plan Updated | Status |
|----------|--------------|--------|
| frontend-reviewer | docs/frontend-plan.md | ✓ Updated |
| backend-reviewer | docs/backend-plan.md | ✓ Updated |
| tech-reviewer | docs/dev-plan.md, docs/progress.json | ✓ Synced |

### Changes Summary

**Frontend Plan:**
- [List of changes from frontend-reviewer]

**Backend Plan:**
- [List of changes from backend-reviewer]

**Dev Plan:**
- [List of synced changes from tech-reviewer]

### Files Modified
```
docs/
├── frontend-plan.md    # [if updated]
├── backend-plan.md     # [if updated]
├── dev-plan.md         # ✓ Synced
└── progress.json       # ✓ Synced
```

### Next Steps
1. Review the updated plans
2. Check progress.json for task changes
3. Continue with `/developer` to implement tasks
```

---

## Scope Clarification (If Needed)

If user needs are ambiguous, ask:

```
AskUserQuestion:
  question: "What scope should I review?"
  header: "Review Scope"
  options:
    - label: "Frontend only"
      description: "Components, state, UI patterns"
    - label: "Backend only"
      description: "Schema, queries, RLS, APIs"
    - label: "Both frontend and backend"
      description: "Full stack review"
    - label: "Let me specify"
      description: "I'll describe what I need"
```

---

## Error Handling

### Reviewer Agent Fails
```
If any reviewer agent fails:
1. Report which reviewer failed
2. Show error message
3. Ask user to fix and re-run
4. Do not proceed to tech-reviewer
```

### No Changes Needed
```
If reviewer determines no changes needed:
1. Report "No changes required for {plan}"
2. Skip tech-reviewer if nothing changed
3. Confirm with user
```

### Conflict Between Plans
```
If frontend and backend plans conflict:
1. tech-reviewer will detect this
2. Ask user which approach to prefer
3. Update both plans for consistency
```

---

## Execution Rules

### DO:
- Parse user needs before spawning agents
- Only spawn reviewers that match user needs
- Spawn frontend + backend in parallel when both needed
- Always run tech-reviewer after any plan updates
- Pass user needs to each reviewer

### DO NOT:
- Spawn all reviewers regardless of user needs
- Skip tech-reviewer after plan updates
- Run tech-reviewer before reviewers complete
- Ignore user's specific focus areas
- Make changes without reviewer asking user

---

## Minimal Prompts (Token Optimized)

### Frontend Reviewer Prompt
```
frontend-reviewer:
"User needs: {userNeeds} | Review: docs/frontend-plan.md | Ask user before editing"
```

### Backend Reviewer Prompt
```
backend-reviewer:
"User needs: {userNeeds} | Review: docs/backend-plan.md | Ask user before editing"
```

### Tech Reviewer Prompt
```
tech-reviewer:
"Updated: {list of updated plans} | Sync: docs/dev-plan.md, docs/progress.json"
```

---

## Examples

### Example 1: Frontend Only
```
User: /review-plan change the sidebar to a sheet component

Detected: "sidebar", "sheet", "component" → Frontend keywords
Action: Spawn frontend-reviewer only
→ frontend-reviewer updates frontend-plan.md
→ tech-reviewer syncs to dev-plan.md
```

### Example 2: Backend Only
```
User: /review-plan optimize the user search query

Detected: "query" → Backend keyword
Action: Spawn backend-reviewer only
→ backend-reviewer updates backend-plan.md
→ tech-reviewer syncs to dev-plan.md
```

### Example 3: Both
```
User: /review-plan simplify state management and update RLS policies

Detected: "state management" → Frontend, "RLS policies" → Backend
Action: Spawn both reviewers in parallel
→ frontend-reviewer updates frontend-plan.md
→ backend-reviewer updates backend-plan.md
→ tech-reviewer syncs both to dev-plan.md
```

### Example 4: Full Review
```
User: /review-plan review everything for performance

Detected: "everything", "performance" → Both keywords
Action: Spawn both reviewers in parallel
→ Both reviewers check their respective plans
→ tech-reviewer consolidates changes
```

---

## Checklist

- [ ] User needs parsed
- [ ] Scope determined (frontend/backend/both)
- [ ] Plan files located
- [ ] Correct reviewer(s) spawned
- [ ] Reviewers completed successfully
- [ ] tech-reviewer synced changes
- [ ] Summary report provided
