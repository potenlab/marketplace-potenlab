# Requirements: Potenlab Claude Code Marketplace

**Defined:** 2025-01-24
**Core Value:** One command to set up any project with the team's full Claude Code tooling

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Plugin Infrastructure

- [ ] **PLUG-01**: Plugin manifest exists with `/pl` namespace and valid structure
- [ ] **PLUG-02**: `/pl:help` displays all available commands with descriptions
- [ ] **PLUG-03**: `/pl:init` configures project with MCPs, rules, and agents in one command
- [ ] **PLUG-04**: Team can install plugin via GitHub link

### Core Extensions

- [ ] **EXT-01**: `/pl:review` analyzes code and returns structured feedback
- [ ] **EXT-02**: `/pl:refactor` refactors code with clear before/after explanation
- [ ] **EXT-03**: `/pl:research <topic>` spawns parallel sub-agents and synthesizes results
- [ ] **EXT-04**: `/pl:slice <figma-link>` converts Figma design to code via MCP

### Quality & Workflow

- [ ] **QUAL-01**: `/pl:context` shows current token usage and budget status
- [ ] **QUAL-02**: All extensions return standardized, summary-format outputs
- [ ] **QUAL-03**: `/pl:commit` creates well-formatted commits with context

### Architecture Patterns

- [ ] **ARCH-01**: Sub-agents use isolated context windows (200K each)
- [ ] **ARCH-02**: Parallel execution uses Task tool with up to 7 concurrent sub-agents
- [ ] **ARCH-03**: MCP integration follows token budget guidelines (avoid 40%+ context bloat)

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
| PLUG-01 | Phase 1 | Pending |
| PLUG-02 | Phase 1 | Pending |
| PLUG-03 | Phase 1 | Pending |
| PLUG-04 | Phase 1 | Pending |
| EXT-01 | Phase 2 | Pending |
| EXT-02 | Phase 2 | Pending |
| EXT-03 | Phase 3 | Pending |
| EXT-04 | Phase 3 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |
| ARCH-01 | Phase 4 | Pending |
| ARCH-02 | Phase 4 | Pending |
| ARCH-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2025-01-24*
*Last updated: 2025-01-24 after roadmap creation*
