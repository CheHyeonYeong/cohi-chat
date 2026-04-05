#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/chat-blue-green-common.sh"

IS_BLUE=$(docker ps --filter "name=cohi-chat-server-blue" --format "{{.Names}}")

if [ -z "$IS_BLUE" ]; then
    INACTIVE="blue"
    ACTIVE="green"
else
    INACTIVE="green"
    ACTIVE="blue"
fi

echo "[deploy] Active: ${ACTIVE} -> Deploying to: ${INACTIVE}"

echo "[deploy] 1. Pulling new image..."
$CHAT_COMPOSE pull "chat-server-${INACTIVE}"

echo "[deploy] 2. Starting chat-server-${INACTIVE}..."
$CHAT_COMPOSE up -d --no-deps "chat-server-${INACTIVE}"

echo "[deploy] 3. Health check..."
wait_healthy "cohi-chat-server-${INACTIVE}"

echo "[deploy] 4. Switching nginx to chat-server-${INACTIVE}..."
switch_upstream "$INACTIVE"

echo "[deploy] 5. Stopping old chat-server-${ACTIVE}..."
stop_slot "$ACTIVE"
