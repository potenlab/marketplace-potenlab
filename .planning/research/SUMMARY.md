# Project Research Summary

**Project:** Potenlab Internal Claude Code Extension Marketplace
**Domain:** Claude Code Plugin Development (`/pl:*` namespace)
**Researched:** 2026-01-24
**Confidence:** HIGH (official Claude Code documentation)

## Executive Summary

Claude Code extensions are built using a well-documented four-layer architecture: **Skills** (slash commands with dynamic instructions), **Sub-agents** (isolated AI workers for parallel execution), **MCP servers** (external tool integrations), and **Hooks** (event-driven automation). These components package into **Plugins** for distribution. The Potenlab marketplace will deliver internal extensions (`/pl:slice`, `/pl:review`, `/pl:research`, `/pl:refactor`) using this mature plugin system.

The recommended approach is **skills-first development**: start with simple slash commands for core workflows, add sub-agent isolation for context-heavy operations, integrate MCP for Figma connectivity, and layer hooks for automation. This incremental strategy avoids common pitfalls while delivering value early. The `/pl:research` extension serves as the complexity ceiling, requiring parallel sub-agent orchestration with result synthesis.

Key risks center on **context management**: MCP servers can consume 40%+ of available context before work begins, bloated CLAUDE.md files get ignored, and verbose sub-agent outputs exhaust the main conversation. Mitigation requires strict token budgets, Tool Search enablement, and mandating sub-agents return summaries. Security risks from prompt injection via MCP servers demand vetting all third-party integrations.

## Key Findings

### Recommended Stack

Claude Code provides a complete extension platform requiring no additional frameworks. Extensions are defined through configuration files (YAML frontmatter + Markdown content) that Claude loads natively. The plugin system handles distribution, installation, and lifecycle management.

