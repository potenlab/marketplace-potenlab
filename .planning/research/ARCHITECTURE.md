# Architecture Patterns for Claude Code Extensions

**Domain:** Claude Code extension architecture (skills, sub-agents, MCP)
**Researched:** 2026-01-24
**Confidence:** HIGH (based on official Claude Code documentation)

## Executive Summary

Claude Code provides a layered extension architecture where each component serves a distinct purpose. Building sophisticated workflows like parallel research requires understanding how these layers compose: **Skills** provide reusable knowledge and invocable workflows, **Sub-agents** provide isolated execution contexts for parallel or context-heavy work, **MCP** connects to external services, and **Hooks** automate deterministic actions. **Plugins** bundle these into distributable packages.

The key architectural insight: **Skills orchestrate, Sub-agents execute in parallel, MCP provides external data**. A `/pl:research` skill would contain orchestration logic that spawns multiple sub-agents, each researching one dimension with its own isolated context window, then synthesizes their results.

## Recommended Architecture for Parallel Research

### High-Level Component Flow

```
User invokes /pl:research
        |
        v
+------------------+
|  Orchestrator    |  <-- Skill with context: fork
|  (SKILL.md)      |      Spawns sub-agents, synthesizes results
+------------------+
        |
        +----+----+----+----+
        |    |    |    |    |
        v    v    v    v    v
     +----+ +----+ +----+ +----+
     |Sub | |Sub | |Sub | |Sub |  <-- Custom sub-agents
     |Agt1| |Agt2| |Agt3| |Agt4|      Each has isolated context
     +----+ +----+ +----+ +----+      Can run in parallel (up to 7)
        |    |    |    |
        +----+----+----+
             |
             v
     +------------------+
     |  Synthesizer     |  <-- Either main agent or dedicated sub-agent
     |  (combines)      |
     +------------------+
             |
             v
       Final Output
```

### Component Boundaries

| Component | Responsibility | Location | Communicates With |
|-----------|---------------|----------|-------------------|
| Orchestrator Skill | Define research dimensions, spawn sub-agents, synthesis instructions | `.claude/skills/research/SKILL.md` | Sub-agents via Task tool |
| Dimension Sub-agents | Research one specific dimension independently | `.claude/agents/{dimension}.md` | MCP servers, filesystem |
| MCP Servers | Provide external data (Context7, web, APIs) | `.mcp.json` or `claude mcp add` | Sub-agents (tools) |
| Hooks | Automation (format output, notifications) | `settings.json` | Lifecycle events |
| Plugin | Bundle and distribute the system | `.claude-plugin/plugin.json` | All components |

### Data Flow for Parallel Research

```
1. User: /pl:research "topic X"
                |
2. Skill parses dimensions, prepares prompts
                |
3. Task tool spawns N sub-agents in parallel
   (Each receives focused prompt + preloaded skills)
                |
4. Sub-agents work independently:
   - Use Explore agent type (read-only, fast)
   - Query MCP servers if needed
   - Return summarized findings
                |
5. Results return to orchestrator context
                |
6. Synthesis: combine findings into final output
                |
7. Optional: Hooks run (format, log, notify)
```

## Core Patterns

### Pattern 1: Skill as Orchestrator

**What:** A skill file that contains orchestration logic for spawning and coordinating sub-agents.

**When:** Building multi-step workflows, parallel research, coordinated tasks.

**Structure:**
```yaml
---
name: research
description: Spawn parallel research agents across multiple dimensions
context: fork           # Run in isolated context
agent: general-purpose  # Use full-capability agent
allowed-tools: Task, Read, Grep, Glob
---

# Research Orchestrator

When invoked with $ARGUMENTS, perform parallel research:

## Step 1: Parse Dimensions
Identify 3-5 research dimensions from the topic.

## Step 2: Spawn Parallel Agents
For each dimension, use the Task tool to spawn a research agent:
- Agent type: Explore (read-only, fast)
- Each agent researches ONE dimension
- Agents work in parallel

## Step 3: Synthesize
Once all agents complete, combine findings into:
- Summary of each dimension
- Cross-cutting themes
- Recommendations

## Research Dimensions Template
1. Technology landscape
2. Architecture patterns
3. Feature requirements
4. Common pitfalls
5. Best practices
```

**Key insight:** The skill content becomes the orchestrator's prompt. It tells Claude how to decompose work and spawn sub-agents.

### Pattern 2: Specialized Sub-agents

**What:** Custom sub-agent definitions for each research dimension.

**When:** Each dimension needs specific instructions, tool access, or preloaded knowledge.

