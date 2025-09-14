# Issues & Feature Tracking

This directory tracks technical debt, bugs, features, and improvements for the Badminton Event Cost Splitter project.

## Directory Structure

```
issues/
├── README.md                           # This file - explains the system
├── {issue-name}.md                     # Open issues/features
├── {feature-name}.md                   # Open features
└── done/                              # Completed issues (archive)
    ├── {completed-issue}.md
    └── {completed-feature}.md
```

## File Naming Convention

- **Technical Debt**: `{component}-{problem}-refactor.md`
  - Example: `participant-component-refactor.md`
- **Bug Fixes**: `fix-{description}.md`
  - Example: `fix-cypress-selector-mismatch.md`
- **Features**: `feature-{name}.md`
  - Example: `feature-url-routing.md`
- **Improvements**: `improve-{area}.md`
  - Example: `improve-test-performance.md`

## Issue Template

Each issue file should contain:

```markdown
# Issue Title

## Issue Type
🐛 Bug / 🔧 Technical Debt / ✨ Feature / 📈 Improvement

## Priority
High / Medium / Low

## Description
Clear description of the issue or feature

## Current Problems
List of specific problems

## Proposed Solution
Detailed solution approach

## Benefits
Expected improvements

## Files to Modify
List of files that need changes

## Acceptance Criteria
- [ ] Checklist of completion requirements

## Estimated Effort
Time estimate and complexity

## Dependencies
Any dependencies on other work

## Testing Requirements
Required testing approach

---
**Created:** Date
**Status:** Open / In Progress / Review
**Assigned:** Developer name
```

## Workflow

1. **Create Issue**: Add new `.md` file in `/issues/`
2. **Work on Issue**: Update status to "In Progress"
3. **Complete Issue**: Move file to `/issues/done/`
4. **Reference in Commits**: Use filename in commit messages

## Current Issues

- [`participant-component-refactor.md`](./participant-component-refactor.md) - Refactor duplicate participant rendering logic

## Benefits of This System

- ✅ **Visible backlog** of technical debt and improvements
- ✅ **Detailed documentation** of each issue with context
- ✅ **Progress tracking** with clear completion criteria
- ✅ **Historical record** of completed work in `/done/`
- ✅ **Easy prioritization** with clear effort estimates
- ✅ **Collaborative planning** - team can review and discuss issues

---
**System Created:** September 13, 2025