# Potenlab Claude Code Plugin Marketplace

Official plugin marketplace for Claude Code by Potenlab. Plan, build, and iterate on full-stack projects using orchestrated specialist agents.

## Installation

### Step 1: Register the marketplace

```bash
/plugin marketplace add potenlab/marketplace-potenlab
```

### Step 2: Install the plugin

```bash
/plugin install potenlab-workflow@potenlab-marketplace-potenlab
```

#### Scope options

```bash
/plugin install potenlab-workflow@potenlab-marketplace-potenlab --scope user      # Personal (default)
/plugin install potenlab-workflow@potenlab-marketplace-potenlab --scope project   # Shared with team
/plugin install potenlab-workflow@potenlab-marketplace-potenlab --scope local     # Personal, gitignored
```

### Step 3: Verify

```bash
/potenlab-workflow:hello
```

Expected output:

> Potenlab Marketplace is active. Plugin **potenlab-workflow** v0.2.0 loaded successfully.

## Local Development

Test the plugin locally without installing from the marketplace:

```bash
claude --plugin-dir ./plugins/potenlab-workflow
```

## Plugins

| Plugin | Description | Version |
|--------|-------------|---------|
| `potenlab-workflow` | Full-stack project planning and execution with specialist agents | 0.2.0 |

## Workflow

The plugin provides a complete development lifecycle through 5 skills:

```
  PRD / Figma
      |
      v
  /plan                    1. Create all plans from PRD
      |
      v
  /complete-plan           2. Generate progress.json task tracker
      |
      v
  /execute-phase 0         3. Build each phase (parallel agents)
  /execute-phase 1             Phase 0: Foundation
  /execute-phase 2             Phase 1: Backend
  /execute-phase 3             Phase 2: Shared UI
  /execute-phase 4             Phase 3: Features
  /execute-phase 5             Phase 4: Integration
      |                        Phase 5: Polish
      v
  /developer               4. Post-completion adjustments
```

Need to revise plans? Use `/review-plan` at any point.

### Step 1: Plan — `/plan`

Creates all project plans from a PRD file. Asks clarifying questions first, then orchestrates 4 specialist agents sequentially and in parallel.

```
/plan
```

**Agents spawned:**

```
AskUserQuestion (validate scope, stack, UI priority)
      |
      v
ui-ux-specialist         --> docs/ui-ux-plan.md
      |
      v
tech-lead-specialist     --> docs/dev-plan.md
      |
      v
frontend-specialist  ──┐
                       ├──> parallel
backend-specialist   ──┘
      |
      v
docs/frontend-plan.md + docs/backend-plan.md
```

### Step 2: Complete — `/complete-plan`

Generates `progress.json` from the finalized plans. Classifies every task as `low` or `high` complexity and assigns the right coder agent.

```
/complete-plan
```

**Output:** `docs/progress.json` with all tasks, dependencies, and agent assignments.

### Step 3: Execute — `/execute-phase`

Builds a specific phase by spawning multiple coder agents in parallel. One agent per task, all running simultaneously.

```
/execute-phase 0        # Foundation
/execute-phase 1        # Backend
/execute-phase 2        # Shared UI
/execute-phase 3        # Features
/execute-phase 4        # Integration
/execute-phase 5        # Polish
/execute-phase          # asks which phase
```

**Agent assignment:**
- `complexity: "low"` tasks --> `small-coder` (Sonnet, fast)
- `complexity: "high"` tasks --> `high-coder` (Opus, deep reasoning)

Example: Phase 2 with 5 tasks (3 low, 2 high) spawns 3 small-coders + 2 high-coders in parallel.

### Step 4: Adjust — `/developer`

Handles changes after all phases are complete. Tracks everything in a separate `changes.json`.

```
/developer fix the login button hover state
/developer add dark mode toggle
/developer                                   # asks what to change
```

Each invocation creates a new batch (`C1`, `C2`, `C3`...) preserving full change history.

### Revise Plans — `/review-plan`

Edit existing plans based on feedback. Same agent flow as `/plan` but in edit mode.

```
/review-plan change auth to OAuth
/review-plan add a notifications feature
/review-plan                                 # asks what to change
```

Updates all plan files + regenerates `progress.json` if it exists.

## Skills Reference

| Skill | Purpose | Input |
|-------|---------|-------|
| `/plan` | Create all plans from PRD | PRD file + user preferences |
| `/complete-plan` | Generate progress.json | Existing plan files |
| `/review-plan` | Edit existing plans | User feedback (args or prompt) |
| `/execute-phase N` | Build phase N with parallel agents | Phase number |
| `/developer` | Post-completion adjustments | Change request (args or prompt) |
| `/info` | Plugin ecosystem overview | None |

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `ui-ux-specialist` | Opus | Design system, wireframes, user flows, WCAG accessibility |
| `tech-lead-specialist` | Opus | Single source of truth dev plan from UI/UX plan |
| `frontend-specialist` | Opus | Component specs, Bulletproof React structure, shadcn mapping |
| `backend-specialist` | Opus | Schema, migrations, RLS policies, Supabase best practices |
| `progress-creator` | Opus | Parse plans into structured progress.json with complexity classification |
| `high-coder` | Opus | Execute complex multi-file tasks (3+ files) |
| `small-coder` | Sonnet | Execute small isolated tasks (1-2 files, fast) |

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

## Repository Structure

```
marketplace-potenlab/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace catalog
├── plugins/
│   └── potenlab-workflow/
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin metadata (v0.2.0)
│       ├── agents/               # 7 specialist + coder agents
│       ├── commands/             # Slash commands
│       │   └── hello.md
│       ├── references/           # Supabase Postgres best practices (30 rules)
│       ├── rules/                # Vercel React best practices (57 rules)
│       ├── skills/               # 6 orchestration skills
│       │   ├── plan/
│       │   ├── complete-plan/
│       │   ├── review-plan/
│       │   ├── execute-phase/
│       │   ├── developer/
│       │   └── info/
│       └── README.md
├── CLAUDE.md
└── README.md
```

## Requirements

- Claude Code CLI
- A PRD file (markdown) to start planning

### Optional MCP servers

These enhance agent capabilities but are not required:

| MCP Server | Used By | Purpose |
|------------|---------|---------|
| `shadcn` | frontend-specialist, ui-ux-specialist | Component discovery |
| `context7` | frontend-specialist, backend-specialist | Library documentation |
| `postgres` | backend-specialist | Database state inspection |

## License

MIT
