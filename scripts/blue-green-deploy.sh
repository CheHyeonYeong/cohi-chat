#!/bin/bash
# Blue-Green zero-downtime deploy script
# Usage: bash scripts/blue-green-deploy.sh
#
# Preconditions:
#   - latest code and .env are present on the EC2 host
#   - infra/app/docker-compose.server.yml defines nginx + backend-blue/green + redis
#   - infra/app/nginx/upstream.conf is mounted into the nginx container

set -euo pipefail

COMPOSE="docker-compose -p cohi-chat --env-file .env -f infra/app/docker-compose.server.yml -f infra/observability/docker-compose.backend-observability.yml"
NGINX_UPSTREAM_FILE="./infra/app/nginx/upstream.conf"
HEALTH_TIMEOUT=120
HEALTH_INTERVAL=5

source "$(dirname "$0")/blue-green-common.sh"

wait_redis_ready() {
    wait_healthy "cohi-chat-redis" "redis"
}

main() {
    echo "=============================="
    echo " Blue-Green Deploy Start"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="

    echo "[infra] Ensuring redis is running..."
    $COMPOSE up -d redis
    wait_redis_ready

    local active
    active=$(detect_active)
    local inactive
    inactive=$([ "$active" = "blue" ] && echo "green" || echo "blue")

    echo "[info] Active: ${active} -> Deploying to: ${inactive}"

    echo "[deploy] Starting backend-${inactive} with new image..."
    $COMPOSE up -d --no-deps --build "backend-${inactive}"

    wait_healthy "cohi-chat-backend-${inactive}" "backend-${inactive}"
    ensure_nginx_running
    switch_upstream "$inactive"

    echo "[cleanup] Stopping old backend-${active}..."
    $COMPOSE stop "backend-${active}" || echo "[warn] backend-${active} was not running, skipping stop."

    if [ "${ENABLE_DOCKER_PRUNE:-1}" = "1" ]; then
        echo "[cleanup] Pruning dangling Docker images/build cache..."
        docker image prune -f >/dev/null 2>&1 || true
        docker builder prune -f >/dev/null 2>&1 || true
    fi

    echo "=============================="
    echo " Deploy Success: ${inactive} is now active"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="
}

main "$@"
