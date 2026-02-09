---
name: checkpoint
description: Track progress with auto-flow execution. Use for "checkpoint", "progress", "status", "start CP", "complete", "resume".
argument-hint: "[start|complete|status|resume] [CP#]"
disable-model-invocation: true
user-invocable: true
---

# Checkpoint Manager

Auto-flow execution with human approval at checkpoint completion only.

## Flow

```
/checkpoint start CP1
       ↓
[Auto-implement ALL tasks]
       ↓
Build + Lint + Test + Verify
       ↓
Show Diff → Human Approval → Commit
       ↓
Auto-start next checkpoint
```

## Actions

| Action | Description |
|--------|-------------|
| `start [CP#]` | Begin checkpoint, auto-implement all tasks |
| `complete` | Verify + commit (called automatically) |
| `status` | Show progress dashboard |
| `resume [CP#]` | Resume interrupted checkpoint |

---

## Action: Start Checkpoint

### 1. Load State

Read `.planning/CHECKPOINTS.md` and `.planning/PRD.md`.

### 2. Complexity Check

Count tasks and estimate files:

```
Checkpoint: CP1 - Database Setup
Tasks: 3
Estimated files: ~5
```

If >5 tasks OR >10 estimated files:
```
⚠️ This checkpoint is large (6 tasks, ~12 files).
Consider splitting into smaller checkpoints.

Continue anyway? [y/n]
```

### 3. Mark Active

Update CHECKPOINTS.md:
```markdown
## CP1: Database Setup 🔄
> Started: [date]
```

### 4. Auto-Detect UI Work

Check if any task involves UI:
- Keywords: "form", "button", "page", "component", "UI", "style"
- Files: `*.tsx` in `components/`, `app/`

If UI work detected:
```
🎨 UI work detected. Applying /baseline-ui rules:
- No gradients unless requested
- No animations unless requested
- Use Tailwind defaults
- shadcn/ui components
```

Load `.claude/rules/ui.md` into context.

### 5. Show Plan

```
## Starting CP1: Database Setup

Tasks to implement:
1. [ ] Create users table with RLS
2. [ ] Create tasks table with RLS
3. [ ] Generate TypeScript types

I'll implement all tasks, then ask for your approval.

Beginning...
```

### 6. Auto-Implement All Tasks

For each task:

1. **Announce task**:
   ```
   ### Task 1/3: Create users table with RLS
   ```

2. **Implement** - Do the actual work

3. **Quick verify** (silent):
   ```bash
   bun run build
   ```

4. **Track progress** in memory:
   ```
   ✓ Task 1/3 complete
   ```

5. **Save partial progress** to CHECKPOINTS.md:
   ```markdown
   - [x] Create users table with RLS ← partial
   - [ ] Create tasks table with RLS
   ```

6. **Continue to next task** - No pause

### 7. Handle Errors

If build fails:
```
⚠️ Task 1 failed build:
[error message]

Attempting fix...
```

Fix and retry (max 3 attempts).

If unfixable:
```
❌ Stuck on Task 1 after 3 attempts.

Options:
1. Skip and continue (mark as TODO)
2. Pause for human help
3. Rollback this task
```

### 8. All Tasks Done → Auto-Complete

```
All tasks implemented. Running final verification...
```

Automatically proceed to complete flow.

---

## Action: Complete Checkpoint

### 1. Full Verification

Run all checks:

```bash
# Build
bun run build

# Lint
bun run lint

# Tests (if script exists)
bun run test --passWithNoTests 2>/dev/null || true
```

```
## CP1 Verification

| Check | Status |
|-------|--------|
| Build | ✅ Pass |
| Lint | ✅ Pass |
| Tests | ✅ Pass (or N/A) |
| Tasks | ✅ 3/3 complete |
```

If any check fails:
```
## CP1 Verification: ISSUES FOUND

| Check | Status | Issue |
|-------|--------|-------|
| Lint | ⚠️ | 2 warnings in users.ts |

Auto-fixing lint issues...
```

Auto-fix if possible, then re-verify.

### 2. Generate Diff Summary

```bash
git diff --stat HEAD
git diff --name-only HEAD
```

