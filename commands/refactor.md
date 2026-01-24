---
description: Refactor code with clear before/after explanation. Verifies changes with tests before completion.
---

# Refactor Command

This file enables the `/pl:refactor` slash command in Claude Code.

The command provides code refactoring with:
- Analysis of current code structure
- Clear before/after comparison
- Test verification before completion
- Explanation of improvements made

Usage:
```
/pl:refactor src/utils/helper.ts "extract repeated logic into function"
/pl:refactor src/components/Button.tsx "simplify state management"
```

See `skills/refactor/SKILL.md` for the full skill definition.
