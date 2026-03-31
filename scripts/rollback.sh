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

    echo "[rollback] Recreating backend-${previous} with current compose network settings..."
    $COMPOSE up -d --no-deps "backend-${previous}"
    wait_healthy "cohi-chat-backend-${previous}" "backend-${previous}"

    ensure_nginx_running
    switch_upstream "$previous"

    stop_backend_if_running "$active" "problematic"

    print_banner "Rollback Success: ${previous} is now active"
    echo ""
    echo "[next] After fixing the issue, redeploy with 'bash scripts/blue-green-deploy.sh'."
}

main "$@"
