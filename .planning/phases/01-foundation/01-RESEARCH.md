# Phase 1: Foundation - Research

**Researched:** 2026-01-24
**Domain:** Claude Code Plugin System
**Confidence:** HIGH

## Summary

This research covers the Claude Code plugin system, focusing on plugin manifest structure, directory organization, skill/command registration, namespace handling, and installation via GitHub. The Claude Code plugin system is well-documented with a mature API that supports skills, agents, hooks, MCP servers, and LSP servers.

The plugin system uses a specific directory structure with `.claude-plugin/plugin.json` as the manifest file, and component directories (`commands/`, `skills/`, `agents/`, `hooks/`) at the plugin root level. Skills are namespaced using the plugin name (e.g., `/plugin-name:skill-name`), which prevents conflicts between plugins.

**Primary recommendation:** Create a plugin with namespace `pl` containing a manifest at `.claude-plugin/plugin.json`, skills in `skills/` directory, and a `marketplace.json` for GitHub distribution.

## Standard Stack

The established approach for Claude Code plugins:

### Core Components
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| Plugin Manifest | `.claude-plugin/plugin.json` | Plugin metadata and configuration | Required by Claude Code plugin system |
| Skills | `skills/<name>/SKILL.md` | Model-invoked slash commands | Official pattern for reusable skills |
| Commands | `commands/<name>.md` | User-invoked slash commands | Legacy pattern, still supported |
| Agents | `agents/<name>.md` | Specialized subagents | For complex multi-step workflows |
| Hooks | `hooks/hooks.json` | Event handlers | For automation on tool events |
| MCP Config | `.mcp.json` | External tool configuration | For MCP server integration |

### Supporting Files
| File | Location | Purpose | When to Use |
|------|----------|---------|-------------|
| marketplace.json | `.claude-plugin/marketplace.json` | Plugin catalog for distribution | When sharing via GitHub |
| README.md | Plugin root | Plugin documentation | Always include |
| CHANGELOG.md | Plugin root | Version history | For versioned releases |

### No External Dependencies Required
This is a pure Claude Code plugin - no npm packages or external libraries needed. The plugin system is built into Claude Code.

## Architecture Patterns

### Recommended Plugin Structure
```
marketplace-potenlab/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest (required)
│   └── marketplace.json     # Marketplace catalog (for distribution)
├── skills/                   # Skills directory (at root, NOT inside .claude-plugin/)
│   ├── help/
│   │   └── SKILL.md         # Creates /pl:help
│   └── init/
│       └── SKILL.md         # Creates /pl:init
├── agents/                   # Agents directory (optional)
├── hooks/                    # Hooks directory (optional)
│   └── hooks.json
├── .mcp.json                # MCP configuration (optional)
├── README.md                # Plugin documentation
└── CHANGELOG.md             # Version history
```

### Pattern 1: Plugin Manifest Structure
**What:** The `plugin.json` manifest defines plugin identity and component locations
**When to use:** Required for all plugins
**Example:**
```json
// Source: https://code.claude.com/docs/en/plugins-reference
{
  "name": "pl",
  "version": "1.0.0",
  "description": "Potenlab team toolkit for Claude Code",
  "author": {
    "name": "Potenlab",
    "email": "team@potenlab.com"
  },
  "homepage": "https://github.com/potenlab/marketplace-potenlab",
  "repository": "https://github.com/potenlab/marketplace-potenlab",
  "license": "MIT",
  "keywords": ["potenlab", "team", "toolkit"]
}
```

### Pattern 2: Skill Structure with SKILL.md
**What:** Skills are directories containing SKILL.md files with YAML frontmatter
**When to use:** For all slash commands
**Example:**
```markdown
// Source: https://code.claude.com/docs/en/skills
---
name: help
description: Display all available Potenlab commands with descriptions
disable-model-invocation: true
---

# Help Command

Display all available commands in the /pl namespace with their descriptions.

List each command with:
1. Command name (e.g., /pl:help)
2. Brief description of what it does
3. Usage example if applicable
```

