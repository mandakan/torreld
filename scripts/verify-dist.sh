#!/usr/bin/env bash
# Verify the built dist/ tree before it ships:
#   - no unresolved <!-- INJECT:* --> tokens in index.html
#   - favicon and default OG card present
#   - every per-pack stub has its OG png and an absolute og:image URL
#
# Pack IDs are discovered from dist/p/* so a newly added pack is checked automatically -
# no hardcoded list to drift (that gap is exactly how hfo-masters slipped past the old
# inline check). Needs a full build with librsvg so the PNGs exist. Shared by the PR CI
# workflow (.github/workflows/ci.yml) and the deploy workflow (deploy.yml).
set -euo pipefail

DIST=${1:-dist}
fail=0
err() { echo "::error::$1"; fail=1; }

[ -f "$DIST/index.html" ] || err "missing $DIST/index.html"
if grep -n 'INJECT:' "$DIST/index.html" >/dev/null 2>&1; then
  err "$DIST/index.html contains unresolved <!-- INJECT:* --> tokens"
fi
[ -f "$DIST/favicon.png" ] || err "missing $DIST/favicon.png"
[ -f "$DIST/og/default.png" ] || err "missing $DIST/og/default.png"

shopt -s nullglob
packs=("$DIST"/p/*/)
if [ ${#packs[@]} -eq 0 ]; then
  err "no per-pack stubs found under $DIST/p/"
fi
for dir in "${packs[@]}"; do
  pid=$(basename "$dir")
  [ -f "$DIST/og/$pid.png" ] || err "missing $DIST/og/$pid.png"
  [ -f "$DIST/p/$pid/index.html" ] || err "missing stub for $pid"
  grep -q "https://torreld.urdr.dev/og/$pid.png" "$DIST/p/$pid/index.html" \
    || err "stub $pid missing absolute og:image"
done

if [ "$fail" -eq 0 ]; then
  ids=$(for d in "${packs[@]}"; do basename "$d"; done | tr '\n' ' ')
  echo "verify-dist: OK - ${#packs[@]} packs: ${ids}"
fi
exit "$fail"
