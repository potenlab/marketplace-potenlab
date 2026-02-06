---
name: quick
description: Quick task without full workflow. Use for "quick", "just add", "small change", "simple fix".
argument-hint: "[task description]"
disable-model-invocation: true
user-invocable: true
---

# Quick Task

For small tasks that don't need PRD/checkpoints.

## When to Use

✅ Use `/quick` for:
- Add a button
- Fix a typo
- Small styling change
- Add a simple component
- Quick bug fix

❌ Don't use for:
- New database tables
- New features with multiple files
- Changes touching 5+ files
- Anything needing planning

## Flow

```
/quick "add logout button to header"
       ↓
Complexity check
       ↓
Implement (auto-apply UI rules if needed)
       ↓
Build + Lint + Test
       ↓
Show diff → Human approval → Commit
```

---

## Workflow

### 1. Parse & Validate

```
Quick task: "add logout button to header"

Checking complexity...
- Estimated files: 1-2
- Complexity: Low ✅
```

If too complex:
```
⚠️ This seems larger than a quick task:
- May need new API endpoint
- Touches 5+ files estimated

Recommend: /init-project or /checkpoint

Continue anyway? [y/n]
```

### 2. Check for UI Work

If task involves UI files:
```
🎨 UI task detected. Applying rules:
- No gradients
- No animations
- Use shadcn/ui
```

### 3. Implement

Do the work. Follow rules from `.claude/rules/`.

### 4. Full Verification

```bash
bun run build
bun run lint
bun run test --passWithNoTests 2>/dev/null || true
```

```
## Verification

| Check | Status |
|-------|--------|
| Build | ✅ |
| Lint | ✅ |
| Tests | ✅ |
```

Auto-fix lint if needed.

### 5. Show Diff

```bash
git diff --stat
```

```
## Changes

**Files**: 1 changed (+15/-2)

| File | Changes |
|------|---------|
| components/header.tsx | +15 / -2 |

### What Changed
- Added SignOutButton to header nav
- Imported from @/components/auth
```

### 6. Human Approval

```
## Ready to Commit

Task: Add logout button to header
Files: 1 changed (+15/-2)

Commit message:
"feat(ui): add logout button to header"

Approve?
```

Options:
1. **Approve** → Commit
2. **View full diff** → Show complete diff
3. **Edit message** → Change message
4. **Request changes** → Modify implementation
5. **Cancel** → Don't commit

### 7. Commit (if approved)

```bash
git add -A
git commit -m "feat(ui): add logout button to header

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 8. Done

```
✅ Done!

Commit: abc1234
Task: Add logout button to header
Files: 1 (+15/-2)
```

---

## Rules

1. No PRD/checkpoint files created
2. Build + Lint + Test must pass
3. Show diff before approval
4. Human approval required
5. Auto-apply UI rules for UI work
6. Redirect to /checkpoint if too complex
