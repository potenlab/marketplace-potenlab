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
| `/pl:help` | Display available commands and usage |
| `/pl:init` | Initialize a project with team tooling |

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

### Get Help

Run `/pl:help` to see all available commands and their usage:

```
/pl:help
```

## Contributing

This is an internal Potenlab team plugin. For issues or feature requests, contact the platform team.

## License

MIT License - see LICENSE file for details.
