# Phase 3: Advanced Extensions - Research

**Researched:** 2026-01-24
**Domain:** Parallel Sub-Agent Research Orchestration and Figma MCP Design-to-Code
**Confidence:** HIGH

## Summary

This research covers implementing two advanced skills: `/pl:research <topic>` for parallel sub-agent research workflows, and `/pl:slice <figma-link>` for Figma design-to-code conversion via MCP.

For **`/pl:research`**, the key architectural insight is that Claude Code's subagent system supports parallel execution through the Task tool, with each subagent getting its own isolated 200K context window. The recommended pattern is to define research "dimensions" (e.g., technical feasibility, ecosystem landscape, common pitfalls), spawn parallel sub-agents for each dimension, have each save structured output to distinct files, then synthesize findings into a cohesive summary. The skill should use `context: fork` with appropriate agent type to run in isolation.

For **`/pl:slice`**, the Figma MCP server provides a complete toolkit for design-to-code workflows. The recommended approach uses the official Figma MCP tools (`get_design_context`, `get_screenshot`, `get_variable_defs`, `get_code_connect_map`) in a specific sequence to gather design context before code generation. The skill needs to handle both link-based and selection-based design extraction, transform Figma's default React+Tailwind output to match team conventions, and integrate with existing design system components.

**Primary recommendation:** Create two skills at `skills/research/SKILL.md` and `skills/slice/SKILL.md`. The research skill orchestrates parallel sub-agents through explicit instructions for dimension-based research. The slice skill requires Figma MCP to be configured and follows the documented tool invocation sequence.

## Standard Stack

The established approach for these advanced Claude Code skills:

### Core Components
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| Research Skill | `skills/research/SKILL.md` | Orchestrate parallel research sub-agents | Skill with dimension-based parallel research pattern |
| Slice Skill | `skills/slice/SKILL.md` | Figma design to code conversion | Skill leveraging Figma MCP tools |
| Research Agents | `.claude/agents/research-*.md` | Dimension-specific research agents | Project-level agents for reuse |

### Required MCP Configuration
| MCP Server | Command | Purpose |
|------------|---------|---------|
| Figma Remote | `claude mcp add --transport http figma https://mcp.figma.com/mcp` | Access Figma designs via MCP |
| Figma Desktop (alt) | `claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp` | Local desktop server option |

