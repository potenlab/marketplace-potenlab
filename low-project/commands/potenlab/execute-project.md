---
name: potenlab:execute-project
description: Execute all phases with auto plan-clear-execute cycle and persistent context tracking
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Task
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
---

<objective>

Execute the full project from roadmap to completion with automated workflow:

1. Read ROADMAP.md to get all phases
2. For each phase:
   - Run `/gsd:plan-phase [N]` to create execution plan
   - Run `/clear` to free context
   - Run `/gsd:execute-phase [N]` to execute the plan
3. After each phase execution:
   - Detect tech stack configurations (Supabase, Firebase, etc.)
   - Update `.claude/CLAUDE.md` with project context for AI persistence
   - Track completed phases and configurations

**This command automates the full execution flow so you go from roadmap to working project in one command.**

</objective>

<execution_context>

@./.planning/ROADMAP.md
@./.planning/PROJECT.md
@./.planning/STATE.md
@./.planning/config.json
@./.claude/CLAUDE.md
@./.claude/get-shit-done/workflows/potenlab/execute-project.md

</execution_context>

<process>

## Phase 1: Validate Project Setup

**Check that project was initialized:**

```bash
# Verify required files exist
[ -f ".planning/ROADMAP.md" ] && echo "ROADMAP found" || echo "ERROR: ROADMAP.md not found"
[ -f ".planning/PROJECT.md" ] && echo "PROJECT found" || echo "ERROR: PROJECT.md not found"
[ -f ".planning/STATE.md" ] && echo "STATE found" || echo "ERROR: STATE.md not found"
```

**If any missing:** Display error and suggest running `/potenlab:start-project` first.

**Read current state:**

Read `.planning/STATE.md` to check:
- Current milestone
- Current phase (if any in progress)
- Execution status

## Phase 2: Extract Phases from Roadmap

**Parse ROADMAP.md:**

```bash
# Extract phase numbers and names from ROADMAP.md
PHASES=$(grep -E "^## Phase [0-9]+" .planning/ROADMAP.md)
PHASE_COUNT=$(echo "$PHASES" | wc -l | tr -d ' ')
```

**Extract phase details:**

For each phase, extract:
- Phase number
- Phase name/title
- Phase goal (first line of phase description)

**Display execution plan:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PROJECT EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found [PHASE_COUNT] phases to execute:

[For each phase:]
  Phase [N]: [Phase Name]
  └─ [Phase Goal]

Workflow per phase:
  1. /gsd:plan-phase [N] — Create execution plan
  2. /clear — Free context window
  3. /gsd:execute-phase [N] — Execute the plan
  4. Update CLAUDE.md — Persist configuration context
```

## Phase 3: Ask Execution Preferences

**Use AskUserQuestion:**

- header: "Execution Mode"
- question: "How would you like to execute the phases?"
- options:
  - "Execute all phases" — Run through every phase automatically (Recommended)
  - "Start from specific phase" — Choose where to begin
  - "Execute single phase" — Run just one phase

**If "Start from specific phase" or "Execute single phase":**

Use AskUserQuestion:
- header: "Select Phase"
- question: "Which phase?"
- options: [Generate from phase list]

Store the starting phase number.

## Phase 4: Initialize CLAUDE.md

**Check if .claude/CLAUDE.md exists:**

```bash
[ -f ".claude/CLAUDE.md" ] && echo "CLAUDE.md exists" || echo "Creating CLAUDE.md"
```

**If CLAUDE.md doesn't exist, create it:**

```markdown
# Project Context for AI

> This file maintains project context across conversation sessions.
> Updated automatically by `/potenlab:execute-project`.

## Project Overview

- **Project**: [Read from PROJECT.md]
- **Started**: [Current date]
- **Status**: In Progress

## Tech Stack Configuration

<!-- Updated after each phase execution -->

| Technology | Configured | MCP Server | Notes |
|------------|------------|------------|-------|

## Completed Phases

<!-- Updated after each phase execution -->

| Phase | Name | Completed | Key Outputs |
|-------|------|-----------|-------------|

## Active Configuration Notes

<!-- Add specific configuration reminders here -->

## MCP Servers in Use

<!-- List any MCP servers configured for this project -->

---

*Last updated: [timestamp]*
```

**If CLAUDE.md exists, read current content to preserve it.**

## Phase 5: Execute Each Phase

**For each phase (starting from selected phase):**

### Step 5.1: Display Phase Header

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PHASE [N] of [TOTAL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Phase Name]
[Phase Goal]

Step 1/3: Planning...
```

