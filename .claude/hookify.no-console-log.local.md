---
name: no-console-log
enabled: true
event: file
pattern: \bconsole\.(log|debug|info|warn|error)\s*\(
action: block
---

**console.log interdit dans le code commité**

`console.log()` et variantes ne doivent pas être écrits dans les fichiers.
Utilise les tests ou le debugging navigateur à la place.
