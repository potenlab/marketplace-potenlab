---
name: potenlab:start-project
description: Initialize project from PRD with automatic phase discussions and tech stack scaffolding
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
---

<objective>

Initialize a complete project from a PRD (Product Requirements Document) with automated workflow:

1. Locate and read the PRD file
2. Extract tech stack information from PRD
3. Run `/gsd:new-project` using PRD context
4. Scaffold tech stack structures:
   - If Next.js detected → Bulletproof React structure
   - If ExpressJS detected → Modular Express structure
5. Run `/gsd:discuss-phase` for every phase in the roadmap (prompting user to `/clear` after each)

**This command automates the full project initialization flow so you can go from PRD to ready-for-execution in one command.**

**Note:** Since `/clear` is a built-in CLI command, the workflow will pause after each phase discussion and prompt you to run `/clear` manually before continuing. This ensures fresh context for each phase discussion.

</objective>

<execution_context>

@./nextjs-fe-structure.md
@./express-be-structure.md
@./.claude/get-shit-done/workflows/potenlab/start-project.md
@./.claude/get-shit-done/templates/scaffolds/nextjs-bulletproof.md
@./.claude/get-shit-done/templates/scaffolds/expressjs-modular.md

</execution_context>

<process>

## Phase 1: Locate PRD

**Ask for PRD location:**

Use AskUserQuestion:
- header: "PRD Location"
- question: "Where is your PRD (Product Requirements Document) file located?"
- options:
  - "docs/prd.md" — Standard location
  - "PRD.md" — Root directory
  - "requirements/prd.md" — Requirements folder

Wait for user response. If "Other", capture the custom path.

**Validate PRD exists:**

```bash
PRD_PATH="[user provided path]"
[ -f "$PRD_PATH" ] && echo "PRD found" || echo "ERROR: PRD not found at $PRD_PATH"
```

**If not found:** Ask user to provide correct path or create PRD first.

**If found:** Read the PRD file and continue.

## Phase 2: Extract Tech Stack

**Read and analyze PRD:**

Read the PRD file completely. Look for:
- "Tech Stack" section
- "Technology" section
- "Stack" section
- Technical requirements mentions
- Framework/library mentions

**Identify frameworks:**

Extract tech stack information, specifically looking for:
- **Frontend:** Next.js, React, Vue, Angular, Svelte
- **Backend:** Node.js, Python, Go, Rust, Java
- **Database:** PostgreSQL, MongoDB, MySQL, SQLite
- **Other:** Any mentioned tools, libraries, services

**Store extracted info:**

```
TECH_STACK_FRONTEND="[extracted frontend framework]"
TECH_STACK_BACKEND="[extracted backend framework]"
TECH_STACK_DATABASE="[extracted database]"
HAS_NEXTJS=$(echo "$TECH_STACK_FRONTEND" | grep -i "next" && echo "yes" || echo "no")
HAS_EXPRESS=$(echo "$TECH_STACK_BACKEND" | grep -iE "express|expressjs" && echo "yes" || echo "no")
```

**Display findings:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PRD ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRD: [PRD_PATH]

## Extracted Tech Stack

| Layer    | Technology       |
|----------|------------------|
| Frontend | [framework]      |
| Backend  | [framework]      |
| Database | [database]       |

## Scaffolds to Create

[If Next.js detected:]
- Next.js detected — Will scaffold Bulletproof React structure

[If ExpressJS detected:]
- ExpressJS detected — Will scaffold Modular Express structure

Proceeding with project initialization...
```

## Phase 3: Run GSD New Project

**Prepare PRD context for new-project:**

Create a summary of the PRD to feed into the questioning phase:

```
PRD_SUMMARY="
## From PRD: [PRD filename]

### Product Overview
[Extract product description from PRD]

### Core Features
[Extract key features/requirements from PRD]

### Tech Stack
- Frontend: [extracted]
- Backend: [extracted]
- Database: [extracted]

