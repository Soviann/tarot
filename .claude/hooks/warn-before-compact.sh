#!/bin/bash
# UserPromptSubmit hook — warns the main Claude to invoke the session-handoff
# skill when the transcript size approaches the auto-compact threshold.
# Tuned for Opus 4.6 with the 1M context window (claude-opus-4-6[1m]).

INPUT=$(cat)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty')

if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then
  exit 0
fi

# Portable byte size (macOS + Linux)
SIZE=$(stat -f %z "$TRANSCRIPT" 2>/dev/null || stat -c %s "$TRANSCRIPT" 2>/dev/null || echo 0)

# Thresholds calibrated from observed auto-compact events on this project
# (~850 KB transcript size). Soft = early warning, hard = urgent.
SOFT=716800    # ~700 KB
HARD=808960    # ~790 KB

if [ "$SIZE" -ge "$HARD" ]; then
  MSG="CONTEXT CRITICAL ($(( SIZE / 1024 )) KB transcript) — auto-compact imminent. BEFORE responding to the user's request, warn them that auto-compact is about to fire and ASK whether they want you to invoke the session-handoff skill now to save state to .claude/session-handoff.md. Do NOT launch session-handoff without their explicit confirmation."
elif [ "$SIZE" -ge "$SOFT" ]; then
  MSG="Context is getting large ($(( SIZE / 1024 )) KB transcript). Warn the user that auto-compact may fire soon and ASK whether they want you to invoke the session-handoff skill at the next natural checkpoint to preserve state in .claude/session-handoff.md. Do NOT launch session-handoff without their explicit confirmation."
else
  exit 0
fi

jq -n --arg ctx "$MSG" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$ctx}}'
