#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
ARCHIVE_PATH="$PROJECT_ROOT/dist-web.tar.gz"
ENV_FILE="$PROJECT_ROOT/.env.production"

info() {
  printf "\\n[ship-web] %s\\n" "$1"
}

if ! command -v node >/dev/null 2>&1; then
  echo "[ship-web] node is required but was not found in PATH." >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "[ship-web] npx is required but was not found in PATH." >&2
  exit 1
fi

info "Project root: $PROJECT_ROOT"

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  info "Installing dependencies (node_modules missing)"
  (cd "$PROJECT_ROOT" && npm install)
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "[ship-web] Expected production environment file at $ENV_FILE." >&2
  echo "[ship-web] Create it (or symlink) before running this script so Expo can resolve production secrets." >&2
  exit 1
fi

info "Loading environment from $ENV_FILE"
set +u
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
# Explicitly export the variables to ensure they're available to child processes
export EXPO_PUBLIC_SUPABASE_URL
export EXPO_PUBLIC_SUPABASE_ANON_KEY
export EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
set -u
set +a

# Verify environment variables are set
if [ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "[ship-web] ERROR: Required environment variables are not set!" >&2
  echo "[ship-web] EXPO_PUBLIC_SUPABASE_URL: ${EXPO_PUBLIC_SUPABASE_URL:-NOT SET}" >&2
  echo "[ship-web] EXPO_PUBLIC_SUPABASE_ANON_KEY: ${EXPO_PUBLIC_SUPABASE_ANON_KEY:+SET (hidden)}" >&2
  exit 1
fi

info "Cleaning previous web build output"
rm -rf "$DIST_DIR" "$ARCHIVE_PATH"

info "Exporting optimized web bundle with environment variables"
(cd "$PROJECT_ROOT" && npx expo export -p web --clear)

if [ ! -d "$DIST_DIR" ]; then
  echo "[ship-web] Expo export did not produce $DIST_DIR; aborting." >&2
  exit 1
fi

# Ensure Azure Static Web Apps config is copied to dist
PUBLIC_CONFIG="$PROJECT_ROOT/public/staticwebapp.config.json"
if [ -f "$PUBLIC_CONFIG" ]; then
  info "Copying Azure Static Web Apps config to dist"
  cp "$PUBLIC_CONFIG" "$DIST_DIR/staticwebapp.config.json"
fi

info "Creating archive $ARCHIVE_PATH"
tar -czf "$ARCHIVE_PATH" -C "$PROJECT_ROOT" dist

info "All done!"
echo "• Deploy the contents of $DIST_DIR to your static host."
echo "• Or upload $ARCHIVE_PATH and extract it on the server."
echo "Remember to set the same Supabase environment variables in your hosting provider."

