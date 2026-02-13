# Potenlab Workflow

Full-stack project planning and execution for Claude Code. Orchestrates specialist agents to plan, build, and iterate on projects.

## Installation

```bash
npx potenlab-workflow
```

This installs commands, agents, and best-practice rules into `~/.claude/` so Claude Code auto-discovers them.

### Options

```bash
npx potenlab-workflow              # Install globally to ~/.claude/
npx potenlab-workflow --local      # Install to ./.claude/ (project-scoped)
npx potenlab-workflow --uninstall  # Remove all potenlab files
```

### Verify

Start a new Claude Code session, then:

```
/potenlab:hello
```

Expected output:

> Potenlab Workflow is active. **potenlab-workflow** v0.2.0 loaded successfully.

## What Gets Installed

```
~/.claude/
├── commands/potenlab/          # 11 slash commands
│   ├── plan-project.md
│   ├── execute-phase.md
│   ├── developer.md
│   ├── complete-plan.md
│   ├── review-plan.md
│   ├── generate-test.md
│   ├── run-test-all.md
│   ├── run-test-phase.md
│   ├── verify-test.md
│   ├── info.md
│   └── hello.md
├── agents/                     # 8 specialist agents (potenlab-prefixed)
│   ├── potenlab-ui-ux-specialist.md
│   ├── potenlab-tech-lead-specialist.md
│   ├── potenlab-frontend-specialist.md
│   ├── potenlab-backend-specialist.md
│   ├── potenlab-progress-creator.md
│   ├── potenlab-high-coder.md
│   ├── potenlab-small-coder.md
│   └── potenlab-qa-specialist.md
└── potenlab-workflow/          # Core data
    ├── VERSION
    ├── CLAUDE.md
    ├── rules/                  # React best practices
    └── references/             # Postgres best practices
```

## Workflow

```
  PRD / Figma
      |
      v
  /potenlab:plan-project       1. Create all plans from PRD
      |
      v
  /potenlab:complete-plan      2. Generate progress.json task tracker
      |
      v
  /potenlab:execute-phase 0    3. Build each phase (parallel agents)
  /potenlab:execute-phase 1        Phase 0: Foundation
  /potenlab:execute-phase 2        Phase 1: Backend
  /potenlab:execute-phase 3        Phase 2: Shared UI
  /potenlab:execute-phase 4        Phase 3: Features
  /potenlab:execute-phase 5        Phase 4: Integration
      |                            Phase 5: Polish
      v
  /potenlab:developer          4. Post-completion adjustments
```

Need to revise plans? Use `/potenlab:review-plan` at any point.

### Step 1: Plan — `/potenlab:plan-project`

Creates all project plans from a PRD file. Asks clarifying questions first, then orchestrates 4 specialist agents sequentially and in parallel.

**Agents spawned:**

```
AskUserQuestion (validate scope, stack, UI priority)
      |
      v
potenlab-ui-ux-specialist       --> docs/ui-ux-plan.md
      |
      v
potenlab-tech-lead-specialist   --> docs/dev-plan.md
      |
      v
potenlab-frontend-specialist ──┐
                               ├──> parallel
potenlab-backend-specialist  ──┘
      |
      v
docs/frontend-plan.md + docs/backend-plan.md
```

### Step 2: Complete — `/potenlab:complete-plan`

Generates `progress.json` from the finalized plans. Classifies every task as `low` or `high` complexity and assigns the right coder agent.

**Output:** `docs/progress.json` with all tasks, dependencies, and agent assignments.

### Step 3: Execute — `/potenlab:execute-phase`

Builds a specific phase by spawning multiple coder agents in parallel.

```
/potenlab:execute-phase 0        # Foundation
/potenlab:execute-phase 1        # Backend
/potenlab:execute-phase 2        # Shared UI
/potenlab:execute-phase 3        # Features
/potenlab:execute-phase 4        # Integration
/potenlab:execute-phase 5        # Polish
```

**Agent assignment:**
- `complexity: "low"` tasks --> `potenlab-small-coder` (Sonnet, fast)
- `complexity: "high"` tasks --> `potenlab-high-coder` (Opus, deep reasoning)

### Step 4: Adjust — `/potenlab:developer`

Handles changes after all phases are complete. Tracks everything in `changes.json`.

```
/potenlab:developer fix the login button hover state
/potenlab:developer add dark mode toggle
```

