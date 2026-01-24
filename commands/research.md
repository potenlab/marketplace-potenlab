---
description: Research a topic using parallel sub-agents across multiple dimensions, synthesizing findings into actionable insights
allowed-tools: Task, Read, Grep, Glob, WebFetch
---

# Research Command

This file enables the `/pl:research` slash command in Claude Code.

The command provides parallel research capabilities with:
- 5 fixed dimensions (Technical, Ecosystem, Patterns, Pitfalls, Path Forward)
- Parallel sub-agent execution for faster research
- File-based synthesis via `.research/` directory
- Structured output with confidence ratings

Usage:
```
/pl:research "nextjs auth patterns"
/pl:research "state management for React"
/pl:research "database optimization strategies"
```

See `skills/research/SKILL.md` for the full skill definition.
