# Tarot — Agent Rules

Project-specific guidelines and conventions for Soviann/tarot. Extends global rules.

## Tech Stack & Architecture

- **Backend**: Symfony 7.4 + API Platform 4, PHP 8.3 (`backend/`)
- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS 4, TanStack Query (`frontend/`)
- **Database**: MariaDB via DDEV
- **Codebase Map**: Refer to `docs/patterns.md` for entities, repositories, DTOs, state processors, hooks, pages, components, and routes before exploring.

## Commands

Always use `make` targets; always prefix with `ddev exec`. Never run `ddev poweroff` (stops all DDEV projects across the host).

| Command | Purpose |
|---|---|
| `ddev exec make dev` | Initial setup / dependencies + migrations |
| `ddev exec make test` | All tests (backend + frontend) |
| `ddev exec make test-back` | PHPUnit tests |
| `ddev exec make test-front` | Vitest tests |
| `ddev exec make lint` | Linters (PHPStan + CS Fixer dry-run + TypeScript) |
| `ddev exec make phpstan` | PHPStan level 9 |
| `ddev exec make cs` | PHP CS Fixer (auto-fix) |
| `ddev exec make db-diff` | Generate Doctrine migration |
| `ddev exec make db-migrate` | Run Doctrine migrations |
| `ddev exec make build` | Production build |
| `ddev exec make sf CMD="..."` | Symfony console command |

## Testing & Quality

- **Mandatory TDD**: Write failing test first → implement minimum to pass → refactor with green tests.
- Backend: PHPUnit (`ddev exec make test-back`). Extend `ApiTestCase` for API tests; isolate via `dama/doctrine-test-bundle`.
- Frontend: Vitest (`ddev exec make test-front`). `@testing-library/react` wrapped with `QueryClientProvider`.
- Linter / Static Analysis: PHPStan level 9 (never ignore or lower level).

## Backend Standards (Symfony & PHP)

- **Code Style**: `@Symfony` and `@Symfony:risky` ruleset via PHP CS Fixer.
- **Native Functions**: Leading backslash for native functions (e.g. `\array_map()`, `\sprintf()`, `\count()`).
- **Strings**: Prefer Symfony `u()` String component over native PHP string functions.
- **Yoda Conditions**: `null === $var` rather than `$var === null`.
- **Method Ordering**: `__construct` → `public` → `protected` → `private` (`setUp`/`tearDown` first in tests).
- **Arguments**: One-line args, except promoted constructor arguments (one per line with trailing comma).
- **Sorting**: Alphabetical constructor assignments, array keys, and YAML keys.
- **Entities & DB**:
  - Auto-increment integer IDs.
  - Queries strictly in `src/Repository/` via `QueryBuilder` only (no DQL). Never inject `EntityManagerInterface` directly for queries.
  - Doctrine migrations must implement `getDescription()` with a concise description in French.
  - Domain constants/enums over magic strings. Use PHP backed enums.
- **API & DTOs**:
  - API Platform 4 serialization groups for payload projection.
  - `readonly` DTO classes in `src/DTO/` or matching namespace when custom models are needed.

## Frontend Standards (React & TypeScript)

- Functional components with strict TypeScript types.
- API interactions wrapped in custom React hooks with TanStack Query.
- Use existing UI primitives in `components/ui/` (see `docs/patterns.md`).
- Dark mode via `next-themes` (`attribute="class"`), Tailwind CSS 4, and custom themes in `themeRegistry.ts`.

## Translations

- Never hardcode user-facing strings in templates or components.
- `translations/messages.fr.yaml`: UI labels, titles, buttons, navigation.
- `translations/validators.fr.yaml`: Validator constraint messages.
- Key convention: `app.<entity>.<context>.<purpose>` (e.g. `app.player.admin.fields.name.label`).
- Twig: `{{ 'key'|trans }}` or `{{ 'key'|trans({'%param%': value}) }}`.

## Git & Workflow

- **Branching**: Never push directly to `main`. Branch + PR only.
  - Branch format: `<type>/<issue-number>-<short-description>` (e.g. `feat/2-entities`) or `<type>/<short-description>`.
- **Commits**: Follow `/commit` conventions.
  - Format: `<type>(scope): description`
  - French descriptions, 3rd-person imperative (`ajoute`, `corrige`, `supprime`).
  - Title describes visible impact / outcome, not internal implementation details.
- **Pull Requests**:
  - Title: `<type>(scope): description`. Body: summary + `fixes #N`.
  - Squash merge (`--squash`) to keep one commit per issue.
- **Releases**: SemVer `vMAJOR.MINOR.PATCH` tagged at milestones. Update `CHANGELOG.md` (`[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`).
- **Roadmap / GitHub Project**:
  - Repo: `Soviann/tarot` | Project: `Tarot - Roadmap` (number: 2, owner: Soviann).
  - Columns: `Backlog` → `Todo` → `In Progress` → `Done`.

## Documentation & Changelog

- Keep `docs/patterns.md` up to date inline whenever adding entities, enums, services, hooks, components, or routes.
- Update `CHANGELOG.md` under `## [Unreleased]` (`Added`, `Changed`, `Fixed`, `Removed`).
- User documentation in `docs/user-guide.md` and developer reference in `docs/frontend-usage.md`.
