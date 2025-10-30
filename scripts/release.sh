#!/usr/bin/env bash
set -euo pipefail

# GitHub-CLI-only release script
# Requires: gh CLI installed and authenticated (or GITHUB_TOKEN exported)

ROOT_DIR=$(pwd)
TAR_NAME="deploy.tar.gz"
TAR_PATH="$ROOT_DIR/$TAR_NAME"

# Load .env if present (and export its variables)
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
if [ -f "$ENV_FILE" ]; then
  echo "[release] Loading environment from $ENV_FILE"
  # shellcheck disable=SC1090
  set -o allexport
  . "$ENV_FILE"
  set +o allexport
fi

if [ ! -f "$TAR_PATH" ]; then
  echo "[release] ERROR: $TAR_NAME not found in project root. Run npm run build:prod first."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "[release] ERROR: GitHub CLI 'gh' not found. Install it (e.g. 'brew install gh') and authenticate (gh auth login) or set GITHUB_TOKEN." >&2
  exit 1
fi

# ensure authenticated or token provided
if [ -z "${GITHUB_TOKEN:-}" ] && ! gh auth status >/dev/null 2>&1; then
  echo "[release] ERROR: gh not authenticated and GITHUB_TOKEN not set. Run 'gh auth login' or export GITHUB_TOKEN with repo scope." >&2
  exit 1
fi

# determine repository (owner/repo)
REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  git_url=$(git config --get remote.origin.url || true)
  if [ -z "$git_url" ]; then
    echo "[release] ERROR: cannot determine repository (no GITHUB_REPOSITORY and no git remote origin)" >&2
    exit 1
  fi
  if [[ "$git_url" =~ github.com[:/](.+) ]]; then
    REPO="${BASH_REMATCH[1]}"
    REPO=${REPO%.git}
  fi
fi

VERSION=$(node -e "console.log(require('./package.json').version)")
TAG="${TAG:-v$VERSION}"

echo "[release] Using repo: $REPO" >&2
echo "[release] Using tag: $TAG" >&2

# create or upload using gh
if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "[release] Release $TAG exists; uploading asset with gh" >&2
  gh release upload "$TAG" "$TAR_PATH" --repo "$REPO" --clobber
  echo "[release] Done. Release $TAG updated with $TAR_NAME" >&2
  exit 0
else
  echo "[release] Creating release $TAG with gh and uploading asset" >&2
  gh release create "$TAG" "$TAR_PATH" --repo "$REPO" --title "$TAG" --notes ""
  echo "[release] Done. Release $TAG created and asset uploaded" >&2
  exit 0
fi
