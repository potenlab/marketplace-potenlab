---
name: rollback
description: Revert changes when implementation fails. Use for "rollback", "undo", "revert", "go back", "start over".
argument-hint: "[target]"
disable-model-invocation: true
user-invocable: true
---

# Rollback Manager

Safely revert changes when things go wrong.

## Workflow

### 1. Understand Request

Ask user:
- What went wrong? (bug, wrong approach, want to try different solution)
- How far back? (last commit, checkpoint start, specific commit, single file)

### 2. Check State

```bash
git status
git log --oneline -10
git diff --stat HEAD~5
```

Show:
```
Current State:
- Branch: main
- Uncommitted: 2 files modified
- Recent commits:
  abc123 - feat: add form
  def456 - fix: validation
  ...
```

### 3. Identify Target

**Rollback to checkpoint start:**
```bash
git log --oneline --grep="CP2"
```

**Rollback specific commits:**
```bash
git log --oneline -10
```

**Single file:**
```bash
git log --oneline -- src/path/file.tsx
```

### 4. Preserve Work (Optional)

Ask: "Any code to save before rolling back?"

If yes:
- Create backup branch: `git branch backup-[date]`
- Or copy snippets to temp file

### 5. Confirm Before Executing

```
I will run:
1. git stash (save uncommitted)
2. git reset --hard [commit]

This will discard changes since [target].

Type 'confirm' to proceed.
```

### 6. Execute

```bash
# Safe methods:
git reset --hard [commit]           # Clean reset
git revert [commit]..HEAD           # Preserve history
git checkout [commit] -- path/file  # Single file
```

### 7. Update Tracking

Update `.planning/CHECKPOINTS.md`:
- Mark rolled-back tasks incomplete
- Add rollback note

### 8. Verify

```bash
bun run build
git status
```

```
Rollback complete!
Rolled back to: abc123 - feat: setup
Build: Passing
Backup: backup-2026-02-01
```

## Common Scenarios

| Scenario | Command |
|----------|---------|
| Undo last commit | `git reset --soft HEAD~1` |
| Start checkpoint over | `git reset --hard [cp-start]` |
| Revert single file | `git checkout [commit] -- file` |
| Keep some changes | `git stash` → reset → `git stash pop` |

## Emergency Recovery

```bash
git reflog                    # Find lost commits
git checkout [reflog-hash]    # Recover
```

## Rules

1. Always confirm before destructive commands
2. Create backup branch before hard reset
3. Warn about uncommitted changes
4. Test build after rollback
