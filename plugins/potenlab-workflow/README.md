# Potenlab Starter Plugin

Full-stack project planning and execution plugin for Claude Code. Orchestrates specialist agents to plan, build, and iterate on projects using a structured, phased workflow.

## Installation

### 1. Add the marketplace

```
/plugin marketplace add potenlab/marketplace-potenlab
```

### 2. Install the plugin

```
/plugin install potenlab-workflow@potenlab-marketplace-potenlab
```

### Scope options

```
/plugin install potenlab-workflow@potenlab-marketplace-potenlab --scope user      # Personal (default)
/plugin install potenlab-workflow@potenlab-marketplace-potenlab --scope project   # Shared with team
/plugin install potenlab-workflow@potenlab-marketplace-potenlab --scope local     # Personal, gitignored
```

### Verify installation

```
/potenlab-workflow:hello
```

You should see:

> Potenlab Marketplace is active. Plugin **potenlab-workflow** v0.2.0 loaded successfully.

## Workflow Overview

```
  PRD / Figma
      |
      v
  /plan                    Create all plans from PRD
      |
      v
  /complete-plan           Generate progress.json
      |
      v
  /execute-phase 0         Build Phase 0: Foundation
  /execute-phase 1         Build Phase 1: Backend
  /execute-phase 2         Build Phase 2: Shared UI
  /execute-phase 3         Build Phase 3: Features
  /execute-phase 4         Build Phase 4: Integration
  /execute-phase 5         Build Phase 5: Polish
      |
      v
  /generate-test           Generate .test.ts from test-plan.md
  /run-test-all            Run all tests
  /run-test-phase          Run tests for a specific phase
      |
      v
  /developer               Post-completion adjustments
      |
      v
  /verify-test             Sync tests after changes
```

Need to revise plans at any point? Use `/review-plan`.

## Skills

### `/plan`

Creates all project plans from a PRD file.

```
/plan
```

**Flow:**
1. Asks clarifying questions (scope, tech stack, UI priority)
2. Spawns `ui-ux-specialist` — creates `docs/ui-ux-plan.md`
3. Spawns `tech-lead-specialist` — creates `docs/dev-plan.md`
4. Spawns `frontend-specialist` + `backend-specialist` in parallel — creates `docs/frontend-plan.md` and `docs/backend-plan.md`

**Output:**
```
docs/
├── ui-ux-plan.md
├── dev-plan.md
├── frontend-plan.md
└── backend-plan.md
```

---

### `/complete-plan`

Generates `progress.json` from all finalized plan files. Run this after `/plan`.

```
/complete-plan
```

**Flow:**
1. Verifies `dev-plan.md` exists (required)
2. Spawns `progress-creator` agent
3. Parses all phases and tasks
4. Classifies each task as `low` or `high` complexity
5. Assigns `small-coder` or `high-coder` per task

**Output:**
```
docs/
└── progress.json
```

---

### `/review-plan`

Edits existing plan files based on your feedback. Same agent flow as `/plan` but in edit mode.

```
/review-plan change the auth flow to use OAuth
/review-plan add a dark mode feature
/review-plan remove the billing module
/review-plan                                    # asks what to change
```

**Flow:**
1. Gets feedback from arguments or asks via prompt
2. Edits `ui-ux-plan.md` (sequential)
3. Edits `dev-plan.md` (sequential)
4. Edits `frontend-plan.md` + `backend-plan.md` (parallel)
5. Regenerates `progress.json` if it exists

Each updated file gets a **Revision Log** documenting what changed.

---

### `/execute-phase`

Executes all pending tasks in a specific development phase. Spawns multiple coder agents in parallel.

```
/execute-phase 0        # Foundation
/execute-phase 1        # Backend
/execute-phase 3        # Features
/execute-phase          # asks which phase
```

**Flow:**
1. Reads `progress.json`
2. Filters pending + unblocked tasks in the target phase
3. Groups by complexity: `low` -> `small-coder`, `high` -> `high-coder`
4. Spawns ALL agents in parallel (one per task)
5. Updates `progress.json` with results

**Example:** If Phase 2 has 5 tasks (3 low, 2 high), it spawns 3 `small-coder` + 2 `high-coder` agents simultaneously.

---

### `/developer`

Handles post-completion adjustments after all phases are done. Tracks changes separately in `changes.json`.

```
/developer fix the login button hover state
/developer add a loading spinner to the dashboard
/developer refactor user card to new design tokens
/developer                                        # asks what to change
```

**Flow:**
1. Gets change request from arguments or asks via prompt
2. Reads project context (all plans + existing code)
3. Breaks request into tasks, classifies complexity
4. Creates/appends to `docs/changes.json` with a new batch
5. Spawns coder agents in parallel
6. Updates `changes.json` with results

**Output:**
```
docs/
└── changes.json       # Separate from progress.json
```

Each invocation creates a new batch (`C1`, `C2`, `C3`...) so full change history is preserved.

---

### `/generate-test`

Generates Vitest test files from `test-plan.md` using `qa-specialist` agents.

```
/generate-test           # asks scope (all, specific feature, RLS only, CRUD only)
/generate-test all       # generate tests for all features
/generate-test auth      # generate tests for auth feature only
```

**Flow:**
1. Reads `test-plan.md`, `vitest-best-practices.md`, `backend-plan.md`
2. Generates shared test utils (`src/test-utils/supabase.ts`) if missing
3. Spawns one `qa-specialist` per feature in parallel
4. Each agent produces `.test.ts` files with CRUD, RLS, constraint, and edge case tests

