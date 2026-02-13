#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const PACKAGE = 'potenlab-workflow';
const VERSION = require('../plugins/potenlab-workflow/.claude-plugin/plugin.json').version;

const COMMANDS_DIR = 'commands/potenlab';
const AGENTS_DIR = 'agents';
const DATA_DIR = 'potenlab-workflow';

const AGENT_PREFIX = 'potenlab-';

// Agent names (without prefix) — these are the filenames in plugins/potenlab-workflow/agents/
const AGENT_NAMES = [
  'ui-ux-specialist',
  'tech-lead-specialist',
  'frontend-specialist',
  'backend-specialist',
  'progress-creator',
  'high-coder',
  'small-coder',
  'qa-specialist',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(msg);
}

function logStep(msg) {
  console.log(`  → ${msg}`);
}

function logError(msg) {
  console.error(`\x1b[31m✗ ${msg}\x1b[0m`);
}

function logSuccess(msg) {
  console.log(`\x1b[32m✓ ${msg}\x1b[0m`);
}

function logWarn(msg) {
  console.log(`\x1b[33m! ${msg}\x1b[0m`);
}

/**
 * Recursively copy a directory
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively delete a directory
 */
function rmDirSync(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Delete files matching a glob-like prefix in a directory
 */
function deleteFilesWithPrefix(dir, prefix) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry.startsWith(prefix)) {
      fs.unlinkSync(path.join(dir, entry));
      count++;
    }
  }
  return count;
}

/**
 * Recursively process all .md files in a directory, applying a transform function
 */
function processMarkdownFiles(dir, transformFn) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += processMarkdownFiles(fullPath, transformFn);
    } else if (entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const transformed = transformFn(content);
      if (transformed !== content) {
        fs.writeFileSync(fullPath, transformed, 'utf8');
        count++;
      }
    }
  }
  return count;
}

/**
 * Replace {{POTENLAB_HOME}} placeholder with actual path
 */
function replacePlaceholders(content, potenHome) {
  return content.replace(/\{\{POTENLAB_HOME\}\}/g, potenHome);
}

/**
 * Prefix agent names in content:
 *   subagent_type: ui-ux-specialist → subagent_type: potenlab-ui-ux-specialist
 *   agent references in text
 */
function prefixAgentNames(content) {
  let result = content;
  for (const name of AGENT_NAMES) {
    const prefixed = AGENT_PREFIX + name;
    // Skip if already prefixed
    // subagent_type references
    result = result.replace(
      new RegExp(`(subagent_type:\\s*)${escapeRegex(name)}`, 'g'),
      `$1${prefixed}`
    );
    // name: in frontmatter (agent files)
    result = result.replace(
      new RegExp(`^(name:\\s*)${escapeRegex(name)}$`, 'gm'),
      `$1${prefixed}`
    );
  }
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Resolve paths ───────────────────────────────────────────────────────────

function resolveTarget(isLocal) {
  if (isLocal) {
    return path.resolve(process.cwd(), '.claude');
  }
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) {
    logError('Cannot determine home directory.');
    process.exit(1);
  }
  return path.join(home, '.claude');
}

function resolvePluginRoot() {
  // When run via npx, __dirname is the bin/ folder inside the package
  return path.resolve(__dirname, '..', 'plugins', 'potenlab-workflow');
}

// ─── Install ─────────────────────────────────────────────────────────────────

