<purpose>
Execute the complete Potenlab project initialization workflow from PRD to ready-for-planning state.

This workflow:
1. Locates and analyzes the PRD document
2. Extracts tech stack information
3. Delegates to GSD new-project for core initialization
4. Scaffolds tech-specific structure (e.g., Next.js)
5. Runs discuss-phase for all phases in the roadmap
</purpose>

<prd_analysis>

**What to extract from PRD:**

| Section | What to look for | Used for |
|---------|------------------|----------|
| Overview | Product description, vision | PROJECT.md "What This Is" |
| Features | User stories, requirements | REQUIREMENTS.md scope |
| Tech Stack | Frameworks, libraries, DBs | Scaffold decision |
| Constraints | Timeline, budget, limits | PROJECT.md constraints |
| Success | Acceptance criteria | Phase success criteria |

**Tech stack detection patterns:**

Frontend frameworks:
- `next.js`, `nextjs`, `Next.js`, `Next JS`
- `react`, `React`, `ReactJS`
- `vue`, `Vue.js`, `Vue 3`
- `angular`, `Angular`
- `svelte`, `SvelteKit`

Backend frameworks:
- `node.js`, `nodejs`, `Node`, `Express`
- `python`, `django`, `fastapi`, `flask`
- `go`, `golang`, `Gin`, `Echo`
- `rust`, `actix`, `axum`
- `java`, `spring`, `Spring Boot`

Databases:
- `postgresql`, `postgres`, `Postgres`
- `mongodb`, `mongo`, `MongoDB`
- `mysql`, `MySQL`, `MariaDB`
- `sqlite`, `SQLite`
- `redis`, `Redis`
- `supabase`, `Supabase`
- `firebase`, `Firestore`

</prd_analysis>

<scaffold_decision>

**When to scaffold Next.js:**

Trigger scaffold when ANY of these patterns found in PRD:
- Explicit: "Next.js", "NextJS", "next.js"
- Implied: "React" + "SSR" or "server-side rendering"
- Implied: "React" + "SEO" requirements
- Framework: "Vercel" deployment mentioned

**Scaffold conditions:**

```
IF tech_stack contains "next" (case-insensitive)
AND NOT exists(src/app/layout.tsx)
AND NOT exists(app/layout.tsx)
THEN scaffold_nextjs()
```

**When to scaffold ExpressJS:**

Trigger scaffold when ANY of these patterns found in PRD:
- Explicit: "Express", "ExpressJS", "express.js"
- Implied: "Node.js" + "REST API" or "API server"
- Implied: "Node.js" + "backend"

**Scaffold conditions:**

```
IF tech_stack contains "express" (case-insensitive)
AND NOT exists(server/index.ts)
AND NOT exists(src/server.ts)
THEN scaffold_expressjs()
```

**Do not scaffold if:**
- Project already has the framework structure
- User explicitly wants different framework
- PRD specifies different approach

</scaffold_decision>

<gsd_integration>

**Handoff to /gsd:new-project:**

The PRD provides context that should be fed into the questioning phase:

1. **Pre-populate answers** where PRD is clear:
   - Product description → "What do you want to build?"
   - Feature list → Active requirements
   - Constraints → PROJECT.md constraints section

2. **Let GSD question** where PRD is vague:
   - Core value (if not explicit)
   - Scope boundaries
   - Workflow preferences

3. **Don't duplicate work:**
   - If PRD has clear requirements → minimize questioning
   - If PRD is high-level → let GSD deep-dive