**Structure:**
```markdown
---
name: tech-researcher
description: Research technology landscape for a given domain. Use for stack decisions.
tools: Read, Grep, Glob, WebSearch, WebFetch
model: sonnet
permissionMode: dontAsk
skills:
  - evaluation-criteria
---

You are a technology researcher specializing in evaluating tech stacks.

When researching a topic:
1. Identify current standard approaches
2. Survey emerging alternatives
3. Compare tradeoffs (performance, DX, ecosystem)
4. Note deprecated/legacy options to avoid

Output format:
## Technology Landscape: {topic}
### Standard Approach
### Emerging Alternatives
### Comparison Matrix
### Recommendation
```

**Built-in sub-agents to leverage:**
- `Explore`: Fast, read-only (Haiku model). Best for codebase analysis.
- `Plan`: Research for planning. Read-only.
- `general-purpose`: Full capability. For complex multi-step work.

### Pattern 3: Context Isolation for Scale

**What:** Use sub-agents to keep main context clean while doing heavy exploration.

**When:**
- Reading many files
- Running extensive searches
- Work that produces verbose intermediate output
- Parallel independent research paths

**How it works:**
```
Main Context Window (~200K tokens)
  |
  +-- User conversation
  +-- CLAUDE.md
  +-- Current work
  |
  +-- Sub-agent 1 (own 200K context)
  |     |-- Reads 50 files
  |     |-- Returns 500 token summary
  |
  +-- Sub-agent 2 (own 200K context)
        |-- Runs extensive grep
        |-- Returns 300 token summary
```

**Key insight:** Each sub-agent has its own context window. They can do extensive work without consuming main context. Only summaries return.

### Pattern 4: Skill + Sub-agent Composition

**What:** Skills preloaded into sub-agents for specialized knowledge.

**When:** Sub-agents need domain expertise that isn't in their base prompt.

**Structure:**
```yaml
# In .claude/agents/api-researcher.md
---
name: api-researcher
description: Research API design patterns
skills:
  - rest-conventions    # Preloaded at startup
  - api-security        # Full content injected
---
```

**Important:** Sub-agents don't inherit skills from parent. You must explicitly list them in `skills:` field. The full skill content is injected at startup, not loaded on-demand.

### Pattern 5: MCP for External Data

**What:** Connect sub-agents to external data sources via MCP.

**When:** Research requires data beyond local files (databases, APIs, documentation).

**Configuration:**
```json
// .mcp.json (project-scoped)
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

**Usage in sub-agents:**
```markdown
---
name: docs-researcher
tools: Read, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

Research library documentation:
1. Use Context7 to get current docs
2. Extract relevant patterns
3. Summarize key APIs
```

### Pattern 6: Hooks for Automation

**What:** Deterministic scripts that run on lifecycle events.

**When:** Need predictable automation without LLM involvement.

**Structure:**
```json
// settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/format.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all research dimensions were covered. If not, continue."
          }
        ]
      }
    ]
  }
}
```

**Key events for research workflows:**
- `SessionStart`: Load context, set up environment
- `Stop`: Validate completeness before finishing
- `SubagentStop`: Process sub-agent results
- `PostToolUse`: React to specific tool completions

## Anti-Patterns to Avoid

### Anti-Pattern 1: Overloading CLAUDE.md
**What:** Putting extensive reference material in CLAUDE.md.
**Why bad:** Consumes context every request. Slows down Claude.
**Instead:** Keep CLAUDE.md under 500 lines. Move reference material to skills.

### Anti-Pattern 2: Nested Sub-agents
**What:** Trying to spawn sub-agents from sub-agents.
**Why bad:** Sub-agents cannot spawn other sub-agents (design limitation).
**Instead:** Chain sub-agents from main conversation or use skills with `context: fork`.

### Anti-Pattern 3: Monolithic Research Agent
**What:** One giant agent that researches everything sequentially.
**Why bad:** Exhausts context window, loses details, slow.
**Instead:** Decompose into parallel specialized sub-agents.

### Anti-Pattern 4: Ignoring Context Costs
**What:** Loading many MCP servers and skills without consideration.
**Why bad:** Each consumes context. Tool definitions alone can be 26K+ tokens.
**Instead:** Use Tool Search (auto-enabled at 10% context), disconnect unused MCP servers.

### Anti-Pattern 5: Missing Skill Descriptions
**What:** Skills without clear descriptions.
**Why bad:** Claude can't match skills to tasks correctly.
**Instead:** Write descriptions that clearly state when the skill should be used.

## Build Order Recommendations

Based on component dependencies, build in this order:

### Phase 1: Foundation
1. **CLAUDE.md** - Project conventions, team standards
2. **Basic skills** - Simple invocable workflows (`/format`, `/lint`)
3. **MCP connections** - Set up external data sources

**Dependencies:** None. Can be done immediately.

### Phase 2: Sub-agent Framework
4. **Built-in sub-agent usage** - Use Explore, Plan, general-purpose
5. **Custom sub-agents** - Define specialized researchers
6. **Skill + sub-agent composition** - Preload skills into sub-agents

**Dependencies:** Requires Phase 1 skills to preload.

### Phase 3: Orchestration
7. **Orchestrator skills** - Skills that spawn sub-agents
8. **Parallel execution** - Multiple sub-agents working simultaneously
9. **Synthesis patterns** - Combining sub-agent results

**Dependencies:** Requires Phase 2 sub-agents.

### Phase 4: Automation
10. **Hooks** - Automate formatting, validation, notifications
11. **Stop hooks** - Ensure completeness before finishing

**Dependencies:** Can be added at any phase but most valuable after orchestration.

### Phase 5: Distribution
12. **Plugin packaging** - Bundle skills, agents, hooks, MCP
13. **Marketplace** - Distribute to team/community

**Dependencies:** Requires mature Phase 1-4 components.

## Practical Implementation: /pl:research

### File Structure
```
.claude/
├── skills/
│   └── research/
│       └── SKILL.md           # Orchestrator skill
├── agents/
│   ├── tech-researcher.md     # Technology dimension
│   ├── arch-researcher.md     # Architecture dimension
│   ├── feature-researcher.md  # Features dimension
│   └── pitfall-researcher.md  # Pitfalls dimension
└── settings.json              # Hooks configuration

