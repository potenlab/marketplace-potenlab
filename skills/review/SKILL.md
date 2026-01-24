---
name: review
description: Analyze code and return structured feedback with actionable items. Use when asked to review code, check quality, or identify issues in a file.
allowed-tools: Read, Grep, Glob
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
