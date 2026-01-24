# Phase 2: Core Extensions - Research

**Researched:** 2026-01-24
**Domain:** Claude Code Skills for Code Review and Refactoring Workflows
**Confidence:** HIGH

## Summary

This research covers implementing `/pl:review` and `/pl:refactor` skills for Claude Code. These are the first "real" workflow skills in the Potenlab toolkit, building on the foundation established in Phase 1.

The key architectural insight is that both commands are **skills that constrain Claude's behavior** through frontmatter configuration. `/pl:review` operates in read-only mode using the `allowed-tools` field to restrict Claude to read-only tools (Read, Grep, Glob). `/pl:refactor` uses the full tool set but includes explicit verification steps (run tests) in its workflow instructions.

Structured output is achieved through the skill's markdown content, which instructs Claude on how to format responses. Claude follows the formatting instructions in SKILL.md, producing consistent structured output without requiring external libraries or special output modes.

**Primary recommendation:** Create two skills at `skills/review/SKILL.md` and `skills/refactor/SKILL.md` with appropriate frontmatter for tool restrictions and clear step-by-step instructions for structured workflows.

## Standard Stack

The established approach for Claude Code review and refactoring skills:

### Core Components
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| Review Skill | `skills/review/SKILL.md` | Read-only code analysis | SKILL.md with `allowed-tools: Read, Grep, Glob` restricts to read-only |
| Refactor Skill | `skills/refactor/SKILL.md` | Code modification workflow | SKILL.md with test verification steps |

### Supporting Files (Optional)
| File | Location | Purpose | When to Use |
|------|----------|---------|-------------|
| Review checklist | `skills/review/checklist.md` | Detailed review criteria | When review criteria exceed 500 lines |
| Refactor patterns | `skills/refactor/patterns.md` | Common refactoring patterns | When pattern library is extensive |

### No External Dependencies Required
This is pure Claude Code plugin development. All functionality is achieved through:
- SKILL.md frontmatter for tool restrictions
- Markdown content for workflow instructions
- Built-in Claude Code tools (Read, Grep, Glob, Write, Edit, Bash)

## Architecture Patterns

### Recommended Skill Structure
```
skills/
├── review/
│   └── SKILL.md          # Read-only code review skill
└── refactor/
    └── SKILL.md          # Code modification skill with verification
```

### Pattern 1: Read-Only Skill via allowed-tools
**What:** Use `allowed-tools` frontmatter to restrict Claude to read-only operations.
**When to use:** Commands that analyze but should never modify code.
**Example:**
```yaml
# Source: https://code.claude.com/docs/en/skills#restrict-tool-access
---
name: review
description: Analyze code and return structured feedback with actionable items. Use for code review, quality checks, and identifying issues.
allowed-tools: Read, Grep, Glob
disable-model-invocation: true
---
```

**Key insight:** The `allowed-tools` field creates a hard boundary. Claude literally cannot use Write, Edit, or Bash tools when this skill is active, ensuring true read-only operation.

### Pattern 2: Structured Output via Instructions
**What:** Define output format in SKILL.md content, Claude follows the structure.
**When to use:** When consistent, parseable output is required.
**Example:**
```markdown
## Output Format

Return your analysis in this exact structure:

### Summary
[2-3 sentence overview of code quality]

### Issues Found
| Severity | Location | Issue | Suggestion |
|----------|----------|-------|------------|
| HIGH/MEDIUM/LOW | file:line | [description] | [fix] |

### Strengths
- [positive observation 1]
- [positive observation 2]

### Actionable Items
1. [ ] [specific action with file reference]
2. [ ] [specific action with file reference]
```

### Pattern 3: Verification Steps in Workflow
**What:** Include explicit verification steps in skill instructions.
**When to use:** Commands that modify code and must verify changes.
**Example:**
```markdown
## Refactoring Workflow

1. **Analyze**: Understand the current code structure
2. **Plan**: Explain what will change and why
3. **Modify**: Make the code changes
4. **Verify**: Run tests to ensure nothing broke
   - Execute: `npm test` or project's test command
   - If tests fail, fix the issue before proceeding
5. **Report**: Show before/after comparison with explanation
```

### Pattern 4: Before/After Explanation
**What:** Skill instructions that require Claude to show original vs modified code.
**When to use:** Any code modification workflow where users need to understand changes.
**Example:**
```markdown
## Output Format

After completing the refactor, provide:

### Changes Made

#### Before
\`\`\`[language]
[original code snippet]
\`\`\`

#### After
\`\`\`[language]
[refactored code snippet]
\`\`\`

#### Why This Change
[Explanation of the improvement: performance, readability, maintainability, etc.]
```

