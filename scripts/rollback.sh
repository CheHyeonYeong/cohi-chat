#!/bin/bash
# Blue-Green rollback script
# Usage: bash scripts/rollback.sh
#
# Immediately switch traffic back to the previous backend.

set -euo pipefail

COMPOSE="docker-compose -p cohi-chat --env-file .env -f infra/app/docker-compose.server.yml -f infra/observability/docker-compose.backend-observability.yml"
NGINX_UPSTREAM_FILE="./infra/app/nginx/upstream.conf"
HEALTH_TIMEOUT=60
HEALTH_INTERVAL=5

source "$(dirname "$0")/blue-green-common.sh"

main() {
    echo "=============================="
    echo " Rollback Start"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="

    local active
    active=$(detect_active)
    local previous
    previous=$([ "$active" = "blue" ] && echo "green" || echo "blue")

    echo "[info] Active: ${active} -> Rolling back to: ${previous}"

    if container_running "$previous"; then
        echo "[info] backend-${previous} is already running. Waiting for health."
        wait_healthy "cohi-chat-backend-${previous}" "backend-${previous}"
    else
        echo "[info] backend-${previous} is stopped. Starting it..."
        $COMPOSE start "backend-${previous}"
        wait_healthy "cohi-chat-backend-${previous}" "backend-${previous}"
    fi

    ensure_nginx_running
    switch_upstream "$previous"

    echo "[cleanup] Stopping problematic backend-${active}..."
    $COMPOSE stop "backend-${active}" || echo "[warn] backend-${active} was not running, skipping stop."

    echo "=============================="
    echo " Rollback Success: ${previous} is now active"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="
    echo ""
    echo "[next] After fixing the issue, redeploy with 'bash scripts/blue-green-deploy.sh'."
}

main "$@"
