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
│   ├── plans/              # Design documents
│   ├── frontend-usage.md   # Developer reference: components, hooks, tokens
│   └── user-guide.md       # End-user guide: how to use the app
├── CLAUDE.md
├── README.md
└── CHANGELOG.md
```

## Workflow

- **Complex tasks**: plan mode → approval → implementation
- **Plans**: save to `docs/plans/YYYY-MM-DD-<feature>.md`, not `~/.claude/plans/`
- **Split** large changes into verifiable chunks
- **Design doc**: `docs/plans/2025-02-05-tarot-app-design.md`

## Mandatory TDD

1. **Test first**: write/modify test → must fail
2. **Implement**: minimum to pass
3. **Refactor**: green tests

**Backend tests**: `ddev exec bin/phpunit`
**Frontend tests**: `cd frontend && npm test`

## Commands

```bash
# DDEV
ddev start                                      # Start environment
ddev exec bin/console doctrine:migrations:diff -n  # Generate migration
ddev exec bin/console doctrine:migrations:migrate -n  # Run migrations
ddev exec bin/phpunit                           # Backend tests

# Frontend (run via DDEV or from frontend/ directory)
ddev exec bash -c 'cd /var/www/html/frontend && npm run dev'    # Dev server (auto-started by daemon)
ddev exec bash -c 'cd /var/www/html/frontend && npm test'       # Vitest
ddev exec bash -c 'cd /var/www/html/frontend && npm run build'  # Production build

# PHPStan (auto-run via PostToolUse hook on Write/Edit of .php files)
# PHP CS Fixer (run manually before committing on modified files)
ddev exec bash -c 'cd /var/www/html/backend && vendor/bin/php-cs-fixer fix <file>'
ddev exec bash -c 'cd /var/www/html/backend && vendor/bin/phpstan analyse <file>'
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
- Delete branch after merge

### Pull Requests

- Every issue closes via a PR, not a direct commit
- PR title follows commit format: `<type>(scope): description`
- PR body: summary + `fixes #N`
- Merge strategy: **squash merge** (`--squash`) → one commit per issue on main
- Request code review (agent) before merge

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
gh pr merge N --squash --delete-branch      # 6. Squash merge + cleanup
# Issue auto-closes via "fixes #N"          # 7. Done
```

## GitHub Issues & Project

**Repo**: `Soviann/tarot` — **Project**: `Tarot - Roadmap` (number: 2, owner: Soviann)

**Board columns** (Status field): `Backlog` → `Todo` → `In Progress` → `Done`

### Rules

1. **All work starts from an issue.** Check existing issues first; create if none exists.
2. **Move issues** through the board: `Todo` → `In Progress` (start) → `Done` (via PR merge).
3. **New ideas** without immediate implementation → `Backlog`.
4. **Close issues** via PR with `fixes #N` in PR body (auto-closes on merge).
5. **Labels**: use existing (`enhancement`, `bug`, etc.). Don't create new ones without asking.
6. **Token optimization** (see dedicated section below).

### Token optimization

- **Prefer `gh` CLI** over MCP tools for simple queries (less verbose output)
- **Always set `minimal_output: true`** on MCP list/search calls when full data isn't needed
- **Max `perPage: 5`** unless more results are explicitly needed
- **No exploratory chains**: one targeted call, not list → read → read
- **Never `gh project item-list`** (returns all items, very expensive). Use `gh project item-add` (idempotent, returns item ID) then cache the item ID in `MEMORY.md`
- **Cache project item IDs** (`PVTI_…`) in `MEMORY.md` after every board interaction — use them directly for `gh project item-edit`
- **Don't verify existence** of issues, PRs, or players already known from the plan or memory
- **Single board move per issue**: move to `Done` at merge time only — skip the intermediate `In Progress` move
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
gh pr merge <PR_NUMBER> --squash --delete-branch

# Tags & Releases
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --generate-notes

# Project board — add item & move to a column
# 1. Add (idempotent): gh project item-add 2 --owner Soviann --url <ISSUE_URL> --format json
#    → returns { "id": "PVTI_..." } — cache this in MEMORY.md
# 2. Edit status:  gh project item-edit --project-id PVT_kwHOANG8LM4BOble --id <ITEM_ID> \
#      --field-id PVTSSF_lAHOANG8LM4BOblezg9IsCA --single-select-option-id <OPTION_ID>
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
