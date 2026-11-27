#!/bin/sh
# Runs in the sandbox guest only: opens each .eml with Quick Look (Apple Mail's
# com.apple.mail.MailQuickLookExtension), in light then dark appearance, and photographs it.
# Usage: sandbox run -- sh test/clients/apple-mail/run.sh [name ...]
# The .eml files come from `node test/clients/run.ts` (committed under eml/).
set -u
cd "$(dirname "$0")" || exit 1

set_mode() {
  osascript -e "tell application \"System Events\" to tell appearance preferences to set dark mode to $1"
  sleep 2
}

capture() {
  name="$1"; mode="$2"
  qlmanage -p "eml/$name.eml" >/dev/null 2>&1 &
  pid=$!
  n=0
  until osascript -e 'tell application "System Events" to exists (window 1 of process "qlmanage")' 2>/dev/null | grep -q true; do
    n=$((n + 1)); [ "$n" -ge 30 ] && break; sleep 1
  done
  sleep 3
  sandbox-shot "$name-$mode"
  kill "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null
}

if [ "$#" -gt 0 ]; then names="$*"; else names=$(ls eml | sed 's/\.eml$//'); fi
for mode in light dark; do
  if [ "$mode" = dark ]; then set_mode true; else set_mode false; fi
  for name in $names; do capture "$name" "$mode"; done
done
set_mode false
