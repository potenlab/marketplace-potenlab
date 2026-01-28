---
description: Generate QA list from Google Sheets with local image tags. Extracts Open/Reopen items and replaces Drive links with local paths.
allowed-tools: Read, Write, Task
---

# QA List Command

This file enables the `/pl:qa-list` slash command in Claude Code.

The command generates a complete QA tracking document from Google Sheets:
- First run: Collects and saves configuration to `source.json`
- Subsequent runs: Uses saved configuration automatically
- Extracts only Open/Reopen status items
- Replaces Google Drive links with local image paths

Usage:
```
/pl:qa-list                # Generate QA list using saved or new config
/pl:qa-list update sources # Update the saved configuration
```

Requires:
- Google Sheets link (QA tracking data)
- Google Drive link (image/video files)
- Local image path (where images are stored)

See `skills/qa-list/SKILL.md` for the full skill definition.