### Constraints
[Extract any constraints, timeline, or limitations from PRD]
"
```

**Execute /gsd:new-project:**

Use the Skill tool to invoke /gsd:new-project:

```
Skill(skill="gsd:new-project")
```

**IMPORTANT:** During the questioning phase of new-project, proactively provide the PRD context:

When asked "What do you want to build?", respond with:

```
I have a PRD that defines the project. Here's the summary:

[PRD_SUMMARY]

The full PRD is at: [PRD_PATH]
```

**Let new-project complete fully** — this creates:
- `.planning/PROJECT.md`
- `.planning/config.json`
- `.planning/research/` (if research selected)
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

## Phase 4: Scaffold Next.js Structure (Conditional)

**Only if Next.js detected in tech stack:**

```bash
# Check if Next.js project needs scaffolding
if [ "$HAS_NEXTJS" = "yes" ]; then
  echo "Scaffolding Next.js frontend structure..."
fi
```

**If Next.js and no existing src/ directory:**

Create the Bulletproof React-inspired structure:

```bash
# Create base directories
mkdir -p src/app
mkdir -p src/assets
mkdir -p src/components
mkdir -p src/config
mkdir -p src/features
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/stores
mkdir -p src/testing
mkdir -p src/types
mkdir -p src/utils
```

**Create placeholder files:**

Write `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '[Project Name from PROJECT.md]',
  description: '[Description from PROJECT.md]',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

Write `src/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main>
      <h1>[Project Name]</h1>
      <p>Project initialized with Potenlab workflow.</p>
    </main>
  )
}
```

Write `src/app/providers.tsx`:
```tsx
'use client'

import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>
}
```

Write `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
```

Write `src/types/index.ts`:
```ts
// Shared TypeScript types
export type {}
```

Write `src/utils/index.ts`:
```ts
// Shared utility functions
export {}
```

Write `src/hooks/index.ts`:
```ts
// Shared React hooks
export {}
```

Write `src/lib/index.ts`:
```ts
// Reusable libraries and adapters
export {}
```

Write `src/config/index.ts`:
```ts
// Global configuration and environment variables
export const config = {
  // Add configuration here
}
```

Write `src/stores/index.ts`:
```ts
// Global state stores
export {}
```

**Display scaffolding result:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► NEXT.JS STRUCTURE CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created Bulletproof React structure:

src/
  app/           ← Next.js routes (layout.tsx, page.tsx)
  assets/        ← Static files
  components/    ← Shared UI components
  config/        ← Global configuration
  features/      ← Feature-based modules
  hooks/         ← Shared hooks
  lib/           ← Reusable libraries/adapters
  stores/        ← Global state stores
  testing/       ← Test utilities
  types/         ← Shared TypeScript types
  utils/         ← Shared utility functions

Feature modules go in: src/features/<feature-name>/
```

**Commit scaffold:**

```bash
git add src/
git commit -m "$(cat <<'EOF'
chore: scaffold Next.js frontend structure

Bulletproof React-inspired structure:
- src/app for Next.js routes
- src/features for feature modules
- Shared directories for components, hooks, utils
EOF
)"
```

## Phase 4.5: Scaffold ExpressJS Structure (Conditional)

**Only if ExpressJS detected in tech stack:**

```bash
# Check if ExpressJS project needs scaffolding
if [ "$HAS_EXPRESS" = "yes" ]; then
  echo "Scaffolding ExpressJS backend structure..."
fi
```

**If ExpressJS and no existing backend src/ directory:**

Create the Modular Express structure (based on express-typescript pattern):

```bash
# Create base directories for backend (use 'server' to avoid conflicts with frontend src)
mkdir -p server/api/healthCheck/__tests__
mkdir -p server/api/user/__tests__
mkdir -p server/api-docs/__tests__
mkdir -p server/common/middleware
mkdir -p server/common/models
mkdir -p server/common/utils
```

**Create placeholder files:**

Write `server/index.ts`:
```ts
import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './common/middleware/errorHandler'
import { requestLogger } from './common/middleware/requestLogger'
import { healthCheckRouter } from './api/healthCheck/healthCheckRouter'
import { userRouter } from './api/user/userRouter'
import { openAPIRouter } from './api-docs/openAPIRouter'

