# CLAUDE.md

**Mandatory** rules for Claude Code on this project.

**Context**: Claude = sole developer. Maximum rigor, keep this file, tests, and docs up to date.

## Architecture

**Stack**: Symfony 7.4 + API Platform 4 (backend) | React 19 + TypeScript + Vite (frontend)
**DB**: MariaDB via DDEV | **Styling**: Tailwind CSS 4 | **Data fetching**: TanStack Query

```
tarot/
├── backend/          # Symfony API — PHP 8.3
│   ├── .ddev/
│   ├── src/Entity/   # Player, Session, Game, ScoreEntry
│   ├── src/Enum/     # Contract, Poignee, PetitAuBout, Chelem, GameStatus
│   ├── src/Service/  # ScoreCalculator
│   └── tests/
├── frontend/         # React PWA — TypeScript
│   └── src/
├── docs/plans/       # Design documents
├── CLAUDE.md
├── README.md
└── CHANGELOG.md
```

## Workflow

- **Complex tasks**: plan mode → approval → implementation
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

# Frontend
cd frontend && npm run dev                      # Dev server
cd frontend && npm test                         # Vitest
cd frontend && npm run build                    # Production build

# Quality — only on modified files
ddev exec vendor/bin/php-cs-fixer fix <file>
ddev exec vendor/bin/phpstan analyse <file>
```

## Git

Format: `<type>(scope): description` — Types: `feat`, `fix`, `chore`, `refactor`, `docs`
No `Co-Authored-By`.

## GitHub Issues & Project

**Repo**: `Soviann/tarot` — **Project**: `Tarot - Roadmap` (number: 2, owner: Soviann)

**Board columns** (Status field): `Backlog` → `Todo` → `In Progress` → `Done`

### Rules

1. **All work starts from an issue.** Check existing issues first; create if none exists.
2. **Move issues** through the board: `Todo` → `In Progress` (start) → `Done` (complete).
3. **New ideas** without immediate implementation → `Backlog`.
4. **Close issues** with `fixes #N` in commit message.
5. **Labels**: use existing (`enhancement`, `bug`, etc.). Don't create new ones without asking.

### Quick reference

```bash
# Issues
gh issue list --repo Soviann/tarot
gh issue create --repo Soviann/tarot --title "..." --body "..." --label "..."
gh issue close N --repo Soviann/tarot

# Project board — move item to a column
# 1. Get item ID:  gh project item-list 2 --owner Soviann --format json
# 2. Edit status:  gh project item-edit --project-id PVT_kwHOANG8LM4BOble --id <ITEM_ID> \
#      --field-id PVTSSF_lAHOANG8LM4BOblezg9IsCA --single-select-option-id <OPTION_ID>
# Column option IDs: Backlog=858f7025  Todo=f75ad846  InProgress=47fc9ee4  Done=98236657
```

## Changelog

Update `CHANGELOG.md` under `## [Unreleased]`: `### Added|Changed|Fixed|Removed`
Format: `- **Name**: Description`

## Code Conventions

- **Alphabetical ordering**: constructor assignments, associative array keys, YAML keys
- **DRY**: extract at 3+ occurrences (2 if complex)
- **Backend enums**: PHP backed enums for all fixed value sets
- **API responses**: use API Platform serialization groups, not custom DTOs unless needed
- **Frontend**: functional components, custom hooks for API calls, TypeScript strict mode
