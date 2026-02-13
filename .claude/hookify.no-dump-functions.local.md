---
name: no-dump-functions
enabled: true
event: file
pattern: \b(dd|dump|var_dump)\s*\(
action: block
---

**Debug functions are forbidden in committed code**

`dd()`, `dump()` and `var_dump()` must not be written to files.
Use logging or test assertions instead.
