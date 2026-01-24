# Technology Stack: Claude Code Extension Architecture

**Project:** Potenlab Internal Marketplace (`/pl:*` namespace)
**Researched:** 2026-01-24
**Overall Confidence:** HIGH (based on official Claude Code documentation)

---

## Executive Summary

Claude Code extensions are built using a layered architecture with four core primitives: **Skills** (reusable instructions), **Sub-agents** (isolated task executors), **MCP servers** (external tool connections), and **Hooks** (event-driven automation). These can be bundled into **Plugins** for distribution. The `/pl:*` namespace will use the plugin system with skills as the primary interaction pattern.

---

## Architecture Overview

```
+------------------+     +------------------+     +------------------+
|   User Prompt    | --> |   Claude Code    | --> |    Response      |
+------------------+     +------------------+     +------------------+
                              |       |
              +---------------+       +---------------+
              |                                       |
              v                                       v
    +------------------+                   +------------------+
    |     Skills       |                   |   Sub-agents     |
    | (Instructions)   |                   | (Isolated Tasks) |
    +------------------+                   +------------------+
              |                                       |
              v                                       v
    +------------------+                   +------------------+
    |     Hooks        |                   |   MCP Servers    |
    | (Event Handlers) |                   | (External Tools) |
    +------------------+                   +------------------+
```

**How they combine:**
1. **User invokes** `/pl:workflow` (skill)
2. **Skill provides** instructions to Claude
3. **Claude may spawn** sub-agents for isolated work
4. **Sub-agents use** MCP servers to connect external tools
5. **Hooks fire** at lifecycle events (pre/post tool use)

---

## Core Primitives

### 1. Skills (PRIMARY MECHANISM)

**What:** Markdown files with instructions Claude loads contextually or on-demand.

**Confidence:** HIGH (official docs)

| Aspect | Detail |
|--------|--------|
| **Location** | `.claude/skills/<name>/SKILL.md` or `~/.claude/skills/<name>/SKILL.md` |
| **Invocation** | `/skill-name` by user, or automatic by Claude based on `description` |
| **Plugin namespace** | `/plugin-name:skill-name` |
| **Format** | YAML frontmatter + Markdown body |

**SKILL.md Structure:**
```yaml
---
name: skill-name
description: When and why Claude should use this skill
argument-hint: [optional-args]
disable-model-invocation: false  # true = user-only trigger
user-invocable: true             # false = Claude-only
allowed-tools: Read, Grep, Glob  # restrict tool access
model: sonnet                    # override model
context: fork                    # run in sub-agent
agent: Explore                   # which sub-agent type
hooks:                           # skill-scoped hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./validate.sh"
---

# Skill Instructions

Your markdown instructions here. Use $ARGUMENTS for user input.

Dynamic context with shell: !`git status`
```

**Key Frontmatter Fields:**

| Field | Required | Purpose | For Potenlab |
|-------|----------|---------|--------------|
| `name` | No (uses dir name) | Skill identifier | `/pl:skill-name` |
| `description` | Recommended | When Claude should load | Critical for auto-invocation |
| `disable-model-invocation` | No | User-only trigger | Use for destructive actions |
| `context: fork` | No | Run in sub-agent | Isolate heavy operations |
| `allowed-tools` | No | Restrict tool access | Security boundaries |

**Supporting Files:**
```
skills/
└── code-review/
    ├── SKILL.md           # Required entry point
    ├── reference.md       # Optional deep docs
    ├── examples/          # Optional examples
    └── scripts/
        └── validate.sh    # Optional scripts
```

**Best Practices:**
- Keep SKILL.md under 500 lines; use supporting files for reference
- Use `$ARGUMENTS` placeholder for user input
- Use `!`command`` for dynamic context injection
- Set `disable-model-invocation: true` for commands with side effects

### 2. Sub-agents (ISOLATION MECHANISM)

**What:** Specialized AI assistants with isolated context, custom permissions, and focused prompts.

**Confidence:** HIGH (official docs)

| Aspect | Detail |
|--------|--------|
| **Location** | `.claude/agents/<name>.md` or `~/.claude/agents/<name>.md` |
| **Invocation** | Automatic by Claude based on `description`, or explicit request |
| **Plugin location** | `<plugin>/agents/<name>.md` |
| **Format** | YAML frontmatter + Markdown system prompt |