```
## Changes Summary

**Files changed**: 5
**Lines**: +245 / -12

| File | Changes |
|------|---------|
| supabase/migrations/001_users.sql | +45 (new) |
| supabase/migrations/002_tasks.sql | +38 (new) |
| lib/supabase/database.types.ts | +120 (new) |
| lib/supabase/client.ts | +30 / -10 |
| .planning/CHECKPOINTS.md | +12 / -2 |

### Key Changes
- Created users table with id, email, name, avatar_url
- Created tasks table with user_id foreign key
- Added RLS policies for both tables
- Generated TypeScript types from schema
```

### 3. Show Commit Preview

```
## Ready to Commit CP1

**Checkpoint**: CP1 - Database Setup
**Tasks**: 3/3 complete
**Files**: 5 changed (+245/-12)

### Commit Message
feat(db): add users and tasks tables with RLS

- Created users table with profile fields
- Created tasks table linked to users
- Added RLS policies for row-level security
- Generated TypeScript types from schema

Checkpoint: CP1
```

### 4. Human Approval

Use AskUserQuestion:

```
Review the changes above. Ready to commit?
```

Options:
1. **Approve** → Commit and continue
2. **View full diff** → Show `git diff` output
3. **Edit message** → Modify commit message
4. **Request changes** → Describe what to fix
5. **Cancel** → Don't commit, keep changes staged

### 5. Handle Approval Response

**If "View full diff"**:
Show full `git diff` output, then ask again.

**If "Request changes"**:
```
What changes would you like?
> [user input]
```
Make changes, re-run verification, ask again.

**If "Approve"**:
Proceed to commit.

### 6. Commit

```bash
git add -A
git commit -m "feat(db): add users and tasks tables with RLS

- Created users table with profile fields
- Created tasks table linked to users
- Added RLS policies for row-level security
- Generated TypeScript types from schema

Checkpoint: CP1
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 7. Update Tracking

Update `.planning/CHECKPOINTS.md`:

```markdown
## CP1: Database Setup ✅
> Completed: [date]
> Commit: abc1234

- [x] Create users table with RLS
- [x] Create tasks table with RLS
- [x] Generate TypeScript types
```

### 8. Auto-Start Next

```
## CP1 Complete! ✅

Commit: abc1234
Files: 5 changed (+245/-12)

Progress: ████░░░░░░ 1/3 checkpoints

Starting CP2: User Authentication...
```

**Automatically execute `/checkpoint start CP2`**.

If last checkpoint:
```
## 🎉 Project Complete!

All checkpoints done:
- ✅ CP1: Database Setup (abc1234)
- ✅ CP2: User Authentication (def5678)
- ✅ CP3: Dashboard (ghi9012)

Total commits: 3
Ready to deploy!
```

---

## Action: Resume Checkpoint

For recovering from interruption:

### 1. Load State

Read CHECKPOINTS.md to find partial progress:

```markdown
## CP1: Database Setup 🔄
- [x] Create users table ← done
- [ ] Create tasks table ← resume here
- [ ] Generate types
```

### 2. Show Status

```
## Resuming CP1: Database Setup

Progress: 1/3 tasks complete
Resuming from: "Create tasks table"

Continue?
```

### 3. Continue Implementation

Pick up from next incomplete task.

---

## Action: Status

```
## Project: Task Manager

Progress: ████████░░ 2/3 checkpoints

| CP | Name | Status | Tasks | Commit |
|----|------|--------|-------|--------|
| 1 | Database | ✅ | 3/3 | abc1234 |
| 2 | Auth | ✅ | 4/4 | def5678 |
| 3 | Dashboard | ⬜ | 0/3 | - |

**Next**: /checkpoint start CP3
```

---

## Commit Message Format

```
<type>(<scope>): <summary>

<body - bullet points of what was done>

Checkpoint: CP#
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`

---

## Rules

1. **One commit per checkpoint** - not per task
2. **Auto-implement all tasks** - no pause between
3. **Human approval only at end** - with full diff
4. **Auto-start next checkpoint** - maintain flow
5. **Build + Lint + Test** must pass
6. **Auto-apply UI rules** when UI work detected
7. **Save partial progress** for recovery
8. **Fix errors automatically** - only ask if stuck
