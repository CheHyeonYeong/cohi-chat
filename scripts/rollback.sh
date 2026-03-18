#!/bin/bash
# Blue-Green 롤백 스크립트
# 사용: bash scripts/rollback.sh
#
# 현재 비활성 컨테이너(이전 버전)로 트래픽을 즉시 전환합니다.

set -euo pipefail

COMPOSE="docker-compose -f docker-compose.prod.yml"
NGINX_UPSTREAM_FILE="./nginx/upstream.conf"
HEALTH_TIMEOUT=60
HEALTH_INTERVAL=5

# ── 현재 활성 컨테이너 감지 ──────────────────────────────────────────────────
detect_active() {
    # Docker 실행 상태 기반 감지 — upstream.conf는 배포마다 git reset으로 초기화되므로 신뢰 불가
    local blue_status green_status
    blue_status=$(docker inspect --format='{{.State.Status}}' "cohi-chat-backend-blue" 2>/dev/null || echo "missing")
    green_status=$(docker inspect --format='{{.State.Status}}' "cohi-chat-backend-green" 2>/dev/null || echo "missing")

    if [ "$blue_status" = "running" ] && [ "$green_status" != "running" ]; then
        echo "blue"
    elif [ "$green_status" = "running" ] && [ "$blue_status" != "running" ]; then
        echo "green"
    else
        grep -q "backend-blue" "$NGINX_UPSTREAM_FILE" && echo "blue" || echo "green"
    fi
}

# ── 컨테이너 상태 확인 ────────────────────────────────────────────────────────
container_running() {
    local container=$1
    local state
    state=$(docker inspect --format='{{.State.Status}}' "cohi-chat-backend-${container}" 2>/dev/null || echo "missing")
    [ "$state" = "running" ]
}

# ── 컨테이너 헬스체크 대기 ───────────────────────────────────────────────────
wait_healthy() {
    local container=$1
    local elapsed=0

    echo "[health] Waiting for ${container} to be healthy (max ${HEALTH_TIMEOUT}s)..."

    while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
        local status
        status=$(docker inspect --format='{{.State.Health.Status}}' "cohi-chat-backend-${container}" 2>/dev/null || echo "missing")

        if [ "$status" = "healthy" ]; then
            echo "[health] ${container} is healthy."
            return 0
        fi

        echo "[health] Status=${status}, elapsed=${elapsed}s ..."
        sleep $HEALTH_INTERVAL
        elapsed=$((elapsed + HEALTH_INTERVAL))
    done

    echo "[error] ${container} did not become healthy within ${HEALTH_TIMEOUT}s."
    return 1
}

# ── Nginx upstream 전환 ───────────────────────────────────────────────────────
switch_upstream() {
    local target=$1

    echo "[nginx] Switching upstream to backend-${target}"
    cat > "$NGINX_UPSTREAM_FILE" <<EOF
# Blue-Green 배포에서 동적으로 교체되는 upstream 설정
upstream backend {
    server backend-${target}:8080;
}
EOF

    docker exec cohi-chat-nginx nginx -s reload
    echo "[nginx] Reloaded. Traffic now routed to backend-${target}."
}

# ── 메인 롤백 로직 ────────────────────────────────────────────────────────────
main() {
    echo "=============================="
    echo " Rollback Start"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="

    local active
    active=$(detect_active)
    local previous
    previous=$([ "$active" = "blue" ] && echo "green" || echo "blue")

    echo "[info] Active: ${active} → Rolling back to: ${previous}"

    # 이전 버전 컨테이너 상태 확인
    if container_running "$previous"; then
        echo "[info] backend-${previous} is already running. Waiting for health."
        wait_healthy "$previous"
    else
        echo "[info] backend-${previous} is stopped. Starting it..."
        $COMPOSE start "backend-${previous}"
        wait_healthy "$previous"
    fi

    # 트래픽 전환
    switch_upstream "$previous"

    # 문제 있는 현재 버전 중지
    echo "[cleanup] Stopping problematic backend-${active}..."
    $COMPOSE stop "backend-${active}"

    echo "=============================="
    echo " Rollback Success: ${previous} is now active"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="

    echo ""
    echo "[next] 배포 문제 원인을 파악한 뒤 'bash scripts/blue-green-deploy.sh' 로 재배포하세요."
}

main "$@"