### Step 5.2: Run Plan Phase

Use the Skill tool:
```
Skill(skill="gsd:plan-phase", args="[phase_number]")
```

Wait for plan-phase to complete. This creates:
- `.planning/phases/[XX-name]/PLAN.md`

**After planning completes:**

```
✓ Plan created for Phase [N]
  └─ .planning/phases/[XX-name]/PLAN.md

Step 2/3: Clearing context...
```

### Step 5.3: Clear Context

Run `/clear` command to free up context window.

```
✓ Context cleared

Step 3/3: Executing...
```

### Step 5.4: Run Execute Phase

Use the Skill tool:
```
Skill(skill="gsd:execute-phase", args="[phase_number]")
```

Wait for execute-phase to complete.

### Step 5.5: Detect Tech Stack Configurations

**After each phase execution, analyze what was configured:**

Read the phase directory and any new configuration files:

```bash
# Check for new/modified config files
git diff --name-only HEAD~1 | grep -iE "(config|env|supabase|firebase|prisma|drizzle)"
```

**Tech stack detection patterns:**

| Pattern | Technology | MCP Server | Action |
|---------|-----------|------------|--------|
| `supabase` in files | Supabase | `supabase` MCP | Add Supabase context |
| `firebase` in files | Firebase | - | Add Firebase context |
| `prisma` schema | Prisma ORM | - | Add Prisma context |
| `drizzle` config | Drizzle ORM | - | Add Drizzle context |
| `.env` with `OPENAI` | OpenAI | - | Add OpenAI context |
| `stripe` in files | Stripe | - | Add Stripe context |
| `@auth` imports | Auth.js | - | Add Auth context |
| `clerk` in files | Clerk | - | Add Clerk context |
| `resend` in files | Resend | - | Add Resend context |
| `uploadthing` | UploadThing | - | Add upload context |

### Step 5.6: Update CLAUDE.md

**Read current CLAUDE.md and update with new information:**

**Update "Completed Phases" table:**

Add row:
```markdown
| [N] | [Phase Name] | [Date] | [Key outputs from phase] |
```

**Update "Tech Stack Configuration" table:**

For each detected technology:
```markdown
| [Technology] | ✓ | [MCP if applicable] | [Notes] |
```

**Add specific configuration notes:**

For each detected configuration:

```markdown
### [Technology] Configuration

- **Configured in Phase**: [N]
- **Config Files**: [list files]
- **MCP Server**: [if applicable, e.g., "Use `supabase` MCP for database operations"]
- **Key Setup**:
  - [Relevant configuration details]
  - [Environment variables needed]
  - [Important patterns to follow]
```

**Example Supabase entry:**

```markdown
### Supabase Configuration

- **Configured in Phase**: 2
- **Config Files**: `src/lib/supabase.ts`, `supabase/config.toml`
- **MCP Server**: Use `supabase` MCP for all database queries and operations
- **Key Setup**:
  - Client initialized in `src/lib/supabase.ts`
  - Types generated at `src/types/supabase.ts`
  - Environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
```

**Example Firebase entry:**

```markdown
### Firebase Configuration

- **Configured in Phase**: 3
- **Config Files**: `src/lib/firebase.ts`, `firebase.json`
- **Key Setup**:
  - App initialized in `src/lib/firebase.ts`
  - Auth configured with Google provider
  - Firestore rules in `firestore.rules`
```

**Update timestamp:**

```markdown
*Last updated: [current timestamp]*
```

### Step 5.7: Commit CLAUDE.md Update

```bash
git add .claude/CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update project context after Phase [N]

- Added [technology] configuration notes
- Updated completed phases table
- [Any MCP server notes]
EOF
)"
```

### Step 5.8: Display Phase Complete

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✓ PHASE [N] COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Outputs:
- Plan: .planning/phases/[XX-name]/PLAN.md
- Execution: [files created/modified]

Context Updated:
- .claude/CLAUDE.md updated with:
  [List any new tech configurations added]

[If more phases remain:]
Continuing to Phase [N+1]...

───────────────────────────────────────────────────────────────
```

### Step 5.9: Clear and Continue

Run `/clear` to free context before next phase.

**Repeat from Step 5.1 for next phase.**

## Phase 6: Project Completion

**After all phases executed:**

**Final CLAUDE.md update:**

Add completion section:

```markdown
## Project Completion

- **Completed**: [Date]
- **Total Phases**: [N]
- **Execution Method**: /potenlab:execute-project

