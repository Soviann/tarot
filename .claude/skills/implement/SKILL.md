# Implement GitHub Issue

**IMPORTANT:** When this skill loads, create a task (TaskCreate) for EACH step below and complete them in order. Mark each task `in_progress` before starting it and `completed` when done. No step may be skipped silently.

1. **Gather context from memory first**: read MEMORY.md and `memory/patterns.md` for project conventions, file paths, patterns, and open issues. Use this to identify the target issue and understand the codebase. Fall back to GitHub (issue details, comments, related PRs) only if memory is insufficient or more info is needed.
2. Create a feature branch from main (follow CLAUDE.md branch naming convention) and push it to the remote.
3. Move the GitHub issue on the project board to In Progress.
4. Follow TDD using the `superpowers:test-driven-development` skill: write failing tests → implement → all tests pass → refactor.
5. Run `superpowers:verification-before-completion`: all tests pass, lint clean (including PHP CS Fixer on staged `.php` files).
6. Update CHANGELOG.md with the change.
7. Grep `docs/` for impacted terms and update any relevant docs (`docs/user-guide.md`, `docs/frontend-usage.md`).
8. Commit and push. Create a PR via `commit-commands:commit-push-pr`.
9. Request code review using `superpowers:requesting-code-review`. Fix review comments using `superpowers:receiving-code-review`. Repeat until review is clean.
10. Squash merge the PR (only after review is clean).
11. Update memory (`memory/patterns.md`, `MEMORY.md`) with any new entities, hooks, components, pages, or routes added.
