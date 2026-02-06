# QA Workflow Agents

A complete QA tracking and fix workflow for Claude Code. Extract QA items from Google Sheets, generate developer tasks, and create PRs for fixes.

## Prerequisites

### Google Drive MCP (Required)

The QA workflow requires the Google Drive MCP server to access Google Sheets and Drive files.

**Install the MCP server:**

```bash
# Clone the repository
git clone https://github.com/piotr-agier/google-drive-mcp.git
cd google-drive-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

**Configure Claude Code to use the MCP:**

Add to your `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "google-drive": {
      "command": "node",
      "args": ["/path/to/google-drive-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

See [google-drive-mcp documentation](https://github.com/piotr-agier/google-drive-mcp) for full setup instructions including Google OAuth credentials.

---

## Agents Overview

| Agent | Purpose |
|-------|---------|
| `qa-list` | Extract Open/Reopen items from Google Sheets |
| `qa-image-tag` | Replace Google Drive links with local image paths |
| `qa-plan` | Transform QA findings into developer tasks |
| `qa-check` | Create git branch, commit, and PR for fixes |

---

## Workflow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Google Sheets  │────▶│   /pl:qa-list    │────▶│ qa-list-auto-   │
│  (QA tracking)  │     │                  │     │ mated.md        │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│  Google Drive   │────▶│  qa-image-tag    │──────────────┤
│  (screenshots)  │     │  (auto-runs)     │              │
└─────────────────┘     └──────────────────┘              │
                                                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   /pl:qa-plan    │────▶│   qa-plan.md    │
                        │                  │     │ (dev tasks)     │
                        └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  /pl:qa-check    │────▶│   GitHub PR     │
                        │                  │     │                 │
                        └──────────────────┘     └─────────────────┘
```

---

## Usage

### Step 1: Generate QA List

```
/pl:qa-list
```

First run will prompt for:
- **Google Sheets link** - Your QA tracking spreadsheet
- **Google Drive link** - Folder containing screenshots
- **Local image path** - Where images are stored locally (e.g., `@Images/`)

Configuration is saved to `source.json` for future runs.

**Output:** `qa-list-automated.md` with all Open/Reopen items

---

### Step 2: Generate QA Plan

```
/pl:qa-plan
```

Will prompt for the path to `qa-list-automated.md`, then:
- Analyzes each QA issue
- Views screenshots to understand issues
- Searches codebase for related files
- Creates atomic tasks with acceptance criteria

**Output:** `qa-plan.md` with developer-ready tasks

---

### Step 3: Fix and Create PR

After fixing an issue:

```
/pl:qa-check 002        # For QA item ID 002
/pl:qa-check            # Auto-detect from conversation
```

This will:
- Create a fix branch: `fix/{area}-{description}`
- Commit changes with proper message
- Push and create a GitHub PR

---

## File Formats

### qa-list-automated.md

```markdown
# QA List - Open & Reopen Items

| ID | Area | Status | Priority | Image / Video | Explanation | Done |
| :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| 001 | Login | Open | High | /Images/bug-001.png | Cannot login | [ ] |
| 002 | Dashboard | Reopen | Medium | /Images/bug-002.png | Charts broken | [ ] |
```

### qa-plan.md

```markdown
# QA Plan

## Authentication

### Task: Fix login error display (ID: 001)
- **Issue**: No error message shown on failed login
- **Priority**: High
- **Related Files**:
  - `@src/components/LoginForm.tsx` - Login form component
  - `@src/hooks/useAuth.ts` - Auth logic
- **Action**: Add error state display
- **Acceptance Criteria**:
  - [ ] Verify error shows on wrong password
  - [ ] Verify error clears on retry
```

### source.json

```json
{
  "googleSheetsLink": "https://docs.google.com/spreadsheets/d/xxxxx/edit",
  "googleDriveLink": "https://drive.google.com/drive/folders/xxxxx",
  "localImagePath": "@Images/"
}
```

---

## Agents Detail

### qa-list

Extracts QA items from Google Sheets:
- Filters for `Open` or `Reopen` status only
- Maps flexible column names (ID, Area, Status, Priority, Image/Video, Explanation)
- Creates formatted markdown table
- Replaces empty cells with `-`

### qa-image-tag

Converts Google Drive links to local paths:
- Lists all files in Google Drive folder via MCP
- Preserves exact filenames (including Korean, spaces, special chars)
- Matches Drive links to actual filenames
- Outputs simple path strings: `/Images/filename.png`

### qa-plan

Transforms QA findings into developer tasks:
- Reads and views each screenshot
- Searches codebase for related component files
- Tags files with `@path/to/file.tsx` format
- Creates testable acceptance criteria
- Asks clarifying questions when unclear

### qa-check

Creates git workflow for fixes:
- Identifies QA item from context or user input
- Creates branch: `fix/{area}-{description}`
- Commits with conventional commit format
- Pushes and creates GitHub PR with proper description

---

## Troubleshooting

### "Cannot access Google Sheets"
- Verify the sheet is shared (at least view access)
- Check Google Drive MCP is properly configured
- Ensure OAuth credentials are valid

### "Image not found"
- Verify the Google Drive folder link is correct
- Check that local image path matches where files are stored
- Ensure filenames match exactly (including special characters)

### "No changed files found"
- The qa-check agent only commits actual code changes
- `qa-list-automated.md` is excluded from commits
- Make sure you've saved your fix before running `/pl:qa-check`
