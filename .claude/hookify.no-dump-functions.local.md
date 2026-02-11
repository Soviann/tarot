---
name: no-dump-functions
enabled: true
event: file
pattern: \b(dd|dump|var_dump)\s*\(
action: block
---

**Fonctions de debug interdites dans le code commité**

`dd()`, `dump()` et `var_dump()` ne doivent pas être écrits dans les fichiers.
Utilise le logging ou les assertions dans les tests.