**Agent Definition Structure:**
```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices. Use proactively after code changes.
tools: Read, Grep, Glob            # Allowlist (inherits all if omitted)
disallowedTools: Write, Edit       # Denylist
model: sonnet                      # sonnet, opus, haiku, or inherit
permissionMode: default            # default, acceptEdits, dontAsk, bypassPermissions, plan
skills:                            # Preload skills into agent context
  - api-conventions
  - error-handling
hooks:                             # Agent-scoped hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./validate.sh"
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

**Built-in Sub-agents:**

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| `Explore` | Haiku | Read-only | Fast codebase exploration |
| `Plan` | Inherit | Read-only | Research for planning |
| `general-purpose` | Inherit | All | Complex multi-step tasks |

**Permission Modes:**

| Mode | Behavior | Use Case |
|------|----------|----------|
| `default` | Standard permission prompts | Normal operations |
| `acceptEdits` | Auto-accept file edits | Trusted modification tasks |
| `dontAsk` | Auto-deny prompts | Strict read-only analysis |
| `bypassPermissions` | Skip all checks | **DANGER** - use with caution |
| `plan` | Read-only exploration | Planning and research |

**Key Patterns:**
- Sub-agents **cannot spawn other sub-agents** (max 1 level deep)
- Use skills for reusable prompts that run in main context
- Use sub-agents for isolated, permission-controlled execution
- Preload skills with `skills:` field for domain knowledge injection

### 3. MCP Servers (EXTERNAL INTEGRATION)

**What:** Model Context Protocol servers connect Claude to external tools (JIRA, GitHub, databases, APIs).

**Confidence:** HIGH (official docs)

| Aspect | Detail |
|--------|--------|
| **User config** | `~/.claude.json` |
| **Project config** | `.mcp.json` |
| **Plugin config** | `<plugin>/.mcp.json` or inline in `plugin.json` |
| **Transport types** | `stdio`, `http`, `sse` |

**MCP Configuration Format:**
```json
{
  "mcpServers": {
    "server-name": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/my-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

**For HTTP/SSE Servers:**
```json
{
  "mcpServers": {
    "remote-api": {
      "type": "http",
      "url": "https://mcp.example.com/api",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

**CLI Commands:**
```bash
# Add remote server
claude mcp add --transport http server-name https://mcp.example.com

# Add local server
claude mcp add --transport stdio server-name -- npx -y @company/mcp-server

# List servers
claude mcp list

# Check status
/mcp
```

**Plugin MCP Features:**
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
- Servers auto-start when plugin is enabled
- User environment variables accessible

### 4. Hooks (EVENT-DRIVEN AUTOMATION)

**What:** Event handlers that run commands or prompts at specific lifecycle points.

**Confidence:** HIGH (official docs)

| Aspect | Detail |
|--------|--------|
| **User config** | `~/.claude/settings.json` |
| **Project config** | `.claude/settings.json` or `.claude/settings.local.json` |
| **Plugin config** | `<plugin>/hooks/hooks.json` or inline in `plugin.json` |

**Hook Events:**

| Event | When | Common Use |
|-------|------|------------|
| `SessionStart` | Session begins/resumes | Load context, set env vars |
| `SessionEnd` | Session terminates | Cleanup, logging |
| `UserPromptSubmit` | Before processing prompt | Validation, context injection |
| `PreToolUse` | Before tool execution | Permission control, validation |
| `PostToolUse` | After successful tool | Linting, formatting |
| `PostToolUseFailure` | After tool failure | Error handling |
| `PermissionRequest` | Permission dialog shown | Auto-approve/deny |
| `Stop` | Claude finishes responding | Force continuation |
| `SubagentStart` | Sub-agent spawns | Setup |
| `SubagentStop` | Sub-agent finishes | Cleanup |
| `Notification` | Claude sends notification | Custom alerts |
| `Setup` | `--init` or `--maintenance` flags | One-time setup |
| `PreCompact` | Before context compaction | Save state |

**Hook Configuration:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/scripts/lint.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./validate-command.sh"
          }
        ]
      }
    ]
  }
}
```

**Hook Types:**

| Type | Purpose | Use Case |
|------|---------|----------|
| `command` | Execute shell script | Linting, validation, logging |
| `prompt` | LLM evaluation | Intelligent stop decisions |
| `agent` | Agentic verifier | Complex verification with tools |

**Exit Codes:**
- `0`: Success, continue
- `2`: Block operation, show stderr to Claude
- Other: Non-blocking error, logged

**Hook Input (stdin JSON):**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../session.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm run test"
  },
  "tool_use_id": "toolu_01ABC..."
}
```

**Decision Control (stdout JSON):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Safe command",
    "updatedInput": {
      "command": "npm run test --silent"
    }
  }
}
```

---

## Plugin System (DISTRIBUTION MECHANISM)

**What:** Packaging format for distributing skills, agents, hooks, and MCP servers.

**Confidence:** HIGH (official docs)

