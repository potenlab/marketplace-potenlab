# Phase 4: Quality & Architecture - Research

**Researched:** 2026-01-24
**Domain:** Claude Code extension quality patterns, context management, parallel sub-agent execution, and standardized output formats
**Confidence:** HIGH

## Summary

This research covers implementing quality standards and architectural patterns for the Potenlab Claude Code plugin ecosystem. The phase addresses six requirements: context tracking (`/pl:context`), standardized output formats, commit workflows (`/pl:commit`), isolated sub-agent context windows, parallel execution limits, and MCP token budget management.

For **context management**, Claude Code provides built-in `/cost` and `/context` commands that show token usage. A `/pl:context` skill can wrap these to provide a user-friendly summary focused on budget status and recommendations. The key insight is that skills can execute shell commands using `!command` syntax to gather dynamic data before presenting it.

For **standardized outputs**, the existing skills already follow a consistent pattern (structured markdown with summary, tables, and actionable items). Phase 4 formalizes this into a documented output format template that all extensions must follow, with verification that outputs match the template.

For **parallel execution**, Claude Code's Task tool supports running up to 10 concurrent sub-agents (commonly recommended as 7 for reliability), each with its own isolated 200K context window. The research skill already implements this pattern correctly with file-based synthesis.

For **MCP token management**, Claude Code's Tool Search feature (auto-enabled at 10% context) prevents MCP bloat. The plugin should configure `ENABLE_TOOL_SEARCH=auto:5` for earlier activation and document MCP server guidelines.

**Primary recommendation:** Create `/pl:context` and `/pl:commit` skills, formalize the existing output format pattern into documented templates, and add architectural documentation for sub-agent and MCP patterns.

## Standard Stack

The established approach for this phase uses Claude Code's built-in features:

### Core Components
| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| `/cost` command | Token usage and cost tracking | Built-in, authoritative source |
| `/context` command | Context window breakdown by category | Built-in, shows MCP/tool consumption |
| `/compact` command | Manual context compaction | Built-in, preserves important context |
| Task tool | Parallel sub-agent execution | Built-in, manages isolated contexts |
| Tool Search | MCP token optimization | Built-in, auto-activates at threshold |

### Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_TOOL_SEARCH` | `auto` (10%) | Controls when MCP tools defer loading |
| `MAX_MCP_OUTPUT_TOKENS` | 25,000 | Limits individual MCP tool output |
| `MAX_THINKING_TOKENS` | 31,999 | Extended thinking budget |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95% | Triggers auto-compaction earlier |

### No External Dependencies Required
All features use Claude Code's built-in capabilities:
- Skills with `!command` syntax for dynamic context injection
- Shell execution via Bash tool
- Git operations via `git` CLI
- Context introspection via built-in commands

## Architecture Patterns

### Recommended Skill Structure for Phase 4
```
skills/
├── context/
│   └── SKILL.md          # /pl:context - Token usage display
├── commit/
│   └── SKILL.md          # /pl:commit - Well-formatted commits
├── init/
│   └── SKILL.md          # (existing) Add MCP guidelines
├── review/
│   └── SKILL.md          # (existing) Ensure output format
├── refactor/
│   └── SKILL.md          # (existing) Ensure output format
├── research/
│   └── SKILL.md          # (existing) Already uses parallel sub-agents
├── slice/
│   └── SKILL.md          # (existing) Ensure output format
└── help/
    └── SKILL.md          # (update) Add new commands
```

### Pattern 1: Dynamic Context Injection for Context Skill
**What:** Use `!command` syntax to gather live data before presenting to user.
**When to use:** When skill needs real-time system information.
**Example:**
```yaml
# Source: https://code.claude.com/docs/en/skills#inject-dynamic-context
---
name: context
description: Display current token usage, budget status, and context recommendations
disable-model-invocation: true
---

# Context Status

## Current Usage
!`claude --print context 2>/dev/null || echo "Context data unavailable"`

## Cost Summary
!`claude --print cost 2>/dev/null || echo "Cost data unavailable"`

## Analysis Task
Based on the data above, provide a summary showing:
1. Current token usage vs. available context
2. MCP tool consumption breakdown
3. Recommendations if context is filling up
4. Warning if MCP tools exceed 40% of context

Format output using the standardized summary format.
```

**Key insight:** The `!command` syntax runs before Claude sees the prompt, injecting real data into the skill content.

### Pattern 2: Standardized Output Format Template
**What:** A consistent structure all skills must follow for their final output.
**When to use:** Every skill that produces user-facing output.
**Template:**
```markdown
### [Action] Complete: [Subject]

**Summary:** [2-3 sentence executive summary]

#### [Primary Data Section]
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| [data] | [data] | [data] |

#### Key Findings / Changes / Results
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

#### Actionable Items / Next Steps
1. [ ] [Specific action item]
2. [ ] [Specific action item]

#### Notes
- [Any caveats, warnings, or additional context]
```

