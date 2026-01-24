---
description: Display current token usage and budget status with recommendations
---

# Context Command

This file enables the `/pl:context` slash command in Claude Code.

The command provides context status reporting with:
- Token usage breakdown by category
- Budget status assessment
- Cost summary from current session
- Actionable recommendations

Usage:
```
/pl:context
```

Note: Runs `/cost` and `/context` internally to gather token and cost data.

See `skills/context/SKILL.md` for the full skill definition.
