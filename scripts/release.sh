#!/usr/bin/env bash
set -euo pipefail

# Create or update a GitHub release and upload the deploy tarball.
# Requires GITHUB_TOKEN env var with repo write permissions.
# Optional env vars:
#  - GITHUB_REPOSITORY (owner/repo). If absent the script will try to infer from git remote.
#  - TAG (release tag). Defaults to v<package.json version>.
#  - ENV_FILE (path to .env). Defaults to project root .env.

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

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[release] ERROR: GITHUB_TOKEN environment variable is not set. Create a token with repo scope and export it (or put GITHUB_TOKEN=... in $ENV_FILE)."
  exit 1
fi

# determine repository
REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  git_url=$(git config --get remote.origin.url || true)
  if [ -z "$git_url" ]; then
    echo "[release] ERROR: cannot determine repository (no GITHUB_REPOSITORY and no git remote origin)"
    exit 1
  fi
  # handle git@github.com:owner/repo.git and https://github.com/owner/repo.git
  if [[ "$git_url" =~ github.com[:/](.+) ]]; then
    REPO="${BASH_REMATCH[1]}"
    REPO=${REPO%.git}
  fi
fi

echo "[release] Repository: $REPO"

# version/tag
VERSION=$(node -e "console.log(require('./package.json').version)")
TAG="${TAG:-v$VERSION}"
echo "[release] Tag: $TAG"

API_BASE="https://api.github.com/repos/$REPO"
AUTH_HEADER=( -H "Authorization: token $GITHUB_TOKEN" )
ACCEPT_JSON=( -H "Accept: application/vnd.github+json" )

create_release() {
  echo "[release] Creating release $TAG..."
  resp=$(curl -s -X POST "${API_BASE}/releases" "${AUTH_HEADER[@]}" "${ACCEPT_JSON[@]}" -d "{\"tag_name\":\"$TAG\",\"name\":\"$TAG\",\"draft\":false,\"prerelease\":false}")
  echo "$resp"
}

get_release_by_tag() {
  curl -s "${API_BASE}/releases/tags/$TAG" "${AUTH_HEADER[@]}" "${ACCEPT_JSON[@]}"
}

# Try to create release. If it already exists, fetch it.
create_resp=$(create_release || true)

# determine if creation succeeded or release exists
release_id=$(echo "$create_resp" | python3 - <<'PY'
import sys, json
try:
    j=json.load(sys.stdin)
    if 'id' in j:
        print(j['id'])
    else:
        # creation failed, try to detect message
        print('')
except Exception:
    print('')
PY
)

if [ -z "$release_id" ]; then
  echo "[release] Release creation returned no id; trying to fetch existing release by tag..."
  get_resp=$(get_release_by_tag)
  release_id=$(echo "$get_resp" | python3 - <<'PY'
import sys, json
try:
    j=json.load(sys.stdin)
    print(j.get('id',''))
except Exception:
    print('')
PY
)
  if [ -z "$release_id" ]; then
    echo "[release] ERROR: failed to create or fetch release. Response was:" >&2
    echo "$create_resp" >&2
    exit 1
  fi
fi

echo "[release] Using release id: $release_id"

# delete existing asset with same name if present
assets_resp=$(curl -s "${API_BASE}/releases/$release_id/assets" "${AUTH_HEADER[@]}" "${ACCEPT_JSON[@]}")
asset_id=$(echo "$assets_resp" | python3 - <<PY
import sys, json
try:
    arr=json.load(sys.stdin)
    for a in arr:
        if a.get('name','') == '$TAR_NAME':
            print(a.get('id',''))
            break
except Exception:
    pass
PY
)

if [ -n "$asset_id" ]; then
  echo "[release] Deleting existing asset id $asset_id with name $TAR_NAME"
  curl -s -X DELETE "${API_BASE}/releases/assets/$asset_id" "${AUTH_HEADER[@]}"
fi

echo "[release] Uploading $TAR_NAME to release $TAG"
UPLOAD_URL="https://uploads.github.com/repos/$REPO/releases/$release_id/assets?name=$(basename "$TAR_NAME")"
curl -s -X POST "$UPLOAD_URL" "${AUTH_HEADER[@]}" -H "Content-Type: application/gzip" --data-binary @"$TAR_PATH" > /dev/null

echo "[release] Done. Release $TAG updated with $TAR_NAME"

exit 0
