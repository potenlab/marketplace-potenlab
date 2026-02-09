# ExpressJS Modular Scaffold Template

Template for scaffolding an ExpressJS backend using the modular architecture pattern.

Reference: https://github.com/edwinhern/express-typescript

<structure>

```
server/
  api/
    healthCheck/
      __tests__/
        healthCheckRouter.test.ts
      healthCheckRouter.ts
    user/
      __tests__/
        userRouter.test.ts
        userService.test.ts
      userController.ts
      userModel.ts
      userRepository.ts
      userRouter.ts
      userService.ts
  api-docs/
    __tests__/
      openAPIRouter.test.ts
    openAPIDocumentGenerator.ts
    openAPIResponseBuilders.ts
    openAPIRouter.ts
  common/
    middleware/
      errorHandler.ts
      rateLimiter.ts
      requestLogger.ts
    models/
      serviceResponse.ts
    utils/
      commonValidation.ts
      envConfig.ts
      httpHandlers.ts
  index.ts
  server.ts
```

</structure>

<domain_module_template>

Each domain module follows this structure:

```
server/api/<domain>/
  __tests__/           ← Co-located tests
    <domain>Router.test.ts
    <domain>Service.test.ts
  <domain>Router.ts    ← Route definitions, HTTP methods
  <domain>Controller.ts ← Request handling, no business logic
  <domain>Service.ts   ← Business logic orchestration
  <domain>Repository.ts ← Data access layer
  <domain>Model.ts     ← Schema/type definitions
```

</domain_module_template>

<request_lifecycle>

## Request Lifecycle

1. Request hits `<domain>Router.ts` for matching path/method
2. Route-level middlewares run (auth, validation, rate limiting, logging)
3. Controller parses/validates input and calls service function
4. Service executes domain logic and calls repository for persistence
5. Controller builds standard HTTP response using helpers
6. Errors travel to `errorHandler.ts` for consistent formatting

```
Request → Router → Middleware → Controller → Service → Repository → Model
                                    ↓
Response ← Controller ← ServiceResponse ← Service
```

</request_lifecycle>

<files>

## server/index.ts

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

// Security middleware
app.use(cors())
app.use(helmet())

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(requestLogger)

// Routes
app.use('/health', healthCheckRouter)
app.use('/api/users', userRouter)
app.use('/docs', openAPIRouter)

// Error handling (must be last)
app.use(errorHandler)

export { app }
```

## server/server.ts

```ts
import { app } from './index'
import { envConfig } from './common/utils/envConfig'

const PORT = envConfig.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`API docs: http://localhost:${PORT}/docs`)
})

// Graceful shutdown
const onCloseSignal = () => {
  console.log('Received shutdown signal, closing server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
  // Force close after 10 seconds
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGINT', onCloseSignal)
process.on('SIGTERM', onCloseSignal)
```

## server/common/models/serviceResponse.ts

```ts
export class ServiceResponse<T = null> {
  readonly success: boolean
  readonly message: string
  readonly data: T
  readonly statusCode: number

  private constructor(
    success: boolean,
    message: string,
    data: T,
    statusCode: number
  ) {
    this.success = success
    this.message = message
    this.data = data
    this.statusCode = statusCode
  }

  static success<T>(
    message: string,
    data: T,
    statusCode = 200
  ): ServiceResponse<T> {
    return new ServiceResponse(true, message, data, statusCode)
  }

  static failure<T = null>(
    message: string,
    data: T,
    statusCode = 400
  ): ServiceResponse<T> {
    return new ServiceResponse(false, message, data, statusCode)
  }
}
```

## server/common/middleware/errorHandler.ts

```ts
import type { Request, Response, NextFunction } from 'express'
import { ServiceResponse } from '../models/serviceResponse'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  console.error(`[Error] ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
  })

  const response = ServiceResponse.failure(message, null, statusCode)
  res.status(statusCode).json(response)
}
```

## server/common/middleware/requestLogger.ts

```ts
import type { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = randomUUID()
  const start = Date.now()

  // Attach request ID for correlation
  req.headers['x-request-id'] = requestId
  res.setHeader('x-request-id', requestId)

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      })
    )
  })

  next()
}
```

## server/common/middleware/rateLimiter.ts

```ts
import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    data: null,
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts.',
    data: null,
    statusCode: 429,
  },
})
```

## server/common/utils/envConfig.ts

```ts
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format())
  process.exit(1)
}

export const envConfig = parsed.data
```

## server/common/utils/httpHandlers.ts

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

## server/common/utils/commonValidation.ts

```ts
import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type PaginationParams = z.infer<typeof paginationSchema>
```

</files>

<guidelines>

## Conventions

1. **Keep business logic in services** — Controllers only translate HTTP to service calls
2. **Repositories only perform data access** — No business logic in repository layer
3. **Co-locate tests** — Tests live in `__tests__/` within each module
4. **Use ServiceResponse** — All service methods return ServiceResponse for consistent shapes
5. **OpenAPI at /docs** — Keep spec generation deterministic and up-to-date

## Adding a New Domain Module

1. Create directory: `server/api/<domain>/`
2. Create files:
   - `<domain>Router.ts` — Route definitions
   - `<domain>Controller.ts` — Request handlers
   - `<domain>Service.ts` — Business logic
   - `<domain>Repository.ts` — Data access
   - `<domain>Model.ts` — Types/schemas
3. Create `__tests__/` directory with test files
4. Register router in `server/index.ts`
5. Add routes to OpenAPI document

## Error Handling

- Throw errors with statusCode property for HTTP errors
- All errors flow to central errorHandler
- ServiceResponse.failure() for expected errors
- Let unexpected errors bubble to errorHandler

## Testing

- Unit tests for services (mock repository)
- Integration tests for routers (supertest)
- Repository tests with test database

</guidelines>

<dependencies>

## Required Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.0.0",
    "zod": "^3.22.0",
    "express-rate-limit": "^7.0.0",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/swagger-ui-express": "^4.1.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "supertest": "^6.0.0",
    "@types/supertest": "^6.0.0"
  }
}
```

</dependencies>