**Rationale:** Consistent format improves scanability, enables automation, and creates professional output.

### Pattern 3: Commit Workflow with Context
**What:** A skill that creates well-formatted commits using git conventions.
**When to use:** When user wants to commit changes with good messages.
**Example:**
```yaml
# Source: https://code.claude.com/docs/en/skills, community patterns
---
name: commit
description: Create a well-formatted git commit with context
disable-model-invocation: true
argument-hint: [message-hint]
---

# Smart Commit

## Current State
Branch: !`git branch --show-current`
Recent commits: !`git log --oneline -5`
Staged changes: !`git diff --cached --stat`
Unstaged changes: !`git status --porcelain=v1`

## Diff to Analyze
!`git diff HEAD`

## Task
Based on the changes above:

1. **Analyze** the nature of changes (feat, fix, docs, refactor, test, chore)
2. **Generate** a commit message following Conventional Commits format
3. **Stage** appropriate files (avoid .env, credentials)
4. **Commit** with the generated message

If $ARGUMENTS provided, use as hint for the commit type/scope.

## Commit Message Format
```
<type>(<scope>): <description>

[optional body with context]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

## Output Format
After committing, show:

### Commit Created

**Hash:** [commit hash]
**Message:** [commit message]

#### Files Changed
- [file list with +/- line counts]

#### Notes
- [any warnings or follow-up actions]
```

### Pattern 4: Sub-agent Isolation (200K Context Windows)
**What:** Each sub-agent spawned via Task tool gets its own isolated 200K context.
**When to use:** For parallel research, heavy exploration, or context-sensitive operations.
**How it works:**
```
Main Context Window (~200K tokens)
  |
  +-- User conversation
  +-- CLAUDE.md
  +-- Current work
  |
  +-- Sub-agent 1 (own 200K context) --> Returns summary only
  +-- Sub-agent 2 (own 200K context) --> Returns summary only
  +-- Sub-agent 3 (own 200K context) --> Returns summary only
```

**Key insight:** Sub-agents can read many files and do extensive exploration without consuming main context. Only their summarized results return.

### Pattern 5: Parallel Execution Limits
**What:** Task tool supports up to 10 concurrent sub-agents, queued in batches.
**Best practice:** Use 5-7 concurrent sub-agents for reliability.
**Behavior:**
- Claude Code creates tasks and runs first batch in parallel
- Waits for batch to complete before starting next batch
- Sub-agents cannot spawn other sub-agents (no nesting)

**Example from existing research skill:**
```markdown
## Dimensions

Spawn parallel subagents for these research dimensions:

1. **Technical** - What's technically possible?
2. **Ecosystem** - What tools/libraries exist?
3. **Patterns** - How do experts approach this?
4. **Pitfalls** - Common mistakes?
5. **Path Forward** - Recommended approach?

Run all 5 dimensions in parallel.
```

### Pattern 6: MCP Token Budget Management
**What:** Prevent MCP tools from consuming more than 40% of context.
**How to implement:**
1. Enable Tool Search at lower threshold: `ENABLE_TOOL_SEARCH=auto:5`
2. Audit MCP servers with `/mcp` command
3. Prefer CLI tools over MCP when available
4. Limit MCP output with `MAX_MCP_OUTPUT_TOKENS`

**Guidelines for plugin:**
```markdown
# MCP Guidelines (add to init skill)

## Token Budget
- MCP tools should not exceed 40% of context
- Check with `/context` command
- Enable Tool Search: ENABLE_TOOL_SEARCH=auto:5

