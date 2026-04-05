#!/bin/bash
# Shared helpers for chat blue-green deployment.

readonly CHAT_COMPOSE="${CHAT_COMPOSE:-docker-compose -f docker-compose.chat.prod.yml}"
readonly CHAT_UPSTREAM_FILE="${CHAT_UPSTREAM_FILE:-./chat/nginx/upstream.conf}"
readonly HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"

wait_healthy() {
    local container=$1
    local elapsed=0

    echo "[health] Waiting for ${container} to be healthy..."

    while [ "$elapsed" -lt "$HEALTH_TIMEOUT" ]; do
        local status
        status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container" 2>/dev/null || echo "missing")

        if [ "$status" = "healthy" ]; then
            echo "[health] ${container} is healthy."
            return 0
        fi

        echo "[health] status=${status} (${elapsed}s)"
        sleep 5
        elapsed=$((elapsed + 5))
    done

    echo "[error] ${container} did not become healthy within ${HEALTH_TIMEOUT}s."
    return 1
}

switch_upstream() {
    local target=$1

    if [ "$(docker inspect --format='{{.State.Status}}' cohi-chat-nginx 2>/dev/null)" != "running" ]; then
        echo "[nginx] chat-nginx is not running. Aborting."
        return 1
    fi

    cat > "$CHAT_UPSTREAM_FILE" <<EOF
upstream chat {
    server chat-server-${target}:3001;
}
EOF

    docker exec cohi-chat-nginx nginx -t
    docker exec cohi-chat-nginx nginx -s reload
    echo "[nginx] Traffic switched to chat-server-${target}."
}

stop_slot() {
    local color=$1
    echo "[cleanup] Stopping chat-server-${color}..."
    $CHAT_COMPOSE stop "chat-server-${color}" || true
}
