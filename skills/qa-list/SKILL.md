---
name: qa-list
description: Generate a complete QA list from Google Sheets with local image tags. Extracts Open/Reopen items and replaces Google Drive links with local image references.
---

# QA List Generator

Generate a complete QA tracking document from Google Sheets with properly linked local images.

---

## The Job

This skill orchestrates the QA list generation workflow:

1. **Check for saved configuration** in `source.json`
2. **Collect inputs if needed** (first time only, or if user wants to update)
3. **Save configuration** to `source.json` for future use
4. **Extract QA items** from Google Sheets (Open/Reopen status only)
5. **Replace Drive links** with local image paths
6. **Deliver qa-list-automated.md** with all images properly linked

---

## Step 0: Check for Saved Configuration (ALWAYS DO THIS FIRST)

**Before asking the user for any inputs, ALWAYS check if `source.json` exists in the current working directory.**

Use the Read tool to check for `source.json`:

```json
{
  "googleSheetsLink": "https://docs.google.com/spreadsheets/d/xxxxx/edit",
  "googleDriveLink": "https://drive.google.com/drive/folders/xxxxx",
  "localImagePath": "@Images/"
}
```

### If `source.json` EXISTS:
1. Read the saved configuration
2. Show the user what's saved:
   ```
   Found saved configuration (source.json):
   - Google Sheets: [saved link]
   - Google Drive: [saved link]
   - Local Path: [saved path]

   Proceeding with saved configuration...
   (Say "update sources" if you want to change these)
   ```
3. Proceed directly to Step 2 (extraction)

### If `source.json` DOES NOT EXIST:
1. Inform the user this is first-time setup
2. Proceed to Step 1 to collect all required inputs
3. Save the configuration to `source.json` before proceeding

### If user says "update sources" or wants to change configuration:
1. Ask which input(s) they want to update, or collect all three again
2. Update `source.json` with new values
3. Proceed with updated configuration

---

## Step 1: Collect Required Inputs (First Time Only)

**Only do this if `source.json` doesn't exist or user wants to update.**

You MUST collect ALL THREE inputs before proceeding:

1. **Google Sheets Link** - Contains the QA/bug tracking data
2. **Google Drive Link** - Contains the image/video files referenced in the sheet
3. **Local Image Path** - The local directory where images are stored (must match Google Drive files)

### Collecting Required Inputs

```
This is your first time using the QA List Generator. I need to save your sources.

Please provide:

1. **Google Sheets Link** - Your QA tracking spreadsheet
   Example: https://docs.google.com/spreadsheets/d/xxxxx/edit

2. **Google Drive Link** - The folder containing your screenshots/videos
   Example: https://drive.google.com/drive/folders/xxxxx

3. **Local Image Path** - Where your images are stored locally
   Examples: @Images/, ./assets/images/, /path/to/images/

These will be saved to source.json so you won't need to enter them again.
```

**Keep asking until ALL inputs are provided.** Do not proceed with partial information.

### Save Configuration to source.json

Once all three inputs are collected, **IMMEDIATELY save them** to `source.json`:

```json
{
  "googleSheetsLink": "[user's sheets link]",
  "googleDriveLink": "[user's drive link]",
  "localImagePath": "[user's local path]"
}
```

---

## Step 2: Extract QA Items from Google Sheets

Use Google Drive MCP to access the spreadsheet:
- Extract the spreadsheet ID from the URL
- Read all rows from the sheet
- Filter for Status = 'Open' or 'Reopen' only (case-insensitive)
- Extract columns: ID, Area, Status, Priority, Image/Video, Explanation

**Column Mapping** (flexible with variations):
- ID: 'ID', 'Bug ID', 'Issue ID', 'Ticket', '#'
- Area: 'Area', 'Module', 'Section', 'Component', 'Feature'
- Status: 'Status', 'State', 'Current Status'
- Priority: 'Priority', 'Severity', 'Level', 'P'
- Image/Video: 'Image', 'Video', 'Screenshot', 'Attachment', 'Media'
- Explanation: 'Explanation', 'Description', 'Details', 'Notes', 'Summary'

---

## Step 3: Replace Google Drive Links with Local Paths

For each image/video link in the table:
1. Use Google Drive MCP to list files in the Drive folder
2. Match Drive links to actual filenames
3. Replace with local path using the saved/provided directory

**Example transformation:**
- From: `https://drive.google.com/file/d/xxxxx`
- To: `/Images/screenshot-001.png`

Preserve exact filenames including Korean characters, spaces, and special characters.

---

## Step 4: Write qa-list-automated.md

Create the file with this format:

```markdown
# QA List - Open & Reopen Items

Last Updated: [current date/time]
Total Items: [X] (Open: [Y], Reopen: [Z])

| ID | Area | Status | Priority | Image / Video | Explanation | Done |
| :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| [data] | [data] | [data] | [data] | [path] | [data] | [ ] |
```

**Table Formatting Rules:**
- All columns except "Explanation" should be center-aligned (`:---:`)
- "Explanation" column should be left-aligned (`:---`)
- "Done" column contains `[ ]` (unchecked) for all items by default

---

## Step 5: Report Results

After completion, provide a summary:

```
QA List Generated Successfully!

File: qa-list-automated.md
Total Items: [X] (Open: [Y], Reopen: [Z])
Images Linked: [N] files matched

Sources used (saved in source.json):
- Sheets: [link]
- Drive: [link]
- Local Path: [path]

The file is ready for use. All Google Drive links have been replaced with local image references.
```

---

## Output Format

### QA List Generated: {count} Items

**Summary:** Extracted {count} QA items with Open/Reopen status from Google Sheets

#### Statistics
| Metric | Value |
|--------|-------|
| Total Items | {total} |
| Open | {open_count} |
| Reopen | {reopen_count} |
| Images Linked | {image_count} |

#### Configuration
- Sheets: {sheets_link}
- Drive: {drive_link}
- Local: {local_path}

#### Actionable Items
1. [ ] Review qa-list-automated.md for accuracy
2. [ ] Run /pl:qa-plan to create developer tasks

#### Notes
- Configuration saved to source.json for future use
- Use "update sources" to change configuration
