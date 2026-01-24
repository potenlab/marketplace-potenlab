---
name: refactor
description: Refactor code with clear before/after explanation. Verifies changes with tests before completion.
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
```[language]
[original code - relevant section only]
```

**After:**
```[language]
[refactored code - same section]
```

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
