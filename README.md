# Potenlab Claude Code Marketplace

Official Potenlab plugins for Claude Code. Provides team-standard tooling and project initialization workflows.

## Installation

Add the marketplace and install the plugin:

```bash
# Add marketplace
claude plugin marketplace add potenlab/marketplace-potenlab

# Install the plugin
claude plugin install pl@potenlab-marketplace
```

## Available Commands

After installation, the following commands are available in Claude Code:

| Command | Description |
|---------|-------------|
| `/pl:commit [hint]` | Create well-formatted git commits with conventional commits format |
| `/pl:context` | Display current token usage and budget status with recommendations |
| `/pl:help` | Display available commands and usage |
| `/pl:init` | Initialize a project with team tooling |
| `/pl:refactor <file>` | Refactor code with before/after explanation and test verification |
| `/pl:research <topic>` | Research a topic using parallel sub-agents across multiple dimensions |
| `/pl:review <file>` | Analyze code and return structured feedback (read-only) |
| `/pl:slice <figma-link>` | Convert Figma design to component code using MCP integration |

## Requirements

- Claude Code version 1.0.33 or higher
- GitHub access (for marketplace installation)

## Usage

### Initialize a New Project

Run `/pl:init` in any project to set up Potenlab's standard Claude Code configuration:

```
/pl:init
```

This will configure:
- Team-standard CLAUDE.md settings
- Project hooks for code quality
- Standard command shortcuts

### Code Review and Refactoring

```
/pl:review src/components/Button.tsx    # Get structured feedback
/pl:refactor src/utils/helpers.ts       # Refactor with test verification
```

### Research and Design

```
/pl:research "nextjs auth patterns"     # Parallel research with synthesis
/pl:slice <figma-link>                  # Convert Figma design to code
```

### Context and Commits

```
/pl:context                             # Check token usage and budget
/pl:commit "add user auth"              # Create well-formatted commit
```

### Get Help

Run `/pl:help` to see all available commands and their usage:

```
/pl:help
```

## Contributing

This is an internal Potenlab team plugin. For issues or feature requests, contact the platform team.

## License

MIT License - see LICENSE file for details.