function install(targetBase, isLocal) {
  const pluginRoot = resolvePluginRoot();
  const scopeLabel = isLocal ? 'local (.claude/)' : `global (~/.claude/)`;

  log('');
  log(`\x1b[1m${PACKAGE} v${VERSION}\x1b[0m — Installing to ${scopeLabel}`);
  log('');

  // Verify source exists
  if (!fs.existsSync(pluginRoot)) {
    logError(`Plugin source not found at: ${pluginRoot}`);
    process.exit(1);
  }

  // ── Step 1: Clean old installation ──────────────────────────────────────

  logStep('Cleaning previous installation...');

  const commandsTarget = path.join(targetBase, COMMANDS_DIR);
  rmDirSync(commandsTarget);

  const agentsTarget = path.join(targetBase, AGENTS_DIR);
  const deletedAgents = deleteFilesWithPrefix(agentsTarget, AGENT_PREFIX);

  const dataTarget = path.join(targetBase, DATA_DIR);
  rmDirSync(dataTarget);

  // ── Step 2: Copy commands ───────────────────────────────────────────────

  logStep('Installing commands...');

  const commandsSrc = path.join(pluginRoot, 'commands');
  fs.mkdirSync(commandsTarget, { recursive: true });

  const commandFiles = fs.readdirSync(commandsSrc).filter(f => f.endsWith('.md'));
  for (const file of commandFiles) {
    fs.copyFileSync(path.join(commandsSrc, file), path.join(commandsTarget, file));
  }
  logSuccess(`${commandFiles.length} commands installed`);

  // ── Step 3: Copy agents ─────────────────────────────────────────────────

  logStep('Installing agents...');

  const agentsSrc = path.join(pluginRoot, 'agents');
  fs.mkdirSync(agentsTarget, { recursive: true });

  const agentFiles = fs.readdirSync(agentsSrc).filter(f => f.endsWith('.md'));
  let agentCount = 0;
  for (const file of agentFiles) {
    const baseName = file.replace('.md', '');
    const destName = AGENT_PREFIX + file;
    fs.copyFileSync(path.join(agentsSrc, file), path.join(agentsTarget, destName));
    agentCount++;
  }
  logSuccess(`${agentCount} agents installed`);

  // ── Step 4: Copy rules and references ───────────────────────────────────

  logStep('Installing rules and references...');

  fs.mkdirSync(dataTarget, { recursive: true });

  const rulesSrc = path.join(pluginRoot, 'rules');
  if (fs.existsSync(rulesSrc)) {
    copyDirSync(rulesSrc, path.join(dataTarget, 'rules'));
  }

  const refsSrc = path.join(pluginRoot, 'references');
  if (fs.existsSync(refsSrc)) {
    copyDirSync(refsSrc, path.join(dataTarget, 'references'));
  }

  const rulesCount = fs.existsSync(rulesSrc) ? fs.readdirSync(rulesSrc).length : 0;
  const refsCount = fs.existsSync(refsSrc) ? fs.readdirSync(refsSrc).length : 0;
  logSuccess(`${rulesCount} rules + ${refsCount} references installed`);

  // ── Step 5: Copy CLAUDE.md ──────────────────────────────────────────────

  logStep('Installing CLAUDE.md...');

  const claudeSrc = path.join(pluginRoot, 'CLAUDE.md');
  if (fs.existsSync(claudeSrc)) {
    fs.copyFileSync(claudeSrc, path.join(dataTarget, 'CLAUDE.md'));
    logSuccess('CLAUDE.md installed');
  } else {
    logWarn('CLAUDE.md not found in plugin source');
  }

  // ── Step 6: Write VERSION file ──────────────────────────────────────────

  logStep('Writing VERSION file...');

  fs.writeFileSync(path.join(dataTarget, 'VERSION'), VERSION, 'utf8');
  logSuccess(`VERSION ${VERSION}`);

  // ── Step 7: Replace {{POTENLAB_HOME}} placeholder ───────────────────────

  logStep('Resolving path placeholders...');

  const potenHome = path.join(targetBase, DATA_DIR);

  let placeholderCount = 0;
  placeholderCount += processMarkdownFiles(commandsTarget, (content) =>
    replacePlaceholders(content, potenHome)
  );
  placeholderCount += processMarkdownFiles(agentsTarget, (content) => {
    // Only process potenlab-prefixed agent files
    return replacePlaceholders(content, potenHome);
  });
  placeholderCount += processMarkdownFiles(dataTarget, (content) =>
    replacePlaceholders(content, potenHome)
  );

  logSuccess(`${placeholderCount} files updated with resolved paths`);

  // ── Step 8: Prefix agent names ──────────────────────────────────────────

  logStep('Prefixing agent names...');

  let prefixCount = 0;

  // Prefix in agent files (the frontmatter name:)
  for (const file of agentFiles) {
    const destPath = path.join(agentsTarget, AGENT_PREFIX + file);
    const content = fs.readFileSync(destPath, 'utf8');
    const transformed = prefixAgentNames(content);
    if (transformed !== content) {
      fs.writeFileSync(destPath, transformed, 'utf8');
      prefixCount++;
    }
  }

  // Prefix in command files (subagent_type references)
  prefixCount += processMarkdownFiles(commandsTarget, prefixAgentNames);

  // Prefix in data files (CLAUDE.md agent references)
  prefixCount += processMarkdownFiles(dataTarget, prefixAgentNames);

  logSuccess(`${prefixCount} files updated with agent name prefixes`);

  // ── Summary ─────────────────────────────────────────────────────────────

  log('');
  log(`\x1b[1m\x1b[32m✓ ${PACKAGE} v${VERSION} installed successfully!\x1b[0m`);
  log('');
  log('  Installed to:');
  log(`    Commands:   ${commandsTarget}/ (${commandFiles.length} files)`);
  log(`    Agents:     ${agentsTarget}/${AGENT_PREFIX}*.md (${agentCount} files)`);
  log(`    Data:       ${dataTarget}/ (rules, references, CLAUDE.md)`);
  log('');
  log('  Quick start:');
  log('    /potenlab:hello          — Verify installation');
  log('    /potenlab:info           — See all commands');
  log('    /potenlab:plan-project   — Start planning from a PRD');
  log('');
}

