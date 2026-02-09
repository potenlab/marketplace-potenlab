# Potenlab Marketplace — Project Conventions

## Repository Purpose

This is the official Potenlab Claude Code plugin marketplace. It hosts plugins that extend Claude Code functionality.

## Structure

- `.claude-plugin/marketplace.json` — Marketplace catalog (entry point)
- `plugins/<name>/` — Each plugin lives in its own directory
- `plugins/<name>/.claude-plugin/plugin.json` — Plugin metadata
- `plugins/<name>/commands/` — Slash commands (`.md` files)
- `plugins/<name>/skills/` — Skills (directories with `SKILL.md`)
- `reference/` — Personal reference material, NOT part of the plugin system. Ignore this folder.

## Rules

- Every plugin MUST have a `.claude-plugin/plugin.json` with name, version, and description.
- Every new plugin MUST be registered in `.claude-plugin/marketplace.json` under the `plugins` array.
- Commands are markdown files in `commands/` — filename becomes the command name.
- Skills are directories under `skills/` containing a `SKILL.md`.
- Do not modify files in `reference/`. It is not part of the marketplace.
