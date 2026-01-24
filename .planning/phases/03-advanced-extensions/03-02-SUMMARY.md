---
phase: 03-advanced-extensions
plan: 02
subsystem: skills
tags: [figma, mcp, design-to-code, help]

# Dependency graph
requires:
  - phase: 02-core-extensions
    provides: help skill structure, skill creation patterns
provides:
  - Figma MCP slice skill for design-to-code conversion
  - Complete help command with all 6 plugin commands
affects: [04-testing-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MCP integration pattern for Figma tools
    - 8-step design-to-code workflow

key-files:
  created:
    - skills/slice/SKILL.md
  modified:
    - skills/help/SKILL.md

key-decisions:
  - "Slice skill follows 8-step Figma MCP workflow from official documentation"
  - "No allowed-tools restriction on slice - needs full access for code generation"

patterns-established:
  - "MCP integration pattern: check prerequisites, provide setup instructions, use structured tool sequence"
  - "Help command shows all available commands with argument hints"

# Metrics
duration: 2min
completed: 2026-01-24
---

# Phase 03 Plan 02: Slice Skill and Help Update Summary

**Figma MCP slice skill with 8-step design-to-code workflow and help command updated to show all 6 plugin commands**

## Performance

- **Duration:** 1 min 38 sec
- **Started:** 2026-01-24T07:09:05Z
- **Completed:** 2026-01-24T07:10:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created slice skill with full Figma MCP integration for design-to-code conversion
- Implemented 8-step workflow: parse link, get_design_context, get_screenshot, get_variable_defs, get_code_connect_map, analyze conventions, generate component, report
- Added MCP prerequisites check with setup instructions for both remote and desktop servers
- Updated help command to show all 6 commands (help, init, review, refactor, research, slice)
- Removed "Coming Soon" section from help as all planned commands are now implemented

## Task Commits

Each task was committed atomically:

1. **Task 1: Create slice skill with Figma MCP integration** - `d63f9b0` (feat)
2. **Task 2: Update help command with all 6 commands** - `bce5ba7` (docs)

## Files Created/Modified

- `skills/slice/SKILL.md` - Figma design-to-code skill with MCP integration
- `skills/help/SKILL.md` - Updated to show all 6 available commands

## Decisions Made

- Slice skill follows 8-step Figma MCP workflow as documented in official Figma developer docs
- No allowed-tools restriction on slice skill - needs full tool access for code generation (unlike review which is read-only)
- Structured output format includes design tokens table, component mappings table, and code preview

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 plugin commands now available (help, init, review, refactor, research, slice)
- Slice skill requires Figma MCP to be configured by user before use
- Research skill needs to be created in plan 03-01 for full functionality
- Ready for Phase 4 testing and deployment

---
*Phase: 03-advanced-extensions*
*Completed: 2026-01-24*
