---
description: Generate QA plan document from qa-list-automated.md. Transforms QA findings into actionable developer tasks with acceptance criteria.
allowed-tools: Read, Write, Glob, Grep, Task
---

# QA Plan Command

This file enables the `/pl:qa-plan` slash command in Claude Code.

The command transforms QA findings into developer-friendly tasks:
- Analyzes each QA issue including screenshots
- Searches for related component files in the codebase
- Creates atomic tasks with acceptance criteria
- Outputs qa-plan.md with all tasks formatted

Usage:
```
/pl:qa-plan               # Will prompt for qa-list-automated.md path
```

Input Required:
- Path to qa-list-automated.md (will be requested)

Output:
- qa-plan.md with actionable tasks grouped by component

See `skills/qa-plan/SKILL.md` for the full skill definition.
