# Coding Rules

## Type Safety

**Before modifying shared type files:**
1. Read existing type files first
2. Grep for imports across codebase
3. Preserve existing types when adding new ones

**Zod + react-hook-form:**
- NEVER use `.transform()` or `.coerce` in schemas
- Keep form fields as strings, convert in submit handler

```typescript
// Bad
const schema = z.object({
  amount: z.string().transform((v) => parseFloat(v)),
})

// Good
const schema = z.object({
  amount: z.string().min(1, "Required"),
})

function onSubmit(data: FormValues) {
  const payload = { amount: parseFloat(data.amount) }
}
```

**Type-check frequently:**
- After creating components
- After modifying types
- Before marking tasks complete
- Command: `bun run build` or `bunx tsc --noEmit`

## Supabase SSR

**ALWAYS use `getAll`/`setAll` pattern:**

```typescript
cookies: {
  getAll() {
    return cookieStore.getAll();
  },
  setAll(cookiesToSet) {
    for (const { name, value, options } of cookiesToSet) {
      cookieStore.set(name, value, options);
    }
  },
}
```

**NEVER use:**
- `get()`, `set()`, `remove()` (deprecated)
- `@supabase/auth-helpers-nextjs` (deprecated)
- `middleware.ts` for auth (use `proxy.ts` in Next.js 16)

## Pre-Commit Checklist

- [ ] `bun run build` passes
- [ ] No TypeScript errors
- [ ] New types exported if needed elsewhere
- [ ] Existing types preserved when modifying shared files
