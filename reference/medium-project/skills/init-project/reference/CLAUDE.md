# Project Context

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui |
| Animations | motion/react (only when requested) |
| Backend | Supabase |
| Forms | react-hook-form + zod |

## Required MCP

| Server | Required |
|--------|----------|
| Supabase | Yes |
| shadcn | Yes |

## Workflow

```
/init-project
     ↓ (auto)
/checkpoint start CP1
     ↓ (auto-implement all tasks)
     ↓ (auto-apply UI rules if UI work)
Build + Lint + Test
     ↓
Show Diff → Human Approval → Commit
     ↓ (auto)
/checkpoint start CP2
     ↓
... repeat until done
```

**Key points**:
- Human approves once per checkpoint (sees full diff)
- Auto-implement all tasks without pausing
- Auto-start next checkpoint after commit
- Auto-apply UI rules when working on UI files
- Recovery with `/checkpoint resume` if interrupted

## Pre-Commit Checks

All must pass before commit:
1. `bun run build` - No build errors
2. `bun run lint` - No lint errors (auto-fix if possible)
3. `bun run test` - Tests pass (if exist)

## Commit Rules

- Never commit without all checks passing
- Never commit without human approval
- One commit per checkpoint (not per task)
- Show diff summary before approval

## Skills

| Skill | Description |
|-------|-------------|
| `/init-project` | Create PRD + checkpoints, auto-start CP1 |
| `/checkpoint start CP#` | Auto-implement all tasks |
| `/checkpoint complete` | Verify + commit (auto-called) |
| `/checkpoint status` | View progress dashboard |
| `/checkpoint resume CP#` | Resume interrupted checkpoint |
| `/quick [task]` | Small task without full workflow |
| `/baseline-ui` | Review anti-AI-slop rules |
| `/session save` | Save context when stopping |
| `/session resume` | Resume from previous session |
| `/debug` | Systematic debugging |
| `/rollback` | Revert changes safely |

## Auto-Applied Rules

Rules in `.claude/rules/` are auto-loaded:
- `coding.md` - Always loaded (type safety, Supabase patterns)
- `ui.md` - Auto-loaded when working on `app/**/*.tsx` or `components/**/*.tsx`

## Complexity Guidelines

| Checkpoint Size | Recommendation |
|----------------|----------------|
| 2-4 tasks | ✅ Good |
| 5 tasks | ⚠️ Consider splitting |
| 6+ tasks | ❌ Too large, split it |

## Error Recovery

If stuck mid-checkpoint:
1. Progress saved to CHECKPOINTS.md automatically
2. Use `/checkpoint resume CP#` to continue
3. Or `/rollback` to start over
