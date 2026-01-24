# Potenlab Marketplace - Claude Code Plugin

This is the Potenlab Claude Code plugin marketplace, providing team-standard extensions for Claude Code workflows.

## Extension Output Format

All /pl:* commands must follow this output structure:

```markdown
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
```

## Sub-agent Architecture

### Context Isolation
- Each sub-agent spawned via Task tool gets its own isolated 200K context window
- Sub-agents can read many files without consuming main context
- Only summarized results return to main context
- Sub-agents cannot spawn other sub-agents (no nesting)

### Parallel Execution Limits
- Task tool supports up to 10 concurrent sub-agents
- Recommended: Use 5-7 concurrent sub-agents for reliability
- Claude Code creates tasks and runs first batch in parallel
- Waits for batch to complete before starting next batch

### Sub-agent Instructions
Every sub-agent instruction must include:
- Clear scope (what dimension/task to focus on)
- Output format (summary only, not exploration logs)
- File output location (if applicable)
- Confidence indication (HIGH/MEDIUM/LOW)

## MCP Token Budget

### Guidelines
- MCP tools should not exceed 40% of context window
- Check current usage with `/context` command
- Enable early Tool Search: Set `ENABLE_TOOL_SEARCH=auto:5`

### Best Practices
1. Use CLI tools when available (gh, aws, gcloud, sentry-cli)
2. Prefer project-scoped MCP over user-scoped
3. Disable unused servers via `/mcp` command
4. Set output limits: `MAX_MCP_OUTPUT_TOKENS=25000`

### Warning Signs
- `/context` shows high MCP tool consumption
- Auto-compaction triggers frequently
- Context filling rapidly during MCP-heavy workflows
