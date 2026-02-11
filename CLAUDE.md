# CLAUDE.md

**Mandatory** rules for Claude Code on this project.

**Context**: Claude = sole developer. Maximum rigor, keep this file, tests, and docs up to date.

## Architecture

**Stack**: Symfony 7.4 + API Platform 4 (backend) | React 19 + TypeScript + Vite (frontend)
**DB**: MariaDB via DDEV | **Styling**: Tailwind CSS 4 | **Data fetching**: TanStack Query

```
tarot/
├── .ddev/            # DDEV config (repo root = project root)
├── backend/          # Symfony API — PHP 8.3
│   ├── src/Entity/   # Player, Session, Game, ScoreEntry
│   ├── src/Enum/     # Contract, Poignee, Side, Chelem, GameStatus
│   ├── src/Service/  # ScoreCalculator
│   └── tests/
├── frontend/         # React PWA — TypeScript
│   └── src/
│       ├── components/ui/  # Reusable UI components (design system)
│       ├── hooks/          # Custom React hooks
│       └── types/          # TypeScript enums mirroring backend
├── docs/
│   ├── plans/              # Temporary design docs (gitignored, deleted after implementation)
│   ├── frontend-usage.md   # Developer reference: components, hooks, tokens
│   └── user-guide.md       # End-user guide: how to use the app
├── CLAUDE.md
├── README.md
└── CHANGELOG.md
```

## Approach

- Act on user instructions directly — no exploratory glob/grep when the user already says where/what.
- Edit files when asked. Don't create issues or plans unless requested.
- Prefer acting over asking.

## Plans

- Store in `docs/plans/` (project-local, never global).
- Temporary — delete after the related PR is merged.

## Workflow

- **Complex tasks**: plan mode → approval → implementation
- **Split** large changes into verifiable chunks

## Mandatory TDD

1. **Test first**: write/modify test → must fail
2. **Implement**: minimum to pass
3. **Refactor**: green tests

**Backend tests**: `make test-back`
**Frontend tests**: `make test-front`

## Commands

All commands run via DDEV (enforced by hookify rule `require-ddev-exec`).
Use `make help` to see all available targets.

```bash
# Environment
make dev                # First launch (DDEV + deps + migrations)
make start / stop       # Start/stop DDEV

# Tests
make test               # All tests (backend + frontend)
make test-back          # PHPUnit
make test-front         # Vitest

# Quality
make lint               # All linters (PHPStan + CS Fixer dry-run + TypeScript)
make phpstan            # PHPStan only
make cs                 # PHP CS Fixer (fix)

# Database
make db-diff            # Generate a migration
make db-migrate         # Run migrations

# Build
make build              # Production build
make serve-prod         # Build + serve (port 4173)

# Symfony
make sf CMD="..."       # Any Symfony console command
```

## Git

### Commits

Format: `<type>(scope): description` — Types: `feat`, `fix`, `chore`, `refactor`, `docs`
No `Co-Authored-By`.
**Always** reference the issue: append `#N` in the message body or use `fixes #N` to auto-close.
**Before committing**: run PHP CS Fixer on all staged `.php` files to ensure consistent formatting.

### Branching

**Never push directly to `main`.** All work goes through a branch + PR.

- Branch naming: `<type>/<issue-number>-<short-description>` (e.g. `feat/2-entities`, `fix/15-score-calc`)
- One branch = one issue (1:1 mapping)
- Branch from `main`, merge back to `main`
- Branch auto-deleted after merge (GitHub setting `delete_branch_on_merge`)

### Pull Requests

- Every issue closes via a PR, not a direct commit
- PR title follows commit format: `<type>(scope): description`
- PR body: summary + `fixes #N`
- Merge strategy: **squash merge** (`--squash`) → one commit per issue on main
- Request code review (agent) before merge
- **Always** update CHANGELOG after merge.

### Tags & Releases

Semantic versioning: `vMAJOR.MINOR.PATCH`
- Tag after a coherent set of issues is merged (milestone)
- Release notes generated from CHANGELOG.md
- No release per PR — only at milestones

