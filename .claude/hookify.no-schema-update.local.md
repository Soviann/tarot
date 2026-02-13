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

**doctrine:schema:update is forbidden**

Always use migrations. Run `make db-diff` to generate a migration.
