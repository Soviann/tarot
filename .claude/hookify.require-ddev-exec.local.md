---
name: require-ddev-exec
enabled: true
event: bash
action: block
conditions:
  - field: command
    operator: regex_match
    pattern: \bbin/(?:phpunit|console)\b|\bvendor/bin/|\bcomposer\b|\bnpm\b|\bnpx\b
  - field: command
    operator: not_contains
    pattern: ddev exec
---

**Command outside DDEV container detected!**

`bin/console`, `vendor/bin/*`, `composer`, `npm` and `npx` commands must run inside the DDEV container.

**Use Makefile targets:**
- `make test-back` / `make test-front` → tests
- `make phpstan` / `make cs` → code quality
- `make db-diff` / `make db-migrate` → migrations
- `make install` → dependencies
- `make sf CMD="..."` → any Symfony command

Or via ddev: `ddev exec bash -c 'cd /var/www/html/backend && ...'`
