# Next.js 16 + Supabase MVP Starter

A production-ready starter for building MVPs with Next.js 16 and Supabase, designed for auto-flow development with Claude Code.

## Features

- **Next.js 16** with Turbopack and React 19
- **Supabase** for Auth, Database, and Storage
- **shadcn/ui** with Tailwind CSS v4
- **Auto-flow development** - minimal interruptions
- **Anti-AI-slop UI rules** - auto-applied
- **Full verification** - build + lint + test before commit

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd next-supabase
bun install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy project URL and anon key from Settings > API

### 3. Configure Environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Connect MCP Servers

| Server | Purpose |
|--------|---------|
| Supabase | Database, migrations |
| shadcn | UI components |

### 5. Start Your Project

```bash
/init-project
```

This will:
1. Ask for project details (one question)
2. Create PRD + Checkpoints
3. **Auto-start CP1** immediately

## Auto-Flow Workflow

```
/init-project
     ↓ automatic
/checkpoint start CP1
     ↓ Claude implements ALL tasks
     ↓ Auto-applies UI rules if UI work
Build + Lint + Test
     ↓
Show Diff → You Approve → Commit
     ↓ automatic
/checkpoint start CP2
     ↓
... until project complete
```

**You only review once per checkpoint** - see full diff, approve, done.

## Skills Reference

| Skill | When to Use |
|-------|-------------|
| `/init-project` | Start new project |
| `/checkpoint start CP#` | Begin/continue checkpoint |
| `/checkpoint status` | View progress |
| `/checkpoint resume CP#` | Recover from interruption |
| `/quick "task"` | Small standalone tasks |
| `/baseline-ui` | Review UI rules |
| `/session save` | Stopping work |
| `/session resume` | Returning to work |
| `/debug` | Something broken |
| `/rollback` | Need to revert |

## Pre-Commit Verification

Every commit is verified:

| Check | Command |
|-------|---------|
| Build | `bun run build` |
| Lint | `bun run lint` |
| Tests | `bun run test` |

All must pass. Lint issues auto-fixed when possible.

## Auto-Applied Rules

Rules in `.claude/rules/` load automatically:

| Rule | When Applied |
|------|--------------|
| `coding.md` | Always |
| `ui.md` | When editing `app/**/*.tsx` or `components/**/*.tsx` |

No need to manually run `/baseline-ui` for UI work - rules auto-apply.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (Turbopack) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui + sonner |
| Backend | Supabase |
| Data | TanStack Query |
| State | Zustand |
| Forms | react-hook-form + zod |
| Linting | Biome |

## Project Structure

```
├── app/                     # Next.js app router
├── components/              # React components
├── hooks/                   # Custom hooks
├── lib/                     # Utilities
├── .planning/               # PRD, checkpoints (auto-created)
├── .claude/
│   ├── rules/               # Auto-applied rules
│   │   ├── coding.md        # Type safety
│   │   └── ui.md            # UI quality
│   └── skills/              # Workflow skills
└── CLAUDE.md                # Project instructions
```

## Recovery

If interrupted mid-checkpoint:

```bash
# Resume where you left off
/checkpoint resume CP1

# Or check status first
/checkpoint status
```

Progress is saved automatically to `CHECKPOINTS.md`.

## Available Scripts

```bash
bun run dev       # Development server
bun run build     # Production build
bun run lint      # Run linter
bun run test      # Run tests
```

## Deploy

1. Push to GitHub
2. Import on Vercel
3. Add environment variables
4. Deploy

## License

MIT
