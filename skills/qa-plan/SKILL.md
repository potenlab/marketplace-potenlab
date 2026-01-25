---
name: qa-plan
description: Generate a QA plan document (qa-plan.md) from qa-list-automated.md. Transforms QA findings into actionable developer tasks with acceptance criteria.
---

# QA Plan Generator

Transform QA findings into actionable developer tasks with clear acceptance criteria.

---

## The Job

This skill creates a developer-friendly plan from QA findings:

1. **Ask user for qa-list-automated.md location** - ALWAYS ask, never assume
2. **Analyze each QA issue** including viewing screenshots
3. **Search for related component files** in the codebase
4. **Create atomic tasks** with acceptance criteria
5. **Deliver qa-plan.md** with all tasks properly formatted

---

## Step 1: Collect File Path from User

**CRITICAL:** You MUST ask the user for the qa-list-automated.md file location. NEVER assume it's in the working directory.

When this skill is triggered, IMMEDIATELY ask:

```
To generate your QA plan, please provide the path to your qa-list-automated.md file.

Example: @path/to/qa-list-automated.md

Please tag or provide the full path to continue.
```

**Do NOT proceed until the user provides the file path.**

---

## Step 2: Verify and Read the File

Once the user provides the path:

1. Read the file using the provided path
2. Verify it contains the QA table with columns: ID, Area, Status, Priority, Image/Video, Explanation
3. If file not found or invalid, ask the user to provide the correct path

---

## Step 3: Analyze Each QA Issue

For each issue in the table:

### 3.1: View the Screenshot
Use the Read tool to open and view the image from the `Image / Video` column path.

### 3.2: Search for Related Components
Use Glob and Grep to find actual files related to the Area/component:

```
# Search for component files matching the Area
Glob: **/*{Area}*.{tsx,ts,jsx,js,vue,svelte}
Glob: **/{area}/**/*.{tsx,ts,jsx,js,vue,svelte}

# Search for keywords in file contents
Grep: "{Area}" or related keywords from Explanation
```

**Common Search Patterns:**
| Area | Search Patterns |
|------|-----------------|
| Login | `**/login/**`, `**/auth/**`, `**/*Login*`, `**/*Auth*` |
| Dashboard | `**/dashboard/**`, `**/*Dashboard*` |
| Settings | `**/settings/**`, `**/*Settings*`, `**/*Config*` |
| Profile | `**/profile/**`, `**/*Profile*`, `**/*User*` |
| Navigation | `**/nav/**`, `**/*Nav*`, `**/*Menu*`, `**/*Sidebar*` |

### 3.3: Ask if Unclear
Use AskUserQuestion tool if:
- Image cannot be read or path is invalid
- Explanation is unclear or ambiguous
- Priority is missing
- No related files found in the codebase
- Multiple candidate files found

---

## Step 4: Create Tasks with Acceptance Criteria

For each issue, create a task entry:

```markdown
### Task: [Short task title] (ID: [ID from qa-list])
- **Issue**: [Description based on what you see in the image + explanation]
- **Priority**: [Priority from qa-list]
- **Related Files**:
  - `@path/to/ComponentFile.tsx` - [brief reason why this file is relevant]
  - `@path/to/AnotherFile.ts` - [brief reason]
- **Action**: [What to do - keep it simple, based on visual analysis]
- **Acceptance Criteria**:
  - [ ] [Simple, testable criterion]
  - [ ] [Simple, testable criterion]
```

**Acceptance Criteria Rules:**
- Start with action verb (Verify, Confirm, Check, Ensure)
- Must be testable (yes/no answer)
- Max 3-4 criteria per task

---

## Step 5: Write qa-plan.md

Create the file with this structure:

```markdown
# QA Plan

Generated: [DATE]
Source: [user-provided path to qa-list-automated.md]

---

## [Component/Feature Name]

### Task: [Short task title] (ID: [ID]) [Priority Emoji]
- **Issue**: [Description based on screenshot + explanation]
- **Priority**: [Priority level]
- **Related Files**:
  - `@path/to/file.tsx` - [reason]
- **Action**: [What to do]
- **Acceptance Criteria**:
  - [ ] [Testable criterion]
  - [ ] [Testable criterion]

---
```

**Priority Tags:**
- Critical - Breaks core functionality
- Medium - Affects user experience
- Low - Minor improvements

---

## Step 6: Report Results

After completion, provide a summary:

```
QA Plan Generated Successfully!

File: qa-plan.md
Total Tasks: [X]
Components Covered: [list component names]

Priority Breakdown:
- Critical: [N] tasks
- Medium: [N] tasks
- Low: [N] tasks

The plan is ready for your development team. Each task includes:
- Clear issue description based on screenshots
- Related component files
- Priority level
- Specific action to take
- Testable acceptance criteria
```

---

## Output Format

### QA Plan Generated: {count} Tasks

**Summary:** Created {count} developer tasks from QA findings across {component_count} components

#### Task Breakdown
| Priority | Count |
|----------|-------|
| Critical | {critical} |
| Medium | {medium} |
| Low | {low} |

#### Components Covered
- {list of component/area names}

#### Actionable Items
1. [ ] Review qa-plan.md with the team
2. [ ] Prioritize and assign tasks
3. [ ] Use /pl:qa-check after completing each fix

#### Notes
- Each task includes related file paths for quick navigation
- Acceptance criteria are designed to be testable
