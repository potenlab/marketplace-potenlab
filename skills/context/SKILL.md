---
name: context
description: Display current token usage and budget status with recommendations
disable-model-invocation: true
---

# Context Status

Display current token usage, budget status, and context recommendations.

## Current Session Data

### Git State
Branch: !`git branch --show-current 2>/dev/null || echo "Not a git repository"`
Status: !`git status --short 2>/dev/null | head -5 || echo "N/A"`

## Analysis Task

Run the following Claude Code commands and analyze the results:

1. Run `/cost` to see token usage and costs
2. Run `/context` to see context window breakdown

Based on the data, provide a context status report following this format:

### Context Status

**Summary:** [Brief assessment of current context health - e.g., "Context is healthy with 35% usage" or "Context is filling up, consider compacting"]

#### Token Usage
| Category | Tokens | Percentage |
|----------|--------|------------|
| Conversation | [from /context] | [%] |
| CLAUDE.md | [from /context] | [%] |
| MCP Tools | [from /context] | [%] |
| Skills | [from /context] | [%] |
| **Total** | [sum] | [%] |

#### Budget Status
Check the appropriate status:
- [ ] Context is healthy (< 50% used) - No action needed
- [ ] Context is filling (50-80% used) - Consider compacting soon
- [ ] Context needs attention (> 80% used) - Compact or clear recommended

#### Cost Summary
| Metric | Value |
|--------|-------|
| Session cost | [from /cost] |
| Input tokens | [from /cost] |
| Output tokens | [from /cost] |

#### Recommendations
Based on the current status, provide 1-3 specific recommendations:
1. [Most important action based on context usage]
2. [Secondary recommendation if applicable]
3. [Additional tip if needed]

#### Notes
- Use `/clear` to reset context between unrelated tasks
- Use `/compact` to summarize conversation and free space
- Check `/mcp` to audit and disable unused MCP servers
- If MCP tools exceed 40% of context, consider disabling unused servers
- Tool Search activates automatically at 10% context to optimize MCP usage