.mcp.json                      # MCP server configuration
```

### Key Configuration

**Orchestrator Skill (`.claude/skills/research/SKILL.md`):**
```yaml
---
name: research
description: Parallel research across multiple dimensions
context: fork
agent: general-purpose
disable-model-invocation: true
---

# Parallel Research System

Research $ARGUMENTS across these dimensions using parallel sub-agents:

## Dimensions
1. **Technology** - Stack options, libraries, frameworks
2. **Architecture** - Patterns, component structure
3. **Features** - Table stakes, differentiators
4. **Pitfalls** - Common mistakes, anti-patterns

## Execution
For each dimension, spawn a dedicated sub-agent using Task tool.
Each sub-agent returns findings in structured markdown.

## Synthesis
Combine all findings into:
- Summary (1 page)
- Detailed findings per dimension
- Recommendations with rationale
```

**Dimension Sub-agent (`.claude/agents/tech-researcher.md`):**
```yaml
---
name: tech-researcher
description: Research technology landscape. Use when evaluating stacks.
tools: Read, Grep, Glob, WebSearch, WebFetch
model: sonnet
permissionMode: dontAsk
---

Research technology options for the given topic.

Focus on:
- Current standard approach
- Emerging alternatives
- Tradeoffs (performance, DX, ecosystem)
- Deprecation warnings

Return structured findings in markdown.
```

### Execution Flow

1. User runs `/research "building a CLI tool in Node.js"`
2. Orchestrator skill activates in forked context
3. Task tool spawns 4 sub-agents in parallel:
   - tech-researcher: "Node.js CLI frameworks"
   - arch-researcher: "CLI architecture patterns"
   - feature-researcher: "CLI tool features"
   - pitfall-researcher: "Node.js CLI pitfalls"
4. Each sub-agent researches independently (own context window)
5. Results return to orchestrator
6. Orchestrator synthesizes into final report
7. Report returned to user

## Scalability Considerations

| Concern | Small Team | Growing Team | Large Team |
|---------|------------|--------------|------------|
| Skill organization | `.claude/skills/` | Plugin per domain | Multiple marketplaces |
| Sub-agent count | 3-5 parallel | 7 parallel (max) | Chain batches |
| MCP servers | 2-3 essential | Tool Search enabled | Strict allowlists |
| Context management | Manual `/compact` | Auto-compact at 95% | Lower threshold |

## Sources

- [Claude Code Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents) (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills.md) (HIGH confidence)
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp.md) (HIGH confidence)
- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks.md) (HIGH confidence)
- [Claude Code Features Overview](https://code.claude.com/docs/en/features-overview.md) (HIGH confidence)
- [Claude Code Plugins Documentation](https://code.claude.com/docs/en/plugins.md) (HIGH confidence)
- [Skills Explained - Claude Blog](https://claude.com/blog/skills-explained) (HIGH confidence)