### Plugin Structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json         # REQUIRED: manifest
├── skills/                  # Agent Skills
│   └── my-skill/
│       ├── SKILL.md
│       └── scripts/
├── commands/                # Legacy (use skills/)
│   └── simple-command.md
├── agents/                  # Sub-agents
│   └── code-reviewer.md
├── hooks/
│   └── hooks.json          # Hook configuration
├── .mcp.json               # MCP servers
├── .lsp.json               # Language servers
├── scripts/                # Utility scripts
└── README.md
```

**CRITICAL:** Only `plugin.json` goes in `.claude-plugin/`. All other directories at plugin root.

### Plugin Manifest (plugin.json)

```json
{
  "name": "pl-marketplace",
  "version": "1.0.0",
  "description": "Potenlab internal marketplace extensions",
  "author": {
    "name": "Potenlab Team",
    "email": "team@potenlab.com"
  },
  "repository": "https://github.com/potenlab/marketplace-potenlab",
  "license": "MIT",
  "keywords": ["potenlab", "workflows", "automation"]
}
```

**Fields:**

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Plugin ID, becomes skill namespace |
| `version` | No | Semantic version (MAJOR.MINOR.PATCH) |
| `description` | No | Shown in plugin manager |
| `author` | No | Attribution |
| `repository` | No | Source code URL |
| `commands` | No | Custom command paths |
| `agents` | No | Custom agent paths |
| `skills` | No | Custom skill paths |
| `hooks` | No | Hook config path or inline |
| `mcpServers` | No | MCP config path or inline |
| `lspServers` | No | LSP config path or inline |

### Plugin Development Workflow

```bash
# Test locally during development
claude --plugin-dir ./my-plugin

# Load multiple plugins
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two

# Validate manifest
/plugin validate
```

### Plugin Distribution

**Via GitHub Marketplace:**
```json
{
  "plugins": [
    {
      "name": "pl-workflows",
      "source": "./plugins/workflows",
      "description": "Potenlab workflow extensions"
    }
  ]
}
```

**Installation:**
```bash
# From marketplace
claude plugin install pl-workflows@potenlab-marketplace

# Scopes
--scope user     # Personal, all projects (default)
--scope project  # Team, via .claude/settings.json
--scope local    # Personal, current project only
```

---

## Memory System (CONTEXT PERSISTENCE)

**What:** CLAUDE.md files provide persistent instructions across sessions.

**Confidence:** HIGH (official docs)

### Memory Hierarchy

| Type | Location | Shared | Purpose |
|------|----------|--------|---------|
| Managed | `/Library/Application Support/ClaudeCode/CLAUDE.md` | Org-wide | IT policies |
| User | `~/.claude/CLAUDE.md` | Personal | Personal preferences |
| Project | `./CLAUDE.md` or `.claude/CLAUDE.md` | Team | Project conventions |
| Local | `./CLAUDE.local.md` | Personal | Local overrides |
| Rules | `.claude/rules/*.md` | Team | Modular guidelines |

### Path-Specific Rules

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "lib/**/*.ts"
---

# API Development Rules

- All endpoints must include input validation
- Use standard error response format
```

### Memory Imports

```markdown
# Project Instructions

See @README for overview.
See @docs/api-guidelines.md for API conventions.

# Personal Overrides
@~/.claude/my-project-preferences.md
```

---

## Settings System

### Configuration Scopes

| Scope | Location | Precedence |
|-------|----------|------------|
| Managed | System `managed-settings.json` | Highest (cannot override) |
| CLI args | Command line | High |
| Local | `.claude/settings.local.json` | Medium |
| Project | `.claude/settings.json` | Medium |
| User | `~/.claude/settings.json` | Lowest |

### Permission Rules

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(git * main)",
      "Read(./.env)"
    ],
    "deny": [
      "Bash(curl:*)",
      "Read(./secrets/**)"
    ],
    "ask": [
      "Bash(git push:*)"
    ]
  }
}
```

---

## Recommended Stack for Potenlab Marketplace

### Plugin Configuration

```
pl-marketplace/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── deploy/
│   │   ├── SKILL.md
│   │   └── scripts/
│   ├── review/
│   │   └── SKILL.md
│   └── init/
│       └── SKILL.md
├── agents/
│   ├── code-reviewer.md
│   └── security-scanner.md
├── hooks/
│   └── hooks.json
├── .mcp.json
└── README.md
```

### Namespace Pattern

All skills accessible as `/pl:skill-name`:
- `/pl:deploy` - Deployment workflows
- `/pl:review` - Code review
- `/pl:init` - Project initialization

### Distribution Strategy

1. **GitHub repository** as marketplace source
2. **Team installation** via `--scope project`
3. **Updates** via `claude plugin update`

---

## What NOT to Do

| Anti-Pattern | Why | Do Instead |
|--------------|-----|------------|
| Put skills in `.claude-plugin/` | Wrong location, won't load | Put at plugin root |
| Spawn sub-agents from sub-agents | Not supported (max 1 level) | Chain from main context |
| Use absolute paths in plugins | Breaks portability | Use `${CLAUDE_PLUGIN_ROOT}` |
| Store secrets in plugin files | Security risk | Use environment variables |
| Make giant SKILL.md files | Consumes context | Use supporting files |
| Skip `description` in skills | Claude can't auto-invoke | Always provide description |

---

## Sources

All information from official Claude Code documentation (HIGH confidence):

- [Skills Documentation](https://code.claude.com/docs/en/skills)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents)
- [MCP Documentation](https://code.claude.com/docs/en/mcp)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Plugins Documentation](https://code.claude.com/docs/en/plugins)
- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Memory Documentation](https://code.claude.com/docs/en/memory)
- [Settings Documentation](https://code.claude.com/docs/en/settings)
