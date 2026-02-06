<purpose>
Complete the Potenlab project with full UAT verification and milestone closure.

This workflow:
1. Validates all phases were executed
2. Extracts features to verify from REQUIREMENTS.md and ROADMAP.md
3. Runs /gsd:verify-work for interactive UAT
4. Fixes any failures with retry logic
5. Completes milestone via /gsd:complete-milestone
6. Updates CLAUDE.md with final project status
</purpose>

<state_validation>

**Required state before completion:**

| Check | How to Verify | If Failed |
|-------|---------------|-----------|
| All phases executed | STATE.md shows no "pending" phases | Run /potenlab:execute-project |
| No phase in progress | STATE.md has no "in_progress" | Wait for current execution |
| Milestone active | STATE.md has current milestone | Run /gsd:new-milestone |
| Code committed | `git status` is clean | Commit pending changes |

**Validation sequence:**

```bash
# 1. Check STATE.md exists
[ -f ".planning/STATE.md" ] || exit 1

# 2. Check for pending phases
grep -c "status: pending" .planning/STATE.md && echo "WARN: Pending phases"

# 3. Check for in-progress
grep -c "status: in_progress" .planning/STATE.md && echo "WARN: Phase in progress"

# 4. Check git status
[ -z "$(git status --porcelain)" ] || echo "WARN: Uncommitted changes"
```

**Bypass options:**

If user insists on completing despite warnings:
- Document incomplete items in CLAUDE.md
- Mark as "partial completion"
- Note which phases were skipped

</state_validation>

<feature_extraction>

**Sources for verification checklist:**

### From REQUIREMENTS.md:

Extract user stories and requirements:
```
## User Stories

As a [user], I want to [action] so that [benefit]
```

Convert each to verification item:
```
Feature: [action]
Acceptance: [benefit achieved]
```

### From ROADMAP.md:

Extract phase deliverables:
```
## Phase N: [Name]

**Deliverables:**
- [Deliverable 1]
- [Deliverable 2]
```

### From Phase CONTEXT.md files:

Extract implementation decisions that affect behavior:
```
.planning/phases/[XX-name]/[XX]-CONTEXT.md
```

**Verification item format:**

```typescript
interface VerificationItem {
  id: string;              // e.g., "REQ-001", "PH2-D1"
  name: string;            // Feature name
  description: string;     // What to verify
  source: string;          // REQUIREMENTS.md, Phase 2, etc.
  phase: number;           // Which phase implemented it
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  failureReason?: string;  // If failed
  fixAttempts: number;     // How many fix attempts
}
```

**Priority assignment:**

| Criteria | Priority |
|----------|----------|
| Core user flow (auth, main action) | Critical |
| Primary features | High |
| Secondary features | Medium |
| Nice-to-have, polish | Low |

</feature_extraction>

<verification_process>

**How /gsd:verify-work operates:**

1. **Interactive walkthrough** — Guides user through each feature
2. **User confirms** — "Does this work?" Yes/No
3. **Records results** — Builds verification report
4. **Identifies gaps** — Notes what's missing

**Our role in verification:**

Before calling verify-work:
- Prepare the feature list
- Group by phase for logical flow
- Note any known issues

After verify-work:
- Parse the verification results
- Identify failures needing fixes
- Prioritize fix order

**Verification output format:**

verify-work typically produces a report like:
```
## Verification Report

### Passed
- [x] Feature A
- [x] Feature B

### Failed
- [ ] Feature C — [reason]
- [ ] Feature D — [reason]

### Skipped
- [ ] Feature E — User skipped
```

</verification_process>

<fix_workflow>

**Fix attempt procedure:**

```
┌─────────────────────────────────────────────────────┐
│ FIX ATTEMPT [N] for [Feature]                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Analyze failure                                │
│     └─ Read relevant code                          │
│     └─ Understand user's issue                     │
│     └─ Identify root cause                         │
│                                                     │
│  2. Implement fix                                  │
│     └─ Make minimal targeted change                │
│     └─ Avoid scope creep                           │
│     └─ Don't break other features                  │
│                                                     │
│  3. Test locally (if possible)                     │
│     └─ Quick sanity check                          │
│     └─ Verify fix addresses issue                  │
│                                                     │
│  4. Commit fix                                     │
│     └─ Atomic commit for this fix only             │
│     └─ Reference the feature/issue                 │
│                                                     │
│  5. User re-verifies                               │
│     └─ Ask if feature now works                    │
│     └─ If yes → mark passed                        │
│     └─ If no → attempt again (max 3)               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Fix commit message format:**

```
fix([scope]): [brief description]

