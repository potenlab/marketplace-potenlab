<purpose>
Execute the complete Potenlab project from roadmap to working application with persistent context tracking.

This workflow:
1. Validates project initialization (ROADMAP.md, PROJECT.md exist)
2. Extracts all phases from roadmap
3. For each phase: plan → clear → execute → detect tech → update CLAUDE.md
4. Maintains persistent context in .claude/CLAUDE.md for future AI sessions
5. Tracks MCP server recommendations based on detected tech stack
</purpose>

<project_validation>

**Required files before execution:**

| File | Purpose | If Missing |
|------|---------|------------|
| .planning/ROADMAP.md | Phase definitions | Run /potenlab:start-project first |
| .planning/PROJECT.md | Project context | Run /potenlab:start-project first |
| .planning/STATE.md | Execution state | Run /potenlab:start-project first |
| .planning/config.json | GSD configuration | Run /potenlab:start-project first |

**Validation check:**

```bash
# All must exist
[ -f ".planning/ROADMAP.md" ] || echo "MISSING: ROADMAP.md"
[ -f ".planning/PROJECT.md" ] || echo "MISSING: PROJECT.md"
[ -f ".planning/STATE.md" ] || echo "MISSING: STATE.md"
[ -f ".planning/config.json" ] || echo "MISSING: config.json"
```

**If any missing:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚠ PROJECT NOT INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Missing required files. Please run:

  /potenlab:start-project

This initializes the project from your PRD and creates:
- PROJECT.md, ROADMAP.md, STATE.md
- Tech stack scaffolding
- Phase discussions
```

</project_validation>

<phase_extraction>

**Parse ROADMAP.md for phases:**

Look for phase headers in format:
```
## Phase [N]: [Name]
```

Or decimal phases:
```
## Phase [N.M]: [Name]
```

**Extract phase metadata:**

For each phase, capture:
- `phase_number`: The number (1, 2, 3... or 1.1, 1.2...)
- `phase_name`: The title after colon
- `phase_goal`: First line of phase description (often starts with "Goal:")
- `phase_dir`: Directory name (e.g., `01-setup`, `02-auth`)

**Example extraction:**

```
## Phase 1: Project Setup & Foundation
Goal: Establish base project structure with core dependencies.

Extracted:
- phase_number: 1
- phase_name: "Project Setup & Foundation"
- phase_goal: "Establish base project structure with core dependencies"
- phase_dir: "01-project-setup-foundation" (slugified)
```

**Phase ordering:**

- Sort by phase number (numeric)
- Decimal phases come after their integer parent (1, 1.1, 1.2, 2, 2.1, 3...)
- Execute in order unless user specifies otherwise

</phase_extraction>

<execution_cycle>

**Per-phase execution cycle:**

```
┌─────────────────────────────────────────────────────┐
│ PHASE N                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. /gsd:plan-phase [N]                            │
│     └─ Creates PLAN.md with tasks                  │
│                                                     │
│  2. /clear                                         │
│     └─ Frees context for execution                 │
│                                                     │
│  3. /gsd:execute-phase [N]                         │
│     └─ Executes all tasks in plan                  │
│     └─ Creates atomic commits                      │
│                                                     │
│  4. Detect tech configurations                     │
│     └─ Scan new/modified files                     │
│     └─ Identify tech stack additions               │
│                                                     │
│  5. Update .claude/CLAUDE.md                       │
│     └─ Add completed phase                         │
│     └─ Add tech configurations                     │
│     └─ Add MCP recommendations                     │
│                                                     │
│  6. Commit CLAUDE.md                               │
│     └─ Persist context changes                     │
│                                                     │
│  7. /clear                                         │
│     └─ Fresh context for next phase                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**State tracking:**

Update STATE.md after each phase:
- Mark phase as completed
- Record completion timestamp
- Note any deviations or issues

</execution_cycle>

<tech_detection>

**When to detect:**

Run tech detection AFTER execute-phase completes, before CLAUDE.md update.

**Detection method:**

1. Get files changed in this phase:
   ```bash
   git diff --name-only HEAD~[commits_in_phase]
   ```

2. Scan for tech patterns in changed files:
   ```bash
   # Check file names and contents
   grep -r "pattern" --include="*.ts" --include="*.tsx" --include="*.json"
   ```

3. Check for new config files:
   ```bash
   ls -la *.config.* .env* */config.* 2>/dev/null
   ```

**Tech detection patterns:**

