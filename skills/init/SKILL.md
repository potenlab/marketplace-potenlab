---
name: init
description: Configure project with MCPs, rules, and agents in one command
---

# Project Initialization

Initialize a project with the Potenlab team's standard Claude Code configuration.

## What This Does

When you run `/pl:init`, Claude will:

1. **Check for .mcp.json**
   - If missing, create a placeholder configuration file
   - If exists, report current MCP configuration

2. **Check for .claude/rules/**
   - If missing, create the directory with placeholder rules
   - If exists, report existing rules

3. **Report Configuration**
   - Display what was created or found
   - Suggest next steps

## Instructions for Claude

When the user runs this command, perform the following steps:

### Step 1: Check MCP Configuration

```bash
if [ ! -f .mcp.json ]; then
  echo "Creating .mcp.json placeholder..."
  # Create placeholder - full MCP config comes in later phases
fi
```

If `.mcp.json` does not exist, create it with this placeholder content:

```json
{
  "mcpServers": {}
}
```

### Step 2: Check Rules Directory

```bash
if [ ! -d .claude/rules ]; then
  mkdir -p .claude/rules
  echo "Created .claude/rules/ directory"
fi
```

If `.claude/rules/` does not exist, create it and add a placeholder file:

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

### Step 4: Display MCP Guidelines

After initialization, also display the MCP token budget guidelines:

```
MCP Token Budget Guidelines
---------------------------
- MCP tools should not exceed 40% of context
- Check usage with: /context or /pl:context
- Enable early Tool Search: ENABLE_TOOL_SEARCH=auto:5

Recommended MCP Configuration:
1. Use CLI tools (gh, aws, gcloud) when available
2. Prefer project-scoped MCP over user-scoped
3. Disable unused servers: /mcp
4. Set output limits: MAX_MCP_OUTPUT_TOKENS=25000

Check MCP health:
/mcp          # List and manage servers
/context      # See token breakdown
/pl:context   # Potenlab context summary
```

## Note

This is a skeleton implementation for Phase 1. Full MCP configuration, rules templates, and agent setup will be added in later phases.

## Future Enhancements

- Pre-configured MCP server templates
- Standard rule sets for different project types
- Agent configuration for common workflows
- Interactive setup wizard
- ENABLE_TOOL_SEARCH auto-configuration