const app: Express = express()

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(requestLogger)

// Routes
app.use('/health', healthCheckRouter)
app.use('/api/users', userRouter)
app.use('/docs', openAPIRouter)

// Error handling
app.use(errorHandler)

export { app }
```

Write `server/server.ts`:
```ts
import { app } from './index'
import { envConfig } from './common/utils/envConfig'

const PORT = envConfig.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Graceful shutdown
const onCloseSignal = () => {
  console.log('SIGINT received, shutting down')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGINT', onCloseSignal)
process.on('SIGTERM', onCloseSignal)
```

Write `server/api/healthCheck/healthCheckRouter.ts`:
```ts
import { Router } from 'express'
import { ServiceResponse } from '../../common/models/serviceResponse'
import { handleServiceResponse } from '../../common/utils/httpHandlers'

export const healthCheckRouter = Router()

healthCheckRouter.get('/', (_req, res) => {
  const serviceResponse = ServiceResponse.success('Service is healthy', null)
  handleServiceResponse(serviceResponse, res)
})
```

Write `server/api/user/userRouter.ts`:
```ts
import { Router } from 'express'
import { userController } from './userController'

export const userRouter = Router()

userRouter.get('/', userController.getUsers)
userRouter.get('/:id', userController.getUser)
userRouter.post('/', userController.createUser)
userRouter.put('/:id', userController.updateUser)
userRouter.delete('/:id', userController.deleteUser)
```

Write `server/api/user/userController.ts`:
```ts
import type { Request, Response } from 'express'
import { userService } from './userService'
import { handleServiceResponse } from '../../common/utils/httpHandlers'

export const userController = {
  getUsers: async (_req: Request, res: Response) => {
    const serviceResponse = await userService.findAll()
    handleServiceResponse(serviceResponse, res)
  },

  getUser: async (req: Request, res: Response) => {
    const { id } = req.params
    const serviceResponse = await userService.findById(id)
    handleServiceResponse(serviceResponse, res)
  },

  createUser: async (req: Request, res: Response) => {
    const serviceResponse = await userService.create(req.body)
    handleServiceResponse(serviceResponse, res)
  },

  updateUser: async (req: Request, res: Response) => {
    const { id } = req.params
    const serviceResponse = await userService.update(id, req.body)
    handleServiceResponse(serviceResponse, res)
  },

  deleteUser: async (req: Request, res: Response) => {
    const { id } = req.params
    const serviceResponse = await userService.delete(id)
    handleServiceResponse(serviceResponse, res)
  },
}
```

Write `server/api/user/userService.ts`:
```ts
import { ServiceResponse } from '../../common/models/serviceResponse'
import { userRepository } from './userRepository'

export const userService = {
  findAll: async () => {
    const users = await userRepository.findAll()
    return ServiceResponse.success('Users retrieved', users)
  },

  findById: async (id: string) => {
    const user = await userRepository.findById(id)
    if (!user) {
      return ServiceResponse.failure('User not found', null, 404)
    }
    return ServiceResponse.success('User retrieved', user)
  },

  create: async (data: unknown) => {
    const user = await userRepository.create(data)
    return ServiceResponse.success('User created', user, 201)
  },

  update: async (id: string, data: unknown) => {
    const user = await userRepository.update(id, data)
    if (!user) {
      return ServiceResponse.failure('User not found', null, 404)
    }
    return ServiceResponse.success('User updated', user)
  },

  delete: async (id: string) => {
    const deleted = await userRepository.delete(id)
    if (!deleted) {
      return ServiceResponse.failure('User not found', null, 404)
    }
    return ServiceResponse.success('User deleted', null)
  },
}
```

Write `server/api/user/userRepository.ts`:
```ts
// Repository layer - implement with your database of choice
// This is a placeholder with in-memory storage

interface User {
  id: string
  email: string
  name: string
}

const users: User[] = []

export const userRepository = {
  findAll: async (): Promise<User[]> => {
    return users
  },

  findById: async (id: string): Promise<User | undefined> => {
    return users.find(u => u.id === id)
  },

  create: async (data: unknown): Promise<User> => {
    const user = { id: crypto.randomUUID(), ...(data as Omit<User, 'id'>) }
    users.push(user)
    return user
  },

  update: async (id: string, data: unknown): Promise<User | undefined> => {
    const index = users.findIndex(u => u.id === id)
    if (index === -1) return undefined
    users[index] = { ...users[index], ...(data as Partial<User>) }
    return users[index]
  },

  delete: async (id: string): Promise<boolean> => {
    const index = users.findIndex(u => u.id === id)
    if (index === -1) return false
    users.splice(index, 1)
    return true
  },
}
```

Write `server/api/user/userModel.ts`:
```ts
// Define your database model/schema here
// Example with Zod for validation:

import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type User = z.infer<typeof UserSchema>

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true })
export type CreateUserInput = z.infer<typeof CreateUserSchema>
```

Write `server/common/middleware/errorHandler.ts`:
```ts
import type { Request, Response, NextFunction } from 'express'
import { ServiceResponse } from '../models/serviceResponse'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err)

  const serviceResponse = ServiceResponse.failure(
    err.message || 'Internal server error',
    null,
    500
  )

  res.status(500).json(serviceResponse)
}
```

Write `server/common/middleware/requestLogger.ts`:
```ts
import type { Request, Response, NextFunction } from 'express'

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })

  next()
}
```

Write `server/common/middleware/rateLimiter.ts`:
```ts
import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
})
```

Write `server/common/models/serviceResponse.ts`:
```ts
export class ServiceResponse<T = null> {
  readonly success: boolean
  readonly message: string
  readonly data: T
  readonly statusCode: number

