# Requirements: Potenlab Claude Code Marketplace

**Defined:** 2025-01-24
**Core Value:** One command to set up any project with the team's full Claude Code tooling

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Plugin Infrastructure

- [x] **PLUG-01**: Plugin manifest exists with `/pl` namespace and valid structure
- [x] **PLUG-02**: `/pl:help` displays all available commands with descriptions
- [x] **PLUG-03**: `/pl:init` configures project with MCPs, rules, and agents in one command
- [x] **PLUG-04**: Team can install plugin via GitHub link

### Core Extensions

- [x] **EXT-01**: `/pl:review` analyzes code and returns structured feedback
- [x] **EXT-02**: `/pl:refactor` refactors code with clear before/after explanation
- [x] **EXT-03**: `/pl:research <topic>` spawns parallel sub-agents and synthesizes results
- [x] **EXT-04**: `/pl:slice <figma-link>` converts Figma design to code via MCP

### Quality & Workflow

- [x] **QUAL-01**: `/pl:context` shows current token usage and budget status
- [x] **QUAL-02**: All extensions return standardized, summary-format outputs
- [x] **QUAL-03**: `/pl:commit` creates well-formatted commits with context

### Architecture Patterns

- [x] **ARCH-01**: Sub-agents use isolated context windows (200K each)
- [x] **ARCH-02**: Parallel execution uses Task tool with up to 7 concurrent sub-agents
- [x] **ARCH-03**: MCP integration follows token budget guidelines (avoid 40%+ context bloat)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Automation

- **AUTO-01**: PostToolUse hooks for auto-linting
- **AUTO-02**: PreToolUse hooks for validation gates
- **AUTO-03**: Automatic formatting on file writes

### Advanced Features

- **ADV-01**: Extension testing framework
- **ADV-02**: Usage analytics and token tracking
- **ADV-03**: Extension versioning and updates

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Public marketplace | Internal team only, no external users |
| Payments/billing | No monetization needed |
| Web UI | CLI-only, stays in Claude Code |
| Mobile app | Desktop CLI workflow |
| User accounts | Team uses existing GitHub access |
| OAuth login | No auth needed for internal tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLUG-01 | Phase 1 | Complete |
| PLUG-02 | Phase 1 | Complete |
| PLUG-03 | Phase 1 | Complete |
| PLUG-04 | Phase 1 | Complete |
| EXT-01 | Phase 2 | Complete |
| EXT-02 | Phase 2 | Complete |
| EXT-03 | Phase 3 | Complete |
| EXT-04 | Phase 3 | Complete |
| QUAL-01 | Phase 4 | Complete |
| QUAL-02 | Phase 4 | Complete |
| QUAL-03 | Phase 4 | Complete |
| ARCH-01 | Phase 4 | Complete |
| ARCH-02 | Phase 4 | Complete |
| ARCH-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2025-01-24*
*Last updated: 2026-01-24 after Phase 4 completion (v1 complete)*
