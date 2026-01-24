# Roadmap: Potenlab Claude Code Marketplace

## Overview

This roadmap delivers an internal Claude Code extension ecosystem for Potenlab. We start with plugin infrastructure and simple commands, then build core extensions (`/pl:review`, `/pl:refactor`), advance to complex parallel execution (`/pl:research`) and MCP integration (`/pl:slice`), and finish with quality standards and architecture patterns that ensure maintainability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Plugin manifest, `/pl:help`, `/pl:init`, and GitHub installation
- [x] **Phase 2: Core Extensions** - `/pl:review` and `/pl:refactor` skills with tool restrictions
- [ ] **Phase 3: Advanced Extensions** - `/pl:research` (parallel sub-agents) and `/pl:slice` (Figma MCP)
- [ ] **Phase 4: Quality & Architecture** - Context management, output standards, commit workflow, and sub-agent patterns

## Phase Details

### Phase 1: Foundation
**Goal**: Team can install plugin from GitHub and discover available commands
**Depends on**: Nothing (first phase)
**Requirements**: PLUG-01, PLUG-02, PLUG-03, PLUG-04
**Success Criteria** (what must be TRUE):
  1. Plugin manifest exists at `.claude-plugin/plugin.json` with `/pl` namespace
  2. Running `/pl:help` displays all available commands with descriptions
  3. Running `/pl:init` configures MCPs, rules, and agents in one command
  4. Team member can install plugin via `claude plugin install <github-url>`
**Plans**: 2 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md - Plugin manifest, marketplace catalog, README, and CHANGELOG (Wave 1)
- [x] 01-02-PLAN.md - Help and init commands with installation verification (Wave 2)

### Phase 2: Core Extensions
**Goal**: Team can run code review and refactoring workflows with structured output
**Depends on**: Phase 1
**Requirements**: EXT-01, EXT-02
**Success Criteria** (what must be TRUE):
  1. Running `/pl:review` on a file returns structured feedback with actionable items
  2. `/pl:review` operates in read-only mode (cannot modify files)
  3. Running `/pl:refactor <file>` modifies code and shows before/after explanation
  4. Refactored code is verified by tests before completion
**Plans**: 2 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md - Create review and refactor skills with structured output (Wave 1)
- [x] 02-02-PLAN.md - Update help command and verify plugin structure (Wave 2)

### Phase 3: Advanced Extensions
**Goal**: Team can run parallel research workflows and convert Figma designs to code
**Depends on**: Phase 2
**Requirements**: EXT-03, EXT-04
**Success Criteria** (what must be TRUE):
  1. Running `/pl:research <topic>` spawns parallel sub-agents for different dimensions
  2. Research results are synthesized into a cohesive summary (not raw sub-agent outputs)
  3. Running `/pl:slice <figma-link>` fetches design from Figma via MCP
  4. Figma designs are converted to component code matching team patterns
  5. Each sub-agent returns a summary (not verbose exploration logs)
**Plans**: TBD

Plans:
- [ ] 03-01: Research skill with parallel sub-agent orchestration
- [ ] 03-02: Slice skill with Figma MCP integration

### Phase 4: Quality & Architecture
**Goal**: All extensions follow consistent patterns for context management, output format, and sub-agent isolation
**Depends on**: Phase 3
**Requirements**: QUAL-01, QUAL-02, QUAL-03, ARCH-01, ARCH-02, ARCH-03
**Success Criteria** (what must be TRUE):
  1. Running `/pl:context` displays token usage and budget status
  2. All extension outputs follow a standardized summary format
  3. Running `/pl:commit` creates well-formatted commits with context
  4. Sub-agents use isolated 200K context windows (not main conversation context)
  5. Parallel execution uses Task tool with up to 7 concurrent sub-agents
  6. MCP servers do not consume more than 40% of context (Tool Search enabled)
**Plans**: TBD

Plans:
- [ ] 04-01: Context and commit commands
- [ ] 04-02: Output standardization and sub-agent isolation patterns
- [ ] 04-03: MCP token budget enforcement

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 1.1 -> 2 -> 2.1 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2025-01-24 |
| 2. Core Extensions | 2/2 | Complete | 2025-01-24 |
| 3. Advanced Extensions | 0/2 | Not started | - |
| 4. Quality & Architecture | 0/3 | Not started | - |

---
*Roadmap created: 2025-01-24*
*Last updated: 2025-01-24*
