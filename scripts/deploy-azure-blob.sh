#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
ENV_FILE="$PROJECT_ROOT/.env.azure"

info() {
  printf "\n[deploy-azure] %s\n" "$1"
}

warn() {
  printf "\n[deploy-azure][warn] %s\n" "$1"
}

fatal() {
  printf "\n[deploy-azure][error] %s\n" "$1" >&2
  exit 1
}

if ! command -v az >/dev/null 2>&1; then
  fatal "Azure CLI (az) is required but not installed. Install from https://learn.microsoft.com/cli/azure/install-azure-cli."
fi

info "Project root: $PROJECT_ROOT"

if [ -f "$ENV_FILE" ]; then
  info "Loading Azure deployment configuration from $ENV_FILE"
  set +u
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set -u
  set +a
else
  warn "No $ENV_FILE found. Assuming Azure credentials are already exported in the current shell."
fi

AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-}"
AZURE_STORAGE_CONTAINER="${AZURE_STORAGE_CONTAINER:-}"
AZURE_STORAGE_PATH="${AZURE_STORAGE_PATH:-}"
AZURE_STORAGE_CONNECTION_STRING="${AZURE_STORAGE_CONNECTION_STRING:-}"
AZURE_STORAGE_SAS_TOKEN="${AZURE_STORAGE_SAS_TOKEN:-}"
AZURE_STORAGE_ACCOUNT_KEY="${AZURE_STORAGE_ACCOUNT_KEY:-}"

if [ -z "$AZURE_STORAGE_CONTAINER" ]; then
  fatal "AZURE_STORAGE_CONTAINER must be provided (via environment or .env.azure)."
fi

if [ -n "$AZURE_STORAGE_CONNECTION_STRING" ]; then
  AUTH_MODE="connection-string"
elif [ -n "$AZURE_STORAGE_SAS_TOKEN" ]; then
  AUTH_MODE="sas-token"
elif [ -n "$AZURE_STORAGE_ACCOUNT" ] && [ -n "$AZURE_STORAGE_ACCOUNT_KEY" ]; then
  AUTH_MODE="account-key"
else
  fatal "Provide one of the following authentication methods:
  • AZURE_STORAGE_CONNECTION_STRING
  • AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_SAS_TOKEN
  • AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_ACCOUNT_KEY"
fi

if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A "$DIST_DIR")" ]; then
  fatal "Web build not found at $DIST_DIR. Run 'npm run ship:web' first."
fi

info "Uploading contents of $DIST_DIR to Azure Blob container '$AZURE_STORAGE_CONTAINER'"

UPLOAD_ARGS=("--destination" "$AZURE_STORAGE_CONTAINER" "--source" "$DIST_DIR" "--overwrite")

if [ -n "$AZURE_STORAGE_PATH" ]; then
  info "Using destination path '$AZURE_STORAGE_PATH'"
  UPLOAD_ARGS+=("--destination-path" "$AZURE_STORAGE_PATH")
fi

case "$AUTH_MODE" in
  "connection-string")
    UPLOAD_ARGS=("--connection-string" "$AZURE_STORAGE_CONNECTION_STRING" "${UPLOAD_ARGS[@]}")
    ;;
  "sas-token")
    UPLOAD_ARGS=("--account-name" "$AZURE_STORAGE_ACCOUNT" "--sas-token" "$AZURE_STORAGE_SAS_TOKEN" "${UPLOAD_ARGS[@]}")
    ;;
  "account-key")
    UPLOAD_ARGS=("--account-name" "$AZURE_STORAGE_ACCOUNT" "--account-key" "$AZURE_STORAGE_ACCOUNT_KEY" "${UPLOAD_ARGS[@]}")
    ;;
esac

set -x
az storage blob upload-batch "${UPLOAD_ARGS[@]}"
set +x

info "Deployment complete. Verify at your static site endpoint or CDN."