### Anti-Patterns to Avoid
- **Using `context: fork` for review:** Running review in a subagent loses conversation context. Keep review inline so users can discuss findings.
- **Hardcoding test commands:** Use generic "run project's test suite" language or let user specify. Different projects use different test runners.
- **Overly rigid output format:** Allow some flexibility in structure. Claude may need to adapt based on what it finds.
- **Missing disable-model-invocation:** Without this flag, Claude might auto-trigger review or refactor when you just want to discuss code.

## Don't Hand-Roll

Problems that have existing solutions in Claude Code:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Read-only mode | Custom permission checks | `allowed-tools: Read, Grep, Glob` | Built-in, enforced at tool level |
| Structured output | JSON schema enforcement | Markdown templates in SKILL.md | Claude follows formatting instructions reliably |
| Test execution | Custom test runner integration | `Bash(npm:test)` or similar in allowed-tools | Built-in Bash tool handles test commands |
| File navigation | Custom file finder | Glob and Grep tools | Built-in tools optimized for codebase exploration |
| Code modification | Custom diff/patch system | Write and Edit tools | Built-in tools handle atomic edits |

**Key insight:** Claude Code's built-in tools and SKILL.md configuration handle all the infrastructure. Focus on writing clear instructions, not building infrastructure.

## Common Pitfalls

### Pitfall 1: Review Skill Modifies Files
**What goes wrong:** Review skill accidentally writes changes when showing "suggested fixes."
**Why it happens:** Forgot to add `allowed-tools` restriction, Claude defaults to full tool access.
**How to avoid:** Always include `allowed-tools: Read, Grep, Glob` in review skill frontmatter.
**Warning signs:** Review output contains "I've updated the file" or similar modification language.

### Pitfall 2: Refactor Without Test Verification
**What goes wrong:** Refactored code breaks functionality, discovered later.
**Why it happens:** Skill instructions don't require test execution before completion.
**How to avoid:** Include explicit "run tests and verify passing before reporting complete" step.
**Warning signs:** Refactor reports success without mentioning test results.

### Pitfall 3: Unstructured Review Output
**What goes wrong:** Review output varies wildly, hard to act on.
**Why it happens:** SKILL.md doesn't specify output format, Claude uses its own judgment.
**How to avoid:** Include explicit output format template in SKILL.md.
**Warning signs:** Review output missing actionable items or severity levels.

### Pitfall 4: Overly Broad Refactor Scope
**What goes wrong:** User asks to refactor one file, Claude rewrites half the codebase.
**Why it happens:** Instructions don't constrain scope.
**How to avoid:** Include scope guidance: "Only modify the file(s) explicitly specified. Ask before expanding scope."
**Warning signs:** Refactor touches files not mentioned in original request.

### Pitfall 5: Missing Arguments Handling
**What goes wrong:** User runs `/pl:review` without specifying a file, skill fails or produces generic output.
**Why it happens:** SKILL.md doesn't include `$ARGUMENTS` handling or default behavior.
**How to avoid:** Include `$ARGUMENTS` in skill content and handle empty case: "If no file specified, ask user which file to review."
**Warning signs:** Error messages or confused output when invoked without arguments.

## Code Examples

Verified patterns from official documentation and established practices:

### Review Skill (skills/review/SKILL.md)
```yaml
# Source: Pattern derived from https://code.claude.com/docs/en/skills
---
name: review
description: Analyze code and return structured feedback with actionable items. Use when asked to review code, check quality, or identify issues in a file.
allowed-tools: Read, Grep, Glob
disable-model-invocation: true
argument-hint: <file-or-directory>
---

# Code Review

Analyze the specified code and provide structured feedback.

## Target
Review: $ARGUMENTS

If no target specified, ask the user which file or directory to review.

## Review Checklist

Evaluate the code against these criteria:

### Code Quality
- [ ] Clear naming conventions
- [ ] Appropriate function/method size
- [ ] Single responsibility principle
- [ ] No code duplication (DRY)

### Error Handling
- [ ] Edge cases handled
- [ ] Errors caught and handled appropriately
- [ ] Input validation present

### Maintainability
- [ ] Code is readable without excessive comments
- [ ] Complex logic is documented
- [ ] No magic numbers or strings

### Performance
- [ ] No obvious performance issues
- [ ] Appropriate data structures used
- [ ] No unnecessary computations

## Output Format

Provide your review in this exact structure:

### Summary
[2-3 sentence overview of code quality and main findings]

### Issues Found

| Severity | Location | Issue | Suggestion |
|----------|----------|-------|------------|
| [HIGH/MEDIUM/LOW] | [file:line] | [description] | [how to fix] |

If no issues found, state: "No significant issues found."

### Strengths
- [Positive observation about the code]
- [Another positive observation]

### Actionable Items
1. [ ] [Specific action item with file:line reference]
2. [ ] [Another action item]

If no actions needed, state: "No immediate actions required."

## Important
- This is a READ-ONLY review. Do not modify any files.
- Focus on actionable feedback, not stylistic preferences.
- Severity levels: HIGH = bugs/security, MEDIUM = maintainability, LOW = suggestions.
```

