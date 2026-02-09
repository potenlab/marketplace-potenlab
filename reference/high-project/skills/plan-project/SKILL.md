---
name: plan-project
description: "Orchestrates complete project planning from PRD. Spawns frontend, backend, and UI/UX specialists in parallel, then consolidates with tech-lead-specialist. Creates comprehensive dev-plan.md and progress.json in /docs directory. Triggers on: plan project, create dev plan, project planning, full plan, prd to plan."
---

# Plan Project Skill

Orchestrate a complete project planning workflow from a PRD file, spawning specialized agents in parallel and consolidating into actionable developer tasks.

---

## Token Optimization Strategy

**CRITICAL: Minimize token usage through file-based handoff.**

```
┌─────────────────────────────────────────────────────────────────┐
│  WRONG (High Token Usage):                                      │
│  Agent A → returns content → passed to Agent B prompt           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CORRECT (Low Token Usage):                                     │
│  Agent A → Write file → Agent B → Read file                     │
└─────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. Each specialist WRITES their plan to `/docs/*.md` using Write tool
2. Tech-lead-specialist READS those files using Read tool
3. Prompts only contain file PATHS, never file CONTENT
4. Agents are independent - no content passed between them

---

## Workflow

```
/plan-project
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  1. Locate PRD → 2. Ensure /docs → 3. Ask max 5 questions    │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  4. PARALLEL: Spawn 3 specialists (each WRITES to file)      │
│                                                              │
│  frontend-specialist ──Write──→ docs/frontend-plan.md        │
│  backend-specialist  ──Write──→ docs/backend-plan.md         │
│  ui-ux-specialist    ──Write──→ docs/ui-ux-plan.md           │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  5. tech-lead-specialist (READS files, WRITES outputs)       │
│                                                              │
│  Read: docs/frontend-plan.md                                 │
│  Read: docs/backend-plan.md                                  │
│  Read: docs/ui-ux-plan.md                                    │
│        │                                                     │
│        ▼                                                     │
│  Write: docs/dev-plan.md                                     │
│  Write: docs/progress.json                                   │
└──────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  6. Report: List created files (no content in response)      │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 1: Locate PRD

First, search for the PRD file:

```
# Search for PRD file
Glob: **/prd.md
Glob: **/PRD.md
Glob: **/prd.MD
Glob: docs/prd.md
```

If not found, use AskUserQuestion:

```
AskUserQuestion:
  question: "Where is your PRD file located?"
  header: "PRD Location"
  options:
    - label: "docs/prd.md"
      description: "Standard location in docs folder"
    - label: "prd.md (root)"
      description: "In the project root directory"
    - label: "I'll provide a path"
      description: "Enter a custom path"
```

---

## Step 2: Ensure /docs Directory

Check and create docs directory:

```
# Check if docs exists
Bash: ls -la docs/ 2>/dev/null || echo "NOT_FOUND"

# Create if missing
Bash: mkdir -p docs
```

---

## Step 3: Validate PRD and Ask Clarifying Questions

**Read the PRD file first**, then ask up to **5 questions maximum** to clarify approach.

### Question Guidelines

Only ask questions that are:
- Critical for accurate planning
- Not already answered in PRD
- About approach, not implementation details

### Question Categories

**Question 1: Tech Stack** (if not specified in PRD)
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

**Question 2: Authentication** (if not specified)
```
AskUserQuestion:
  question: "What authentication approach?"
  header: "Auth Method"
  options:
    - label: "Supabase Auth (Recommended)"
      description: "Built-in auth with social providers"
    - label: "Custom JWT"
      description: "Roll your own with JWT tokens"
    - label: "No auth needed"
      description: "Public app without user accounts"
```

**Question 3: UI/UX Priority** (always ask)
```
AskUserQuestion:
  question: "What's the UI/UX priority for this project?"
  header: "UI Priority"
  options:
    - label: "Speed to market (Recommended)"
      description: "Use shadcn defaults, minimal customization"
    - label: "Custom brand design"
      description: "Detailed design system, unique look"
    - label: "Accessibility first"
      description: "WCAG AAA compliance, inclusive design"
```

**Question 4: Database Approach** (if complex data)
```
AskUserQuestion:
  question: "How should we handle data relationships?"
  header: "Data Model"
  options:
    - label: "Normalized (Recommended)"
      description: "Separate tables with foreign keys"
    - label: "Denormalized for speed"
      description: "Duplicate data for faster reads"
    - label: "Hybrid approach"
      description: "Normalize core, denormalize for performance"
```

**Question 5: Performance Requirements** (for scale)
```
AskUserQuestion:
  question: "What are the expected scale requirements?"
  header: "Scale"
  options:
    - label: "Small (< 1000 users)"
      description: "Standard patterns, no special optimization"
    - label: "Medium (1000-100k users)"
      description: "Connection pooling, basic caching"
    - label: "Large (100k+ users)"
      description: "Full optimization, CDN, edge functions"