// ─── Uninstall ───────────────────────────────────────────────────────────────

function uninstall(targetBase) {
  log('');
  log(`\x1b[1m${PACKAGE}\x1b[0m — Uninstalling...`);
  log('');

  // 1. Delete commands/potenlab/
  const commandsTarget = path.join(targetBase, COMMANDS_DIR);
  if (fs.existsSync(commandsTarget)) {
    const count = fs.readdirSync(commandsTarget).length;
    rmDirSync(commandsTarget);
    logSuccess(`Removed ${count} commands from ${COMMANDS_DIR}/`);
  } else {
    logWarn(`${COMMANDS_DIR}/ not found — skipped`);
  }

  // 2. Delete agents/potenlab-*.md only
  const agentsTarget = path.join(targetBase, AGENTS_DIR);
  const deletedAgents = deleteFilesWithPrefix(agentsTarget, AGENT_PREFIX);
  if (deletedAgents > 0) {
    logSuccess(`Removed ${deletedAgents} agent files (${AGENT_PREFIX}*.md)`);
  } else {
    logWarn(`No ${AGENT_PREFIX}*.md agent files found — skipped`);
  }

  // 3. Delete potenlab-workflow/ data
  const dataTarget = path.join(targetBase, DATA_DIR);
  if (fs.existsSync(dataTarget)) {
    rmDirSync(dataTarget);
    logSuccess(`Removed ${DATA_DIR}/ (rules, references, CLAUDE.md, VERSION)`);
  } else {
    logWarn(`${DATA_DIR}/ not found — skipped`);
  }

  log('');
  log(`\x1b[1m\x1b[32m✓ ${PACKAGE} uninstalled.\x1b[0m`);
  log('');
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  const isUninstall = args.includes('--uninstall');
  const isLocal = args.includes('--local') || args.includes('-l');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    log('');
    log(`\x1b[1m${PACKAGE} v${VERSION}\x1b[0m`);
    log('');
    log('Usage:');
    log('  npx potenlab-workflow              Install globally to ~/.claude/');
    log('  npx potenlab-workflow --local      Install to ./.claude/ (project)');
    log('  npx potenlab-workflow --uninstall  Remove all potenlab files');
    log('  npx potenlab-workflow --help       Show this help');
    log('');
    log('Aliases:');
    log('  -l   --local');
    log('  -h   --help');
    log('');
    process.exit(0);
  }

  const targetBase = resolveTarget(isLocal);

  if (isUninstall) {
    uninstall(targetBase);
  } else {
    install(targetBase, isLocal);
  }
}

main();
