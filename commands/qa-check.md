---
description: Create git branch, commit, and PR for QA fixes. Supports context mode (auto-detect) or manual mode with ID.
allowed-tools: Read, Bash, Glob, Grep
---

# QA Check Command

This file enables the `/pl:qa-check` slash command in Claude Code.

The command creates a fix branch, commits changes, and opens a PR for QA items:
- **Context Mode**: Auto-detects the QA item from conversation context
- **Manual Mode**: User provides the ID explicitly

Usage:
```
/pl:qa-check              # Auto-detect from conversation
/pl:qa-check 002          # Fix QA item 002
/pl:qa-check ID 005       # Fix QA item 005
```

See `skills/qa-check/SKILL.md` for the full skill definition.
