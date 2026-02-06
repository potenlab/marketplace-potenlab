---
name: potenlab:complete-project
description: Verify all features with UAT, fix failures, then complete the milestone
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Task
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
---

<objective>

Complete the project with full verification and milestone closure:

1. Run `/gsd:verify-work` to UAT all implemented features
2. If any UAT fails → Fix the issues and re-verify
3. Once all UAT passes → Run `/gsd:complete-milestone`
4. Update `.claude/CLAUDE.md` with completion status
5. Generate final project summary

**This command ensures quality before closing the milestone - no incomplete features slip through.**

</objective>

<execution_context>

@./.planning/ROADMAP.md
@./.planning/PROJECT.md
@./.planning/STATE.md
@./.planning/REQUIREMENTS.md
@./.claude/CLAUDE.md
@./.claude/get-shit-done/workflows/potenlab/complete-project.md

</execution_context>

<process>

## Phase 1: Validate Project State

**Check project is ready for completion:**

```bash
# Verify execution happened
[ -f ".planning/ROADMAP.md" ] && echo "ROADMAP found" || echo "ERROR: ROADMAP.md not found"
[ -f ".planning/STATE.md" ] && echo "STATE found" || echo "ERROR: STATE.md not found"
```

**Read STATE.md to check:**
- All phases are marked complete
- No phases in "in_progress" state
- Current milestone is active

**If phases incomplete:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚠ PROJECT NOT READY FOR COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Some phases are not yet executed:

[List incomplete phases]

Please run:
  /potenlab:execute-project

Or execute remaining phases individually:
  /gsd:execute-phase [N]
```

## Phase 2: Extract Features to Verify

**Read REQUIREMENTS.md and ROADMAP.md:**

Extract all features/requirements that should be verified:
- User stories from REQUIREMENTS.md
- Phase deliverables from ROADMAP.md
- Success criteria from each phase

**Build verification checklist:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PROJECT COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Features to verify:

[For each major feature:]
  □ [Feature name] — [Brief description]

Total: [N] features across [M] phases

Starting UAT verification...
```

## Phase 3: Run Verification

**Execute /gsd:verify-work:**

Use the Skill tool:
```
Skill(skill="gsd:verify-work")
```

**verify-work will:**
- Walk through each feature interactively
- Ask user to confirm feature works
- Record pass/fail for each item
- Generate verification report

**Capture verification results:**

Track which features:
- ✓ Passed UAT
- ✗ Failed UAT (with reason)
- ⊘ Skipped (user choice)

## Phase 4: Handle UAT Failures

**If any features failed UAT:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚠ UAT FAILURES DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[N] feature(s) did not pass verification:

[For each failure:]
  ✗ [Feature name]
    Issue: [User-reported issue]
    Phase: [Which phase implemented this]
```

**Ask user how to proceed:**

Use AskUserQuestion:
- header: "Fix Failures"
- question: "How would you like to handle the UAT failures?"
- options:
  - "Fix all issues" — Address each failure before completing (Recommended)
  - "Fix critical only" — Only fix blocking issues
  - "Skip and complete" — Mark as known issues and proceed
  - "Abort completion" — Stop and handle manually

**If "Fix all issues" or "Fix critical only":**

For each failed feature:

### Step 4.1: Analyze the failure

Read the relevant phase code:
- Find files related to the feature
- Understand what's not working
- Identify the fix needed

### Step 4.2: Implement the fix

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FIXING: [Feature Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: [What's wrong]
Fix: [What we're doing]
```

Make the necessary code changes to fix the issue.

### Step 4.3: Commit the fix

```bash
git add [changed files]
git commit -m "$(cat <<'EOF'
fix: [brief description of fix]

Resolves UAT failure for [feature name].
[Additional context if needed]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### Step 4.4: Re-verify the fix

Ask user to confirm the fix works:

Use AskUserQuestion:
- header: "Verify Fix"
- question: "Does [feature name] now work correctly?"
- options:
  - "Yes, it's fixed" — Mark as passed
  - "No, still broken" — Need another fix attempt
  - "Skip for now" — Move on, mark as known issue

**If still broken:** Loop back to Step 4.1 (max 3 attempts per feature)

**After fixing all (or selected) issues:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✓ FIXES COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fixed: [N] issues
Remaining: [M] known issues (if any)

Proceeding to milestone completion...
```

## Phase 5: Complete Milestone

**All UAT passed (or user chose to proceed):**

**Execute /gsd:complete-milestone:**