### Refactor Skill (skills/refactor/SKILL.md)
```yaml
# Source: Pattern derived from https://code.claude.com/docs/en/skills and https://code.claude.com/docs/en/common-workflows#refactor-code
---
name: refactor
description: Refactor code with clear before/after explanation. Verifies changes with tests before completion.
disable-model-invocation: true
argument-hint: <file> [refactoring-goal]
---

# Code Refactor

Refactor the specified code while maintaining functionality.

## Target
Refactor: $ARGUMENTS

If no target specified, ask the user which file to refactor and what improvement they want.

## Workflow

Follow these steps in order:

### Step 1: Analyze
- Read the target file(s)
- Understand current structure and functionality
- Identify the refactoring opportunity

### Step 2: Plan
Explain what you will change:
- What code will be modified
- Why this change improves the code
- Any risks or considerations

Ask for confirmation before proceeding if the changes are substantial.

### Step 3: Refactor
- Make the code changes
- Keep changes focused and minimal
- Only modify files explicitly in scope

### Step 4: Verify
Run the project's test suite:
```bash
# Try common test commands in order
npm test || yarn test || pnpm test || pytest || go test ./... || cargo test
```

**CRITICAL:** If tests fail:
1. Analyze the failure
2. Fix the issue
3. Re-run tests
4. Repeat until tests pass

Do NOT report completion until tests pass.

### Step 5: Report

Provide the refactoring summary:

## Refactoring Complete

### Changes Made

#### File: [filename]

**Before:**
\`\`\`[language]
[original code - relevant section only]
\`\`\`

**After:**
\`\`\`[language]
[refactored code - same section]
\`\`\`

**Why:** [Explanation of the improvement]

### Test Results
- Tests run: [number]
- Tests passed: [number]
- Tests failed: [number]

### Summary
[Brief description of what was improved: performance, readability, maintainability, etc.]

## Scope Rules
- Only modify files explicitly specified or directly required for the refactor
- If refactoring requires changes to other files, explain and ask for permission
- Keep changes minimal and focused on the stated goal
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
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| commands/ directory | skills/ directory with SKILL.md | 2025 | Skills support frontmatter, supporting files |
| Manual tool restrictions | `allowed-tools` frontmatter | 2025 | Declarative, enforced at tool level |
| Custom output formatting | Markdown templates in skill content | Current | Claude follows format reliably |
| Separate test script | Inline test command in skill | Current | Simpler, no external dependencies |

**Current best practices:**
- Use `skills/` directory with SKILL.md (not commands/)
- Use `allowed-tools` for read-only skills
- Use `disable-model-invocation: true` for action skills
- Include explicit output format in skill content
- Include verification steps for modification skills

## Open Questions

1. **Test command detection**
   - What we know: Different projects use different test runners (npm, yarn, pytest, etc.)
   - What's unclear: Whether to auto-detect or require user configuration
   - Recommendation: Try common commands in order, fall back to asking user

2. **Review scope for directories**
   - What we know: Users may want to review entire directories
   - What's unclear: How to handle large directories without overwhelming output
   - Recommendation: For directories, provide summary + top issues, offer to drill down

3. **Refactor confirmation threshold**
   - What we know: Large refactors should confirm before proceeding
   - What's unclear: What constitutes "substantial" changes
   - Recommendation: Ask for confirmation if modifying more than one file or >50 lines

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) - Skill structure, frontmatter options, allowed-tools
- [Claude Code Common Workflows](https://code.claude.com/docs/en/common-workflows) - Refactoring workflow patterns
- [claude-code-showcase GitHub](https://github.com/ChrisWiles/claude-code-showcase) - Practical skill organization examples

### Secondary (MEDIUM confidence)
- [Claude Code Internals - Permission System](https://kotrotsos.medium.com/claude-code-internals-part-8-the-permission-system-624bd7bb66b7) - How allowed-tools enforces restrictions
- [Claude Skills Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) - Skill invocation patterns

### Applied from Phase 1
- Phase 1 Research (01-RESEARCH.md) - Plugin structure, skill registration, namespace handling

## Metadata

**Confidence breakdown:**
- Read-only mode via allowed-tools: HIGH - Official documentation explicitly shows this pattern
- Structured output via markdown: HIGH - Official docs and practical examples confirm
- Test verification pattern: MEDIUM - Best practice from workflows, exact implementation varies
- Scope constraint patterns: MEDIUM - Derived from anti-patterns and best practices

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - skill system is stable)
