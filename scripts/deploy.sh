#!/usr/bin/env bash
set -euo pipefail

# Deploy a production build for transport.
# IMPORTANT: this script does NOT run the build. Run `npm run build` before using this.

ROOT_DIR=$(pwd)
DIST_DIR="$ROOT_DIR/dist_prod"
TAR_NAME="$ROOT_DIR/deploy.tar.gz"

echo "[deploy] Packaging production build (does NOT run build)"
echo "[deploy] Make sure you've run: npm run build  (or run: npm run build:prod to do both)"

echo "[deploy] Cleaning previous dist ($DIST_DIR)"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Files and directories to include in the transport bundle
INCLUDE=(
  "package.json"
  "package-lock.json"
  "server.js"
  "public"
  ".next"
  "next.config.ts"
  "lib"
)

echo "[deploy] Copying required files into dist"
for p in "${INCLUDE[@]}"; do
  if [ -e "$ROOT_DIR/$p" ]; then
    echo "  + $p"
    cp -R "$ROOT_DIR/$p" "$DIST_DIR/" || true
  fi
done

echo "[deploy] Installing production dependencies into dist"
# Install only production dependencies into the dist folder
npm install --production --prefix "$DIST_DIR"

# If project scripts reference runtime tooling that is normally a devDependency
# (for example "concurrently" used by "start:all"), install it into the dist
# so the extracted package can run without `npm install` on the target.
if grep -q 'concurrently' "$ROOT_DIR/package.json" && grep -q 'start:all' "$ROOT_DIR/package.json"; then
  echo "[deploy] Detected 'concurrently' referenced in package.json scripts — installing into dist"
  npm install --prefix "$DIST_DIR" concurrently --no-save
fi

# If Next configuration is in TypeScript (next.config.ts) or there's a tsconfig,
# Next will try to install TypeScript at runtime when starting. Include
# `typescript` in the bundle so `next start` on the target doesn't attempt to
# fetch it.
if [ -f "$ROOT_DIR/next.config.ts" ] || [ -f "$ROOT_DIR/tsconfig.json" ]; then
  echo "[deploy] Detected TypeScript config (next.config.ts or tsconfig.json) — installing 'typescript' into dist"
  npm install --prefix "$DIST_DIR" typescript --no-save
fi

echo "[deploy] Creating tar archive: $TAR_NAME"
rm -f "$TAR_NAME"
pushd "$DIST_DIR" >/dev/null
  tar -czf "$TAR_NAME" .
popd >/dev/null

# remove the dist directory after creating the tar
rm -rf "$DIST_DIR"

echo "[deploy] Done. Archive created at: $TAR_NAME"
echo "To transport: copy deploy.tar.gz to target, extract, then run: npm run start"

exit 0