Use the Skill tool:
```
Skill(skill="gsd:complete-milestone")
```

**complete-milestone will:**
- Archive the current milestone
- Move planning artifacts to archive
- Update STATE.md
- Prepare for next milestone (if any)

## Phase 6: Update CLAUDE.md

**Update project status:**

Edit `.claude/CLAUDE.md`:

### Update "Project Overview" section:

```markdown
- **Status**: Complete ✓
- **Completed**: [YYYY-MM-DD]
```

### Add "Project Completion" section:

```markdown
## Project Completion

- **Milestone**: [Milestone name/version]
- **Completed**: [YYYY-MM-DD]
- **Total Phases**: [N]
- **UAT Status**: [All Passed / N Known Issues]

### Verification Summary

| Feature | Status | Notes |
|---------|--------|-------|
| [Feature 1] | ✓ Passed | - |
| [Feature 2] | ✓ Passed | - |
| [Feature 3] | ⚠ Known Issue | [Brief note] |

### Final Tech Stack

[Consolidated list from earlier sections]

### Key Deliverables

- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]
```

### Update timestamp:

```markdown
*Last updated: [YYYY-MM-DD HH:MM] — Project Complete*
```

**Commit CLAUDE.md:**

```bash
git add .claude/CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: mark project complete in CLAUDE.md

- Updated status to Complete
- Added verification summary
- Recorded completion date

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Phase 7: Final Summary

**Display completion summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POTENLAB ► PROJECT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name]**

## Summary

| Metric | Value |
|--------|-------|
| Phases Executed | [N] |
| Features Verified | [M] |
| UAT Pass Rate | [X]% |
| Fixes Applied | [Y] |

## Tech Stack

[For each technology:]
  • [Technology] [MCP badge if applicable]

## Deliverables

[Key outputs of the project]

## Files

| Purpose | Location |
|---------|----------|
| Project Context | .claude/CLAUDE.md |
| Archive | .planning/archive/[milestone]/ |
| Final State | .planning/STATE.md |

───────────────────────────────────────────────────────

## ▶ What's Next?

[If more milestones planned:]
  • `/gsd:new-milestone` — Start next version

[General options:]
  • Deploy the application
  • Create release notes
  • Start new feature work

───────────────────────────────────────────────────────

Thank you for using Potenlab! 🎉
```

</process>

<uat_fix_strategy>

**Fix prioritization:**

When multiple UAT failures exist, fix in this order:

1. **Critical** — App won't run, crashes, data loss
2. **High** — Core feature broken, user can't complete main flow
3. **Medium** — Secondary feature broken, workaround exists
4. **Low** — Minor issue, cosmetic, edge case

**Fix attempt limits:**

- Max 3 fix attempts per feature
- After 3 attempts, mark as "needs manual review"
- Don't block completion for low-priority issues

**When to abort:**

Suggest aborting if:
- More than 50% of features fail UAT
- Critical features can't be fixed
- Fixes introduce new failures

</uat_fix_strategy>

<success_criteria>

- [ ] Project state validated (all phases executed)
- [ ] Features extracted from REQUIREMENTS.md and ROADMAP.md
- [ ] /gsd:verify-work executed
- [ ] All UAT failures addressed (fixed or acknowledged)
- [ ] Fixes committed with proper messages
- [ ] /gsd:complete-milestone executed
- [ ] .claude/CLAUDE.md updated with completion status
- [ ] Final summary displayed to user
- [ ] User knows next steps

</success_criteria>

<error_handling>

**verify-work fails to start:**
- Check STATE.md for project status
- Ensure phases were executed
- Suggest running /potenlab:execute-project first

**Fix attempt fails:**
- Log the error
- Ask user to try manual fix or skip
- Continue with other failures

**complete-milestone fails:**
- Check for uncommitted changes
- Check for merge conflicts
- Display error and suggest manual completion

**CLAUDE.md update fails:**
- Non-blocking, continue with completion
- Note for manual update later

</error_handling>

<notes>

**Potenlab Workflow Complete:**

This command is the final step in the Potenlab automation:

```
/potenlab:start-project
        ↓
/potenlab:execute-project
        ↓
/potenlab:complete-project  ← You are here
```

**Quality Gate:**

This command acts as a quality gate:
- No milestone closes without verification
- Failures are addressed before completion
- Known issues are documented

**Context Persistence:**

CLAUDE.md is updated with:
- Final project status
- Verification results
- Any known issues for future reference

Future AI sessions will know:
- Project is complete
- What was verified
- Any outstanding issues

</notes>
