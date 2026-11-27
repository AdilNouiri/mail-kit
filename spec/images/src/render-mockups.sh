#!/usr/bin/env bash
# Renders every spec/images/src/05-*.html to spec/images/ in light and dark, at 1280x800 and 390x844.
# Headless Chrome will not shrink its viewport under about 500px, so the phone size is an
# iframe of 390px centred in a 500px window, then a centred crop (sips crops from the centre).
set -euo pipefail
src="$(cd "$(dirname "$0")" && pwd)"
out="$(dirname "$src")"
chrome="${MOCKUP_CHROME:-$(find "$HOME/Library/Caches/ms-playwright" -name chrome-headless-shell -type f 2>/dev/null | sort | tail -1)}"
[ -x "$chrome" ] || { echo "set MOCKUP_CHROME to a chrome-headless-shell (npx playwright install chromium-headless-shell)"; exit 1; }
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

shot() { # url size png scheme(0 dark, 1 light)
  local profile; profile="$(mktemp -d "$tmp/p.XXXX")"
  "$chrome" --headless --mute-audio --disable-gpu --hide-scrollbars --user-data-dir="$profile" \
    --blink-settings=preferredColorScheme="$4" --window-size="$2" --screenshot="$3" "$1" >/dev/null 2>&1 || true
  [ -s "$3" ] || { echo "no screenshot: $3"; exit 1; }
}

for f in "$src"/05-*.html; do
  name="$(basename "$f" .html)"
  for scheme in 1 0; do
    suffix=""; [ "$scheme" = 0 ] && suffix="-dark"
    shot "file://$f" 1280,800 "$out/$name$suffix.png" "$scheme"
    printf '<style>html,body{margin:0}</style><iframe src="file://%s" width="390" height="844" style="border:0;display:block;margin-left:55px"></iframe>' "$f" > "$tmp/frame.html"
    shot "file://$tmp/frame.html" 500,844 "$out/$name$suffix-phone.png" "$scheme"
    sips -c 844 390 "$out/$name$suffix-phone.png" >/dev/null
  done
done
ls "$out"/*.png
