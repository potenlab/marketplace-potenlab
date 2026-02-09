---
name: debug
description: Systematic debugging workflow. Use for "debug", "fix bug", "not working", "error", "broken".
argument-hint: "[issue description]"
disable-model-invocation: true
user-invocable: true
---

# Debug Assistant

Systematic debugging workflow with documentation.

## Workflow

### 1. Understand Problem

Ask user:
- Error message (exact text)?
- When does it occur? (always, sometimes, specific action)
- What changed recently?
- Console/network errors?

### 2. Create Debug Session

Write to `.planning/DEBUG-LOG.md`:

```markdown
## Active Session

**Issue**: [description]
**Reported**: [date]
**Severity**: [Critical/High/Medium/Low]

### Error
```
[exact error text]
```

### Steps to Reproduce
1. [step]
2. [step]
3. Error occurs

### Expected vs Actual
- Expected: [what should happen]
- Actual: [what happens]
```

### 3. Investigate

**Checklist:**

```bash
# Build & types
bun run build

# Recent changes
git diff HEAD~5
git log --oneline -10
```

**Common causes by error type:**

| Error | Check |
|-------|-------|
| "undefined" | Null handling, async timing |
| "Module not found" | Import paths, file exists |
| Type mismatch | Type definitions |
| RLS violation | Auth state, policies |
| Hydration | Client-only code in SSR |

**Binary search:**
1. Does it work in simpler case?
2. Does removing X fix it?
3. Does adding X break it?

### 4. Document Findings

Update DEBUG-LOG.md:

```markdown
### Attempt 1: Check RLS
- Theory: User lacks access
- Check: Ran query as user
- Result: Policy missing on budgets
- Conclusion: CONFIRMED
```

### 5. Fix

1. Explain fix to user first
2. Make minimal change
3. Don't refactor while fixing
4. Test immediately

### 6. Verify

```bash
bun run build
# Reproduce original steps - should work
```

```
Fix Verified!
Issue: [description]
Root Cause: [what was wrong]
Fix: [what changed]
Files: src/lib/api.ts:45
```

### 7. Close Session

Update DEBUG-LOG.md:

```markdown
## Solution
**Root Cause**: Missing null check
**Fix**: Added optional chaining
**Files**: src/lib/api.ts
**Lesson**: Add to RULES.md if pattern emerges

**Resolved**: [date]
```

## Rules

1. Don't guess - investigate systematically
2. One change at a time
3. Document everything
4. Verify the fix works
5. Minimal fixes, no refactoring
6. Add to RULES.md if pattern emerges
