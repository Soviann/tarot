---
name: no-schema-update
enabled: true
event: bash
pattern: doctrine:schema:update
action: block
---

**doctrine:schema:update est interdit**

Utilise toujours les migrations. Lance `make db-diff` pour générer une migration.