**Expected artifacts from GSD:**
- `.planning/PROJECT.md`
- `.planning/config.json`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/research/` (optional)

</gsd_integration>

<discuss_all_phases>

**After GSD completes:**

1. **Parse ROADMAP.md** to get phase list:
   ```
   ## Phase 1: [Name]
   ## Phase 2: [Name]
   ...
   ```

2. **For each phase**, run `/gsd:discuss-phase [N]`:
   - Identifies gray areas for that phase
   - Captures implementation decisions
   - Creates `{phase}-CONTEXT.md`

3. **IMPORTANT: Clear context after each discussion:**
   - After discuss-phase completes and CONTEXT.md is created
   - Run `/clear` to reset the conversation context
   - This prevents context overflow with large projects
   - Each phase discussion starts with fresh context

4. **Batch discussion option:**
   - User can discuss all phases sequentially
   - User can select specific phases
   - User can skip discussion entirely

**Phase discussion order:**
- Always start with Phase 1
- Continue sequentially
- Run `/clear` after each phase discussion completes
- Each phase discussion should be quick (5-10 min)
- Focus on decisions that affect implementation

</discuss_all_phases>

<expressjs_scaffold_process>

**Directory structure to create:**

```bash
# Core directories for backend
mkdir -p server/api/healthCheck/__tests__
mkdir -p server/api/user/__tests__
mkdir -p server/api-docs/__tests__
mkdir -p server/common/middleware
mkdir -p server/common/models
mkdir -p server/common/utils
```

**Files to create:**

| File | Purpose |
|------|---------|
| server/index.ts | App bootstrap with middleware and routes |
| server/server.ts | Server entry with graceful shutdown |
| server/api/healthCheck/healthCheckRouter.ts | Health endpoint |
| server/api/user/userRouter.ts | User routes |
| server/api/user/userController.ts | Request handlers |
| server/api/user/userService.ts | Business logic |
| server/api/user/userRepository.ts | Data access |
| server/api/user/userModel.ts | Type definitions |
| server/common/middleware/errorHandler.ts | Central error handling |
| server/common/middleware/requestLogger.ts | Request logging |
| server/common/middleware/rateLimiter.ts | Rate limiting |
| server/common/models/serviceResponse.ts | Response type |
| server/common/utils/envConfig.ts | Environment config |
| server/common/utils/httpHandlers.ts | Response helpers |
| server/api-docs/openAPIRouter.ts | Swagger UI |
| server/api-docs/openAPIDocumentGenerator.ts | OpenAPI spec |

**Post-scaffold:**

1. Commit scaffold with message: `chore: scaffold ExpressJS backend structure`
2. Do NOT install dependencies (let user control that)
3. Inform user about next steps:
   - `npm install` or `pnpm install`
   - Review structure
   - Start development

</expressjs_scaffold_process>

<nextjs_scaffold_process>

**Directory structure to create:**

```bash
# Core directories
mkdir -p src/app
mkdir -p src/assets
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/config
mkdir -p src/features
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/stores
mkdir -p src/testing
mkdir -p src/types
mkdir -p src/utils
```

**Files to create:**

| File | Content Source |
|------|----------------|
| src/app/layout.tsx | Template with PROJECT.md name |
| src/app/page.tsx | Basic home page |
| src/app/providers.tsx | Empty providers wrapper |
| src/app/globals.css | Tailwind base styles |
| src/config/index.ts | App config object |
| src/types/index.ts | Common type definitions |
| src/utils/index.ts | Utility functions |
| src/hooks/index.ts | Empty barrel |
| src/lib/index.ts | Empty barrel |
| src/stores/index.ts | Empty barrel |

**Template variables:**

- `{{PROJECT_NAME}}` → From PROJECT.md "What This Is" title
- `{{PROJECT_DESCRIPTION}}` → From PROJECT.md description

**Post-scaffold:**

1. Commit scaffold with message: `chore: scaffold Next.js frontend structure`
2. Do NOT install dependencies (let user control that)
3. Inform user about next steps:
   - `npm install` or `pnpm install`
   - Review structure
   - Start development

</nextjs_scaffold_process>

<error_handling>

**PRD not found:**
```
PRD file not found at: [path]

Please provide the correct path to your PRD file, or create one first.

A PRD should include:
- Product overview
- Feature requirements
- Tech stack (optional but recommended)
- Constraints (optional)
```

**No tech stack in PRD:**
```
No explicit tech stack found in PRD.

You can either:
1. Add a "Tech Stack" section to your PRD
2. Specify the tech stack now
3. Let GSD help you decide during project setup
```

**GSD new-project fails:**
```
Project initialization encountered an issue.

Check:
- Is there an existing .planning/ directory?
- Are there git conflicts?
- Is the working directory clean?

Run `/gsd:progress` to see project state.
```

**discuss-phase fails:**
```
Phase [N] discussion could not complete.

The phase context may be incomplete. You can:
1. Re-run `/gsd:discuss-phase [N]` manually
2. Skip this phase and continue
3. Review ROADMAP.md for phase details
```

</error_handling>

<completion_checklist>

Before marking complete, verify:

- [ ] PRD was read and analyzed
- [ ] Tech stack was extracted (or noted as unspecified)
- [ ] /gsd:new-project completed successfully
- [ ] All core GSD artifacts exist:
  - [ ] .planning/PROJECT.md
  - [ ] .planning/config.json
  - [ ] .planning/REQUIREMENTS.md
  - [ ] .planning/ROADMAP.md
  - [ ] .planning/STATE.md
- [ ] If Next.js: src/ structure created and committed
- [ ] If ExpressJS: server/ structure created and committed
- [ ] Phase discussions completed (or intentionally skipped)
- [ ] /clear executed after each phase discussion
- [ ] CONTEXT.md created for each discussed phase
- [ ] User informed of next steps

</completion_checklist>