```

### Question Tracking

**IMPORTANT: Track questions asked. Stop at 5 maximum.**

```
questionsAsked = 0
MAX_QUESTIONS = 5

# Only ask if questionsAsked < MAX_QUESTIONS
# Only ask if the answer is NOT already in the PRD
```

---

## Step 4: Spawn Specialist Agents (PARALLEL)

**CRITICAL: Spawn all 3 in ONE message. Each agent WRITES its own file.**

```
[Single message with 3 Task tool calls]

Task 1: frontend-specialist
Prompt: "PRD: {prd_path}. Write output to: docs/frontend-plan.md"

Task 2: backend-specialist
Prompt: "PRD: {prd_path}. Write output to: docs/backend-plan.md"

Task 3: ui-ux-specialist
Prompt: "PRD: {prd_path}. Write output to: docs/ui-ux-plan.md"
```

**Each agent:**
1. Reads PRD file (Read tool)
2. Does its analysis
3. Writes plan file (Write tool)
4. Returns only "Done: {filepath}"

---

## Step 5: Spawn Tech Lead Specialist

**After files exist, tech-lead READS them (not receives content).**

```
Task: tech-lead-specialist
Prompt: |
  Read these files and consolidate:
  - docs/frontend-plan.md
  - docs/backend-plan.md
  - docs/ui-ux-plan.md

  Write outputs to:
  - docs/dev-plan.md
  - docs/progress.json
```

**Tech-lead agent:**
1. Reads 3 plan files (Read tool)
2. Consolidates into tasks
3. Writes dev-plan.md (Write tool)
4. Writes progress.json (Write tool)
5. Returns only "Done: docs/dev-plan.md, docs/progress.json"

---

## Step 6: Report Completion

Provide comprehensive summary:

```markdown
## Project Planning Complete!

### Plans Created

| File | Location | Description |
|------|----------|-------------|
| frontend-plan.md | /docs | Component architecture, shadcn components, state management |
| backend-plan.md | /docs | Database schema, RLS policies, API endpoints |
| ui-ux-plan.md | /docs | Design system, wireframes, accessibility |
| dev-plan.md | /docs | Unified development roadmap with phases |
| progress.json | /docs | Developer checklist with pass/fail tracking |

### Summary Statistics

- **Total Tasks:** X
- **Critical:** X | **High:** X | **Medium:** X | **Low:** X
- **Phases:** 6 (Foundation → Backend → UI → Features → Integration → Polish)

### Next Steps

1. Review dev-plan.md for task breakdown
2. Assign tasks to developers
3. Update progress.json as tasks complete
4. Run `cat docs/progress.json | jq .summary` to check progress

### Files Ready for Development

```
docs/
├── prd.md              # Source requirements
├── frontend-plan.md    # Frontend implementation guide
├── backend-plan.md     # Backend implementation guide
├── ui-ux-plan.md       # Design system guide
├── dev-plan.md         # Unified task list
└── progress.json       # Developer checklist
```
```

---

## Error Handling

### PRD Not Found
```
If PRD file cannot be located:
1. Ask user for path (AskUserQuestion)
2. If still not found, ask to create one
3. Do not proceed without valid PRD
```

### Specialist Agent Fails
```
If any specialist agent fails:
1. Report which agent failed
2. Show error message
3. Ask user to fix and re-run
4. Do not proceed to tech-lead-specialist
```

### Incomplete PRD
```
If PRD is missing critical sections:
1. List missing sections
2. Ask user to update PRD
3. Or use AskUserQuestion to fill gaps (count toward 5 max)
```

---

## Execution Rules

### DO:
- Always check for existing /docs directory first
- Always read PRD before asking questions
- Spawn specialist agents in parallel (single message)
- Wait for all specialists before spawning tech-lead
- Track question count (max 5)

### DO NOT:
- Ask questions already answered in PRD
- Spawn tech-lead before specialists complete
- Create files outside /docs directory
- Ask more than 5 clarifying questions
- Skip the PRD validation step

---

## Minimal Prompts (Token Optimized)

### Specialist Prompts (Keep Short!)

```
frontend-specialist:
"PRD: docs/prd.md | Write: docs/frontend-plan.md"

backend-specialist:
"PRD: docs/prd.md | Write: docs/backend-plan.md"

ui-ux-specialist:
"PRD: docs/prd.md | Write: docs/ui-ux-plan.md"
```

### Tech Lead Prompt

```
tech-lead-specialist:
"Read: docs/frontend-plan.md, docs/backend-plan.md, docs/ui-ux-plan.md
Write: docs/dev-plan.md, docs/progress.json"
```

---

## Checklist

- [ ] PRD located
- [ ] /docs exists
- [ ] Max 5 questions asked
- [ ] 3 specialists spawned (parallel, each writes file)
- [ ] tech-lead spawned (reads files, writes outputs)
- [ ] Report file paths only (not content)