### Revise Plans — `/potenlab:review-plan`

Edit existing plans based on feedback. Same agent flow as planning but in edit mode.

```
/potenlab:review-plan change auth to OAuth
/potenlab:review-plan add a notifications feature
```

### Testing

```
/potenlab:generate-test          # Generate .test.ts files from test-plan.md
/potenlab:run-test-all           # Run all Vitest tests
/potenlab:run-test-phase 1       # Run tests for a specific phase
/potenlab:verify-test            # Sync tests after code changes
```

## Commands Reference

| Command | Purpose | Input |
|---------|---------|-------|
| `/potenlab:plan-project` | Create all plans from PRD | PRD file + user preferences |
| `/potenlab:complete-plan` | Generate progress.json | Existing plan files |
| `/potenlab:review-plan` | Edit existing plans | User feedback (args or prompt) |
| `/potenlab:execute-phase N` | Build phase N with parallel agents | Phase number |
| `/potenlab:developer` | Post-completion adjustments | Change request (args or prompt) |
| `/potenlab:generate-test` | Generate Vitest test files | test-plan.md |
| `/potenlab:run-test-all` | Run all tests | None |
| `/potenlab:run-test-phase` | Run tests for a phase | Phase number |
| `/potenlab:verify-test` | Sync tests after changes | Scope (optional) |
| `/potenlab:info` | Show overview | None |
| `/potenlab:hello` | Verify installation | None |

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `potenlab-ui-ux-specialist` | Opus | Design system, wireframes, user flows, WCAG accessibility |
| `potenlab-tech-lead-specialist` | Opus | Single source of truth dev plan from UI/UX plan |
| `potenlab-frontend-specialist` | Opus | Component specs, Bulletproof React structure, shadcn mapping |
| `potenlab-backend-specialist` | Opus | Schema, migrations, RLS policies, Supabase best practices |
| `potenlab-progress-creator` | Opus | Parse plans into structured progress.json |
| `potenlab-high-coder` | Opus | Execute complex multi-file tasks (3+ files) |
| `potenlab-small-coder` | Sonnet | Execute small isolated tasks (1-2 files, fast) |
| `potenlab-qa-specialist` | Opus | Test generation, verification, failure analysis |

## Generated Files

```
docs/
├── ui-ux-plan.md         # Design system, user research, wireframes
├── dev-plan.md           # Phased development checklist (single source of truth)
├── frontend-plan.md      # Component specs, file paths, props, patterns
├── backend-plan.md       # Schema, SQL migrations, RLS policies
├── progress.json         # Task tracker with complexity + agent assignments
└── changes.json          # Post-completion change tracking (batched)
```

## Project Structure

All plans enforce the Bulletproof React architecture:

```
src/
├── app/                  # Routes, providers
├── components/           # Shared + styled components
│   ├── ui/               # shadcn primitives
│   ├── layouts/          # Page layouts
│   ├── common/           # Generic reusable (LoadingSpinner, ErrorBoundary)
│   └── {feature}/        # Feature-specific styled/presentational components
├── config/               # Global config
├── features/             # Business logic only
│   └── {name}/
│       ├── api/          # Data fetching hooks (React Query + Supabase)
│       ├── components/   # Business-purpose only (list, detail, create, edit, delete)
│       ├── hooks/        # Feature-specific hooks
│       ├── types/        # Feature types
│       └── utils/        # Feature utilities
├── hooks/                # Shared hooks
├── lib/                  # Library wrappers (Supabase client)
├── stores/               # Global state (Zustand)
├── types/                # Shared TypeScript types
└── utils/                # Shared utilities
```

## Local Development

Test locally without publishing to npm:

```bash
# Run the installer directly
node bin/install.js

# Install to local project
node bin/install.js --local

# Uninstall
node bin/install.js --uninstall

# Test with plugin system (legacy)
claude --plugin-dir ./plugins/potenlab-workflow
```

## Requirements

- Claude Code CLI
- A PRD file (markdown) to start planning

### Optional MCP servers

These enhance agent capabilities but are not required:

| MCP Server | Used By | Purpose |
|------------|---------|---------|
| `shadcn` | potenlab-frontend-specialist, potenlab-ui-ux-specialist | Component discovery |
| `context7` | potenlab-frontend-specialist, potenlab-backend-specialist | Library documentation |
| `postgres` | potenlab-backend-specialist | Database state inspection |

## License

MIT
