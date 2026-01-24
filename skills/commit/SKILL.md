---
name: commit
description: Create well-formatted git commits with conventional commits format
disable-model-invocation: true
argument-hint: [message-hint]
---

# Smart Commit

Create a well-formatted git commit with proper context and conventional commits format.

## Current Git State

Branch: !`git branch --show-current 2>/dev/null || echo "Not a git repository"`
Status: !`git status --short 2>/dev/null || echo "No changes"`
Recent history: !`git log --oneline -3 2>/dev/null || echo "No commits yet"`

## Changes to Commit

!`git diff HEAD 2>/dev/null || git diff 2>/dev/null || echo "No changes to show"`

## Commit Guidelines

Analyze the changes above and create a commit following these rules:

### Conventional Commits Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature or functionality
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Formatting, no logic change
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies, config

**Scope:** Optional, indicates the area affected (e.g., api, ui, auth)

**Subject:** Short description in imperative mood ("add" not "added")

### Process

1. **Analyze** the diff to understand what changed and why
2. **Determine** the appropriate commit type based on the nature of changes
3. **Stage** appropriate files:
   - Use `git add <file>` for specific files
   - NEVER commit: `.env`, `credentials.*`, `node_modules/`, `*.log`, secrets
4. **Generate** commit message following Conventional Commits format
5. **Create** the commit with the generated message

If $ARGUMENTS is provided, use it as a hint for the commit type or scope.

### Output Format

After creating the commit, display the result:

### Commit Created

**Hash:** `[short hash from git rev-parse --short HEAD]`
**Type:** [feat|fix|docs|style|refactor|test|chore]

**Message:**
```
[full commit message]
```

#### Files Changed
| File | Changes |
|------|---------|
| [path/to/file] | +X / -Y lines |

#### Notes
- [Any follow-up actions needed, e.g., "Remember to push to remote"]
- [Warnings about remaining uncommitted changes if any]
- [Related tasks or issues if applicable]
