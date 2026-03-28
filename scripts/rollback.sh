#!/bin/bash
# Blue-Green rollback script
# Usage: bash scripts/rollback.sh
#
# Immediately switch traffic back to the previous backend.

set -euo pipefail

HEALTH_TIMEOUT=120

source "$(dirname "$0")/blue-green-common.sh"

main() {
    print_banner "Rollback Start"

    local active
    active=$(detect_active)
    local previous
    previous=$(opposite_color "$active")

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

    stop_backend_if_running "$active" "problematic"

    print_banner "Rollback Success: ${previous} is now active"
    echo ""
    echo "[next] After fixing the issue, redeploy with 'bash scripts/blue-green-deploy.sh'."
}

main "$@"
