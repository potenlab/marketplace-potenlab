---
description: Convert Figma design to component code using MCP integration. Provide a Figma frame link.
---

# Slice Command

This file enables the `/pl:slice` slash command in Claude Code.

The command provides Figma to code conversion with:
- 8-step Figma MCP workflow
- Design token extraction and mapping
- Project convention analysis
- Reusable component detection via Code Connect

Usage:
```
/pl:slice https://www.figma.com/design/abc123/MyDesign?node-id=123-456
/pl:slice https://figma.com/design/xyz/Component?node-id=1-2
```

Note: Requires Figma MCP to be configured. The skill will provide setup instructions if not available.

See `skills/slice/SKILL.md` for the full skill definition.