### Database/Backend Services

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| Supabase | `supabase/`, `*supabase*.ts` | `@supabase/`, `createClient` | `supabase` |
| Firebase | `firebase.json`, `*firebase*.ts` | `firebase/`, `initializeApp` | - |
| Prisma | `prisma/schema.prisma` | `@prisma/client`, `PrismaClient` | - |
| Drizzle | `drizzle.config.ts`, `drizzle/` | `drizzle-orm` | - |
| MongoDB | `*mongo*.ts` | `mongodb`, `mongoose` | - |
| PostgreSQL | - | `pg`, `postgres` | - |

### Authentication

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| Clerk | `middleware.ts` with clerk | `@clerk/`, `ClerkProvider` | - |
| Auth.js | `auth.ts`, `[...nextauth]` | `next-auth`, `@auth/` | - |
| Supabase Auth | - | `supabase.auth`, `signIn`, `signUp` | `supabase` |
| Firebase Auth | - | `firebase/auth`, `signInWith` | - |

### Payments

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| Stripe | `*stripe*.ts` | `@stripe/`, `Stripe(` | - |
| LemonSqueezy | - | `@lemonsqueezy/` | - |
| Paddle | - | `@paddle/` | - |

### Email

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| Resend | - | `resend`, `Resend(` | - |
| SendGrid | - | `@sendgrid/mail` | - |
| Postmark | - | `postmark` | - |

### File Storage

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| UploadThing | `uploadthing.ts` | `@uploadthing/`, `createUploadthing` | - |
| Cloudinary | - | `cloudinary` | - |
| S3 | - | `@aws-sdk/client-s3`, `S3Client` | - |
| Supabase Storage | - | `supabase.storage` | `supabase` |

### AI/ML

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| OpenAI | - | `openai`, `OpenAI(` | - |
| Anthropic | - | `@anthropic-ai/sdk` | - |
| Vercel AI | - | `ai`, `@ai-sdk/` | - |
| Replicate | - | `replicate` | - |

### State Management

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| Zustand | `*store*.ts` | `zustand`, `create(` | - |
| Jotai | - | `jotai`, `atom(` | - |
| TanStack Query | - | `@tanstack/react-query` | - |
| Redux | - | `@reduxjs/toolkit` | - |

### UI Libraries

| Technology | File Patterns | Content Patterns | MCP Server |
|------------|---------------|------------------|------------|
| shadcn/ui | `components/ui/` | `@/components/ui` | - |
| Radix UI | - | `@radix-ui/` | - |
| Headless UI | - | `@headlessui/` | - |
| Chakra UI | - | `@chakra-ui/` | - |

</tech_detection>

<claude_md_updates>

**CLAUDE.md update procedure:**

### 1. Read existing content

```typescript
const existing = readFile('.claude/CLAUDE.md')
```

### 2. Parse sections

Identify sections by headers:
- `## Project Overview`
- `## Tech Stack Configuration`
- `## Completed Phases`
- `## Active Configuration Notes`
- `## MCP Servers in Use`
- `## Key File Locations`

### 3. Update "Completed Phases" table

Add new row after existing rows:

```markdown
| [N] | [Phase Name] | [YYYY-MM-DD] | [Key outputs summary] |
```

Key outputs should be concise:
- "Project structure, dependencies"
- "User auth with Clerk, protected routes"
- "Stripe checkout, webhook handling"

### 4. Update "Tech Stack Configuration" table

For each newly detected technology:

```markdown
| [Technology] | ✓ | [MCP or -] | [Brief note] |
```

### 5. Add configuration note (if new tech detected)

Under `## Active Configuration Notes`, add:

```markdown
### [Technology] Configuration

- **Configured in Phase**: [N]
- **Config Files**: [list key files]
- **MCP Server**: [recommendation or "N/A"]
- **Key Setup**:
  - [Important detail 1]
  - [Important detail 2]
  - [Environment variables if any]
```

### 6. Update "MCP Servers in Use" (if applicable)

When MCP-supported tech detected:

```markdown
- **[mcp-server]**: [Usage recommendation]
  - [Specific guidance]
```

### 7. Update timestamp

```markdown
*Last updated: [YYYY-MM-DD HH:MM]*
```

### 8. Write and commit

```bash
git add .claude/CLAUDE.md
git commit -m "docs: update project context after Phase [N]"
```

</claude_md_updates>

<mcp_recommendations>

**MCP Server Recommendations:**

When these technologies are detected, add specific MCP guidance:

### Supabase → `supabase` MCP

