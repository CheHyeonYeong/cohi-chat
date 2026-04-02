#!/bin/bash
# Chat blue-green zero-downtime deploy script.

set -euo pipefail

HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"

source "$(dirname "$0")/chat-blue-green-common.sh"

main() {
    print_banner "Chat Blue-Green Deploy Start"

    local active
    active=$(detect_active)
    local inactive
    inactive=$(opposite_color "$active")

    echo "[info] Active: ${active} -> Deploying to: ${inactive}"

    echo "[deploy] Starting chat-server-${inactive} with new image..."
    $CHAT_COMPOSE up -d --no-deps "$(chat_service_name "$inactive")"

    wait_healthy "$(chat_container_name "$inactive")" "chat-server-${inactive}"
    ensure_nginx_running
    switch_upstream "$inactive"

    if ! smoke_check_proxy; then
        echo "[rollback] Smoke check failed after switching traffic. Reverting upstream..."
        switch_upstream "$active"
        stop_chat_if_running "$inactive" "failed"
        exit 1
    fi

    stop_chat_if_running "$active" "old"

    print_banner "Deploy Success: ${inactive} is now active"
}

main "$@"
