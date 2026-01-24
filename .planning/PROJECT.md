# Potenlab Claude Code Marketplace

## What This Is

An internal Claude Code extension ecosystem for Potenlab's team. Provides one-command project setup with MCPs, rules, and agents pre-configured, plus a library of `/pl:*` commands that leverage Claude Code's full feature set — skills, sub-agents, parallel execution, and MCP integrations.

## Core Value

One command to set up any project with the team's full Claude Code tooling — no more manually configuring MCPs, rules, and agents for each project.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Marketplace infrastructure that installs extensions from GitHub into Claude Code
- [ ] One-command project setup (`/pl:init` or similar)
- [ ] `/pl:help` — discover all available features and usage
- [ ] `/pl:slice <figma-link>` — Figma to code with MCP integration
- [ ] `/pl:review` — code review agent
- [ ] `/pl:refactor` — refactoring agent
- [ ] `/pl:research` — parallel sub-agent research workflow
- [ ] Sophisticated agent architecture leveraging Claude Code features (parallel sub-agents, context management)

### Out of Scope

- Public marketplace — internal team only
- Payments/billing — no monetization needed
- User accounts for external users — team uses existing GitHub access
- Mobile app — CLI-only

## Context

The team currently sets up MCP servers, rules, and agents manually for each new project. This is tedious and error-prone. The goal is a unified ecosystem that:
- New team members can install instantly
- Everyone can contribute improvements
- Improvements benefit the whole team automatically

Team works heavily with Figma → code workflows and wants to maximize Claude Code's capabilities for parallel research, code review, and refactoring.

## Constraints

- **Hosting**: Extensions stored on GitHub
- **Integration**: Must work directly in Claude Code (not a separate web UI)
- **Namespace**: All commands prefixed with `/pl:*`
- **Team size**: Small team (2-5 people), everyone contributes
- **Research required**: Deep dive into Claude Code docs (code.claude.com) to understand optimal agent architectures

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `/pl:*` namespace | Short but still branded, easy to type | — Pending |
| Internal-only | Small team, no need for public marketplace complexity | — Pending |
| GitHub-hosted | Team already uses GitHub, simple distribution | — Pending |

---
*Last updated: 2025-01-24 after initialization*
