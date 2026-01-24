---
description: Create well-formatted git commits with conventional commits format
allowed-tools: Bash, Read, Grep
---

# Commit Command

This file enables the `/pl:commit` slash command in Claude Code.

The command provides smart git commits with:
- Automatic change analysis
- Conventional commits format (feat, fix, docs, etc.)
- Staged file management
- Commit message generation

Usage:
```
/pl:commit
/pl:commit "feat: add auth"
/pl:commit "refactor user service"
```

Note: Analyzes staged and unstaged changes, generates appropriate commit type and message.

See `skills/commit/SKILL.md` for the full skill definition.