Resolves UAT failure for [feature name].

Issue: [what was wrong]
Fix: [what we changed]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Fix attempt tracking:**

Track in memory during session:

```typescript
interface FixAttempt {
  feature: string;
  attempt: number;
  filesChanged: string[];
  commitSha: string;
  result: 'success' | 'failed' | 'skipped';
  userFeedback?: string;
}
```

**Max attempts:**

- Default: 3 attempts per feature
- After max attempts: Mark as "needs manual review"
- Don't block completion for stuck issues

**Fix prioritization:**

Fix in order:
1. Critical issues first (app-breaking)
2. High priority (core features)
3. Medium (if time permits)
4. Low (document as known issues)

</fix_workflow>

<milestone_completion>

**Pre-completion checklist:**

Before calling /gsd:complete-milestone:

- [ ] All critical/high features pass or are documented
- [ ] Fix commits are clean and pushed
- [ ] No uncommitted changes
- [ ] STATE.md reflects current status

**What complete-milestone does:**

1. Archives current milestone artifacts
2. Moves `.planning/phases/` to `.planning/archive/[version]/`
3. Updates STATE.md with completion
4. Prepares for next milestone (if any)
5. May create release notes

**Post-completion:**

After milestone completes:
- Verify archive was created
- Update CLAUDE.md with final status
- Display next steps to user

</milestone_completion>

<claude_md_completion>

**Final CLAUDE.md structure:**

```markdown
# Project Context for AI

> This file maintains project context across conversation sessions.
> Updated automatically by `/potenlab:complete-project`.

## Project Overview

- **Project**: [Name]
- **Description**: [Description]
- **Started**: [Start date]
- **Completed**: [Completion date] ✓
- **Status**: Complete

## Project Completion

- **Milestone**: v1.0 (or milestone name)
- **Completed**: [YYYY-MM-DD]
- **Total Phases**: [N]
- **UAT Status**: All Passed / [N] Known Issues

### Verification Summary

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✓ Passed | Clerk integration |
| Dashboard | ✓ Passed | - |
| Data Export | ⚠ Known Issue | Edge case with large files |

### Fixes Applied During Completion

| Feature | Issue | Fix | Commit |
|---------|-------|-----|--------|
| Login redirect | Wrong URL | Fixed callback path | abc123 |

## Tech Stack Configuration

[Previous content preserved]

## Completed Phases

| Phase | Name | Completed | Key Outputs |
|-------|------|-----------|-------------|
| 1 | Setup | [Date] | Project structure |
| 2 | Auth | [Date] | Clerk integration |
| ... | ... | ... | ... |

## Active Configuration Notes

[Previous content preserved]

## MCP Servers in Use

[Previous content preserved]

## Key File Locations

[Previous content preserved - may be updated]

## Project Patterns

[Previous content preserved]

## Known Issues / Future Work

[If any features had known issues]

- [ ] Data export edge case with large files
- [ ] [Other documented issues]

---

*Last updated: [YYYY-MM-DD HH:MM] — Project Complete*
```

</claude_md_completion>

<output_formats>

**Starting completion:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PROJECT COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Project Name]

Phases executed: [N]
Features to verify: [M]

Starting UAT verification...
```

**UAT progress:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UAT VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Progress: [X]/[N] features verified

✓ [Feature 1] — Passed
✓ [Feature 2] — Passed
✗ [Feature 3] — Failed: [reason]
▶ [Feature 4] — Verifying...
```

**Failures detected:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚠ UAT FAILURES: [N] issues found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical:
  ✗ [Feature] — [Issue]

High:
  ✗ [Feature] — [Issue]

Medium:
  ✗ [Feature] — [Issue]