  private constructor(success: boolean, message: string, data: T, statusCode: number) {
    this.success = success
    this.message = message
    this.data = data
    this.statusCode = statusCode
  }

  static success<T>(message: string, data: T, statusCode = 200): ServiceResponse<T> {
    return new ServiceResponse(true, message, data, statusCode)
  }

  static failure<T = null>(message: string, data: T, statusCode = 400): ServiceResponse<T> {
    return new ServiceResponse(false, message, data, statusCode)
  }
}
```

Write `server/common/utils/envConfig.ts`:
```ts
import dotenv from 'dotenv'

dotenv.config()

export const envConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  // Add other env variables as needed
}
```

Write `server/common/utils/httpHandlers.ts`:
```ts
import type { Response } from 'express'
import type { ServiceResponse } from '../models/serviceResponse'

export const handleServiceResponse = <T>(
  serviceResponse: ServiceResponse<T>,
  res: Response
) => {
  res.status(serviceResponse.statusCode).json(serviceResponse)
}
```

Write `server/api-docs/openAPIRouter.ts`:
```ts
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { generateOpenAPIDocument } from './openAPIDocumentGenerator'

export const openAPIRouter = Router()

openAPIRouter.use('/', swaggerUi.serve, swaggerUi.setup(generateOpenAPIDocument()))
```

Write `server/api-docs/openAPIDocumentGenerator.ts`:
```ts
// Generate OpenAPI document from your routes
// This is a placeholder - implement based on your needs