### Full Tech Stack

[Consolidated list of all technologies configured]

### Key Files Reference

| Purpose | File |
|---------|------|
| [Purpose] | [Path] |
```

**Display final summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PROJECT EXECUTION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name]**

## Phases Executed

[For each phase:]
  ✓ Phase [N]: [Name]

## Tech Stack Configured

[For each technology:]
  • [Technology] [MCP if applicable]

## Context Persisted

All configuration context saved to:
  .claude/CLAUDE.md

Future AI sessions will know:
  - Which tech stack is configured
  - Which MCP servers to use
  - Project structure and patterns
  - Key file locations

───────────────────────────────────────────────────────────────

## ▶ Next Step

The project is built! Now verify and complete the milestone:

**Next Step:**

`/potenlab:complete-project` — Verify features and complete milestone

This will:
1. Run UAT verification (`/gsd:verify-work`)
2. Fix any failures found during verification
3. Complete the milestone (`/gsd:complete-milestone`)
4. Update CLAUDE.md with completion status

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────
```

</process>

<tech_detection_rules>

## Technology Detection Patterns

Use these patterns to detect what was configured in each phase:

### Database/Backend Services

**Supabase:**
- Files: `supabase/`, `supabase.ts`, `@supabase/`
- Env: `SUPABASE_URL`, `SUPABASE_KEY`
- MCP: `supabase` - Use for all database queries
- Note: "Use Supabase MCP for database operations instead of raw SQL"

**Firebase:**
- Files: `firebase.ts`, `firebase.json`, `firebaseConfig`
- Env: `FIREBASE_`, `NEXT_PUBLIC_FIREBASE_`
- Note: "Firebase initialized - use Firebase SDK methods"

**Prisma:**
- Files: `prisma/schema.prisma`, `@prisma/client`
- Note: "Use Prisma client for database queries"

**Drizzle:**
- Files: `drizzle.config.ts`, `drizzle/`
- Note: "Use Drizzle ORM for type-safe queries"

### Authentication

**Clerk:**
- Files: `@clerk/`, `clerk.ts`
- Env: `CLERK_`, `NEXT_PUBLIC_CLERK_`
- Note: "Clerk handles auth - use Clerk hooks/components"

**Auth.js (NextAuth):**
- Files: `auth.ts`, `next-auth`, `@auth/`
- Env: `NEXTAUTH_`, `AUTH_`
- Note: "Auth.js configured - use session hooks"

**Supabase Auth:**
- Files: `supabase.auth`, `createClient`
- Note: "Use Supabase auth methods, MCP supports auth queries"

### Email/Notifications

**Resend:**
- Files: `resend`, `@resend/`
- Env: `RESEND_API_KEY`
- Note: "Resend for transactional emails"

**SendGrid:**
- Files: `@sendgrid/`
- Env: `SENDGRID_API_KEY`

### Payments

**Stripe:**
- Files: `stripe.ts`, `@stripe/`
- Env: `STRIPE_`, `NEXT_PUBLIC_STRIPE_`
- Note: "Stripe configured for payments"

**LemonSqueezy:**
- Files: `lemonsqueezy`, `@lemonsqueezy/`
- Note: "LemonSqueezy for payments"

### File Upload

**UploadThing:**
- Files: `uploadthing`, `@uploadthing/`
- Env: `UPLOADTHING_`
- Note: "UploadThing for file uploads"

**Cloudinary:**
- Files: `cloudinary`
- Env: `CLOUDINARY_`

### AI/ML

**OpenAI:**
- Files: `openai`, `@openai/`
- Env: `OPENAI_API_KEY`
- Note: "OpenAI configured - use OpenAI SDK"

**Anthropic:**
- Files: `@anthropic-ai/`
- Env: `ANTHROPIC_API_KEY`

**Vercel AI SDK:**
- Files: `ai`, `@ai-sdk/`
- Note: "Vercel AI SDK for streaming responses"

### State Management

**Zustand:**
- Files: `zustand`, `create(` with `set(`
- Note: "Zustand stores in src/stores/"

**TanStack Query:**
- Files: `@tanstack/react-query`
- Note: "TanStack Query for server state"

### Styling

**Tailwind CSS:**
- Files: `tailwind.config`
- Note: "Tailwind CSS configured"

**shadcn/ui:**
- Files: `components/ui/`, `@/components/ui`
- Note: "shadcn/ui components available in components/ui/"

</tech_detection_rules>

<claude_md_template>

## CLAUDE.md Structure

