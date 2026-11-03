#!/usr/bin/env bash
#
# Deploys document-service-ui with Docker Compose (deploy/docker-compose.yaml).
#
# The image is built from the local sources as a production build and its container is recreated
# when the image changed. The UI proxies /api/v1 to the mcp-document-service it is pointed at; that
# service is not deployed here.
#
# Settings come from environment variables, then deploy/.env, then the defaults described in README.md.
#
# Usage: ./deploy.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.yaml"
ENV_FILE="$ROOT_DIR/deploy/.env"
UI_SERVICE="document-service-ui"
HEALTH_TIMEOUT_SECONDS=300

compose() {
  docker compose --file "$COMPOSE_FILE" "$@"
}

# Prints a setting from the environment, else from deploy/.env, else the given default.
setting() {
  local name="$1" default="$2" line value
  if [[ -n "${!name:-}" ]]; then
    printf '%s' "${!name}"
    return
  fi
  if [[ -f "$ENV_FILE" ]]; then
    line="$(grep -E "^${name}=" "$ENV_FILE" | tail -n 1 || true)"
    if [[ -n "$line" ]]; then
      value="${line#*=}"
      value="${value%$'\r'}"
      value="${value#[\"\']}"
      value="${value%[\"\']}"
      printf '%s' "$value"
      return
    fi
  fi
  printf '%s' "$default"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_docker() {
  command -v docker >/dev/null 2>&1 || fail "docker is not installed or not on PATH."
  docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 (the 'docker compose' command) is required."
  docker info >/dev/null 2>&1 || fail "The Docker daemon is not reachable. Start Docker and try again."
}

project_version() {
  sed -n 's/^  "version": "\(.*\)".*/\1/p' "$ROOT_DIR/package.json" | head -n 1
}

deploy_ui() {
  echo "Building and deploying document-service-ui $UI_VERSION."
  if ! compose up --detach --build --wait --wait-timeout "$HEALTH_TIMEOUT_SECONDS" "$UI_SERVICE"; then
    compose logs --tail 100 "$UI_SERVICE" >&2 || true
    fail "document-service-ui did not start."
  fi
}

print_summary() {
  local port api_host api_port
  port="$(setting UI_PORT 5431)"
  api_host="$(setting API_HOST host.docker.internal)"
  api_port="$(setting API_PORT 55535)"
  cat <<SUMMARY

document-service-ui $UI_VERSION is running.
  UI:      http://<host>:$port
  API:     /api/v1 is proxied to http://$api_host:$api_port/api/v1
SUMMARY
}

main() {
  require_docker

  UI_VERSION="$(setting UI_VERSION "$(project_version)")"
  export UI_VERSION

  deploy_ui
  print_summary
}

main "$@"
