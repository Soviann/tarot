---
name: no-schema-update
enabled: true
event: bash
action: block
conditions:
  - field: command
    operator: regex_match
    pattern: \bdoctrine:schema:update\b
  - field: command
    operator: regex_match
    pattern: ^(ddev|make|php|bin/)
---

**doctrine:schema:update est interdit**

Utilise toujours les migrations. Lance `make db-diff` pour générer une migration.