```markdown
- **supabase**: Use for all database operations
  - Prefer MCP queries over raw Supabase client for complex operations
  - MCP provides better context awareness for schema
  - Use for: SELECT, INSERT, UPDATE, DELETE, RPC calls
  - Auth operations also supported via MCP
```

### Context7 → `context7` MCP

```markdown
- **context7**: Use for library documentation lookups
  - Query package docs before implementing new libraries
  - Get up-to-date API references
  - Useful for: React, Next.js, Tailwind, any npm package
```

### GitHub → `github` MCP (if applicable)

```markdown
- **github**: Use for repository operations
  - Create issues, PRs
  - Manage branches
  - Query repository data
```

### Filesystem → `filesystem` MCP (if applicable)

```markdown
- **filesystem**: Use for file operations outside project
  - Read/write to allowed directories
  - Useful for: config files, shared resources
```

</mcp_recommendations>

<error_recovery>

**Phase planning fails:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚠ PLANNING FAILED: Phase [N]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase [N] planning could not complete.

Options:
1. Retry planning — Try /gsd:plan-phase [N] again
2. Skip to next phase — Continue with Phase [N+1]
3. Stop execution — Pause for manual intervention

[If context issues suspected:]
Consider running /clear first, then retry.
```

**Phase execution fails:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚠ EXECUTION FAILED: Phase [N]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase [N] execution encountered errors.

Partial progress has been saved.

Options:
1. Retry execution — Resume from last checkpoint
2. Skip to next phase — Mark phase incomplete, continue
3. Stop execution — Pause for debugging

Check .planning/phases/[XX-name]/STATE.md for details.
```

**Tech detection fails:**

Non-blocking. Log warning and continue:

```
⚠ Tech detection incomplete for Phase [N]
  Some configurations may not be captured in CLAUDE.md
  You can manually update .claude/CLAUDE.md later
```

**CLAUDE.md update fails:**

Non-blocking. Log warning and continue:

```
⚠ Could not update CLAUDE.md after Phase [N]
  Execution will continue
  Remember to update context manually if needed
```

</error_recovery>

<state_management>

**Track execution state:**

Update `.planning/STATE.md` with execution progress:

```markdown
## Current Execution

- **Command**: /potenlab:execute-project
- **Started**: [timestamp]
- **Mode**: [all phases / from phase N / single phase N]

## Phase Progress

| Phase | Plan | Execute | Tech Detect | Context Update |
|-------|------|---------|-------------|----------------|
| 1 | ✓ | ✓ | ✓ | ✓ |
| 2 | ✓ | ✓ | ✓ | ✓ |
| 3 | ✓ | In Progress | - | - |
| 4 | - | - | - | - |

## Last Checkpoint

- **Phase**: 3
- **Step**: execute-phase
- **Timestamp**: [timestamp]
- **Notes**: [any relevant notes]
```

**Resume capability:**

If execution is interrupted:
1. Read STATE.md to find last checkpoint
2. Ask user: "Resume from Phase [N] or start over?"
3. If resume, skip completed phases

</state_management>

<completion_checklist>

Before marking execution complete, verify:

**Per-Phase:**
- [ ] /gsd:plan-phase completed → PLAN.md exists
- [ ] /gsd:execute-phase completed → Code changes committed
- [ ] Tech detection ran → New technologies identified
- [ ] CLAUDE.md updated → Phase and tech documented
- [ ] Context cleared → Ready for next phase

**Overall:**
- [ ] All phases executed (or intentionally skipped)
- [ ] CLAUDE.md contains complete project context
- [ ] MCP recommendations added for relevant tech
- [ ] STATE.md shows all phases complete
- [ ] User informed of verification/audit options

</completion_checklist>

<output_format>

**Phase start:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PHASE [N] of [TOTAL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Phase Name]
└─ [Phase Goal]

▶ Step 1/4: Planning...
```

**Phase progress:**

```
✓ Step 1/4: Plan created
▶ Step 2/4: Executing...
```

**Phase complete:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✓ PHASE [N] COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Outputs:
  • Plan: .planning/phases/[XX]/PLAN.md
  • Code: [N] files changed, [M] commits

Tech Configured:
  • [Technology] → [MCP if any]

Context: .claude/CLAUDE.md updated

───────────────────────────────────────────────────────
```

**Final summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► EXECUTION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Project Name]

Phases: [N]/[N] complete

Tech Stack:
  • [Tech 1] [MCP badge if any]
  • [Tech 2]
  • [Tech 3]

Context persisted: .claude/CLAUDE.md

▶ Next: /gsd:verify-work or /gsd:audit-milestone
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</output_format>