```

**Fixing:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FIXING: [Feature Name] (Attempt [N]/3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: [User-reported problem]

Analyzing...
  └─ Found: [Root cause]

Implementing fix...
  └─ File: [path]
  └─ Change: [brief description]

Committing...
  └─ [commit hash]

Please verify the fix works.
```

**Fix result:**

```
✓ [Feature Name] — Fixed and verified

or

✗ [Feature Name] — Fix attempt [N] failed
  Reason: [User feedback]
  [If max attempts:] Marking as known issue
```

**All fixes complete:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✓ FIX CYCLE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Results:
  Fixed: [N] features
  Known Issues: [M] features

Proceeding to milestone completion...
```

**Milestone completing:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMPLETING MILESTONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Archiving phase artifacts...
▶ Updating STATE.md...
▶ Finalizing CLAUDE.md...
```

**Final summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PROJECT COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name]**

## Results

| Metric | Value |
|--------|-------|
| Phases | [N] completed |
| Features | [M] verified |
| UAT Pass Rate | [X]% |
| Fixes Applied | [Y] |
| Known Issues | [Z] |

## Tech Stack

  • Next.js
  • Supabase (MCP: supabase)
  • Clerk
  • Stripe

## Archive

  .planning/archive/[milestone]/

## Context

  .claude/CLAUDE.md — Updated with completion status

───────────────────────────────────────────────────────

The Potenlab workflow is complete!

/potenlab:start-project   ✓
/potenlab:execute-project ✓
/potenlab:complete-project ✓

───────────────────────────────────────────────────────
```

</output_formats>

<error_recovery>

**verify-work doesn't start:**

```
Cannot start verification.

Check:
- Are all phases executed? (STATE.md)
- Is there a valid REQUIREMENTS.md?
- Is the project initialized?

Try: /gsd:progress to see project state
```

**Fix breaks other features:**

If a fix introduces new failures:
1. Revert the fix commit: `git revert [sha]`
2. Try alternative approach
3. If still failing, mark both as known issues
4. Document the dependency

**complete-milestone fails:**

```
Milestone completion failed.

Error: [error message]

Manual steps:
1. Check .planning/STATE.md for conflicts
2. Ensure git working tree is clean
3. Try: /gsd:complete-milestone directly
```

**User abandons mid-completion:**

If user stops before completion:
- Progress is saved in STATE.md
- Fixes are committed
- Resume with /potenlab:complete-project
- Will detect partial completion and continue

</error_recovery>

<completion_checklist>

Before marking workflow complete:

**Verification:**
- [ ] All features extracted from REQUIREMENTS.md
- [ ] /gsd:verify-work executed
- [ ] User verified each feature
- [ ] Results recorded

**Fixes:**
- [ ] All critical failures addressed
- [ ] All high priority failures addressed
- [ ] Medium/low documented as known issues
- [ ] Each fix committed separately
- [ ] No fix broke other features

**Milestone:**
- [ ] /gsd:complete-milestone executed
- [ ] Archive created
- [ ] STATE.md updated

**Context:**
- [ ] CLAUDE.md updated with completion status
- [ ] Verification summary added
- [ ] Known issues documented
- [ ] Timestamp updated

**User:**
- [ ] Final summary displayed
- [ ] Next steps provided
- [ ] Potenlab workflow marked complete

</completion_checklist>

<potenlab_workflow_summary>

**Complete Potenlab Flow:**

```
┌─────────────────────────────────────────────────────┐
│ /potenlab:start-project                            │
│                                                     │
│   PRD → PROJECT.md → ROADMAP.md → Scaffold         │
│   └─ discuss-phase for each phase                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ /potenlab:execute-project                          │
│                                                     │
│   For each phase:                                  │
│   └─ plan-phase → clear → execute-phase            │
│   └─ Detect tech → Update CLAUDE.md                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ /potenlab:complete-project                         │
│                                                     │
│   verify-work → Fix failures → complete-milestone  │
│   └─ Final CLAUDE.md update                        │
│   └─ Project archived and complete                 │
└─────────────────────────────────────────────────────┘
```

**Result:**

- Working application
- Verified features
- Documented tech stack
- Persistent AI context
- Archived planning artifacts

</potenlab_workflow_summary>