**Output:**
```
src/
├── test-utils/supabase.ts                    # Shared Supabase test helpers
├── features/{name}/api/{name}.test.ts        # Feature behavior tests
└── tests/
    ├── rls/{table}.test.ts                   # RLS policy tests
    └── constraints/{table}.test.ts           # Constraint tests
```

---

### `/run-test-all`

Runs every Vitest test in the project and generates a structured result report.

```
/run-test-all
```

**Flow:**
1. Discovers all `.test.ts` files across `src/features/`, `src/tests/`, `supabase/`
2. Checks if Supabase local is running
3. Runs `npx vitest run` with JSON reporter
4. Parses results into `docs/test.result.json` (always replaced, never appended)
5. Spawns `qa-specialist` to analyze any failures

---

### `/run-test-phase`

Runs tests for a specific phase only, based on the phase-to-feature mapping in `test-plan.md`.

```
/run-test-phase          # asks which phase to run
/run-test-phase 1        # run Phase 1 tests
/run-test-phase auth     # run tests for auth phase/feature
```

**Flow:**
1. Reads `test-plan.md` to map phases to features
2. Resolves test files for the chosen phase's features
3. Runs `npx vitest run` with file filter
4. Parses results into `docs/test.result.json` (always replaced)
5. Spawns `qa-specialist` to analyze any failures

---

### `/verify-test`

Detects code changes and updates both `test-plan.md` and test files to stay in sync. Use after `/developer` or manual edits.

```
/verify-test             # auto-detects changes from changes.json + git diff
/verify-test auth        # verify only auth feature tests
/verify-test all         # re-verify all features
```

**Flow:**
1. Detects changes via `changes.json` and `git diff`
2. Compares changed source code against `test-plan.md`
3. Updates `test-plan.md` with new/changed/removed scenarios
4. Spawns `qa-specialist` per affected feature to edit existing test files
5. Reports all changes made

---

### `/info`

Displays an overview of the plugin ecosystem.

```
/info
```

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `ui-ux-specialist` | Opus | Design system, wireframes, user flows, accessibility |
| `tech-lead-specialist` | Opus | Single source of truth dev plan from UI/UX plan |
| `frontend-specialist` | Opus | Component specs, file paths, props, patterns |
| `backend-specialist` | Opus | Schema, migrations, RLS policies, queries |
| `progress-creator` | Opus | Parse plans into structured progress.json |
| `high-coder` | Opus | Execute complex multi-file tasks (3+ files) |
| `small-coder` | Sonnet | Execute small isolated tasks (1-2 files) |
| `qa-specialist` | Opus | Test generation, verification, and failure analysis |

## Generated Files

| File | Created By | Purpose |
|------|-----------|---------|
| `docs/ui-ux-plan.md` | `/plan` | Design system, user research, wireframes |
| `docs/dev-plan.md` | `/plan` | Phased development checklist (single source of truth) |
| `docs/frontend-plan.md` | `/plan` | Component specs with Bulletproof React structure |
| `docs/backend-plan.md` | `/plan` | Schema, SQL migrations, RLS policies |
| `docs/progress.json` | `/complete-plan` | Task tracker with complexity + agent assignments |
| `docs/changes.json` | `/developer` | Post-completion change tracking |
| `docs/test.result.json` | `/run-test-all`, `/run-test-phase` | Test results (replaced on every run) |

## Architecture

```
PRD
 |
 v
ui-ux-specialist ──> ui-ux-plan.md
 |
 v
tech-lead-specialist ──> dev-plan.md  (single source of truth)
 |
 ├──> frontend-specialist ──> frontend-plan.md  } parallel
 └──> backend-specialist  ──> backend-plan.md   }
 |
 v
progress-creator ──> progress.json
 |
 ├──> small-coder (low complexity tasks)   } parallel per task
 └──> high-coder  (high complexity tasks)  }
 |
 v
qa-specialist ──> .test.ts files + test.result.json
 |
 ├──> /generate-test   (create tests from test-plan.md)
 ├──> /run-test-all    (run all tests)
 ├──> /run-test-phase  (run phase tests)
 └──> /verify-test     (sync tests after changes)
```

## Project Structure (Bulletproof React)

All generated plans follow this structure:

```
src/
├── app/              # Routes, providers
├── components/       # Shared + styled components
│   ├── ui/           # shadcn components
│   ├── layouts/      # Page layouts
│   ├── common/       # Generic reusable (LoadingSpinner, ErrorBoundary)
│   └── {feature}/    # Feature-specific styled components
├── config/           # Global config
├── features/         # Business logic only
│   └── {name}/
│       ├── api/      # Data fetching hooks
│       ├── components/ # Business-purpose components (list, detail, create, edit, delete)
│       ├── hooks/
│       ├── types/
│       └── utils/
├── hooks/            # Shared hooks
├── lib/              # Library wrappers
├── stores/           # Global state (Zustand)
├── types/            # Shared types
└── utils/            # Shared utilities
```

## Requirements

- Claude Code CLI
- A PRD file (markdown) to start planning

### Optional MCP servers (for enhanced capabilities)

- `shadcn` — Component discovery for UI planning
- `context7` — Library documentation lookup
- `postgres` — Database state inspection for backend planning

## License

MIT
