#!/bin/bash
# Blue-Green zero-downtime deploy script
# Usage: bash scripts/blue-green-deploy.sh
#
# Preconditions:
#   - latest code and .env are present on the EC2 host
#   - infra/app/docker-compose.server.yml defines nginx + backend-blue/green + redis
#   - infra/app/nginx/upstream.conf is mounted into the nginx container

set -euo pipefail

HEALTH_TIMEOUT=120

source "$(dirname "$0")/blue-green-common.sh"

main() {
    print_banner "Blue-Green Deploy Start"

    local active
    active=$(detect_active)
    local inactive
    inactive=$(opposite_color "$active")

    echo "[info] Active: ${active} -> Deploying to: ${inactive}"

    echo "[deploy] Starting backend-${inactive} with new image..."
    $COMPOSE up -d --no-deps --build "backend-${inactive}"

    wait_healthy "cohi-chat-backend-${inactive}" "backend-${inactive}"
    ensure_nginx_running
    switch_upstream "$inactive"

    stop_backend_if_running "$active" "old"

    if [ "${ENABLE_DOCKER_PRUNE:-1}" = "1" ]; then
        echo "[cleanup] Pruning dangling Docker images/build cache..."
        docker image prune -f >/dev/null 2>&1 || true
        docker builder prune -f >/dev/null 2>&1 || true
    fi

    print_banner "Deploy Success: ${inactive} is now active"
}

main "$@"