### No External Dependencies Required
Both skills use Claude Code's built-in capabilities:
- Subagent system for parallel execution (Task tool)
- Built-in tools (Read, Write, Grep, Glob, Bash)
- Figma MCP tools (provided by Figma's MCP server)
- SKILL.md frontmatter for orchestration configuration

## Architecture Patterns

### Recommended Structure
```
skills/
├── research/
│   └── SKILL.md          # Parallel research orchestration skill
└── slice/
    └── SKILL.md          # Figma design-to-code skill

.claude/
└── agents/               # Optional: custom research dimension agents
    ├── research-technical.md
    ├── research-ecosystem.md
    └── research-pitfalls.md
```

### Pattern 1: Parallel Research Dimensions
**What:** Define research "dimensions" (aspects to investigate), spawn parallel sub-agents for each.
**When to use:** When researching a topic thoroughly from multiple angles.
**Example:**
```yaml
# Source: https://code.claude.com/docs/en/sub-agents (parallel research pattern)
---
name: research
description: Research a topic in parallel across multiple dimensions and synthesize findings
disable-model-invocation: true
argument-hint: <topic>
---

# Parallel Research

Research $ARGUMENTS across multiple dimensions simultaneously.

## Research Dimensions

For each dimension, spawn a subagent to investigate:

1. **Technical Feasibility** - Can it be done? What are the constraints?
2. **Ecosystem Landscape** - What libraries/tools exist? What's popular?
3. **Best Practices** - How do experts approach this? What patterns work?
4. **Common Pitfalls** - What goes wrong? What are the gotchas?
5. **Implementation Path** - What's the recommended approach?

## Execution

1. Spawn 5 parallel subagents, one per dimension
2. Each subagent focuses ONLY on its dimension
3. Each subagent saves findings to `.research/<dimension>.md`
4. Wait for all subagents to complete
5. Synthesize findings into a cohesive summary

## Output Format

After synthesis, provide:

### Research Summary: [topic]

#### Key Findings
- [Top 3-5 insights across all dimensions]

#### Technical Assessment
[From technical feasibility dimension]

#### Recommended Approach
[Synthesized from all dimensions]

#### Watch Out For
[From pitfalls dimension]

#### Next Steps
1. [Concrete action items]
```

### Pattern 2: Figma MCP Design Extraction Sequence
**What:** Follow the documented Figma MCP tool sequence for design-to-code.
**When to use:** Converting Figma designs to code.
**Example:**
```yaml
# Source: https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/
---
name: slice
description: Convert Figma design to code using MCP. Requires Figma link.
disable-model-invocation: true
argument-hint: <figma-link>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, mcp__figma__*
---

# Figma to Code

Convert Figma design to component code.

## Target
Figma Link: $ARGUMENTS

## Required Steps

Follow this exact sequence:

### Step 1: Extract Design Context
Use `get_design_context` to fetch the structured design representation.
- Extract the node-id from the Figma URL
- Default output is React + Tailwind

### Step 2: Capture Visual Reference
Use `get_screenshot` to get a visual reference for layout fidelity.

### Step 3: Extract Design Tokens
Use `get_variable_defs` to get colors, spacing, typography tokens.

### Step 4: Check Code Connect Mappings
Use `get_code_connect_map` to find existing component mappings in codebase.

### Step 5: Analyze Project Conventions
- Check existing components in src/components/
- Identify naming patterns
- Note styling approach (CSS modules, Tailwind, styled-components)

### Step 6: Generate Component Code
Transform Figma's output to match team conventions:
- Use existing components where available (from Code Connect)
- Apply project's token naming
- Follow file organization patterns
- Match styling approach

### Step 7: Report Results

## Generated Component

**File:** `[component-path]`

**Preview:** [description of what was built]

**Used Tokens:**
- Colors: [list]
- Spacing: [list]
- Typography: [list]

**Mapped Components:**
- [Figma component] -> [code component]

**Note:** Review the generated code for project-specific adjustments.
```

### Pattern 3: Sub-Agent Result Synthesis
**What:** Collect outputs from parallel sub-agents and synthesize into unified result.
**When to use:** After parallel research completes.
**Example:**
```markdown
## Synthesis Instructions

After all subagents complete:

1. Read all files in `.research/` directory
2. Identify:
   - Overlapping insights (multiple dimensions agree)
   - Contradictions (dimensions disagree)
   - Unique insights (single dimension)
3. Prioritize:
   - HIGH: Multiple dimensions confirm
   - MEDIUM: Single dimension, well-supported
   - LOW: Speculative or uncertain
4. Synthesize into summary format
5. Remove `.research/` temporary files
```

### Pattern 4: Context Fork for Research
**What:** Run research in forked context to preserve main conversation.
**When to use:** When research produces large output you want summarized.
**Example:**
```yaml
# Source: https://code.claude.com/docs/en/skills#run-skills-in-a-subagent
---
name: deep-research
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, WebSearch
---

Research $ARGUMENTS thoroughly...
```

**Key insight:** `context: fork` runs the skill in an isolated subagent context. Only the summary returns to the main conversation, not all the exploration logs.

### Anti-Patterns to Avoid
- **Single agent doing all research:** Loses parallelization benefit, exhausts context
- **No structured output files:** Makes synthesis unpredictable, no audit trail
- **Raw Figma output without adaptation:** Produces React+Tailwind when project may use different stack
- **Skipping get_screenshot:** Loses layout fidelity context that improves code quality
- **Not checking Code Connect:** Duplicates existing components instead of reusing

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parallel execution | Custom parallelization | Task tool / subagents | Built-in, managed context windows |
| Figma API access | Direct Figma REST API | Figma MCP server | Pre-integrated, handles auth, structured output |
| Design token extraction | Custom parser | `get_variable_defs` tool | Returns structured color/spacing/typography |
| Component mapping | Manual matching | `get_code_connect_map` | Figma's Code Connect integration |
| Context isolation | Manual state management | `context: fork` | Built-in subagent isolation |

**Key insight:** Claude Code provides the orchestration primitives. Focus on defining the research dimensions and synthesis logic, not building parallel execution infrastructure.

## Common Pitfalls

### Pitfall 1: Subagents Cannot Spawn Subagents
**What goes wrong:** Research skill tries to have subagents spawn their own subagents.
**Why it happens:** Nested delegation seems natural but isn't supported.
**How to avoid:** Main agent orchestrates all subagents directly. Use skills or chain from main conversation.
**Warning signs:** "Subagent cannot spawn" errors or silent failures.

### Pitfall 2: Results Not Returned to Main Context
**What goes wrong:** Parallel agents complete but findings don't make it back.
**Why it happens:** Missing synthesis step or subagents don't save to files.
**How to avoid:** Explicit file-based handoff (`.research/<dimension>.md`) + synthesis step.
**Warning signs:** "Research complete" but no summary provided.

### Pitfall 3: Figma MCP Not Configured
**What goes wrong:** `/pl:slice` fails with tool not found errors.
**Why it happens:** User hasn't added Figma MCP server.
**How to avoid:** Check for MCP availability at start, provide setup instructions.
**Warning signs:** "mcp__figma__* tool not available" errors.

### Pitfall 4: Excessive Context Consumption
**What goes wrong:** Research agents return raw exploration logs, filling main context.
**Why it happens:** No summary requirement in agent instructions.
**How to avoid:** Explicit "return summary only, not exploration logs" instructions.
**Warning signs:** Main context compacts after research.

### Pitfall 5: Figma Output Mismatches Project Stack
**What goes wrong:** Generated code uses React+Tailwind when project uses Vue+CSS modules.
**Why it happens:** Default Figma MCP output without transformation.
**How to avoid:** Step 5 (analyze project conventions) before code generation.
**Warning signs:** Generated component doesn't match existing codebase style.

### Pitfall 6: Node ID Extraction Failure
**What goes wrong:** Figma link parsing fails to extract node-id.
**Why it happens:** Various URL formats (design vs. dev mode, branch URLs).
**How to avoid:** Handle multiple URL patterns:
  - `figma.com/design/:fileKey/:fileName?node-id=1-2` -> nodeId `1:2`
  - `figma.com/design/:fileKey/branch/:branchKey/:fileName` -> use branchKey as fileKey
**Warning signs:** "Invalid node ID" or empty design context.

## Code Examples

Verified patterns from official documentation:

### Research Skill (skills/research/SKILL.md)
```yaml
# Source: Pattern from https://code.claude.com/docs/en/sub-agents#run-parallel-research
---
name: research
description: Research a topic using parallel sub-agents across multiple dimensions, synthesizing findings into actionable insights
disable-model-invocation: true
argument-hint: <topic>
---

# Parallel Research

Research **$ARGUMENTS** across multiple dimensions simultaneously.

## Dimensions

Spawn parallel subagents for these research dimensions:

1. **Technical** - What's technically possible? Constraints? Requirements?
2. **Ecosystem** - What tools/libraries exist? What's standard? What's popular?
3. **Patterns** - How do experts approach this? Best practices? Architecture?
4. **Pitfalls** - Common mistakes? Gotchas? What to avoid?
5. **Path Forward** - Recommended approach? First steps? Priorities?

## Process

### Phase 1: Parallel Investigation
For each dimension, use a subagent to:
- Investigate the dimension thoroughly
- Save structured findings to `.research/<dimension>.md`
- Return a 2-3 sentence summary

Run all 5 dimensions in parallel.

### Phase 2: Synthesis
After all complete:
1. Read all `.research/*.md` files
2. Identify cross-dimensional themes
3. Resolve contradictions
4. Synthesize into unified recommendations
5. Clean up `.research/` directory

## Output Format

### Research Complete: $ARGUMENTS

**Summary:** [2-3 sentence executive summary]

#### Key Findings
| Dimension | Finding | Confidence |
|-----------|---------|------------|
| Technical | [key insight] | HIGH/MEDIUM/LOW |
| Ecosystem | [key insight] | HIGH/MEDIUM/LOW |
| Patterns | [key insight] | HIGH/MEDIUM/LOW |
| Pitfalls | [key insight] | HIGH/MEDIUM/LOW |
| Path | [key insight] | HIGH/MEDIUM/LOW |

#### Recommended Approach
[Synthesized recommendation with rationale]

#### Watch Out For
- [Key pitfall 1]
- [Key pitfall 2]
- [Key pitfall 3]

#### Next Steps
1. [ ] [Specific action item]
2. [ ] [Specific action item]
3. [ ] [Specific action item]

#### Sources
- [URLs or references used]
```

### Slice Skill (skills/slice/SKILL.md)
```yaml
# Source: Pattern from https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/
---
name: slice
description: Convert Figma design to component code using MCP integration. Provide a Figma frame link.
disable-model-invocation: true
argument-hint: <figma-link>
---

# Figma to Code

Convert a Figma design to component code matching this project's patterns.

## Target
Figma Link: $ARGUMENTS

If no link provided, ask the user for the Figma frame link.

## Prerequisites Check

First, verify Figma MCP is available:
```bash
# Check if figma MCP tools are available
```

If Figma MCP is not configured, provide setup instructions:
```
Figma MCP is not configured. To set it up:

1. Run: claude mcp add --transport http figma https://mcp.figma.com/mcp
2. Authenticate when prompted
3. Try /pl:slice again

For desktop server (optional):
1. Open Figma desktop app
2. Toggle to Dev Mode (Shift+D)
3. Enable desktop MCP server in inspect panel
4. Run: claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

## Workflow

Follow this exact sequence:

### Step 1: Parse Figma Link
Extract the node-id from the URL:
- Format: `figma.com/design/:fileKey/:fileName?node-id=X-Y`
- Node ID format: Convert `X-Y` to `X:Y`
- Branch URLs: Use branchKey as fileKey

### Step 2: Get Design Context
Call `get_design_context` with the node-id.
- This returns the structured design representation
- Default output: React + Tailwind

### Step 3: Get Visual Reference
Call `get_screenshot` for the same node.
- Preserves layout fidelity
- Helps with spacing and alignment decisions

### Step 4: Get Design Tokens
Call `get_variable_defs` for the node.
- Extracts colors, spacing, typography
- Map to project's token system

### Step 5: Check Code Connect
Call `get_code_connect_map` to find existing mappings.
- Identifies reusable components
- Prevents duplicating existing work

### Step 6: Analyze Project Conventions
Before generating code:
- Scan `src/components/` for patterns
- Identify styling approach (Tailwind, CSS modules, styled-components)
- Note naming conventions (PascalCase, kebab-case)
- Check for UI library (shadcn, MUI, etc.)

### Step 7: Generate Component
Transform Figma output to match project:
- Reuse mapped components from Code Connect
- Apply project's token names
- Follow project's file organization
- Match styling approach

### Step 8: Report

## Component Generated

**File:** `[path/to/Component.tsx]`

**Based on:** [Figma frame name]

### Design Tokens Used
| Token Type | Figma Value | Project Token |
|------------|-------------|---------------|
| Color | #XXXXXX | var(--color-x) |
| Spacing | Xpx | spacing.x |

### Component Mappings
| Figma Component | Code Component | Source |
|-----------------|----------------|--------|
| [name] | `<Component />` | src/components/x |

### Generated Code Preview
\`\`\`tsx
// [brief code preview or description]
\`\`\`

### Notes
- [Any adjustments needed]
- [Project-specific considerations]

## Important
- This skill requires Figma MCP to be configured
- Generated code follows project conventions, not Figma defaults
- Review generated code for project-specific adjustments
```

### Updating Help Skill
Remember to update `skills/help/SKILL.md` to include the new commands:
```markdown
## Available Commands

| Command | Description |
|---------|-------------|
| `/pl:help` | Display this help message showing all available commands |
| `/pl:init` | Initialize project with MCPs, rules, and agents in one command |
| `/pl:review <file>` | Analyze code and return structured feedback (read-only) |
| `/pl:refactor <file>` | Refactor code with before/after explanation and test verification |
| `/pl:research <topic>` | Research topic with parallel sub-agents across 5 dimensions |
| `/pl:slice <figma-link>` | Convert Figma design to component code via MCP |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single agent research | Parallel subagent dimensions | 2025 | 5x faster, better coverage |
| Manual Figma screenshots | `get_screenshot` MCP tool | 2025 | Automated visual reference |
| Figma REST API calls | Figma MCP server | 2025 | Structured output, OAuth handled |
| `get_code` tool | `get_design_context` (renamed) | 2026 | Same functionality, clearer name |
| Raw parallel output | File-based synthesis pattern | 2025 | Reliable result aggregation |

**Current best practices:**
- Use subagent system for parallel research (not manual parallelization)
- Follow Figma MCP tool sequence for design-to-code
- Save subagent outputs to files for synthesis
- Use `context: fork` for exploration-heavy skills
- Check Code Connect before generating new components
- Transform Figma output to match project stack

## Open Questions

1. **Research dimension customization**
   - What we know: 5 dimensions cover most research needs
   - What's unclear: Should dimensions be configurable per-project?
   - Recommendation: Start with fixed 5 dimensions, add customization if needed

2. **Figma MCP authentication flow**
   - What we know: OAuth flow works, tokens are cached
   - What's unclear: Token expiration handling in skill context
   - Recommendation: Check auth at skill start, provide re-auth instructions

3. **Component generation framework detection**
   - What we know: Projects use different frameworks (React, Vue, Svelte)
   - What's unclear: Best way to auto-detect and transform
   - Recommendation: Check package.json and existing components, default to Figma output if unsure

4. **Rate limiting for Figma MCP**
   - What we know: Starter plans limited to 6 calls/month, paid plans per-minute limits
   - What's unclear: How to handle rate limit errors gracefully
   - Recommendation: Check plan tier if possible, provide informative error messages

## Sources

### Primary (HIGH confidence)
- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents) - Parallel research, subagent configuration, built-in agents
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) - context: fork, skill frontmatter, orchestration
- [Figma MCP Server - Tools and Prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/) - Complete tool list, recommended sequence
- [Figma MCP Server Guide](https://github.com/figma/mcp-server-guide) - Setup instructions, best practices
- [Figma MCP Remote Server Installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/) - Authentication, configuration

### Secondary (MEDIUM confidence)
- [How to Use Claude Code Subagents to Parallelize Development](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/) - File-based synthesis pattern
- [Builder.io Claude Code + Figma MCP Server](https://www.builder.io/blog/claude-code-figma-mcp-server) - Practical workflow examples
- [Composio Figma MCP Guide](https://composio.dev/blog/how-to-use-figma-mcp-with-claude-code-to-build-pixel-perfect-designs) - Step-by-step design-to-code

### Applied from Previous Phases
- Phase 2 Research (02-RESEARCH.md) - Skill structure patterns, allowed-tools, output formatting
- Phase 1 Research (01-RESEARCH.md) - Plugin structure, skill registration

## Metadata

**Confidence breakdown:**
- Parallel subagent pattern: HIGH - Official documentation explicitly shows Task tool and parallel research pattern
- File-based synthesis: HIGH - Multiple sources confirm this as best practice for result aggregation
- Figma MCP tools: HIGH - Official Figma developer documentation, verified tool names and sequence
- Code Connect integration: MEDIUM - Documented but less commonly used, requires project setup
- Dimension-based research: MEDIUM - Derived from parallel research pattern, specific dimensions are recommendation

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - subagent system and Figma MCP are stable)