## Preferred Approach
1. Use CLI tools (gh, aws, gcloud) when available
2. Disable unused MCP servers
3. Use project-scoped MCP, not user-scoped
4. Check `/mcp` regularly to audit connected servers
```

### Anti-Patterns to Avoid
- **Returning verbose output from sub-agents:** Always require summaries, not full exploration logs
- **No output format consistency:** All skills must follow the standardized template
- **Ignoring MCP context costs:** Check `/context` and configure Tool Search
- **Monolithic skills:** Split complex operations into parallel sub-agents
- **Missing commit context:** Always include diff analysis in commit messages

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token tracking | Custom token counter | `/cost` and `/context` commands | Built-in, accurate |
| Context compaction | Manual summarization | `/compact` command | Automatic, preserves important context |
| Parallel execution | Custom parallelization | Task tool / sub-agents | Built-in context isolation |
| MCP optimization | Manual tool filtering | Tool Search feature | Automatic, threshold-based |
| Commit formatting | Custom git wrapper | Conventional Commits + git CLI | Standard format, well-documented |
| Cost monitoring | External service | `/cost` command | Built-in, session-accurate |

**Key insight:** Claude Code provides all the primitives needed. Focus on orchestration and user experience, not infrastructure.

## Common Pitfalls

### Pitfall 1: Sub-agent Results Consuming Main Context
**What goes wrong:** Sub-agents return verbose exploration logs, filling main context rapidly.
**Why it happens:** No explicit instruction to summarize results.
**How to avoid:** Every sub-agent instruction must include "Return a summary only, not exploration logs."
**Warning signs:** Auto-compaction triggers after sub-agent work.

### Pitfall 2: MCP Context Bloat Exceeding 40%
**What goes wrong:** Multiple MCP servers consume massive tokens at startup.
**Why it happens:** Each MCP server adds tool definitions to context window.
**How to avoid:**
1. Set `ENABLE_TOOL_SEARCH=auto:5` (trigger at 5% instead of 10%)
2. Audit with `/context` regularly
3. Disconnect unused servers with `/mcp`
**Warning signs:** `/context` shows high MCP tool consumption.

### Pitfall 3: Inconsistent Output Formats
**What goes wrong:** Different skills produce different output structures.
**Why it happens:** No enforced template, developers create ad-hoc formats.
**How to avoid:** Document and enforce the standardized output template.
**Warning signs:** User confusion, difficult automation.

### Pitfall 4: Commit Messages Without Context
**What goes wrong:** Commits have vague messages like "fix bug" or "update code".
**Why it happens:** No systematic diff analysis before committing.
**How to avoid:** `/pl:commit` skill analyzes diff and generates Conventional Commits format.
**Warning signs:** Git history is unreadable, hard to trace changes.

### Pitfall 5: Nested Sub-agent Attempts
**What goes wrong:** Skills try to have sub-agents spawn their own sub-agents.
**Why it happens:** Natural assumption about recursive delegation.
**How to avoid:** Document limitation clearly. All sub-agents are spawned from main orchestrator.
**Warning signs:** "Subagent cannot spawn" errors or silent failures.

### Pitfall 6: Skills Without disable-model-invocation
**What goes wrong:** Skills with side effects (commit, deploy) get triggered automatically.
**Why it happens:** Claude matches description and invokes proactively.
**How to avoid:** Set `disable-model-invocation: true` for any skill with side effects.
**Warning signs:** Unexpected commits or actions.

## Code Examples

Verified patterns from official documentation:

### Context Skill (skills/context/SKILL.md)
```yaml
# Source: https://code.claude.com/docs/en/skills#inject-dynamic-context
---
name: context
description: Display current token usage and budget status with recommendations
disable-model-invocation: true
---

# Context Status

## Current Session Data
Token usage: !`echo "Run /cost in Claude Code to see token usage"`
Context window: !`echo "Run /context in Claude Code to see context breakdown"`

## Analysis Instructions

Provide a context status report:

### Context Status

**Summary:** [Brief assessment of current context health]

#### Token Usage
| Category | Tokens | Percentage |
|----------|--------|------------|
| Conversation | [estimate] | [%] |
| CLAUDE.md | [estimate] | [%] |
| MCP Tools | [estimate] | [%] |
| Skills | [estimate] | [%] |

#### Budget Status
- [ ] Context is healthy (< 50% used)
- [ ] Context is filling (50-80% used)
- [ ] Context needs attention (> 80% used)

#### Recommendations
1. [Specific recommendation based on status]
2. [Another recommendation]

#### Notes
- Use `/clear` to reset between unrelated tasks
- Use `/compact` to summarize and free space
- Check `/mcp` to disable unused MCP servers
```

### Commit Skill (skills/commit/SKILL.md)
```yaml
# Source: https://deducement.com/posts/slash-commands-automatic-git, community patterns
---
name: commit
description: Create well-formatted git commits with proper context and conventional commits format
disable-model-invocation: true
argument-hint: [optional-message-hint]
---

# Smart Commit

## Current Git State
Branch: !`git branch --show-current`
Status: !`git status --short`
Recent history: !`git log --oneline -3`

## Changes to Commit
!`git diff HEAD`

## Commit Guidelines

Analyze the changes and create a commit following these rules:

### Conventional Commits Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no logic change
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Process
1. Stage appropriate files (exclude .env, credentials, node_modules)
2. Analyze the diff to understand the change
3. Generate commit message based on change type and scope
4. Create the commit

If $ARGUMENTS provided, use as guidance for type/scope.

## Output Format

### Commit Created

**Hash:** `[short hash]`
**Type:** [feat|fix|docs|etc]

**Message:**
```
[full commit message]
```

#### Files Changed
| File | Changes |
|------|---------|
| [path] | +X / -Y lines |

#### Notes
- [Any follow-up actions needed]
- [Warnings about uncommitted changes]
```

### Standardized Output Format Template
```yaml
# Add to CLAUDE.md or as a shared skill

