---
name: init-project
description: Initialize project with PRD and checkpoints. Use for "init project", "new project", "start project".
argument-hint: "[project description]"
disable-model-invocation: true
user-invocable: true
---

# Project Initializer

Create PRD and checkpoints through interactive questions.

## What Gets Created

```
.planning/
├── PRD.md           # Requirements + features
└── CHECKPOINTS.md   # Progress tracker
```

## Flow

```
/init-project → Interactive Questions → PRD → Checkpoints → Auto-start CP1
```

---

## Step 1: Verify MCP

Check connections silently:
```
mcp__supabase__list_projects
mcp__shadcn__list_shadcn_components
```

Show status:
```
MCP servers connected:
- Supabase: Connected (project: "xxx")
- shadcn/ui: Connected (59 components)
```

If not connected, warn and stop.

---

## Step 2: Interactive Discovery

Use `AskUserQuestion` for EACH question with smart suggestions.

### Question 1: Project Type

```
AskUserQuestion:
  question: "What type of app are you building?"
  header: "App Type"
  options:
    - label: "SaaS / Dashboard"
      description: "Admin panels, analytics, user management"
    - label: "E-commerce"
      description: "Product listings, cart, checkout"
    - label: "Social / Community"
      description: "Posts, comments, user profiles"
    - label: "Productivity / Tools"
      description: "Task management, notes, utilities"
```

### Question 2: Project Name

Based on app type, suggest names:

```
AskUserQuestion:
  question: "What's your project name?"
  header: "Name"
  options:
    # If SaaS:
    - label: "AdminHub"
      description: "Dashboard and admin panel"
    - label: "MetricFlow"
      description: "Analytics and metrics"
    # If E-commerce:
    - label: "ShopBase"
      description: "Online store"
    - label: "CartFlow"
      description: "Shopping platform"
    # If Productivity:
    - label: "TaskFlow"
      description: "Task management"
    - label: "NoteSpace"
      description: "Notes and docs"
    # Always include Other for custom input
```

### Question 3: Core Problem

```
AskUserQuestion:
  question: "What problem does this solve?"
  header: "Problem"
  options:
    # Based on app type, suggest common problems:
    # If SaaS:
    - label: "Track and manage user data"
      description: "CRUD operations, user management"
    - label: "Visualize metrics and analytics"
      description: "Charts, reports, dashboards"
    # If E-commerce:
    - label: "Sell products online"
      description: "Product catalog, checkout flow"
    - label: "Manage inventory"
      description: "Stock tracking, orders"
    # If Productivity:
    - label: "Organize tasks and projects"
      description: "Todo lists, project boards"
    - label: "Take and organize notes"
      description: "Note-taking, knowledge base"
```

### Question 4: MVP Features

```
AskUserQuestion:
  question: "Select MVP features (pick 3-4)"
  header: "Features"
  multiSelect: true
  options:
    # Based on app type, suggest relevant features:
    # If SaaS/Dashboard:
    - label: "User authentication"
      description: "Login, signup, profile"
    - label: "Dashboard overview"
      description: "Stats, charts, summary"
    - label: "Data management (CRUD)"
      description: "Create, read, update, delete"
    - label: "Search & filters"
      description: "Find and filter data"

    # If E-commerce:
    - label: "Product catalog"
      description: "List and view products"
    - label: "Shopping cart"
      description: "Add to cart, manage items"
    - label: "Checkout flow"
      description: "Payment, order confirmation"
    - label: "Order history"
      description: "View past orders"

    # If Productivity:
    - label: "Task CRUD"
      description: "Create, edit, delete tasks"
    - label: "Categories/Projects"
      description: "Organize items"
    - label: "Due dates & reminders"
      description: "Time-based features"
    - label: "Search & filters"
      description: "Find items quickly"
```

---

## Step 3: Confirm Before Creating

Show summary and ask confirmation:

```
## Project Summary

**Name**: TaskFlow
**Type**: Productivity / Tools
**Problem**: Organize tasks and projects

**MVP Features**:
1. User authentication
2. Task CRUD
3. Categories/Projects
4. Search & filters

**Checkpoints** (auto-generated):
- CP1: Database & Auth (3 tasks)
- CP2: Core Features (4 tasks)
- CP3: Polish & Deploy (3 tasks)

Create project files?
```

```
AskUserQuestion:
  question: "Create project with these settings?"
  header: "Confirm"
  options:
    - label: "Yes, create project"
      description: "Generate PRD and checkpoints, start CP1"
    - label: "Change features"
      description: "Go back and modify feature selection"
    - label: "Start over"
      description: "Begin from app type selection"
```

---

## Step 4: Generate PRD

Write `.planning/PRD.md` with collected info:

```markdown
# [Name] - PRD

## Overview
- **Project**: [name]
- **Type**: [type]
- **Created**: [date]
- **Status**: In Progress

## Problem
[selected problem]

## Target User
[inferred from type]

## MVP Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | [feature] | [description] | P0 |
| F2 | [feature] | [description] | P0 |
| F3 | [feature] | [description] | P1 |
| F4 | [feature] | [description] | P1 |

## Tech Stack
- Framework: Next.js 16
- Styling: Tailwind CSS v4
- UI: shadcn/ui
- Backend: Supabase
- Forms: react-hook-form + zod
```

---

## Step 5: Generate Checkpoints

Auto-generate checkpoints based on features:

**Pattern**:
- CP1: Database + Auth (always first)
- CP2: Core features (main functionality)
- CP3: Polish + Deploy (always last)

```markdown
# Project Checkpoints

## Status
- **Project**: [name]
- **Progress**: 0/3 checkpoints
- **Current**: CP1

---

## CP1: Database & Auth ⬜
> Setup foundation

- [ ] Create database tables with RLS
- [ ] Setup authentication flow
- [ ] Generate TypeScript types

**Done when**: User can sign up, login, and data is secure

---

## CP2: Core Features ⬜
> Build main functionality

- [ ] [Feature 1 - main task]
- [ ] [Feature 2 - main task]
- [ ] [Feature 3 - main task]
- [ ] [Feature 4 - main task]

**Done when**: All MVP features working

---

## CP3: Polish & Deploy ⬜
> Final touches

- [ ] Add loading & error states
- [ ] Mobile responsive check
- [ ] Deploy to Vercel

**Done when**: App is production-ready
```

---

## Step 6: Confirm & Auto-Start

```
✅ Project initialized!

Created:
├── .planning/PRD.md
└── .planning/CHECKPOINTS.md

Checkpoints:
1. CP1: Database & Auth (3 tasks)
2. CP2: Core Features (4 tasks)
3. CP3: Polish & Deploy (3 tasks)

Starting CP1 automatically...
```

**Immediately execute `/checkpoint start CP1`**.

---

## Smart Suggestions by App Type

### SaaS / Dashboard
```
Features: Auth, Dashboard, CRUD, Reports, Settings
CP1: DB + Auth
CP2: Dashboard + CRUD
CP3: Reports + Polish
```

### E-commerce
```
Features: Auth, Products, Cart, Checkout, Orders
CP1: DB + Auth + Products schema
CP2: Product listing + Cart + Checkout
CP3: Orders + Polish
```

### Social / Community
```
Features: Auth, Posts, Comments, Profiles, Feed
CP1: DB + Auth + Profiles
CP2: Posts + Comments + Feed
CP3: Notifications + Polish
```

### Productivity
```
Features: Auth, Items CRUD, Categories, Search
CP1: DB + Auth
CP2: Items + Categories + Search
CP3: Polish + Deploy
```

---

## Rules

1. **Always use AskUserQuestion** - never ask user to fill blank form
2. **Provide smart suggestions** based on app type
3. **Multi-select for features** - let user pick multiple
4. **Confirm before creating** - show summary first
5. **Auto-start CP1** after creation
6. **3 checkpoints max** for MVP
