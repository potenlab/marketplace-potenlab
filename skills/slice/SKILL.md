---
name: slice
description: Convert Figma design to component code using MCP integration. Provide a Figma frame link.
disable-model-invocation: true
argument-hint: <figma-link>
---

# Figma to Code

Convert a Figma design to component code matching this project's patterns.

## Target

Figma Link: $ARGUMENTS

If no link provided, ask the user for the Figma frame link.

## Prerequisites Check

First, verify Figma MCP is available by checking for figma MCP tools.

If Figma MCP is not configured, provide setup instructions:

```
Figma MCP is not configured. To set it up:

Remote server (recommended):
1. Run: claude mcp add --transport http figma https://mcp.figma.com/mcp
2. Authenticate when prompted
3. Try /pl:slice again

Desktop server (alternative):
1. Open Figma desktop app
2. Toggle to Dev Mode (Shift+D)
3. Enable desktop MCP server in inspect panel
4. Run: claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

## Workflow

Follow this exact sequence:

### Step 1: Parse Figma Link

Extract the node-id from the URL:
- Format: `figma.com/design/:fileKey/:fileName?node-id=X-Y`
- Node ID format: Convert `X-Y` to `X:Y`
- Branch URLs: `figma.com/design/:fileKey/branch/:branchKey/:fileName` - use branchKey as fileKey

### Step 2: Get Design Context

Call `get_design_context` with the node-id.
- This returns the structured design representation
- Default output: React + Tailwind

### Step 3: Get Visual Reference

Call `get_screenshot` for the same node.
- Preserves layout fidelity
- Helps with spacing and alignment decisions

### Step 4: Get Design Tokens

Call `get_variable_defs` for the node.
- Extracts colors, spacing, typography
- Map to project's token system

### Step 5: Check Code Connect

Call `get_code_connect_map` to find existing mappings.
- Identifies reusable components
- Prevents duplicating existing work

### Step 6: Analyze Project Conventions

Before generating code:
- Scan `src/components/` for patterns
- Identify styling approach (Tailwind, CSS modules, styled-components)
- Note naming conventions (PascalCase, kebab-case)
- Check for UI library (shadcn, MUI, etc.)
- Check `package.json` for framework (React, Vue, Svelte)

### Step 7: Generate Component

Transform Figma output to match project:
- Reuse mapped components from Code Connect
- Apply project's token names
- Follow project's file organization
- Match styling approach

### Step 8: Report

## Output Format

### Component Generated

**File:** `[path/to/Component.tsx]`

**Based on:** [Figma frame name]

#### Design Tokens Used

| Token Type | Figma Value | Project Token |
|------------|-------------|---------------|
| Color | #XXXXXX | var(--color-x) |
| Spacing | Xpx | spacing.x |
| Typography | [font spec] | text-x |

#### Component Mappings

| Figma Component | Code Component | Source |
|-----------------|----------------|--------|
| [name] | `<Component />` | src/components/x |

#### Generated Code Preview

```tsx
// [code preview]
```

#### Notes

- [Any adjustments needed]
- [Project-specific considerations]

## Important

- This skill requires Figma MCP to be configured
- Generated code follows project conventions, not Figma defaults
- Review generated code for project-specific adjustments
