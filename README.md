# Potenlab Claude Code Plugin Marketplace

Official plugin marketplace for Claude Code by Potenlab.

## Quick Start

```bash
# Register the marketplace
claude /plugin marketplace add https://github.com/potenlab/marketplace-potenlab

# Verify installation
claude /potenlab-starter:hello
```

## Plugins

| Plugin | Description | Version |
|--------|-------------|---------|
| `potenlab-starter` | Starter plugin to validate marketplace installation | 0.1.0 |

## Local Development

Test a plugin locally:

```bash
claude --plugin-dir ./plugins/potenlab-starter
```

## Structure

```
marketplace-potenlab/
├── .claude-plugin/marketplace.json   # Marketplace catalog
├── plugins/
│   └── potenlab-starter/             # Starter plugin
│       ├── .claude-plugin/plugin.json
│       ├── commands/hello.md
│       └── skills/info/SKILL.md
├── CLAUDE.md
└── README.md
```

## License

MIT
