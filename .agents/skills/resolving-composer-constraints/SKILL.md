---
name: resolving-composer-constraints
description: Use when Composer refuses to resolve, install or update dependencies in a PHP project — a requirement set with no installable solution, a refused composer require, or an update that will not move a package — including « composer refuse », « impossible de mettre à jour la dépendance », « conflit de dépendances », even when Composer is never named. Identifies the actual blocking constraint before anything is changed.
---

# Resolving Composer constraints

Composer resolution failures have a small number of recurring causes. The error output names the
symptom, rarely the cause. Diagnose read-only first; mutate only once the cause is identified and
the fix approved.

## Arriving from a merge conflict

One recurring entry point is a `composer.lock` conflict replay, and it changes what is already
true when this skill starts. The chain is:

> git merge conflicts → the conflicted set is **exactly** `composer.lock` →
> `merge-flow` keeps the target's lock and replays the ticket's `composer.json` delta with
> `composer update <packages> -W` (`merge-flow/shared/composer-lock-conflict.md`, item 5) →
> **the resolver refuses** → here.

What that means for the diagnosis:

- **A merge is in progress.** Everything below is read-only until Step 5, so it is safe, but
  never `git merge --abort`, `git checkout` or `git stash` to get a cleaner workspace — that
  is the caller's decision, not this skill's.
- **`composer.json` is already merged and is not in conflict** — `merge-flow` stops outright
  when it is. So the requirement set being resolved is the intended one: the failure is a real
  incompatibility between the two sides' requirements, not a bad merge to undo.
- **The replay list is not the cause.** It is derived from the `composer.json` diff. Widening
  it, or dropping `-W`, changes what moves without addressing what blocks — Step 3's
  instruments do.
- **Report back, do not finish the merge.** Once the blocking constraint is fixed and
  `composer update` completes, control returns to the lock-conflict procedure at its
  `composer validate --check-lock` step.

## Never do these

Each one makes the error disappear while making the project worse.

| Never | Why | Instead |
|---|---|---|
| `composer update` with no package list | Re-resolves and rewrites the whole lock; unrelated packages move silently | Update named packages: `composer update <pkg> -W` |
| `--ignore-platform-req` | Hides a real PHP or extension mismatch that will fail at deploy | Fix the container's PHP, or declare `config.platform` |
| Hand-editing `composer.lock` | The `content-hash` binds the lock to `composer.json`; editing corrupts it | Let Composer regenerate the lock |
| Raising `extra.symfony.require` | Upgrades every `symfony/*` package at once, as a side effect | Treat a Symfony line bump as its own deliberate task |

## Step 1 — Resolve the runner

There is usually no `composer` binary on the host. Check, in order:

```bash
command -v composer
test -d .ddev && echo "DDEV project"
```

Use `ddev composer …` when a DDEV project is present. Never assume a host binary. Commands below
are written bare — prefix each with the runner resolved here.

## Step 2 — Read the error bottom-up

Composer prints the general complaint first and the actual blocking edge last. Inside each
`Problem N` block, the final `- …` line names the constraint that failed. Capture every
`Problem N` block verbatim before forming a hypothesis; do not summarise it away.

## Step 3 — Diagnose read-only

Nothing in this step writes to disk.

| Question | Command |
|---|---|
| What blocks `<pkg>` at `<version>`? | `composer why-not <pkg> <version>` |
| What requires `<pkg>`, and at what constraint? | `composer why <pkg>` |
| What does the resolved tree look like? | `composer show --tree <pkg>` |
| Does the platform satisfy requirements? | `composer check-platform-reqs` |
| What would actually move? | `composer update <pkg> -W --dry-run` |

`why-not` is the primary instrument. Reach for it before forming any theory.

## Step 4 — Match the cause

Ordered most to least frequent. Confirm before fixing.

| Symptom | Cause | Confirm | Fix |
|---|---|---|---|
| A `symfony/*` package refuses to leave one minor line | `extra.symfony.require` caps every `symfony/*` package to that line, and the error output never names it | Read `extra.symfony.require` in `composer.json` | Usually nothing: the cap is intentional. Raising it is a separate, deliberate Symfony upgrade |
| "requires X ^2.0 -> found X 1.9 … but it conflicts with your root composer.json", for a package never required directly | A partial update is not allowed to move a locked transitive dependency | Re-run the same command with `-W` | `composer update <pkg> -W` |
| `php` or `ext-*` version complaints | Platform mismatch between host, container, and production | `composer check-platform-reqs` | Fix the container's PHP or extensions, or declare `config.platform` to pin the target |
| Resolves to `dev-*` or unexpected pre-release versions | `minimum-stability: dev` without `prefer-stable: true` | Read both keys in `composer.json` | Report it; adding `prefer-stable: true` is its own change |
| An explicit "conflicts with" coming from a package | That package declares a `conflict` rule | `composer why-not <pkg> <version>` | Choose compatible versions; never force |
| Package not found, or 401/404 on a private package | Private repository authentication (a `repositories` entry) | `composer diagnose` | Fix credentials; never remove the repository entry |
| Package reports as abandoned, or was renamed | `replace` / abandoned metadata | `composer show <pkg>` | Migrate to the named successor |

If none of these match, say so. Do not invent a cause.

## Step 5 — Propose, then apply

1. **Present** the root cause, the exact command, and what `composer update <pkg> -W --dry-run`
   reports will move.
2. **Wait** for explicit approval. `composer.json` and `composer.lock` are version-controlled.
3. **Apply** the approved command.
4. **Verify** with `composer validate --check-lock`, then report the version deltas that actually
   landed — including any that were not in the plan.

## When to stop

If three instruments from Step 3 do not converge on a cause, stop and report what has been ruled
out. Repeated `composer update` attempts are slow and mutate the lock; they are not a diagnostic
technique.
