---
name: research
description: Research a topic using parallel sub-agents across multiple dimensions, synthesizing findings into actionable insights
disable-model-invocation: true
argument-hint: <topic>
---

# Parallel Research

Research **$ARGUMENTS** across multiple dimensions simultaneously.

## Target

Parse the topic from $ARGUMENTS. If no topic specified, ask the user what they want to research.

## Dimensions

Spawn parallel subagents for these research dimensions:

1. **Technical** - What's technically possible? Constraints? Requirements?
2. **Ecosystem** - What tools/libraries exist? What's standard? What's popular?
3. **Patterns** - How do experts approach this? Best practices? Architecture?
4. **Pitfalls** - Common mistakes? Gotchas? What to avoid?
5. **Path Forward** - Recommended approach? First steps? Priorities?

## Process

### Phase 1: Parallel Investigation

For each dimension, spawn a subagent to:
- Investigate the dimension thoroughly
- Save structured findings to `.research/<dimension>.md`
- Return a 2-3 sentence summary

Run all 5 dimensions in parallel.

**Subagent instructions:**
Each subagent should focus ONLY on its assigned dimension. Do not overlap with other dimensions. Save findings in this format:

```markdown
# [Dimension] Research: [Topic]

## Findings
- [Key finding 1]
- [Key finding 2]
- [Key finding 3]

## Details
[Detailed explanation with sources]

## Confidence
[HIGH/MEDIUM/LOW with rationale]
```

### Phase 2: Synthesis

After all subagents complete:
1. Read all `.research/*.md` files
2. Identify cross-dimensional themes (multiple dimensions agree)
3. Resolve contradictions (dimensions disagree)
4. Prioritize findings:
   - HIGH: Multiple dimensions confirm
   - MEDIUM: Single dimension, well-supported
   - LOW: Speculative or uncertain
5. Synthesize into unified recommendations
6. Clean up `.research/` directory (remove temporary files)

## Output Format

After synthesis, provide output in this exact structure:

### Research Complete: [Topic]

**Summary:** [2-3 sentence executive summary synthesizing all dimensions]

#### Key Findings

| Dimension | Finding | Confidence |
|-----------|---------|------------|
| Technical | [key insight] | HIGH/MEDIUM/LOW |
| Ecosystem | [key insight] | HIGH/MEDIUM/LOW |
| Patterns | [key insight] | HIGH/MEDIUM/LOW |
| Pitfalls | [key insight] | HIGH/MEDIUM/LOW |
| Path Forward | [key insight] | HIGH/MEDIUM/LOW |

#### Recommended Approach
[Synthesized recommendation with rationale, drawing from all dimensions]

#### Watch Out For
- [Key pitfall 1 from Pitfalls dimension]
- [Key pitfall 2]
- [Key pitfall 3]

#### Next Steps
1. [ ] [Specific action item from Path Forward]
2. [ ] [Specific action item]
3. [ ] [Specific action item]

#### Sources
- [URLs or references used during research]

## Important

- This skill uses parallel subagent execution for faster research
- Each subagent has its own isolated context window
- Findings are saved to files for reliable synthesis
- The `.research/` directory is temporary and cleaned up after synthesis
- Output is a structured summary, not raw exploration logs
