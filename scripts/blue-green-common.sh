#!/bin/bash
# Shared helpers for blue-green deployment scripts.

readonly COMPOSE="${COMPOSE:-docker-compose -p cohi-chat --env-file .env -f infra/app/docker-compose.server.yml -f infra/observability/docker-compose.backend-observability.yml}"
readonly NGINX_UPSTREAM_FILE="${NGINX_UPSTREAM_FILE:-./infra/app/nginx/upstream.conf}"
readonly HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
readonly DRAIN_DELAY_SECONDS="${DRAIN_DELAY_SECONDS:-15}"

print_banner() {
    local message=$1
    echo "=============================="
    echo " ${message}"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="
}

opposite_color() {
    local color=$1
    if [ "$color" = "blue" ]; then
        echo "green"
        return 0
    fi

    echo "blue"
}

container_status() {
    local name=$1
    docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null || echo "missing"
}

container_health() {
    local name=$1
    docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$name" 2>/dev/null || echo "missing"
}

detect_active() {
    local blue_status green_status
    blue_status=$(container_status "cohi-chat-backend-blue")
    green_status=$(container_status "cohi-chat-backend-green")

    if [ "$blue_status" = "running" ] && [ "$green_status" != "running" ]; then
        echo "blue"
        return 0
    fi

    if [ "$green_status" = "running" ] && [ "$blue_status" != "running" ]; then
        echo "green"
        return 0
    fi

    if [ ! -s "$NGINX_UPSTREAM_FILE" ]; then
        echo "[warn] Upstream file is missing or empty. Defaulting to blue." >&2
        echo "blue"
        return 0
    fi

    grep -q "backend-blue" "$NGINX_UPSTREAM_FILE" && echo "blue" || echo "green"
}

wait_healthy() {
    local container_name=$1
    local label=$2
    local elapsed=0
    local last_status=""

    echo "[health] Waiting for ${label} to be healthy (max ${HEALTH_TIMEOUT}s)..."

    while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
        local status
        status=$(container_health "$container_name")

        if [ "$status" = "healthy" ]; then
            echo "[health] ${label} is healthy."
            return 0
        fi

        if [ "$status" != "$last_status" ]; then
            echo "[health] ${label} status=${status} (elapsed=${elapsed}s)"
            last_status=$status
        fi

        sleep "$HEALTH_INTERVAL"
        elapsed=$((elapsed + HEALTH_INTERVAL))
    done

    echo "[error] ${label} did not become healthy within ${HEALTH_TIMEOUT}s."
    return 1
}

container_running() {
    local container=$1
    local state
    state=$(container_status "cohi-chat-backend-${container}")
    [ "$state" = "running" ]
}

ensure_nginx_running() {
    local nginx_status
    nginx_status=$(container_status "cohi-chat-nginx")

    if [ "$nginx_status" != "running" ]; then
        echo "[nginx] Starting nginx..."
        $COMPOSE up -d nginx
    fi
}

stop_backend_if_running() {
    local color=$1
    local context=$2

    if [ "$DRAIN_DELAY_SECONDS" -gt 0 ]; then
        echo "[drain] Waiting ${DRAIN_DELAY_SECONDS}s before stopping backend-${color}..."
        sleep "$DRAIN_DELAY_SECONDS"
    fi

    echo "[cleanup] Stopping ${context} backend-${color}..."
    $COMPOSE stop "backend-${color}" || echo "[warn] backend-${color} was not running, skipping stop."
}

switch_upstream() {
    local target=$1
    local backup="${NGINX_UPSTREAM_FILE}.bak"

    echo "[nginx] Switching upstream to backend-${target}"
    cp "$NGINX_UPSTREAM_FILE" "$backup"
    cat > "$NGINX_UPSTREAM_FILE" <<EOF
# Blue-Green deployment upstream target
upstream backend {
    server backend-${target}:8080;
}
EOF

    if ! docker exec cohi-chat-nginx nginx -t >/dev/null 2>&1; then
        echo "[nginx] configuration test failed, reverting upstream"
        cp "$backup" "$NGINX_UPSTREAM_FILE"
        docker exec cohi-chat-nginx nginx -s reload >/dev/null 2>&1 || true
        rm -f "$backup"
        return 1
    fi

    if ! docker exec cohi-chat-nginx nginx -s reload >/dev/null 2>&1; then
        echo "[nginx] reload failed, reverting upstream"
        cp "$backup" "$NGINX_UPSTREAM_FILE"
        docker exec cohi-chat-nginx nginx -s reload >/dev/null 2>&1 || true
        rm -f "$backup"
        return 1
    fi

    rm -f "$backup"
    echo "[nginx] Reloaded. Traffic now routed to backend-${target}."
}
