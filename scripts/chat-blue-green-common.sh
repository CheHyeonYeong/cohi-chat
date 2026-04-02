#!/bin/bash
# Shared helpers for chat blue-green deployment.

readonly CHAT_COMPOSE="${CHAT_COMPOSE:-docker-compose -f docker-compose.chat.prod.yml}"
readonly CHAT_UPSTREAM_FILE="${CHAT_UPSTREAM_FILE:-./chat/nginx/upstream.conf}"
readonly HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
readonly DRAIN_DELAY_SECONDS="${DRAIN_DELAY_SECONDS:-10}"
readonly CHAT_SMOKE_PATH="${CHAT_SMOKE_PATH:-http://127.0.0.1/api/swagger-ui}"

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

chat_container_name() {
    local color=$1
    echo "cohi-chat-server-${color}"
}

chat_service_name() {
    local color=$1
    echo "chat-server-${color}"
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
    blue_status=$(container_status "$(chat_container_name blue)")
    green_status=$(container_status "$(chat_container_name green)")

    if [ "$blue_status" = "running" ] && [ "$green_status" != "running" ]; then
        echo "blue"
        return 0
    fi

    if [ "$green_status" = "running" ] && [ "$blue_status" != "running" ]; then
        echo "green"
        return 0
    fi

    if [ ! -s "$CHAT_UPSTREAM_FILE" ]; then
        echo "[warn] Chat upstream file is missing or empty. Defaulting to blue." >&2
        echo "blue"
        return 0
    fi

    grep -q "chat-server-blue" "$CHAT_UPSTREAM_FILE" && echo "blue" || echo "green"
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
    local color=$1
    local state
    state=$(container_status "$(chat_container_name "$color")")
    [ "$state" = "running" ]
}

ensure_nginx_running() {
    local nginx_status
    nginx_status=$(container_status "cohi-chat-nginx")

    if [ "$nginx_status" != "running" ]; then
        echo "[nginx] Starting chat-nginx..."
        $CHAT_COMPOSE up -d chat-nginx
    fi
}

stop_chat_if_running() {
    local color=$1
    local context=$2

    if [ "$DRAIN_DELAY_SECONDS" -gt 0 ]; then
        echo "[drain] Waiting ${DRAIN_DELAY_SECONDS}s before stopping ${context} chat-server-${color}..."
        sleep "$DRAIN_DELAY_SECONDS"
    fi

    echo "[cleanup] Stopping ${context} chat-server-${color}..."
    $CHAT_COMPOSE stop "$(chat_service_name "$color")" || echo "[warn] chat-server-${color} was not running, skipping stop."
}

switch_upstream() {
    local target=$1
    local backup="${CHAT_UPSTREAM_FILE}.bak"

    echo "[nginx] Switching upstream to chat-server-${target}"
    cp "$CHAT_UPSTREAM_FILE" "$backup"
    cat > "$CHAT_UPSTREAM_FILE" <<EOF
upstream chat {
    server chat-server-${target}:3001;
}
EOF

    if ! docker exec cohi-chat-nginx nginx -t >/dev/null 2>&1; then
        echo "[nginx] configuration test failed, reverting upstream"
        cp "$backup" "$CHAT_UPSTREAM_FILE"
        docker exec cohi-chat-nginx nginx -s reload >/dev/null 2>&1 || true
        rm -f "$backup"
        return 1
    fi

    if ! docker exec cohi-chat-nginx nginx -s reload >/dev/null 2>&1; then
        echo "[nginx] reload failed, reverting upstream"
        cp "$backup" "$CHAT_UPSTREAM_FILE"
        docker exec cohi-chat-nginx nginx -s reload >/dev/null 2>&1 || true
        rm -f "$backup"
        return 1
    fi

    rm -f "$backup"
    echo "[nginx] Reloaded. Traffic now routed to chat-server-${target}."
}

smoke_check_proxy() {
    echo "[smoke] Checking proxied chat response via nginx..."

    if docker exec cohi-chat-nginx wget --quiet --tries=1 --spider "$CHAT_SMOKE_PATH"; then
        echo "[smoke] Proxy smoke check passed."
        return 0
    fi

    echo "[smoke] Proxy smoke check failed for ${CHAT_SMOKE_PATH}."
    return 1
}