## Extension Output Format

All /pl:* commands must follow this output structure:

### [Action] Complete: [Subject]

**Summary:** [2-3 sentence executive summary of what was done]

#### [Primary Data Section]
[Tables, code blocks, or structured data relevant to the action]

#### Key Findings / Changes Made / Results
- [Most important point]
- [Second important point]
- [Third important point]

#### Actionable Items
1. [ ] [Specific next step with file:line if applicable]
2. [ ] [Another action item]

#### Notes
- [Caveats, warnings, or context]
- [Links to relevant documentation]
```

### MCP Guidelines Addition (for init skill)
```markdown
## MCP Token Budget Guidelines

### Context Budget Rules
- MCP tools should not exceed 40% of context window
- Check current usage with `/context` command
- Enable early Tool Search: `ENABLE_TOOL_SEARCH=auto:5`

### Recommended MCP Configuration
1. Use CLI tools when available (gh, aws, gcloud, sentry-cli)
2. Prefer project-scoped MCP over user-scoped
3. Disable unused servers via `/mcp` command
4. Set output limits: `MAX_MCP_OUTPUT_TOKENS=25000`

### Checking MCP Health
```bash
# In Claude Code
/mcp          # List and manage servers
/context      # See token breakdown
```

If MCP tools exceed 40% of context:
1. Disconnect unused servers
2. Lower Tool Search threshold
3. Use CLI alternatives where possible
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual token tracking | `/cost` and `/context` built-in | 2025 | Accurate, built-in |
| All MCP tools loaded | Tool Search auto-defers | 2025 | 46% token reduction |
| Monolithic research | Parallel sub-agents | 2025 | 5x faster, better coverage |
| Ad-hoc output formats | Standardized templates | Best practice | Consistency, automation |
| Vague commit messages | Conventional Commits | Industry standard | Clear history |

**Current best practices:**
- Use `/cost` and `/context` for token awareness
- Configure Tool Search at 5% threshold for earlier optimization
- Follow Conventional Commits format for all commits
- Use parallel sub-agents (5-7) for complex research
- Enforce standardized output format across all skills
- Add `disable-model-invocation: true` for skills with side effects

## Open Questions

1. **Context introspection in skills**
   - What we know: `/cost` and `/context` work interactively
   - What's unclear: Whether `!claude --print context` works in skill context
   - Recommendation: Test during implementation; may need to rely on user running commands

2. **Exact MCP percentage threshold**
   - What we know: 40%+ is considered "bloat" based on community reports
   - What's unclear: Whether this is hard limit or guideline
   - Recommendation: Use 40% as warning threshold, document as guideline

3. **Sub-agent count optimization**
   - What we know: Task tool supports up to 10 concurrent, community recommends 7
   - What's unclear: Optimal number for Potenlab's specific workflows
   - Recommendation: Start with 5 dimensions as in current research skill, adjust based on experience

4. **Output format enforcement**
   - What we know: Template is defined
   - What's unclear: How to programmatically verify output matches template
   - Recommendation: Manual review during PR process; consider validation hook later

## Sources

### Primary (HIGH confidence)
- [Claude Code Costs Documentation](https://code.claude.com/docs/en/costs) - `/cost`, `/context`, token management
- [Claude Code Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents) - Task tool, parallel execution, isolation
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) - Skill creation, `!command` syntax, frontmatter
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp) - Tool Search, MCP configuration, token limits
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) - Context management, CLAUDE.md guidelines

### Secondary (MEDIUM confidence)
- [Claude Code Slash Commands Guide](https://alexop.dev/posts/claude-code-slash-commands-guide/) - Command patterns
- [Automating Git Commits with Claude Code](https://deducement.com/posts/slash-commands-automatic-git) - Commit workflow patterns
- [Auto-Commit Custom Command](https://en.bioerrorlog.work/entry/git-commit-with-claude-code-custom-slash-command) - Git integration examples
- [MCP Token Reduction Article](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734) - Tool Search benefits

### Applied from Previous Phases
- Phase 3 Research (03-RESEARCH.md) - Parallel sub-agent patterns, file-based synthesis
- Phase 2 Research (02-RESEARCH.md) - Skill structure, allowed-tools, output formatting
- PITFALLS.md - MCP context bloat, sub-agent context explosion, skill descriptions

## Metadata

**Confidence breakdown:**
- Context tracking: HIGH - Built-in commands are well-documented
- Standardized output: MEDIUM - Best practice derived from existing patterns
- Commit workflow: HIGH - Git CLI + Conventional Commits are standards
- Sub-agent isolation: HIGH - Official documentation confirms 200K isolation
- Parallel execution: HIGH - Task tool documentation confirms 7-10 agents
- MCP token budget: MEDIUM - 40% threshold from community, Tool Search from docs

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - Claude Code features are stable)
