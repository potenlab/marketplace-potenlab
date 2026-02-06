---
name: session
description: Save or resume work context. Use for "save", "pause", "resume", "continue", "stopping".
argument-hint: "[save|resume]"
disable-model-invocation: true
user-invocable: true
---

# Session Manager

Save context when stopping, resume when returning.

## Actions

| Action | Triggers |
|--------|----------|
| `save` | "save", "pause", "stopping", "done for today" |
| `resume` | "resume", "continue", "where was I" |

---

## Save Workflow

### 1. Gather State

```bash
git status
git log --oneline -3
```

Read `.planning/CHECKPOINTS.md` for current progress.

### 2. Create Handoff

Write `.planning/HANDOFF.md`:

```markdown
# Session Handoff

**Date**: [date]
**Checkpoint**: CP2 - Authentication

## Progress
- ✅ CP1: Database (committed)
- 🔄 CP2: Authentication (in progress)
  - [x] Login form
  - [ ] Register form ← stopped here
  - [ ] Password reset

## Current State
- Branch: main
- Uncommitted changes: Yes/No
- Last commit: abc1234 "feat(db): setup tables"

## Next Step
Continue with "Register form" in CP2.

## Notes
[Any important context]
```

### 3. Handle Uncommitted Changes

If uncommitted changes exist:
```
⚠️ You have uncommitted changes.

Options:
1. Create WIP commit
2. Stash changes
3. Leave as-is
```

### 4. Confirm

```
Session saved to .planning/HANDOFF.md

To continue later: /session resume
```

---

## Resume Workflow

### 1. Load Handoff

Read `.planning/HANDOFF.md`.

If missing, read `.planning/CHECKPOINTS.md` instead.

### 2. Verify Environment

```bash
bun run build
git status
```

### 3. Show Summary

```
## Welcome Back!

**Project**: Task Manager
**Last session**: 2026-02-01

### Where You Left Off
Checkpoint: CP2 - Authentication
Task: Register form (not started)

### To Continue
I'll continue implementing CP2.

Ready to start?
```

### 4. Auto-Continue

If user confirms, **automatically run `/checkpoint start CP2`** to continue.

---

## Rules

1. Always check for uncommitted changes
2. Be specific about next step
3. Auto-continue to checkpoint on resume
