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
| `/pl:qa-check [id]` | Create git branch, commit, and PR for QA fixes |
| `/pl:qa-list` | Generate QA list from Google Sheets with local image tags |
| `/pl:qa-plan` | Transform QA findings into actionable developer tasks |
| `/pl:refactor <file>` | Refactor code with before/after explanation and test verification |
| `/pl:research <topic>` | Research a topic using parallel sub-agents across multiple dimensions |
| `/pl:review <file>` | Analyze code and return structured feedback (read-only) |
| `/pl:slice <figma-link>` | Convert Figma design to component code using MCP integration |

## Requirements

- Claude Code version 1.0.33 or higher
- GitHub access (for marketplace installation)
- **For QA Workflow:** [Google Drive MCP](https://github.com/piotr-agier/google-drive-mcp) (see [QA Workflow Setup](#qa-workflow-setup))

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

### QA Workflow

```
/pl:qa-list                             # Generate QA list from Google Sheets
/pl:qa-plan                             # Create developer tasks from QA list
/pl:qa-check 002                        # Create fix branch and PR for item 002
```

## QA Workflow Setup

The QA commands require the **Google Drive MCP** to access Google Sheets and Drive files.

### Step 1: Install Google Drive MCP

```bash
git clone https://github.com/piotr-agier/google-drive-mcp.git
cd google-drive-mcp
npm install
npm run build
```

### Step 2: Configure MCP in Claude Code

Add to your `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "google-drive": {
      "command": "node",
      "args": ["/path/to/google-drive-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

See [google-drive-mcp](https://github.com/piotr-agier/google-drive-mcp) for OAuth setup.

### Step 3: QA Workflow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Google Sheets  │────▶│   /pl:qa-list    │────▶│ qa-list-auto-   │
│  (QA tracking)  │     │                  │     │ mated.md        │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│  Google Drive   │────▶│  qa-image-tag    │──────────────┘
│  (screenshots)  │     │  (auto-runs)     │
└─────────────────┘     └──────────────────┘

                        ┌──────────────────┐     ┌─────────────────┐
                        │   /pl:qa-plan    │────▶│   qa-plan.md    │
                        │                  │     │ (dev tasks)     │
                        └──────────────────┘     └─────────────────┘

                        ┌──────────────────┐     ┌─────────────────┐
                        │  /pl:qa-check    │────▶│   GitHub PR     │
                        │                  │     │                 │
                        └──────────────────┘     └─────────────────┘
```

**First run of `/pl:qa-list`** will prompt for:
- Google Sheets link (QA tracking spreadsheet)
- Google Drive link (screenshots folder)
- Local image path (e.g., `@Images/`)

Configuration is saved to `source.json` for future runs.

### Get Help

Run `/pl:help` to see all available commands and their usage:

```
/pl:help
```

## Contributing

This is an internal Potenlab team plugin. For issues or feature requests, contact the platform team.

## License

MIT License - see LICENSE file for details.
