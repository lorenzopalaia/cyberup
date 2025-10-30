#!/usr/bin/env bash
set -euo pipefail

OWNER="lorenzopalaia"
REPO="cyberup"
ASSET_NAME="deploy.tar.gz"
API="https://api.github.com/repos/${OWNER}/${REPO}/releases/latest"

# fetch release JSON
resp="$(curl -sS -H "Accept: application/vnd.github.v3+json" "$API")"

# extract browser_download_url for the requested asset
if command -v jq >/dev/null 2>&1; then
  url="$(printf '%s' "$resp" | jq -r --arg name "$ASSET_NAME" '.assets[] | select(.name==$name) | .browser_download_url' || true)"
else
  # fallback if jq is not available (basic awk-based parser)
  url="$(printf '%s' "$resp" | awk -v name="$ASSET_NAME" '
    BEGIN{FS="\""}
    /"name":/ {n=$4}
    /"browser_download_url":/ {u=$4; if(n==name){print u; exit}}
  ')"
fi

if [[ -z "${url:-}" || "$url" == "null" ]]; then
  echo "Errore: asset '$ASSET_NAME' non trovato nella release latest" >&2
  exit 1
fi

echo "Scarico '$ASSET_NAME' da: $url"
curl -fSL -o "$ASSET_NAME" "$url"