---
description: Analyze code and return structured feedback with actionable items. Use when asked to review code, check quality, or identify issues in a file.
allowed-tools: Read, Grep, Glob
---

# Review Command

This file enables the `/pl:review` slash command in Claude Code.

The command provides read-only code analysis with structured output including:
- Severity-rated issues (HIGH/MEDIUM/LOW)
- Specific file:line locations
- Actionable suggestions
- Identified strengths

Usage:
```
/pl:review src/utils/helper.ts
/pl:review src/components/
```

See `skills/review/SKILL.md` for the full skill definition.