export const generateOpenAPIDocument = () => ({
  openapi: '3.0.0',
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API documentation generated by Potenlab',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': { description: 'Service is healthy' },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'Get all users',
        responses: {
          '200': { description: 'List of users' },
        },
      },
      post: {
        summary: 'Create a user',
        responses: {
          '201': { description: 'User created' },
        },
      },
    },
  },
})
```

**Display scaffolding result:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► EXPRESSJS STRUCTURE CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created Modular Express structure:

server/
  api/
    healthCheck/     ← Health check endpoint
    user/            ← User domain module
      userRouter.ts
      userController.ts
      userService.ts
      userRepository.ts
      userModel.ts
      __tests__/
  api-docs/          ← OpenAPI/Swagger docs
  common/
    middleware/      ← Error handler, logger, rate limiter
    models/          ← Service response types
    utils/           ← Env config, HTTP handlers
  index.ts           ← App bootstrap
  server.ts          ← Server entry

Request flow: Router → Controller → Service → Repository → Model
```

**Commit scaffold:**

```bash
git add server/
git commit -m "$(cat <<'EOF'
chore: scaffold ExpressJS backend structure

Modular Express structure:
- Domain-based API modules (user, healthCheck)
- Layered architecture (router → controller → service → repository)
- Common middleware, models, and utilities
- OpenAPI documentation setup
EOF
)"
```

## Phase 5: Auto-Discuss All Phases

**Read ROADMAP.md to get phases:**

```bash
# Extract phase numbers from ROADMAP.md
PHASES=$(grep -E "^## Phase [0-9]+" .planning/ROADMAP.md | grep -oE "[0-9]+" | sort -n)
PHASE_COUNT=$(echo "$PHASES" | wc -l | tr -d ' ')
```

**Display discussion plan:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PHASE DISCUSSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found [PHASE_COUNT] phases in roadmap.

Will discuss each phase to gather implementation context:

[For each phase:]
- Phase [N]: [Phase Name]
```

**Ask for confirmation:**

Use AskUserQuestion:
- header: "Discuss Phases"
- question: "Ready to discuss all [PHASE_COUNT] phases? This will gather implementation decisions for each phase."
- options:
  - "Discuss all phases" — Go through each phase in order (Recommended)
  - "Discuss specific phases" — Choose which phases to discuss
  - "Skip discussions" — Go straight to planning

**If "Discuss all phases":**

For each phase number in PHASES:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► DISCUSSING PHASE [N] of [PHASE_COUNT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the Skill tool:
```
Skill(skill="gsd:discuss-phase", args="[phase_number]")
```

**CRITICAL: Context Clear Protocol (after EACH discuss-phase completes):**

Since `/clear` is a built-in CLI command that cannot be invoked programmatically, you MUST pause and prompt the user:

1. Wait for the discussion to finish and CONTEXT.md to be created
2. Display completion message:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✓ Phase [N] discussion complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXT.md created at: .planning/phases/[XX-name]/[XX]-CONTEXT.md

▶ NEXT: Clear context before Phase [N+1]
```

3. **Use AskUserQuestion to pause:**
   - header: "Clear Context"
   - question: "Phase [N] complete. Please run `/clear` now, then select 'Continue' to discuss Phase [N+1]."
   - options:
     - "Continue to Phase [N+1]" — I have run /clear and am ready (Recommended)
     - "Skip remaining phases" — Stop discussions here

4. Wait for user response before proceeding to next phase
5. If user selects "Continue", proceed with next phase discussion
6. If user selects "Skip", jump to Phase 6 (Completion)

This ensures each phase discussion starts with a clean context window.

**If "Discuss specific phases":**

Use AskUserQuestion:
- header: "Select Phases"
- question: "Which phases do you want to discuss?"
- multiSelect: true
- options: [Generate from phase list]

Run discuss-phase for each selected phase, with context clear prompt after each (same protocol as above).

**If "Skip discussions":**

Continue to completion.

## Phase 6: Completion

**Display final summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PROJECT FULLY INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name from PROJECT.md]**

## Created Artifacts

