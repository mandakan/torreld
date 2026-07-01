#!/usr/bin/env bash
# Host PR screenshot PNGs on the orphan `ci-previews` branch so a PR comment can embed
# them inline via raw.githubusercontent.com. That URL only renders in comments on a
# PUBLIC repo - on a private repo GitHub's image proxy can't fetch it. `publish` is called
# by CI (.github/workflows/ci.yml); `remove` is a manual pruning tool - no workflow runs it,
# so previews persist after a PR closes and merged PRs keep their inline screenshots.
#
# Each PR owns a pr-<n>/ directory, overwritten on every push, so the branch holds at
# most one image set per PR. Uses the repo's already-authenticated origin via a throwaway
# worktree, and retries on push races.
#
#   scripts/previews.sh publish <pr-number> <dir-of-pngs>
#   scripts/previews.sh remove  <pr-number>
set -euo pipefail

BRANCH="ci-previews"
cmd="${1:-}"
pr="${2:-}"
[ -n "$cmd" ] && [ -n "$pr" ] || { echo "usage: previews.sh publish <pr> <dir> | remove <pr>" >&2; exit 2; }

parent="$(mktemp -d)"
wt="$parent/wt"
trap 'git worktree remove -f "$wt" 2>/dev/null || true; rm -rf "$parent"' EXIT

git config user.name  "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# Put the ci-previews branch (or a fresh orphan) into the worktree at $wt.
checkout_branch() {
  git worktree remove -f "$wt" 2>/dev/null || true
  if git fetch --no-tags origin "$BRANCH" 2>/dev/null; then
    git worktree add -f "$wt" "origin/$BRANCH" >/dev/null
    git -C "$wt" checkout -B "$BRANCH" >/dev/null 2>&1
    return 0
  fi
  return 1   # branch does not exist yet
}

case "$cmd" in
  publish)
    src="${3:?usage: previews.sh publish <pr> <dir>}"
    ls "$src"/*.png >/dev/null 2>&1 || { echo "no PNGs in $src" >&2; exit 1; }
    for attempt in 1 2 3; do
      if ! checkout_branch; then
        git worktree add -f --detach "$wt" >/dev/null
        git -C "$wt" checkout --orphan "$BRANCH" >/dev/null 2>&1
        git -C "$wt" rm -rf . >/dev/null 2>&1 || true
      fi
      rm -rf "$wt/pr-$pr"
      mkdir -p "$wt/pr-$pr"
      cp "$src"/*.png "$wt/pr-$pr/"
      git -C "$wt" add -A
      git -C "$wt" commit -q -m "previews: PR #$pr" || { echo "no changes"; exit 0; }
      if git -C "$wt" push origin "HEAD:$BRANCH" 2>/dev/null; then echo "published pr-$pr"; exit 0; fi
      echo "push race, retry $attempt" >&2; sleep $((attempt * 3))
    done
    echo "publish failed after retries" >&2; exit 1 ;;

  remove)
    for attempt in 1 2 3; do
      checkout_branch || { echo "no $BRANCH branch; nothing to remove"; exit 0; }
      [ -d "$wt/pr-$pr" ] || { echo "no pr-$pr dir; nothing to remove"; exit 0; }
      git -C "$wt" rm -rq "pr-$pr"
      git -C "$wt" commit -q -m "previews: remove PR #$pr"
      if git -C "$wt" push origin "HEAD:$BRANCH" 2>/dev/null; then echo "removed pr-$pr"; exit 0; fi
      echo "push race, retry $attempt" >&2; sleep $((attempt * 3))
    done
    echo "remove failed after retries" >&2; exit 1 ;;

  *) echo "usage: previews.sh publish <pr> <dir> | remove <pr>" >&2; exit 2 ;;
esac
