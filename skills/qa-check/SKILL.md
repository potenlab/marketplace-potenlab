---
name: qa-check
description: Create git branch, commit, and PR for QA fixes. Two modes - Context mode (auto-detect from conversation) or Manual mode (user provides ID).
argument-hint: [id]
---

# QA Check

Create a git branch, commit changes, and open a PR for QA fixes.

---

## The Job

This skill has **TWO MODES**:

### Mode 1: Context Mode (Auto-detect)
- Analyzes the current conversation context
- Identifies which QA item ID was being worked on
- Creates branch and PR based on that context

### Mode 2: Manual Mode (User-provided)
- User explicitly provides the ID
- Example: `/pl:qa-check 002` or `/pl:qa-check ID 005`

---

## Step 1: Determine Mode

Check how the skill was invoked:

### If user provided ID:
```
/pl:qa-check 002
/pl:qa-check ID 005
```
-> Use **Manual Mode** with the provided ID

### If no ID provided:
```
/pl:qa-check
```
-> Use **Context Mode** - analyze conversation to find which QA item was discussed

---

## Step 2: Context Mode - Identify QA Item

**Only if no ID was provided by user.**

Analyze the current conversation to identify:
1. Which QA issue ID was being worked on
2. What Area/component was discussed
3. Any explicit mentions of QA item numbers

Look for patterns like:
- "Working on QA item 002"
- "Fixing the login issue (ID: 003)"
- "This resolves issue #005"
- References to specific bugs or features from qa-list

**If context is unclear, ask the user:**

```
I couldn't identify which QA item you were working on from the conversation.

Please provide the ID:
- Example: /pl:qa-check 002
- Or tell me: "I was working on ID 005"
```

---

## Step 3: Read qa-list-automated.md for Issue Details

Read the local `qa-list-automated.md` file to get details about the QA item:
- **ID**: The QA item ID
- **Area**: The component/module (e.g., Login, Dashboard)
- **Explanation**: Description of the issue

---

## Step 4: Git Workflow - Branch, Commit, Push & PR

### 4.1: Find Changed Files

Run `git status` to identify all modified/added files related to this fix.

**IMPORTANT:** Only include files that are relevant to the current issue fix. Do NOT include:
- `qa-list-automated.md` (QA tracking file)
- Unrelated changes

**If no changed files found:** Report "No changed files found. Skipping git workflow."

### 4.2: Create Fix Branch

Create a new branch from current branch:

```bash
git checkout -b fix/{issue-area}-{brief-description}
```

**Branch naming convention:**
- `fix/login-validation-error`
- `fix/dashboard-chart-loading`
- `fix/settings-dark-mode-toggle`

Use lowercase, kebab-case, based on the issue Area and Description.

### 4.3: Stage and Commit Changes

Stage only the relevant files:

```bash
git add [specific-files]
```

Commit with a meaningful message:

```bash
git commit -m "$(cat <<'EOF'
fix({area}): {brief description}

- {what was changed}
- Resolves QA item #{ID}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 4.4: Push to Remote

```bash
git push -u origin fix/{branch-name}
```

### 4.5: Create Pull Request

Use `gh pr create` to create a PR:

```bash
gh pr create --title "fix({area}): {brief description}" --body "$(cat <<'EOF'
## Summary
{Brief description of what was fixed}

## Changes
- {List of changes made}

## Test
- [ ] {Specific test step to verify the fix}

## QA Reference
Resolves QA item #{ID}
EOF
)"
```

### 4.6: Report Git Results

After PR is created, report:

```
Git Workflow Complete!

Branch: fix/{branch-name}
PR: {PR URL}
```

---

## Table Format Reference

The qa-list-automated.md uses this format:

```markdown
| ID | Area | Status | Priority | Image / Video | Explanation | Done |
| :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| 001 | Login | Open | High | /Images/img.png | Description | [ ] |
| 002 | Dashboard | Reopen | Medium | - | Issue here | [x] |
```

---

## Error Handling

### If ID cannot be determined (Context Mode):
- Ask user to provide the ID explicitly
- Do NOT guess

### If ID not found in qa-list-automated.md:
- Report "ID [X] not found in qa-list-automated.md"
- Ask user to verify the ID

### If no changed files:
- Skip git workflow
- Report "No changed files found"

---

## Output Format

### QA Check Complete: {Area} Fix

**Summary:** Created fix branch and PR for QA item #{ID} - {brief description}

#### Git Results
| Item | Value |
|------|-------|
| Branch | `fix/{branch-name}` |
| PR | {PR URL} |
| Files Changed | {count} |

#### Changes Made
- {list of changes}

#### Next Steps
1. [ ] Review the PR
2. [ ] Run tests to verify fix
3. [ ] Merge when approved