| Artifact       | Location                    |
|----------------|-----------------------------|
| PRD Reference  | [PRD_PATH]                  |
| Project        | `.planning/PROJECT.md`      |
| Config         | `.planning/config.json`     |
| Research       | `.planning/research/`       |
| Requirements   | `.planning/REQUIREMENTS.md` |
| Roadmap        | `.planning/ROADMAP.md`      |
| State          | `.planning/STATE.md`        |
[If Next.js:]
| Frontend       | `src/` (Bulletproof React)  |
[If ExpressJS:]
| Backend        | `server/` (Modular Express) |

## Phase Contexts Created

[For each discussed phase:]
- Phase [N]: `.planning/phases/[XX-name]/[XX]-CONTEXT.md`

───────────────────────────────────────────────────────────────

## ▶ Ready to Execute

All phases have been discussed and context captured.

**Next Step:**

`/potenlab:execute-project` — Execute all phases automatically

This will:
1. Plan each phase (`/gsd:plan-phase`)
2. Execute each phase (`/gsd:execute-phase`)
3. Update CLAUDE.md with tech stack context
4. Track progress through STATE.md

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────
```

</process>

<success_criteria>

- [ ] PRD located and read successfully
- [ ] Tech stack extracted from PRD
- [ ] /gsd:new-project executed with PRD context
- [ ] PROJECT.md created and committed
- [ ] config.json created and committed
- [ ] REQUIREMENTS.md created and committed
- [ ] ROADMAP.md created and committed
- [ ] STATE.md initialized
- [ ] If Next.js: Frontend structure scaffolded and committed
- [ ] If ExpressJS: Backend structure scaffolded and committed
- [ ] All phases discussed (or user skipped)
- [ ] User prompted to `/clear` after each phase discussion (via AskUserQuestion)
- [ ] CONTEXT.md created for each discussed phase
- [ ] User knows next step is `/gsd:plan-phase 1`

</success_criteria>

<notes>

**Potenlab Workflow:**

This command is the first step in the Potenlab automation:

```
/potenlab:start-project  ← You are here
        ↓
/potenlab:execute-project
        ↓
/potenlab:complete-project
```

**PRD Format Expectations:**

The PRD should ideally contain:
- Product overview/description
- Feature requirements or user stories
- Tech stack or technology requirements
- Constraints (timeline, budget, etc.)
- Success criteria or acceptance criteria

**Tech Stack Detection:**

Looks for common patterns:

Frontend:
- "Next.js", "NextJS", "next.js"
- "React", "Vue", "Angular", "Svelte"

Backend:
- "Express", "ExpressJS", "express.js"
- "Node.js", "Python", "Django", "FastAPI"
- "Go", "Rust", "Java", "Spring"

Database:
- "PostgreSQL", "MongoDB", "MySQL", "SQLite"
- "Supabase", "Firebase", "Redis"

**Next.js Structure:**

Based on Bulletproof React pattern:
- Feature-based modules in `src/features/`
- Unidirectional imports: `shared -> features -> app`
- Next.js 13+ App Router conventions

**ExpressJS Structure:**

Based on express-typescript modular pattern:
- Domain-based modules in `server/api/<domain>/`
- Layered architecture: router → controller → service → repository → model
- Shared middleware, models, and utilities in `server/common/`
- OpenAPI documentation in `server/api-docs/`

**Context Clearing (Manual Step Required):**

Since `/clear` is a built-in CLI command that cannot be invoked programmatically from within a skill, the workflow uses `AskUserQuestion` to:
1. Pause after each phase discussion completes
2. Prompt the user to manually run `/clear` in the CLI
3. Wait for user confirmation before proceeding to the next phase

This manual step ensures:
- Fresh context window for each phase discussion
- Prevention of context overflow with large projects
- Clean separation between phase discussions

The user will see a prompt like:
> "Phase [N] complete. Please run `/clear` now, then select 'Continue' to discuss Phase [N+1]."

</notes>
