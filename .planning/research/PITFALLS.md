# Claude Code Extension Pitfalls

**Domain:** Claude Code extensions (skills, sub-agents, MCP, plugins)
**Researched:** 2026-01-24
**Confidence:** HIGH (verified against official documentation at code.claude.com/docs)

---

## Critical Pitfalls

Mistakes that cause major token waste, rewrites, or broken extensions.

---

### Pitfall 1: MCP Context Bloat

**What goes wrong:** Each MCP server adds tool definitions to the context window at startup. With multiple servers, this consumes massive tokens before any work begins. One developer documented 13 MCP servers consuming 82,000 tokens at startup (41% of available context) before typing a single character.

**Why it happens:** Every tool from every connected server gets preloaded into the model's context window. This includes tool names, descriptions, full JSON schemas, parameters, types, and constraints. Developers add MCP servers without understanding the cumulative cost.

**Consequences:**
- Reduced effective context for actual work
- Higher costs per session
- Degraded model performance as context fills
- Sessions requiring compaction sooner

**Warning signs:**
- `/context` shows high MCP tool consumption
- Auto-compaction triggers frequently
- `/cost` shows high baseline token usage before doing work
- Model "forgets" earlier instructions

**Prevention:**
1. Use MCP Tool Search (enabled automatically when tools exceed 10% of context in Claude Code 2.1.7+)
2. Audit MCP servers with `/context` and disable unused ones
3. Configure `ENABLE_TOOL_SEARCH=auto:5` for earlier activation at 5% threshold
4. Use `MAX_MCP_OUTPUT_TOKENS` to limit individual tool output (default 25K)
5. Prefer project-scoped MCP over user-scoped for task-specific servers

**Phase to address:** Phase 1 (Foundation) - establish MCP guidelines before building extensions