```bash
# Workflow for each issue:
git checkout -b feat/N-description main     # 1. Create branch
# ... TDD, commits referencing #N ...       # 2. Develop
git push -u origin feat/N-description       # 3. Push branch
gh pr create --title "..." --body "..."     # 4. Create PR (fixes #N)
# ... code review ...                       # 5. Review
gh pr merge N --squash                       # 6. Squash merge (branch auto-deleted)
# Issue auto-closes via "fixes #N"          # 7. Done
```

## Issue Workflow

- "Next issue" = pick highest-priority Todo from the board and start. Don't list options.
- Full cycle: implement → test → PR → review fixes → squash merge → CHANGELOG.

## GitHub Issues & Project

**Repo**: `Soviann/tarot` — **Project**: `Tarot - Roadmap` (number: 2, owner: Soviann)

**Board columns** (Status field): `Backlog` → `Todo` → `In Progress` → `Done`

### Project workflows (all enabled)

GitHub Project workflows automate board transitions — **no manual board moves needed**:
- **Auto-add to project**: new issues/PRs are added to the board automatically
- **Item added to project**: sets initial status on add
- **Pull request linked to issue**: moves to `In Progress`
- **Pull request merged** / **Item closed**: moves to `Done`
- **Auto-close issue**: closes issue when linked PR merges

### Rules

1. **All work starts from an issue.** Check existing issues first; create if none exists.
2. **Board transitions are automatic** (see workflows above). No manual `gh project item-add` or `gh project item-edit` needed.
3. **New ideas** without immediate implementation → `Backlog` (set manually only for new issues that need triaging).
4. **Close issues** via PR with `fixes #N` in PR body (auto-closes on merge).
5. **Labels**: use existing (`enhancement`, `bug`, etc.). Don't create new ones without asking.
6. **Token optimization** (see dedicated section below).

### Token optimization

- **Prefer `gh` CLI** over MCP tools for simple queries (less verbose output)
- **Always set `minimal_output: true`** on MCP list/search calls when full data isn't needed
- **Max `perPage: 5`** unless more results are explicitly needed
- **No exploratory chains**: one targeted call, not list → read → read
- **Don't verify existence** of issues, PRs, or players already known from the plan or memory
- **No manual board moves**: project workflows handle all transitions automatically
- `fixes #N` in the PR body auto-closes the issue on merge — never close manually

### Quick reference

```bash
# Issues
gh issue create --repo Soviann/tarot --title "..." --body "..." --label "..."

# Branches
git checkout -b <type>/<N>-<desc> main
git push -u origin <type>/<N>-<desc>

# Pull Requests
gh pr create --title "<type>(scope): desc" --body "fixes #N"
gh pr merge <PR_NUMBER> --squash              # Branch auto-deleted by GitHub

# Tags & Releases
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --generate-notes

# Project board — fully automated by workflows, no manual commands needed
# Manual override (rare): gh project item-edit --project-id PVT_kwHOANG8LM4BOble --id <ITEM_ID> \
#   --field-id PVTSSF_lAHOANG8LM4BOblezg9IsCA --single-select-option-id <OPTION_ID>
# Column option IDs: Backlog=858f7025  Todo=f75ad846  InProgress=47fc9ee4  Done=98236657
```

## Changelog

Update `CHANGELOG.md` under `## [Unreleased]`: `### Added|Changed|Fixed|Removed`
Format: `- **Name**: Description`

## Documentation

Two living docs in `docs/` must be maintained:

- **`docs/user-guide.md`** — end-user guide: update when features, screens, or workflows change
- **`docs/frontend-usage.md`** — developer reference: update when components, hooks, or types are added/modified/removed

## Code Conventions

- **Alphabetical ordering**: constructor assignments, associative array keys, YAML keys
- **DRY**: extract at 3+ occurrences (2 if complex)
- **Backend enums**: PHP backed enums for all fixed value sets
- **Backend quality**: PHPStan (level max) auto-enforced by PostToolUse hook; PHP CS Fixer (`@Symfony` + `@Symfony:risky`) run on all modified PHP files before each commit
- **API responses**: use API Platform serialization groups, not custom DTOs unless needed
- **Frontend**: functional components, custom hooks for API calls, TypeScript strict mode

## Language

- **CLAUDE.md**: English only
- **Git commits & PR titles**: English
- **All other files** (README, CHANGELOG, docs, UI text, comments): French
- **Code identifiers** (variables, functions, classes): English
