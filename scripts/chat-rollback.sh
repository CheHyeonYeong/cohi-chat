#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/chat-blue-green-common.sh"

IS_BLUE=$(docker ps --filter "name=cohi-chat-server-blue" --format "{{.Names}}")

if [ -z "$IS_BLUE" ]; then
    ROLLBACK_TO="blue"
    CURRENT="green"
else
    ROLLBACK_TO="green"
    CURRENT="blue"
fi

echo "[rollback] Current: ${CURRENT} -> Rolling back to: ${ROLLBACK_TO}"

$CHAT_COMPOSE up -d --no-deps "chat-server-${ROLLBACK_TO}"
wait_healthy "cohi-chat-server-${ROLLBACK_TO}"
switch_upstream "$ROLLBACK_TO"
stop_slot "$CURRENT"

echo "[rollback] Done. ${ROLLBACK_TO} is now active."