### Pattern 3: Namespace-Based Commands
**What:** Plugin skills are automatically namespaced with plugin name
**When to use:** Always - this is automatic behavior
**Example:**
- Plugin name: `pl`
- Skill folder: `skills/help/`
- Resulting command: `/pl:help`

### Pattern 4: Marketplace Distribution
**What:** A `marketplace.json` file catalogs plugins for installation
**When to use:** When distributing via GitHub
**Example:**
```json
// Source: https://code.claude.com/docs/en/plugin-marketplaces
{
  "name": "potenlab-marketplace",
  "owner": {
    "name": "Potenlab",
    "email": "team@potenlab.com"
  },
  "plugins": [
    {
      "name": "pl",
      "source": "./",
      "description": "Potenlab team toolkit for Claude Code",
      "version": "1.0.0"
    }
  ]
}
```

### Anti-Patterns to Avoid
- **Putting components inside `.claude-plugin/`:** Commands, skills, agents, and hooks directories MUST be at plugin root level, NOT nested inside `.claude-plugin/`. Only `plugin.json` goes inside `.claude-plugin/`.
- **Using absolute paths:** All paths must be relative and start with `./`
- **Hardcoding plugin installation paths:** Use `${CLAUDE_PLUGIN_ROOT}` for all intra-plugin path references
- **Non-kebab-case names:** Use kebab-case for all directory and file names

## Don't Hand-Roll

Problems that have existing solutions in the Claude Code plugin system:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command namespacing | Custom prefix handling | Plugin `name` field | Automatic namespacing via plugin system |
| Command discovery | Custom help system | Claude's built-in `/help` | Shows all commands including plugins |
| Plugin installation | Custom installation scripts | `claude plugin install` | Built-in CLI command |
| MCP server integration | Custom API clients | `.mcp.json` configuration | Native MCP support |
| Event hooks | Custom event listeners | `hooks/hooks.json` | Built-in hook system |

**Key insight:** The Claude Code plugin system handles all infrastructure concerns. Focus on skill content, not plugin mechanics.

## Common Pitfalls

### Pitfall 1: Wrong Directory Structure
**What goes wrong:** Skills/commands placed inside `.claude-plugin/` directory instead of plugin root
**Why it happens:** Intuitive but incorrect assumption that all plugin files go in `.claude-plugin/`
**How to avoid:** Only `plugin.json` and `marketplace.json` go in `.claude-plugin/`. All component directories at root level.
**Warning signs:** Commands not appearing, "no commands found" warnings

### Pitfall 2: Manifest JSON Syntax Errors
**What goes wrong:** Invalid JSON in `plugin.json` prevents plugin loading
**Why it happens:** Missing commas, extra commas, or unquoted strings
**How to avoid:** Validate with `claude plugin validate .` before testing
**Warning signs:** "Invalid JSON syntax" or "corrupt manifest file" errors

### Pitfall 3: Missing SKILL.md File
**What goes wrong:** Skill directories without SKILL.md are ignored
**Why it happens:** Creating folders but forgetting the required entrypoint
**How to avoid:** Every skill folder MUST contain a `SKILL.md` file
**Warning signs:** Commands not appearing in `/help` output

### Pitfall 4: Path References Outside Plugin
**What goes wrong:** Paths like `../shared/` fail after installation
**Why it happens:** Plugins are copied to cache; external paths not included
**How to avoid:** Keep all files inside plugin directory, use symlinks if needed
**Warning signs:** "File not found" errors after installation

### Pitfall 5: Forgetting disable-model-invocation
**What goes wrong:** Claude automatically triggers commands like deploy/init
**Why it happens:** Default allows model to invoke any skill
**How to avoid:** Add `disable-model-invocation: true` for action commands
**Warning signs:** Claude unexpectedly running init/deploy/commit commands

## Code Examples

Verified patterns from official documentation:

### Plugin Manifest (plugin.json)
```json
// Source: https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema
{
  "name": "pl",
  "version": "1.0.0",
  "description": "Potenlab team toolkit for Claude Code",
  "author": {
    "name": "Potenlab"
  },
  "homepage": "https://github.com/potenlab/marketplace-potenlab",
  "repository": "https://github.com/potenlab/marketplace-potenlab",
  "license": "MIT",
  "keywords": ["potenlab", "toolkit", "team"]
}
```

