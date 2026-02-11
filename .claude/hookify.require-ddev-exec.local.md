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

**Commande hors conteneur DDEV détectée !**

Les commandes `bin/console`, `vendor/bin/*`, `composer`, `npm` et `npx` doivent être exécutées dans le conteneur DDEV.

**Utilise les cibles Makefile :**
- `make test-back` / `make test-front` → tests
- `make phpstan` / `make cs` → qualité de code
- `make db-diff` / `make db-migrate` → migrations
- `make install` → dépendances
- `make sf CMD="..."` → commande Symfony quelconque

Ou via ddev : `ddev exec bash -c 'cd /var/www/html/backend && ...'`