**Core technologies:**
- **Skills (SKILL.md files)**: Primary interaction mechanism — users invoke `/pl:command`, Claude loads instructions and executes. Supports dynamic context injection via `!`command`` syntax, tool restrictions via `allowed-tools`, and sub-agent delegation via `context: fork`.
- **Sub-agents (agents/*.md)**: Isolated execution contexts with independent 200K token windows. Built-in types include `Explore` (Haiku, read-only, fast), `Plan` (research), and `general-purpose` (full capability). Custom agents define tool access, permission modes, and preloaded skills.
- **MCP (Model Context Protocol)**: Connects Claude to external services via HTTP, SSE, or stdio transports. Critical for Figma integration (`/pl:slice`). Requires careful token budget management — each server's tool definitions consume context.
- **Plugin packaging (.claude-plugin/)**: Bundles skills, agents, hooks, and MCP servers into distributable packages. Supports namespace isolation (`/pl:*`), version management, and team installation via `--scope project`.

**Version requirements:**
- Claude Code 2.1.7+ for automatic Tool Search (reduces MCP context bloat by 46%)
- Node.js runtime for MCP servers (npm-based integrations)

**Distribution strategy:**
- GitHub-based marketplace (avoids URL path resolution issues)
- Git source for reliable plugin installation
- Team installation via project-scoped settings

### Expected Features

**Must have (table stakes):**
- Slash command invocation (`/pl:command-name`) — universal UX pattern
- Clear command descriptions — users need to know purpose before invoking
- Argument support (`$ARGUMENTS` placeholder) — most workflows need user input
- Plugin metadata (name, version, description) — discovery and installation
- Namespace isolation (`/pl:*`) — prevent conflicts with other plugins
- Installation via CLI (`claude plugin install`) — standard workflow
- Error handling with clear feedback — users need actionable messages

**Must have for specific extensions:**
- `/pl:slice` (Figma-to-code): MCP server for Figma API, component templates, code generation
- `/pl:review`: Read-only tool access, review checklist, actionable feedback format
- `/pl:research`: Sub-agent spawning, parallel execution (up to 7 concurrent), result synthesis
- `/pl:refactor`: Edit tool access, file modification capabilities, test verification

**Should have (differentiators):**
- Sub-agent isolation (`context: fork`) — preserve main context during heavy operations
- Parallel sub-agent execution — 10x speed for independent research paths
- Model selection per agent — cost optimization (Haiku for exploration, Sonnet/Opus for complex work)
- Tool restrictions — safety through limited capabilities (`tools:` or `disallowedTools:`)
- Permission modes — auto-approve safe operations (`permissionMode: acceptEdits`)
- Dynamic context injection — inject live data before execution (`!`git status``)
- Hook-based automation — trigger actions on events (PostToolUse for linting, Stop for completion validation)

**Defer (v2+):**
- LSP integration — complex, language-specific, high implementation cost
- Visual output generation — HTML reports, diagrams via `webbrowser.open()`
- Prompt-based hooks — LLM-evaluated decisions (vs. deterministic scripts)
- Background task execution — non-blocking long-running operations

### Architecture Approach

The layered architecture enables composition: **Skills orchestrate workflows, sub-agents execute in parallel with isolated context, MCP provides external data, and hooks automate deterministic actions**. For the `/pl:research` extension, a skill contains orchestration logic that spawns 4 specialized sub-agents (tech, architecture, features, pitfalls) in parallel, each researching one dimension independently. Results return to the orchestrator for synthesis into a unified report.

**Major components:**

1. **Orchestrator Skills** — Define research dimensions, spawn sub-agents via Task tool, provide synthesis instructions. Located in `.claude/skills/research/SKILL.md`. Uses `context: fork` and `agent: general-purpose` for complex coordination.

2. **Dimension Sub-agents** — Specialized researchers with focused prompts, read-only tool access, and fast models (Haiku). Each has isolated 200K context window for extensive exploration without consuming main context. Return concise summaries (500 tokens max recommended).

3. **MCP Integration Layer** — Connects sub-agents to external data sources (Context7 for docs, Figma API for design specs, GitHub for code). Configured via `.mcp.json` with environment variable support (`${VAR}` syntax). Requires Tool Search enablement to avoid context bloat.

4. **Plugin Bundle** — Packages all components with manifest (`.claude-plugin/plugin.json`), namespace (`pl-marketplace`), and installation metadata. Directory structure critical: skills/, agents/, hooks/ at plugin root (NOT inside `.claude-plugin/`).

**Data flow for parallel research:**
1. User invokes `/pl:research "topic"`
2. Skill parses dimensions, prepares focused prompts
3. Task tool spawns N sub-agents in parallel (up to 7)
4. Sub-agents work independently, query MCP if needed
5. Results return to orchestrator context (summaries only)
6. Synthesis combines findings into final output
7. Hooks run for formatting/logging (optional)

**Key patterns:**
- Context isolation for scale — sub-agents do heavy lifting, return summaries
- Skill + sub-agent composition — preload domain knowledge via `skills:` field
- Tool restrictions for safety — read-only for review, edit for refactor
- Permission modes for speed — `dontAsk` for analysis, `acceptEdits` for trusted modifications

### Critical Pitfalls

1. **MCP Context Bloat** — Each MCP server adds tool definitions to context at startup. With multiple servers, this can consume 40%+ of context (82K tokens documented with 13 servers). **Prevention:** Use Tool Search (auto-enabled at 10% context in v2.1.7+), audit servers with `/context`, disconnect unused ones, set `ENABLE_TOOL_SEARCH=auto:5` for earlier activation.

2. **Bloated CLAUDE.md Files** — Files exceeding 500 lines become kitchen sinks. Claude ignores rules buried in noise. **Prevention:** Keep under 500 lines, move specialized instructions to on-demand skills, ruthlessly prune anything Claude can infer from code.

3. **Sub-agent Context Explosion** — Sub-agents return verbose results to main conversation. Multiple parallel sub-agents multiply this problem, exhausting context. **Prevention:** Mandate sub-agents return summaries (500 token max), use sub-agents for verbose exploration that would bloat main context, limit parallelism to 7 concurrent.

4. **Plugin Directory Structure Mistakes** — Developers put skills/, agents/, hooks/ inside `.claude-plugin/`. Only `plugin.json` goes there. **Prevention:** All component directories at plugin root, test with `--plugin-dir` during development, validate with `/help` and `/agents`.

5. **Prompt Injection via MCP Servers** — MCP servers fetching untrusted content expose prompt injection risks. Malicious payloads can override instructions. **Prevention:** Vet all third-party MCP servers, use `allowedMcpServers`/`deniedMcpServers` in managed settings, prefer official marketplace servers, use sandboxing for additional isolation.

## Implications for Roadmap

Based on research, suggested phase structure follows increasing complexity: foundation (simple skills), core features (sub-agent patterns), advanced capabilities (parallel orchestration), and optimization (hooks, distribution).

### Phase 1: Foundation & Simple Extensions
**Rationale:** Establish plugin structure and deliver immediate value with low-complexity skills. This validates the architecture before tackling parallel execution.

**Delivers:**
- Plugin manifest and namespace (`/pl:*`)
- `/pl:review` skill with read-only tools and review checklist
- `/pl:refactor` skill with edit tools and test verification
- CLAUDE.md guidelines (under 500 lines)
- Security and permission baselines

**Addresses features:**
- Table stakes: slash commands, descriptions, argument support, installation
- Tool restrictions for safety
- Clear error handling

**Avoids pitfalls:**
- Plugin structure mistakes (correct directory layout from start)
- Bloated CLAUDE.md (establish 500-line limit)
- Permission fatigue (configure safe allowlists)

**Research needs:** None — standard patterns, well-documented

### Phase 2: Sub-agent Isolation
**Rationale:** Add context isolation before parallel execution. Learn sub-agent patterns with simpler single-agent workflows.

**Delivers:**
- Custom sub-agents for review and refactor domains
- Skill + sub-agent composition (preloaded domain knowledge)
- Context management guidelines (summary returns)
- Model selection strategy (Haiku vs. Sonnet)

**Uses stack elements:**
- Built-in sub-agents (Explore, Plan)
- Custom agent definitions with tool restrictions
- Permission modes (`dontAsk`, `acceptEdits`)

**Implements architecture:**
- Isolated execution contexts
- Context preservation (sub-agents keep main conversation clean)

**Avoids pitfalls:**
- Sub-agent context explosion (mandate summaries from start)
- Skills without proper descriptions (establish review process)
- Sub-agents that cannot complete tasks (test with explicit task prompts)

**Research needs:** Phase-level research for sub-agent orchestration patterns (`/gsd:research-phase` before Phase 3)

### Phase 3: Parallel Research Extension
**Rationale:** Highest complexity — requires orchestration, parallel execution, and synthesis. Build after mastering single sub-agents.

**Delivers:**
- `/pl:research` orchestrator skill
- 4 specialized dimension sub-agents (tech, arch, features, pitfalls)
- Parallel execution (up to 7 concurrent)
- Result synthesis patterns
- Documentation for parallel sub-agent workflows

**Addresses features:**
- Key differentiator: parallel sub-agent execution
- Sub-agent spawning and coordination
- Result synthesis into cohesive output

**Implements architecture:**
- Orchestrator skill pattern
- Dimension sub-agents with isolated contexts
- Parallel execution flow with Task tool

**Avoids pitfalls:**
- Sub-agent context explosion (strict summary requirements)
- Context bloat (Tool Search enabled, MCP audit)
- Missing skill descriptions (orchestrator needs clear when-to-use)

**Research needs:** HIGH — complex orchestration, synthesis patterns, parallel execution management

### Phase 4: MCP Integration (Figma)
**Rationale:** External service integration adds complexity and security risks. Tackle after core features proven.

**Delivers:**
- `/pl:slice` skill for Figma-to-code
- MCP server for Figma API
- Component template system
- Code generation patterns

**Uses stack elements:**
- MCP HTTP transport for Figma
- Environment variable management (`${FIGMA_TOKEN}`)
- Tool Search for context management

**Addresses features:**
- Figma integration (must-have for `/pl:slice`)
- Dynamic context injection (live Figma data)
- External data access

**Avoids pitfalls:**
- MCP context bloat (Tool Search, token budgets)
- Prompt injection (vet Figma MCP server, validate responses)
- MCP server startup timeouts (set `MCP_TIMEOUT`)

**Research needs:** MEDIUM — Figma API patterns, component extraction, code generation templates

### Phase 5: Automation & Optimization
**Rationale:** Hooks and performance tuning enhance existing features. Add after core functionality stabilized.

**Delivers:**
- PostToolUse hooks for auto-linting
- Stop hooks for completeness validation
- Token budget enforcement
- Extended thinking configuration per skill
- Performance optimization guidelines

**Uses stack elements:**
- Hook configuration (hooks/hooks.json)
- Exit code semantics (0/2/other)
- JSON control output for advanced decisions

**Avoids pitfalls:**
- Hook exit code confusion (templates with correct patterns)
- Extended thinking token waste (per-skill configuration)
- Skill character budget overflow (consolidate, optimize descriptions)

**Research needs:** None — standard hooks patterns documented

### Phase 6: Distribution & Marketplace
**Rationale:** Final phase packages and publishes complete extensions.

**Delivers:**
- GitHub-based marketplace setup
- Installation documentation
- Version management strategy
- Team onboarding guide

**Avoids pitfalls:**
- Plugin marketplace path errors (Git-based, not URL)
- Installation failures (integration testing from marketplace)

**Research needs:** None — standard distribution patterns

### Phase Ordering Rationale

- **Dependencies:** Simple skills (Phase 1) before sub-agents (Phase 2) before orchestration (Phase 3). MCP integration (Phase 4) can happen after Phase 2 but before Phase 3 if Figma access becomes urgent.
- **Learning curve:** Complexity increases incrementally — master skills, then sub-agents, then parallel coordination.
- **Value delivery:** Phase 1 ships `/pl:review` and `/pl:refactor` immediately, delivering value before tackling complex parallel research.
- **Risk management:** Validate architecture with simple extensions before investing in complex orchestration. Learn context management patterns with single sub-agents before parallel execution.
- **Pitfall avoidance:** Establish token budgets, directory structure, and security baselines early (Phase 1). Add context management discipline (Phase 2) before multiplying complexity (Phase 3).

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2:** Sub-agent orchestration patterns — need concrete examples of skill-to-subagent handoff, summary formats, error handling
- **Phase 3:** Parallel execution and synthesis — complex, requires research into Task tool usage, result aggregation, failure handling
- **Phase 4:** Figma MCP integration — niche domain, need API documentation, component extraction patterns, authentication flows

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Simple skills with tool restrictions — well-documented, straightforward implementation
- **Phase 5:** Hooks for automation — standard patterns documented in official refs
- **Phase 6:** Plugin distribution — established marketplace workflows

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Claude Code documentation, mature platform with clear APIs |
| Features | HIGH | Feature requirements verified against official docs and 130+ existing plugins |
| Architecture | HIGH | Layered architecture well-documented with concrete examples and built-in sub-agents |
| Pitfalls | HIGH | Pitfalls sourced from official best practices, community reports, and documented token bloat issues |

**Overall confidence:** HIGH

Research based entirely on official Claude Code documentation (code.claude.com/docs) with community validation from 130+ plugin ecosystem. Claude Code is a mature platform (v2.x) with stable APIs and established patterns. No experimental features or unverified approaches recommended.

### Gaps to Address

**Token budget enforcement mechanisms:** Research documents token limits and Tool Search activation, but enforcement strategy needs definition. Address during Phase 1 planning — define maximum MCP servers per plugin (recommend 3), skill description length (recommend 500 chars), CLAUDE.md size (enforce 500 lines).

**Sub-agent result format standards:** Pitfalls document need for summaries but not specific format. Define during Phase 2 planning — establish template for sub-agent returns (structured markdown with max token count, summary-first pattern, no verbose logs).

**Figma MCP server selection:** Multiple Figma MCP implementations may exist. Validate official/recommended server during Phase 4 research. Security review mandatory before integration.

**Parallel execution limits:** Documentation mentions "up to 7 concurrent" sub-agents but not queuing behavior beyond that. Test during Phase 3 to understand performance characteristics and failure modes.

**Marketplace governance:** Technical implementation clear, but operational aspects need definition — who approves new extensions, version update process, deprecation policy. Address in Phase 6 planning.

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) — skill structure, frontmatter fields, invocation
- [Claude Code Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents) — agent types, isolation, parallelism
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp) — transport types, configuration, Tool Search
- [Claude Code Plugins Documentation](https://code.claude.com/docs/en/plugins) — packaging, distribution, namespace
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — manifest schema, directory structure
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — event types, exit codes, JSON control
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) — CLAUDE.md limits, context management
- [Claude Code Security Documentation](https://code.claude.com/docs/en/security) — prompt injection, permissions, sandboxing
- [Claude Code Memory Documentation](https://code.claude.com/docs/en/memory) — CLAUDE.md hierarchy, rules system
- [Claude Code Settings Documentation](https://code.claude.com/docs/en/settings) — configuration scopes, permissions

### Secondary (MEDIUM confidence)
- [Awesome Claude Code Plugins](https://github.com/ccplugins/awesome-claude-code-plugins) — 130+ plugins catalog, validation of feature patterns
- [Parallel Subagents Guide](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/) — real-world parallel execution patterns
- [MCP Token Reduction Article](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734) — quantified context bloat (82K tokens with 13 servers)
- [Claude Code Experience Guide](https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/) — pitfalls from production usage

---
*Research completed: 2026-01-24*
*Ready for roadmap: yes*