```markdown
# Project Context for AI

> This file maintains project context across conversation sessions.
> Updated automatically by `/potenlab:execute-project`.

## Project Overview

- **Project**: [Name]
- **Description**: [One-line description]
- **Started**: [Date]
- **Status**: [In Progress / Complete]

## Tech Stack Configuration

| Technology | Configured | MCP Server | Notes |
|------------|------------|------------|-------|
| Next.js | ✓ | - | App Router in src/app/ |
| Supabase | ✓ | supabase | Use MCP for DB queries |
| Clerk | ✓ | - | Auth via Clerk hooks |

## Completed Phases

| Phase | Name | Completed | Key Outputs |
|-------|------|-----------|-------------|
| 1 | Setup & Foundation | 2024-01-15 | Project structure, dependencies |
| 2 | Authentication | 2024-01-16 | Clerk integration, protected routes |

## Active Configuration Notes

### Supabase Configuration

- **Configured in Phase**: 2
- **Config Files**: `src/lib/supabase.ts`
- **MCP Server**: Use `supabase` MCP for all database operations
- **Key Setup**:
  - Client: `src/lib/supabase.ts`
  - Types: `src/types/supabase.ts`
  - Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Clerk Configuration

- **Configured in Phase**: 3
- **Config Files**: `src/middleware.ts`, `src/app/providers.tsx`
- **Key Setup**:
  - Middleware protects `/dashboard/*` routes
  - ClerkProvider wraps app in providers.tsx
  - Env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

## MCP Servers in Use

- **supabase**: Use for all database queries, auth operations, and storage
  - Prefer MCP over raw Supabase client when available
  - MCP provides better context and error handling

## Key File Locations

| Purpose | Path |
|---------|------|
| Database client | src/lib/supabase.ts |
| Auth middleware | src/middleware.ts |
| API routes | src/app/api/ |
| Feature modules | src/features/ |
| UI components | src/components/ui/ |

## Project Patterns

- **Feature modules**: Each feature in `src/features/<name>/` with components, hooks, api
- **API routes**: REST endpoints in `src/app/api/<resource>/route.ts`
- **Database queries**: Use Supabase MCP, types from `src/types/supabase.ts`
- **Auth checks**: Use `auth()` from Clerk in server components

---

*Last updated: [timestamp]*
```

</claude_md_template>

<success_criteria>

- [ ] Project files validated (ROADMAP.md, PROJECT.md, STATE.md exist)
- [ ] All phases extracted from ROADMAP.md
- [ ] User selected execution mode
- [ ] .claude/CLAUDE.md initialized or read
- [ ] For each phase:
  - [ ] /gsd:plan-phase executed
  - [ ] /clear executed after planning
  - [ ] /gsd:execute-phase executed
  - [ ] Tech stack configurations detected
  - [ ] CLAUDE.md updated with new configurations
  - [ ] CLAUDE.md changes committed
  - [ ] /clear executed before next phase
- [ ] Final CLAUDE.md contains all project context
- [ ] User informed of next steps

</success_criteria>

<error_handling>

**If phase planning fails:**
- Display error message
- Ask user: "Retry planning" or "Skip to next phase" or "Stop execution"

**If phase execution fails:**
- Display error message
- Save partial progress to STATE.md
- Ask user: "Retry execution" or "Skip to next phase" or "Stop execution"

**If CLAUDE.md update fails:**
- Continue with execution (non-blocking)
- Note the failure for manual update later

**If /clear fails:**
- Continue without clearing (warning only)
- Note context may be heavy

</error_handling>

<notes>

**Potenlab Workflow:**

This command is the second step in the Potenlab automation:

```
/potenlab:start-project
        ↓
/potenlab:execute-project  ← You are here
        ↓
/potenlab:complete-project
```

**Context Management:**

The `/clear` commands are strategic:
1. After plan-phase → Free context before execution
2. After execute-phase → Free context before next phase

This ensures each phase has maximum context window available.

**CLAUDE.md Purpose:**

This file serves as persistent memory for AI sessions:
- New conversations read CLAUDE.md to understand project state
- Prevents re-explaining tech stack each session
- MCP server recommendations are immediately visible
- Key file locations reduce exploration time

**Tech Detection:**

Detection runs after each phase execution because:
- Different phases set up different technologies
- Early detection allows immediate context updates
- MCP usage recommendations are phase-specific

**Incremental Updates:**

CLAUDE.md is updated incrementally:
- Each phase adds its own section
- Previous sections are preserved
- Timestamp tracks currency of information

</notes>