### Help Skill (skills/help/SKILL.md)
```markdown
// Source: https://code.claude.com/docs/en/skills#frontmatter-reference
---
name: help
description: Display all available Potenlab commands with descriptions
disable-model-invocation: true
---

# Potenlab Help

Display all commands available in the /pl namespace:

## Available Commands

- `/pl:help` - Display this help message
- `/pl:init` - Initialize project with MCPs, rules, and agents

For each command, show:
1. The full command name
2. A brief description of its purpose
3. Any required or optional arguments
```

### Init Skill (skills/init/SKILL.md)
```markdown
// Source: https://code.claude.com/docs/en/skills#frontmatter-reference
---
name: init
description: Configure project with MCPs, rules, and agents in one command
disable-model-invocation: true
---

# Project Initialization

Set up this project with the Potenlab team configuration:

1. Configure MCP servers for the project
2. Set up Claude rules (.claude/rules/*.md)
3. Install required agents

This command prepares the project for Claude Code with all team standards.
```

### Marketplace Catalog (marketplace.json)
```json
// Source: https://code.claude.com/docs/en/plugin-marketplaces#marketplace-schema
{
  "name": "potenlab-marketplace",
  "owner": {
    "name": "Potenlab",
    "email": "team@potenlab.com"
  },
  "metadata": {
    "description": "Official Potenlab Claude Code plugins",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "pl",
      "source": "./",
      "description": "Potenlab team toolkit for Claude Code",
      "version": "1.0.0",
      "homepage": "https://github.com/potenlab/marketplace-potenlab"
    }
  ]
}
```

### Installation Commands
```bash
# Add marketplace from GitHub
claude plugin marketplace add potenlab/marketplace-potenlab

# Install plugin from marketplace
claude plugin install pl@potenlab-marketplace

# Or within Claude Code:
/plugin marketplace add potenlab/marketplace-potenlab
/plugin install pl@potenlab-marketplace
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `commands/` directory | `skills/` directory with SKILL.md | Current version | Skills support additional features like supporting files, frontmatter |
| Single markdown files | Skill folders with SKILL.md | Current version | Better organization, supporting files possible |

**Note:** Both approaches work. `commands/` is still supported for backward compatibility, but `skills/` is recommended for new development.

**Current version requirements:**
- Claude Code version 1.0.33 or later for plugin support
- Claude Code version 2.0.12 or higher for community plugin CLI tools

## Open Questions

1. **Marketplace naming conventions**
   - What we know: Marketplace names must be kebab-case, certain names are reserved
   - What's unclear: Whether `potenlab-marketplace` vs `marketplace-potenlab` matters
   - Recommendation: Use `potenlab-marketplace` as the marketplace name

2. **Init command scope**
   - What we know: `/pl:init` should configure MCPs, rules, and agents
   - What's unclear: Exact MCP servers and rules to include (Phase 2+ concern)
   - Recommendation: Create skeleton init for Phase 1, flesh out in later phases

## Sources

### Primary (HIGH confidence)
- [Create plugins](https://code.claude.com/docs/en/plugins) - Official plugin creation guide
- [Plugins reference](https://code.claude.com/docs/en/plugins-reference) - Complete technical specifications
- [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins) - Installation documentation
- [Skills](https://code.claude.com/docs/en/skills) - Skill system documentation
- [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) - Marketplace distribution

### Secondary (MEDIUM confidence)
- [claude-code/plugins GitHub](https://github.com/anthropics/claude-code/tree/main/plugins) - Official example plugins
- [claude-plugins-official GitHub](https://github.com/anthropics/claude-plugins-official) - Official Anthropic plugins

## Metadata

**Confidence breakdown:**
- Plugin manifest structure: HIGH - Official documentation verified
- Directory structure: HIGH - Official documentation verified with explicit warnings about common mistakes
- Skill/command registration: HIGH - Multiple official sources confirm
- Installation from GitHub: HIGH - Official documentation with examples
- Namespace handling: HIGH - Official documentation explicitly states automatic namespacing

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - plugin system is stable)
