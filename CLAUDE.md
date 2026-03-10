# CLAUDE.md

Mandatory rules. Claude = sole developer. Keep this file, tests, docs up to date.

## Architecture

Symfony 7.4 + API Platform 4 | React 19 + TypeScript + Vite | MariaDB via DDEV | Tailwind CSS 4 | TanStack Query

```
tarot/
├── backend/    # Symfony API — PHP 8.3
├── frontend/   # React PWA — TypeScript
├── docs/       # user-guide.md, frontend-usage.md, plans/
├── CLAUDE.md
└── CHANGELOG.md
```

> File map (entities, hooks, components, routes, API endpoints): `memory/patterns.md`

## Approach

- Edit files when asked.
- **No codebase exploration.** CLAUDE.md, MEMORY.md, `memory/patterns.md` have all context. Only read files you're about to edit.
- **Keep `memory/patterns.md` up to date** when adding entities, hooks, components, pages, routes.

## Plans

Store in `docs/plans/` (temporary, delete after PR merged). Concise: what to do, not how.

## Mandatory TDD

1. Test first (must fail) → 2. Implement (minimum to pass) → 3. Refactor (green tests)

Backend: `make test-back` | Frontend: `make test-front`

## Commands

Always use `make` targets, always prefix with `ddev exec` (hookify-enforced).

| Command | Purpose |
|---|---|
| `ddev exec make dev` | First launch (deps + migrations) |
| `ddev exec make test` | All tests |
| `ddev exec make test-back` | PHPUnit |
| `ddev exec make test-front` | Vitest |
| `ddev exec make lint` | All linters (PHPStan + CS Fixer dry-run + TS) |
| `ddev exec make phpstan` | PHPStan only |
| `ddev exec make cs` | PHP CS Fixer (fix) |
| `ddev exec make db-diff` | Generate migration |
| `ddev exec make db-migrate` | Run migrations |
| `ddev exec make build` | Production build |
| `ddev exec make sf CMD="..."` | Any Symfony console command |

## Git

### Commits

`<type>(scope): description` — Types: `feat|fix|chore|refactor|docs`
Verbe conjugué (impératif 3e pers.): `ajoute`, `corrige`, `supprime` (pas infinitif).
Always reference issue (`#N` in body or `fixes #N`). Run CS Fixer on staged `.php` before commit.

### Branching

Never push to `main`. Branch + PR only.
- `<type>/<issue-number>-<short-description>` (e.g. `feat/2-entities`)
- One branch = one issue. Branch from `main`, auto-deleted after merge.

### Pull Requests

- PR title: `<type>(scope): description` | Body: summary + `fixes #N`
- Squash merge (`--squash`) → one commit per issue
- Code review (agent) before merge. Update CHANGELOG on branch before merge.

### Releases

Semver `vMAJOR.MINOR.PATCH`. Tag at milestones (not per PR).
Workflow: update CHANGELOG `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`, then `git tag vX.Y.Z && git push origin vX.Y.Z`.
GitHub Action auto-creates release from CHANGELOG.

### Issue workflow

```bash
git checkout -b feat/N-description main   # 1. Branch
# TDD, commits referencing #N             # 2. Develop
git push -u origin feat/N-description     # 3. Push
gh pr create --title "..." --body "..."   # 4. PR (fixes #N)
# code review                             # 5. Review
gh pr merge N --squash                    # 6. Merge (auto-delete, auto-close)
```

"Next issue" = highest-priority Todo from board. Full cycle: implement → test → PR → review → merge → CHANGELOG.

## GitHub Project

**Repo**: `Soviann/tarot` | **Project**: `Tarot - Roadmap` (number: 2, owner: Soviann)
Columns: `Backlog` → `Todo` → `In Progress` → `Done`. IDs in MEMORY.md.

Rules:
1. All work starts from an issue. Check existing first.
2. Move to `In Progress` manually (`gh project item-edit`). Other transitions are automatic.
3. New ideas without implementation → `Backlog`.
4. Close via PR `fixes #N`. Labels: use existing only.

## Changelog

`CHANGELOG.md` under `## [Unreleased]`: `### Added|Changed|Fixed|Removed`
Format: `- **Name**: Description`

## Documentation

Maintain: `docs/user-guide.md` (end-user) and `docs/frontend-usage.md` (developer reference).

## Code Conventions

- **Backend**: queries in repositories only (QueryBuilder, no raw DQL). PHP backed enums. PHPStan level max. CS Fixer `@Symfony` + `@Symfony:risky`. API Platform serialization groups (no custom DTOs unless needed).
- **Frontend**: functional components, custom hooks for API, TypeScript strict. UI primitives from `components/ui/`.

## Language

- Git, PR, CHANGELOG, docs, UI text, comments: **French**
- Code identifiers: **English**