**Source:** [Official MCP docs](https://code.claude.com/docs/en/mcp), [Medium article on token reduction](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)

---

### Pitfall 2: Bloated CLAUDE.md Files

**What goes wrong:** CLAUDE.md files become kitchen sinks of documentation. Claude ignores half the instructions because important rules get lost in the noise.

**Why it happens:** Teams add every convention, pattern, and rule to CLAUDE.md. Unlike skills that load on-demand, CLAUDE.md loads every session, consuming tokens even for unrelated work.

**Consequences:**
- Claude ignores actual instructions
- Wasted tokens on every session
- Inconsistent behavior (some rules followed, others ignored)
- Developer frustration at "Claude not listening"

**Warning signs:**
- CLAUDE.md exceeds 500 lines
- Claude repeatedly violates documented rules
- Different team members get different behaviors
- Rules added but behavior unchanged

**Prevention:**
1. Keep CLAUDE.md under 500 lines - ruthlessly prune
2. Move specialized instructions to skills (load on-demand)
3. For each line, ask: "Would removing this cause Claude to make mistakes?" If not, cut it
4. Include only: bash commands Claude cannot guess, code style differences from defaults, testing instructions, repo etiquette, architectural decisions, developer environment quirks
5. Exclude: anything Claude can figure out from code, standard language conventions, detailed API docs (link instead), file-by-file descriptions

**Phase to address:** Phase 1 (Foundation) - template design for extension CLAUDE.md

**Source:** [Best Practices](https://code.claude.com/docs/en/best-practices)

---

### Pitfall 3: Sub-agent Context Explosion

**What goes wrong:** Sub-agents complete and return verbose results to the main conversation, consuming massive context. Running many sub-agents in parallel multiplies this problem.

**Why it happens:** Sub-agents are designed to isolate work, but their results still return. Developers spawn many parallel sub-agents without considering the cumulative context cost.

**Consequences:**
- Main conversation context fills with sub-agent outputs
- Auto-compaction triggers, losing important earlier context
- Expensive sessions from excessive tokens
- Model performance degrades as context fills

**Warning signs:**
- Multiple sub-agent invocations in quick succession
- Main conversation compacts after sub-agent returns
- `/cost` shows spikes after sub-agent completions
- Claude "forgets" earlier context after sub-agent work

**Prevention:**
1. Request sub-agents return summaries, not full outputs
2. Use sub-agents for exploration that produces verbose output (tests, logs, docs)
3. Limit parallel sub-agents - their results compound
4. Use `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` to trigger compaction earlier (e.g., 50%)
5. For expensive operations, use `/clear` after sub-agent work if starting new task

**Phase to address:** Phase 2 (Core Features) - when implementing sub-agent patterns

**Source:** [Sub-agents documentation](https://code.claude.com/docs/en/sub-agents), [Best Practices](https://code.claude.com/docs/en/best-practices)

---

### Pitfall 4: Plugin Directory Structure Mistakes

**What goes wrong:** Developers put `commands/`, `agents/`, `skills/`, or `hooks/` inside the `.claude-plugin/` directory. Only `plugin.json` goes inside `.claude-plugin/`. All other directories must be at the plugin root level.

**Why it happens:** Intuitive assumption that plugin contents belong inside the plugin metadata folder.

**Consequences:**
- Plugin components not discovered
- Skills/commands not available
- Confusing "plugin installed but doesn't work" bugs
- Time wasted debugging path issues

**Warning signs:**
- Plugin installs without errors but skills don't appear
- `/help` doesn't show expected commands
- `/agents` doesn't list expected agents

**Prevention:**
1. Follow correct structure:
```
my-plugin/
  .claude-plugin/
    plugin.json        # ONLY manifest goes here
  commands/            # At plugin root
  agents/              # At plugin root
  skills/              # At plugin root
  hooks/               # At plugin root
  .mcp.json            # At plugin root
```
2. Test with `claude --plugin-dir ./my-plugin` during development
3. Check component discovery with `/help` and `/agents`

**Phase to address:** Phase 2 (Core Features) - plugin template and scaffolding

**Source:** [Plugins documentation](https://code.claude.com/docs/en/plugins)

---

### Pitfall 5: Prompt Injection via MCP Servers

**What goes wrong:** MCP servers that fetch untrusted content expose users to prompt injection attacks. Malicious content in fetched data can override AI instructions.

**Why it happens:** MCP servers have network access and can retrieve arbitrary content. If that content contains prompt injection payloads, they get injected into the model's context.

**Consequences:**
- Claude executes unintended actions
- Data exfiltration
- Malicious file modifications
- Security policy bypasses

**Warning signs:**
- MCP servers fetching user-provided URLs
- Servers returning unvalidated external content
- Unexpected Claude behavior after MCP tool use
- Commands Claude "shouldn't" suggest

**Prevention:**
1. Use third-party MCP servers at your own risk (Anthropic has not verified them)
2. Vet MCP servers before installation - check source, ratings, permissions
3. Use `allowedMcpServers` and `deniedMcpServers` in managed settings
4. Prefer official marketplace servers or build your own
5. Be especially careful with servers that fetch URLs, parse external files, or access untrusted APIs
6. Use sandboxing (`/sandbox`) for additional isolation

**Phase to address:** Phase 1 (Foundation) - security guidelines for marketplace

**Source:** [Security documentation](https://code.claude.com/docs/en/security), [MCP documentation](https://code.claude.com/docs/en/mcp)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or poor user experience.

---

### Pitfall 6: Skills Without Proper Descriptions

**What goes wrong:** Skills have vague or missing descriptions. Claude either invokes them at wrong times (false positives) or never invokes them (false negatives).

**Why it happens:** Developers focus on skill content, neglecting the `description` field that Claude uses for automatic invocation decisions.

**Consequences:**
- Skills trigger unexpectedly (annoying)
- Skills never trigger when needed (useless)
- Users must manually invoke with `/skill-name`
- Reduced extension value

**Warning signs:**
- Users report "skill keeps running when I don't want it"
- Users report "skill never runs automatically"
- High manual invocation rate vs. automatic

**Prevention:**
1. Write descriptions with keywords users would naturally say
2. Include when-to-use guidance: "Use when reviewing code, checking PRs, or analyzing code quality"
3. For task skills (side effects), use `disable-model-invocation: true`
4. For background knowledge, use `user-invocable: false`
5. Test automatic invocation with natural prompts before shipping

**Phase to address:** Phase 2 (Core Features) - skill authoring guidelines

**Source:** [Skills documentation](https://code.claude.com/docs/en/skills)

---

### Pitfall 7: Sub-agents That Cannot Complete Tasks

**What goes wrong:** Sub-agents with `context: fork` receive guidelines without actionable tasks. They start with the guidelines but no prompt to execute, returning without meaningful output.

**Why it happens:** Skills designed as reference content (conventions, patterns) are run as sub-agents. Sub-agents need explicit tasks, not just knowledge.

**Consequences:**
- Sub-agent does nothing useful
- Wasted tokens on sub-agent startup
- User confusion at empty results

**Warning signs:**
- Sub-agent returns quickly with no output
- Skill works inline but fails with `context: fork`
- Sub-agent output is just "I'm ready to help"

**Prevention:**
1. Only use `context: fork` for skills with explicit step-by-step tasks
2. Reference content should run inline (no `context: fork`)
3. When using `context: fork`, ensure skill content includes actionable instructions
4. Test skill both inline and as sub-agent

**Phase to address:** Phase 2 (Core Features) - skill/sub-agent design patterns

**Source:** [Skills documentation](https://code.claude.com/docs/en/skills)

---

### Pitfall 8: MCP Server Startup Timeouts

**What goes wrong:** MCP servers fail to start within the default timeout, appearing as "connection failed" or not showing in `claude mcp list`.

**Why it happens:** Default MCP startup timeout is low. Slow servers (npm packages, complex initialization) exceed it.

**Consequences:**
- MCP tools unavailable
- "Server not showing up" confusion
- Users abandon working servers

**Warning signs:**
- `claude mcp list` doesn't show recently added server
- "Connection closed" errors
- Server works sometimes but not others

**Prevention:**
1. Set `MCP_TIMEOUT` environment variable (e.g., `MCP_TIMEOUT=10000` for 10 seconds)
2. On Windows, use `cmd /c npx` wrapper for npm-based servers
3. Test server startup independently before configuring in Claude Code
4. Check firewall/proxy rules for remote servers

**Phase to address:** Phase 2 (Core Features) - MCP server templates and testing

**Source:** [MCP documentation](https://code.claude.com/docs/en/mcp)

---

### Pitfall 9: Hook Exit Code Confusion

**What goes wrong:** Hook scripts use wrong exit codes. Exit code 2 (blocking) is meant for feedback to Claude, but developers use it for general errors. Exit code 0 with JSON is ignored when developers expected blocking behavior.

**Why it happens:** Unusual exit code semantics. Most tools use 0=success, non-zero=failure. Claude hooks use 0=success (or JSON control), 2=blocking error, other=non-blocking error.

**Consequences:**
- Hooks don't block when they should
- Error messages go to wrong place (stderr vs stdout)
- Silent failures in hook logic

**Warning signs:**
- Hook "runs" but doesn't affect Claude behavior
- Error messages appear in wrong UI location
- JSON output ignored

**Prevention:**
1. Exit code 0: Success, stdout to user (verbose) or parsed as JSON for control
2. Exit code 2: Blocking error, stderr to Claude as feedback
3. Other codes: Non-blocking error, stderr to user (verbose)
4. For JSON control with exit 0: use `"decision": "block"` not exit code 2
5. Test hooks with `claude --debug` to see execution details

**Phase to address:** Phase 2 (Core Features) - hook templates and testing

**Source:** [Hooks reference](https://code.claude.com/docs/en/hooks)

---

### Pitfall 10: Extended Thinking Token Waste

**What goes wrong:** Extended thinking enabled by default (31,999 tokens) burns expensive output tokens on simple tasks that don't need deep reasoning.

**Why it happens:** Extended thinking improves complex planning but is overkill for simple operations. Developers don't adjust the budget per task complexity.

**Consequences:**
- Significantly higher costs for simple operations
- Thinking tokens billed as output tokens (more expensive)
- Budget consumed before actual output

**Warning signs:**
- High `/cost` for simple operations
- "Thinking" phase takes long time on trivial tasks
- Output token count much higher than actual response length

**Prevention:**
1. Disable extended thinking in `/config` for extensions focused on simple tasks
2. Set `MAX_THINKING_TOKENS` environment variable lower (e.g., 8000) for moderate tasks
3. Document thinking requirements in extension README
4. Include "ultrathink" in skill content only when deep reasoning needed

**Phase to address:** Phase 3 (Optimization) - cost management guidelines

**Source:** [Costs documentation](https://code.claude.com/docs/en/costs)

---

### Pitfall 11: Skill Character Budget Overflow

**What goes wrong:** Too many skills with long descriptions exceed the character budget (default 15,000 characters). Some skills get excluded from context.

**Why it happens:** Each skill's description loads into context so Claude knows what's available. With many skills, they compete for limited space.

**Consequences:**
- Some skills invisible to Claude
- Unpredictable which skills load
- "Skill not triggering" bugs

**Warning signs:**
- `/context` shows warning about excluded skills
- Some skills work, similar ones don't
- Adding new skill breaks existing ones

**Prevention:**
1. Keep skill descriptions concise
2. Set `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable if needed
3. Use `disable-model-invocation: true` for user-only skills (removes from context)
4. Consolidate related skills into one with conditional logic

**Phase to address:** Phase 3 (Optimization) - skill organization guidelines

**Source:** [Skills documentation](https://code.claude.com/docs/en/skills)

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

---

### Pitfall 12: Plugin Marketplace Not Found Errors

**What goes wrong:** Plugins from URL-based marketplaces fail with "path not found" when files reference relative paths.

**Why it happens:** URL-based marketplaces don't bundle all files. Relative paths in plugin content can't resolve.

**Consequences:**
- Plugin installation fails
- Supporting files not available
- Template/example files missing

**Prevention:**
1. Use Git-based marketplaces (GitHub, GitLab) instead of raw URLs
2. Ensure all referenced files included in plugin package
3. Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
4. Test installation from marketplace, not just local development

**Phase to address:** Phase 4 (Distribution) - marketplace setup

**Source:** [Discover plugins documentation](https://code.claude.com/docs/en/discover-plugins)

---

### Pitfall 13: VS Code Extension Confusion

**What goes wrong:** Developers think the VS Code extension is a standalone chat interface. It's actually a bridge to the CLI in the terminal.

**Why it happens:** Marketing and naming suggest a VS Code chat panel. Reality is it integrates with Claude Code CLI.

**Consequences:**
- Disappointed users expecting GitHub Copilot-like experience
- Confusion about where to type prompts
- Extension feels "broken"

**Prevention:**
1. Document clearly that extension bridges CLI to VS Code UI
2. Prompts still typed in VS Code's integrated terminal
3. Extension provides file sync, not standalone AI chat

**Phase to address:** Phase 4 (Distribution) - documentation and onboarding

**Source:** [Community reports](https://www.eesel.ai/blog/claude-code-vs-code-extension)

---

### Pitfall 14: Fake Tests Generated by Skills

**What goes wrong:** Skills that generate tests produce "fake tests" - tests that pass assertions without verifying business logic.

**Why it happens:** AI generates tests that technically pass but don't test actual requirements. Generic skills don't know project-specific testing standards.

**Consequences:**
- False confidence in test coverage
- Bugs slip through "tested" code
- Technical debt in test suite

**Prevention:**
1. Include testing conventions in skill content or CLAUDE.md
2. Require specific test patterns (arrange-act-assert, specific assertions)
3. Add hook to run linter/coverage after test generation
4. Human review of generated tests mandatory

**Phase to address:** Phase 2 (Core Features) - test generation skill design

**Source:** [Community reports](https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/)

---

### Pitfall 15: Permission Fatigue Leading to Blanket Approvals

**What goes wrong:** Claude asks permission for everything. Users approve without reviewing, bypassing security protections.

**Why it happens:** Constant permission prompts create fatigue. Users start clicking "yes" reflexively.

**Consequences:**
- Unsafe commands executed without review
- Security protections bypassed
- Potential data loss or system damage

**Prevention:**
1. Use `/permissions` to allowlist frequently used safe commands
2. Use `/sandbox` for OS-level isolation (work freely within bounds)
3. Use `--dangerously-skip-permissions` only in contained environments
4. For extensions: pre-configure safe permissions where possible

**Phase to address:** Phase 1 (Foundation) - security and permission guidelines

**Source:** [Security documentation](https://code.claude.com/docs/en/security), [Best Practices](https://code.claude.com/docs/en/best-practices)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Skill definition | Vague descriptions (Pitfall 6) | Require description review, test auto-invocation |
| Sub-agent design | Context explosion (Pitfall 3) | Mandate summary returns, limit parallelism |
| MCP integration | Context bloat (Pitfall 1), Prompt injection (Pitfall 5) | Audit tool counts, security review process |
| Plugin structure | Directory mistakes (Pitfall 4) | Use scaffolding tool, automated validation |
| Distribution | Marketplace paths (Pitfall 12) | Git-based marketplaces, integration tests |
| Hooks | Exit code confusion (Pitfall 9) | Templates with correct patterns, testing harness |
| Performance | Token waste (Pitfall 1, 2, 10) | Token budgets, compaction guidelines |
| Security | Permission fatigue (Pitfall 15) | Pre-configured safe permissions, sandboxing |

---

## Potenlab-Specific Recommendations

Based on your context of building an internal marketplace to avoid:
- Extensions that waste tokens
- Poor context management
- Brittle MCP integrations
- Hard-to-install packages

**Mandatory for all marketplace extensions:**

1. **Token Budget Enforcement**
   - Maximum skill description: 500 characters
   - CLAUDE.md in plugins: under 200 lines
   - MCP servers: maximum 3 per plugin, with Tool Search compatibility

2. **Context Management Requirements**
   - Sub-agents must return summaries (enforce via review)
   - Skills with `context: fork` must have explicit task content
   - Plugins must document expected context usage

3. **MCP Quality Gates**
   - All MCP servers vetted for prompt injection risk
   - Startup time tested (must complete within 5 seconds)
   - Output size limits documented and enforced

4. **Installation Testing**
   - All plugins tested via `--plugin-dir` before publishing
   - Marketplace uses Git source (not URL-based)
   - Automated structure validation (no files inside `.claude-plugin/`)

5. **Security Baseline**
   - No MCP servers that fetch arbitrary URLs without sandboxing
   - Permission requirements documented
   - Third-party MCP servers explicitly flagged with trust warning

---

## Sources

### Official Documentation (HIGH confidence)
- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [Skills Documentation](https://code.claude.com/docs/en/skills)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents)
- [MCP Documentation](https://code.claude.com/docs/en/mcp)
- [Plugins Documentation](https://code.claude.com/docs/en/plugins)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Security Documentation](https://code.claude.com/docs/en/security)
- [Best Practices](https://code.claude.com/docs/en/best-practices)
- [Costs Management](https://code.claude.com/docs/en/costs)
- [Discover Plugins](https://code.claude.com/docs/en/discover-plugins)

### Community Sources (MEDIUM confidence)
- [MCP Token Reduction Article](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)
- [Claude Code Experience Guide](https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/)
- [VS Code Extension Guide](https://www.eesel.ai/blog/claude-code-vs-code-extension)
