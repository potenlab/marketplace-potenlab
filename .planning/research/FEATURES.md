# Feature Landscape: Claude Code Extensions

**Domain:** Claude Code Extension Marketplace (Internal Team)
**Researched:** 2026-01-24
**Confidence:** HIGH (based on official Claude Code documentation)

## Executive Summary

Claude Code provides a comprehensive extension architecture with four core building blocks:
1. **Skills** (formerly Commands) - Custom slash commands with dynamic context
2. **Subagents** - Specialized AI assistants with isolated context and tool restrictions
3. **Hooks** - Event handlers for workflow automation
4. **MCP Servers** - External tool integrations via Model Context Protocol

The Potenlab target extensions (`/pl:slice`, `/pl:review`, `/pl:research`, `/pl:refactor`) map directly to these primitives. The architecture is mature and well-documented.

---

## Table Stakes

Features users expect from any extension. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Slash command invocation** | Universal UX pattern in Claude Code (`/command-name`) | Low | Use Skills with `SKILL.md` files |
| **Clear description** | Users need to know what command does | Low | `description` field in frontmatter |
| **Argument support** | Most commands need user input | Low | `$ARGUMENTS` placeholder substitution |
| **Error handling** | Users need feedback when things fail | Low | Exit codes, stderr handling |
| **Plugin metadata** | Name, version, description for discovery | Low | `.claude-plugin/plugin.json` manifest |
| **README documentation** | Users need usage instructions | Low | Standard markdown |
| **Namespace isolation** | Prevent conflicts between plugins | Low | Automatic: `/plugin-name:command` |
| **Installation via CLI** | `/plugin install` workflow | Low | Standard plugin system |
| **Enable/disable toggle** | Teams need to control active plugins | Low | `/plugin` command interface |

### Table Stakes for Specific Extension Types

| Extension Type | Table Stakes Features |
|----------------|----------------------|
| `/pl:slice` (Figma-to-code) | MCP server for Figma API, component templates, code generation |
| `/pl:review` (Code review) | Read-only tool access, clear review checklist, actionable feedback format |
| `/pl:research` (Parallel research) | Subagent spawning, parallel execution, result synthesis |
| `/pl:refactor` (Refactoring) | Edit tool access, file modification, test verification |

---

## Differentiators

Features that set extensions apart. Not expected, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Subagent isolation** | Preserve main context, run heavy tasks separately | Medium | `context: fork` in skill frontmatter |
| **Parallel subagent execution** | 10x speed for independent tasks | Medium | Spawn multiple subagents, Claude synthesizes results |
| **Model selection per agent** | Cost optimization (Haiku for simple, Opus for complex) | Low | `model: haiku/sonnet/opus` in config |
| **Tool restrictions** | Safety through limited capabilities | Low | `tools:` or `disallowedTools:` fields |
| **Permission modes** | Auto-approve safe operations | Medium | `permissionMode: acceptEdits/bypassPermissions` |
| **Hook-based automation** | Trigger actions on events (PostToolUse, Stop) | Medium | `hooks/hooks.json` configuration |
| **Dynamic context injection** | Inject live data before execution | Medium | `!`command`` syntax in skills |
| **PreToolUse validation** | Block/modify tool calls before execution | High | Hook scripts with exit code 2 |
| **Background task execution** | Non-blocking long-running operations | Medium | Ctrl+B to background, async patterns |
| **Subagent resume** | Continue interrupted work with full context | Medium | Resume by agent ID |
| **MCP Tool Search** | Lazy-load tools to save context | Low | Auto-enabled when many MCP tools |
| **Visual output generation** | HTML reports, diagrams, interactive views | High | Bundled scripts with `webbrowser.open()` |
| **LSP integration** | Real-time code intelligence | High | `.lsp.json` for language servers |
| **Session hooks** | Load context at session start/end | Medium | `SessionStart`, `SessionEnd` events |
| **Prompt-based hooks** | LLM-evaluated decisions (not just scripts) | High | `type: "prompt"` in hook config |

### Differentiator Patterns for Potenlab Extensions

| Extension | Key Differentiators |
|-----------|---------------------|
| `/pl:slice` | MCP for Figma + dynamic context injection for component state |
| `/pl:review` | Subagent isolation for thorough review + hook to auto-lint after suggestions |
| `/pl:research` | Parallel subagents + background execution + result synthesis |
| `/pl:refactor` | PreToolUse hooks for validation + permission bypassing for speed |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Monolithic mega-plugins** | Hard to maintain, context bloat | Create focused single-purpose plugins |
| **Infinite subagent nesting** | Not supported, causes failures | Chain subagents from main conversation |
| **Global state mutation** | Session isolation is intentional | Use CLAUDE.md for persistent context |
| **Unverified MCP servers** | Security risk, prompt injection | Vet all third-party MCP connections |
| **Ignoring context limits** | Extensions can exhaust context window | Use subagents, Tool Search, compaction |
| **Auto-running destructive commands** | Data loss risk | Require permission for writes/deletes |
| **Hardcoded absolute paths** | Breaks portability | Use `$CLAUDE_PROJECT_DIR`, `${CLAUDE_PLUGIN_ROOT}` |
| **Synchronous-only design** | Blocks user during long operations | Support background execution |
| **Exposing secrets in skills** | Security vulnerability | Use environment variables, MCP auth |
| **Over-permissive tool access** | Violates principle of least privilege | Restrict to minimum needed tools |

---

## Feature Dependencies

