#!/usr/bin/env bash
# Mirror webapp/ from the FF69 monorepo to the public repo.
#
# Run from the monorepo root, after committing your webapp/ changes:
#   bash webapp/scripts/publish.sh [remote]
#
# Default remote is "webapp-public" (add it once with:
#   git remote add webapp-public https://github.com/epsilonxe/ff69-pulmoscreen.git )
set -euo pipefail

REMOTE="${1:-webapp-public}"
cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain webapp)" ]; then
  echo "webapp/ has uncommitted changes — commit them first." >&2
  exit 1
fi

git subtree push --prefix=webapp "$REMOTE" main
echo "Pushed webapp/ -> $REMOTE main"
