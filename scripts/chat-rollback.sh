#!/bin/bash
# Chat blue-green rollback script.

set -euo pipefail

HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"

source "$(dirname "$0")/chat-blue-green-common.sh"

main() {
    print_banner "Chat Rollback Start"

    local active
    active=$(detect_active)
    local previous
    previous=$(opposite_color "$active")

    echo "[info] Active: ${active} -> Rolling back to: ${previous}"

    if container_running "$previous"; then
        echo "[info] chat-server-${previous} is already running. Waiting for health."
        wait_healthy "$(chat_container_name "$previous")" "chat-server-${previous}"
    else
        echo "[info] chat-server-${previous} is stopped. Starting it..."
        $CHAT_COMPOSE up -d --no-deps "$(chat_service_name "$previous")"
        wait_healthy "$(chat_container_name "$previous")" "chat-server-${previous}"
    fi

    ensure_nginx_running
    switch_upstream "$previous"
    stop_chat_if_running "$active" "problematic"

    print_banner "Rollback Success: ${previous} is now active"
    echo ""
    echo "[next] After fixing the issue, redeploy with 'bash scripts/chat-blue-green-deploy.sh'."
}

main "$@"
