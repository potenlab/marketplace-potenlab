---
description: Initialize project with MCPs, rules, and agents in one command
allowed-tools: [Bash, Read, Write]
---

# Project Initialization

Initialize a project with the Potenlab team's standard Claude Code configuration.

## What This Does

When you run `/pl:init`, perform the following steps:

### Step 1: Check MCP Configuration

Check if `.mcp.json` exists. If not, create it with:

```json
{
  "mcpServers": {}
}
```

### Step 2: Check Rules Directory

Check if `.claude/rules/` directory exists. If not, create it and add a placeholder:

**.claude/rules/README.md**
```markdown
# Claude Rules

Add project-specific rules here.

Rules are loaded by Claude Code to customize behavior for this project.
```

### Step 3: Report Results

After running, provide a summary:

```
Potenlab Project Initialization Complete!

Configuration:
- .mcp.json: [created/exists]
- .claude/rules/: [created/exists]

Next steps:
- Run /pl:help to see available commands
- Configure MCPs in .mcp.json as needed
- Add project rules to .claude/rules/
```

## Note

This is a skeleton implementation for Phase 1. Full MCP configuration, rules templates, and agent setup will be added in later phases.
