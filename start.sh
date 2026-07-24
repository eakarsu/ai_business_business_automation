#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$project_dir/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$project_dir/.env"
  set +a
fi

required() { [[ -n "${!1:-}" ]] || { echo "$1 is required" >&2; exit 1; }; }
require_config() {
  required DATABASE_URL
  required JWT_SECRET
  required OPENROUTER_API_KEY
  required OPENROUTER_MODEL
  required OPENROUTER_BASE_URL
  required BACKEND_PORT
  required FRONTEND_PORT
  required PROVISION_ADMIN_EMAIL
  required PROVISION_ADMIN_PASSWORD
  required PROVISION_ADMIN_NAME
  required PROVISION_COMPANY_NAME
  [[ ${#JWT_SECRET} -ge 32 ]] || { echo 'JWT_SECRET must be at least 32 characters' >&2; exit 1; }
  [[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo 'BACKEND_PORT and FRONTEND_PORT must differ' >&2; exit 1; }
}
migrate() {
  [[ "${ALLOW_SCHEMA_MIGRATION:-}" == 1 || "${ALLOW_SCHEMA_MIGRATION:-}" == true ]] || { echo 'Set ALLOW_SCHEMA_MIGRATION=true' >&2; exit 1; }
  (cd "$project_dir/backend" && npx prisma migrate deploy)
}
start_services() {
  migrate
  BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin npm --prefix "$project_dir/backend" run create-admin
  cleanup() {
    trap - INT TERM EXIT
    [[ -z "${frontend_pid:-}" ]] || kill "$frontend_pid" 2>/dev/null || true
    [[ -z "${backend_pid:-}" ]] || kill "$backend_pid" 2>/dev/null || true
    [[ -z "${frontend_pid:-}" ]] || wait "$frontend_pid" 2>/dev/null || true
    [[ -z "${backend_pid:-}" ]] || wait "$backend_pid" 2>/dev/null || true
  }
  trap cleanup INT TERM EXIT
  PORT="$BACKEND_PORT" NODE_ENV=development CLIENT_URL="http://127.0.0.1:$FRONTEND_PORT" CORS_ORIGIN="http://127.0.0.1:$FRONTEND_PORT" npm --prefix "$project_dir/backend" start &
  backend_pid=$!
  PORT="$FRONTEND_PORT" HOSTNAME=127.0.0.1 NEXT_PUBLIC_API_URL="http://127.0.0.1:$BACKEND_PORT" npm --prefix "$project_dir/frontend" start -- --hostname 127.0.0.1 --port "$FRONTEND_PORT" &
  frontend_pid=$!
  wait "$backend_pid" "$frontend_pid"
}

case "${1:-start}" in
  check) npm --prefix "$project_dir/backend" run build && npm --prefix "$project_dir/backend" test && NODE_ENV=production npm --prefix "$project_dir/frontend" run build ;;
  migrate) require_config; migrate ;;
  start) require_config; start_services ;;
  *) echo 'usage: ./start.sh [check|migrate|start]' >&2; exit 2 ;;
esac
