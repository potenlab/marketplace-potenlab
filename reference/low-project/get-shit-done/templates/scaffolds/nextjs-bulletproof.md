# Next.js Bulletproof React Scaffold Template

Template for scaffolding a Next.js frontend using the Bulletproof React architecture pattern.

<structure>

```
src/
  app/
    layout.tsx       ← Root layout (metadata, providers)
    page.tsx         ← Home page
    providers.tsx    ← Client-side providers wrapper
    globals.css      ← Global styles
    (auth)/          ← Route group for auth pages
    (dashboard)/     ← Route group for protected pages
    api/             ← API routes
  assets/            ← Static files (images, fonts)
  components/        ← Shared UI components
    ui/              ← Base UI components (Button, Input, etc.)
    layout/          ← Layout components (Header, Footer, Sidebar)
  config/            ← Global configuration, env vars
  features/          ← Feature-based modules
  hooks/             ← Shared React hooks
  lib/               ← Reusable libraries/adapters
  stores/            ← Global state stores
  testing/           ← Test utilities and mocks
  types/             ← Shared TypeScript types
  utils/             ← Shared utility functions
```

</structure>

<feature_module_template>

Each feature module follows this structure:

```
src/features/<feature-name>/
  api/               ← API calls and data fetching
    index.ts
    queries.ts       ← React Query/SWR hooks
    mutations.ts     ← Mutation hooks
  components/        ← Feature-specific components
    index.ts
    FeatureList.tsx
    FeatureItem.tsx
    FeatureForm.tsx
  hooks/             ← Feature-specific hooks
    index.ts
    useFeature.ts
  stores/            ← Feature-specific state
    index.ts
    featureStore.ts
  types/             ← Feature-specific types
    index.ts
  utils/             ← Feature-specific utilities
    index.ts
  index.ts           ← Public API (barrel export)
```

</feature_module_template>

<files>

## src/app/layout.tsx

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '{{PROJECT_NAME}}',
  description: '{{PROJECT_DESCRIPTION}}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## src/app/page.tsx

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{{PROJECT_NAME}}</h1>
      <p className="mt-4 text-gray-600">
        Project initialized with Potenlab workflow.
      </p>
    </main>
  )
}
```

## src/app/providers.tsx

```tsx
'use client'

import { ReactNode } from 'react'
// Add providers as needed: QueryClientProvider, ThemeProvider, etc.

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>
}
```

## src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 255, 255, 255;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

## src/config/index.ts

```ts
// Global configuration and environment variables

export const config = {
  app: {
    name: '{{PROJECT_NAME}}',
    description: '{{PROJECT_DESCRIPTION}}',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
} as const
```

## src/types/index.ts

```ts
// Shared TypeScript types

export type ApiResponse<T> = {
  data: T
  error: string | null
  status: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

## src/utils/index.ts

```ts
// Shared utility functions

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}
```

## src/hooks/index.ts

```ts
// Shared React hooks
export {}
```

## src/lib/index.ts

```ts
// Reusable libraries and adapters
export {}
```

## src/stores/index.ts

```ts
// Global state stores
export {}
```

## src/components/.gitkeep

```
# Shared UI components
```

## src/features/.gitkeep

```
# Feature-based modules
```

## src/assets/.gitkeep

```
# Static files (images, fonts)
```

## src/testing/.gitkeep

```
# Test utilities and mocks
```

</files>

<guidelines>

## Import Rules

Enforce unidirectional imports:
- `shared` (components, hooks, utils) → can be imported anywhere
- `features` → can import shared, cannot import other features
- `app` → can import features and shared

```
shared -> features -> app
```

## Feature Module Guidelines

1. **Colocation**: Keep feature-related code together
2. **Public API**: Export only what's needed via `index.ts`
3. **Isolation**: Features should not import from other features
4. **Composition**: Compose features in `src/app` route handlers

## Barrel Exports

Avoid barrel files (`index.ts` re-exports) for shared code to enable tree-shaking.
Use direct imports:

```ts
// Good
import { Button } from '@/components/ui/Button'

// Avoid (prevents tree-shaking)
import { Button } from '@/components'
```

## Next.js Specifics

- Route segments: `src/app/<segment>/page.tsx`
- Route groups: `src/app/(group)/...` for shared layouts
- API routes: `src/app/api/<route>/route.ts`
- Middleware: `src/middleware.ts` (root level)

</guidelines>