```
Plugin Manifest (required)
    └── Can contain:
        ├── Skills (SKILL.md files)
        │   └── Can use:
        │       ├── $ARGUMENTS substitution
        │       ├── Dynamic context (!`command`)
        │       ├── Tool restrictions
        │       ├── Permission modes
        │       └── context: fork → Subagent execution
        │
        ├── Agents (agents/*.md)
        │   └── Can configure:
        │       ├── Model selection
        │       ├── Tool access
        │       ├── Permission mode
        │       ├── Preloaded skills
        │       └── Agent-scoped hooks
        │
        ├── Hooks (hooks/hooks.json)
        │   └── Event types:
        │       ├── PreToolUse (validate/block/modify)
        │       ├── PostToolUse (react to changes)
        │       ├── Stop/SubagentStop (control completion)
        │       └── SessionStart/End (lifecycle)
        │
        ├── MCP Servers (.mcp.json)
        │   └── Transport types:
        │       ├── HTTP (recommended for remote)
        │       ├── SSE (deprecated)
        │       └── stdio (local processes)
        │
        └── LSP Servers (.lsp.json)
            └── Language-specific code intelligence
```

### Dependency Chain for Parallel Research Extension

```
/pl:research skill
    └── Spawns multiple subagents (context: fork, agent: Explore)
        └── Each subagent has:
            ├── Isolated context window
            ├── Read-only tools (Grep, Glob, Read)
            └── Model: Haiku (fast, low-cost)
        └── Results return to main conversation
            └── Claude synthesizes findings
```

---

## Extension Type Reference

### Skills (Primary Building Block)

**What:** Custom slash commands with instructions
**When to use:** Any reusable workflow or prompt
**Configuration:**

```yaml
---
name: skill-name
description: When Claude should use this skill
disable-model-invocation: true  # User-only trigger
allowed-tools: Read, Grep, Glob
context: fork  # Run in subagent
agent: Explore  # Which subagent type
model: haiku   # Cost optimization
---

Your instructions here with $ARGUMENTS
```

**Key patterns:**
- Use `disable-model-invocation: true` for actions with side effects
- Use `context: fork` for heavy/isolated work
- Use `!`command`` for dynamic context injection

### Subagents (Parallel Execution)

**What:** Specialized AI assistants in isolated context
**When to use:** Complex tasks, parallel work, context preservation
**Built-in types:**
- `Explore` - Fast, read-only codebase analysis (Haiku)
- `Plan` - Research for planning (read-only)
- `general-purpose` - Full capabilities

**Custom agent configuration:**

```yaml
---
name: my-agent
description: When Claude should delegate here
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: sonnet
permissionMode: dontAsk
skills:
  - api-conventions
  - error-handling
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./validate.sh"
---

System prompt for this agent...
```

**Parallelism:** Up to 10 concurrent subagents, queued beyond that

### Hooks (Event-Driven Automation)

**What:** Scripts triggered by Claude Code events
**When to use:** Validation, automation, notifications

**Key events:**
| Event | Use Case |
|-------|----------|
| `PreToolUse` | Validate/block/modify tool calls |
| `PostToolUse` | React to tool completion (lint after edit) |
| `Stop` | Control when Claude finishes |
| `SessionStart` | Load initial context |
| `UserPromptSubmit` | Validate user input |
| `Notification` | Custom notification handling |

**Exit codes:**
- `0` = Success (stdout to user in verbose mode)
- `2` = Blocking error (stderr to Claude)
- Other = Non-blocking error

**JSON output for advanced control:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask",
    "updatedInput": { "field": "modified value" }
  }
}
```

### MCP Servers (External Integrations)

**What:** Connect Claude to external tools/data
**When to use:** Third-party APIs, databases, design tools

**Transport types:**
1. **HTTP** (recommended for remote)
2. **SSE** (deprecated, use HTTP)
3. **stdio** (local processes)

**Configuration in `.mcp.json`:**
```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "headers": { "Authorization": "Bearer ${FIGMA_TOKEN}" }
    },
    "local-tool": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/my-server",
      "args": ["--config", "config.json"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

**Environment variables:** `${VAR}` or `${VAR:-default}` syntax supported

---

## MVP Recommendation

For Potenlab internal marketplace, prioritize in this order:

### Phase 1: Foundation
1. **Plugin structure** - `.claude-plugin/plugin.json` manifest
2. **Simple skills** - `/pl:review` with static instructions
3. **Tool restrictions** - Read-only for review, edit for refactor

### Phase 2: Core Extensions
4. **`/pl:review`** - Code review skill with read-only tools
5. **`/pl:refactor`** - Refactoring skill with edit tools
6. **Subagent isolation** - Use `context: fork` for heavy work

### Phase 3: Advanced
7. **`/pl:research`** - Parallel subagent research
8. **`/pl:slice`** - Figma MCP + code generation
9. **Hooks** - Auto-linting, validation

### Defer to Later:
- **LSP integration** - Complex, language-specific
- **Visual output generation** - Nice-to-have, not core
- **Prompt-based hooks** - Advanced, requires iteration

---

## Sources

### Official Documentation (HIGH Confidence)
- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [Create Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [Connect Claude Code to Tools via MCP](https://code.claude.com/docs/en/mcp)
- [Extend Claude with Skills](https://code.claude.com/docs/en/skills)
- [Create Plugins](https://code.claude.com/docs/en/plugins)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)

### Community Resources (MEDIUM Confidence)
- [Awesome Claude Code Plugins](https://github.com/ccplugins/awesome-claude-code-plugins) - 130+ plugins catalog
- [Claude Plugins Official](https://github.com/anthropics/claude-plugins-official) - Anthropic curated directory
- [Parallel Subagents Guide](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/)
- [Claude Code Subagent Deep Dive](https://cuong.io/blog/2025/06/24-claude-code-subagent-deep-dive)
