#!/bin/bash
# Shared helpers for blue-green deployment scripts.

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

    echo "[health] Waiting for ${label} to be healthy (max ${HEALTH_TIMEOUT}s)..."

    while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
        local status
        status=$(container_health "$container_name")

        if [ "$status" = "healthy" ]; then
            echo "[health] ${label} is healthy."
            return 0
        fi

        echo "[health] Status=${status}, elapsed=${elapsed}s ..."
        sleep $HEALTH_INTERVAL
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
