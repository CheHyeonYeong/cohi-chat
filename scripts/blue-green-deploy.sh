#!/bin/bash
# Blue-Green 무중단 배포 스크립트
# 사용: bash scripts/blue-green-deploy.sh
#
# 전제 조건:
#   - ~/cohi-chat 에 최신 코드 + .env 준비 완료
#   - docker-compose.prod.yml 이 Blue-Green 구성 포함
#   - nginx/upstream.conf 가 volume mount 됨

set -euo pipefail

COMPOSE="docker-compose -f docker-compose.prod.yml"
NGINX_UPSTREAM_FILE="./nginx/upstream.conf"
HEALTH_TIMEOUT=120  # 헬스체크 최대 대기 시간(초)
HEALTH_INTERVAL=5   # 헬스체크 재시도 간격(초)

# ── 현재 활성 컨테이너 감지 ──────────────────────────────────────────────────
detect_active() {
    # upstream.conf 에서 활성 서버 이름 추출
    if grep -q "backend-blue" "$NGINX_UPSTREAM_FILE"; then
        echo "blue"
    else
        echo "green"
    fi
}

# ── 컨테이너 내부 헬스체크 ────────────────────────────────────────────────────
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

# ── 메인 배포 로직 ────────────────────────────────────────────────────────────
main() {
    echo "=============================="
    echo " Blue-Green Deploy Start"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="

    local active
    active=$(detect_active)
    local inactive
    inactive=$([ "$active" = "blue" ] && echo "green" || echo "blue")

    echo "[info] Active: ${active} → Deploying to: ${inactive}"

    # Redis와 inactive backend 기동 (이미 떠있으면 업데이트)
    echo "[deploy] Starting backend-${inactive} with new image..."
    $COMPOSE up -d --no-deps --build "backend-${inactive}"

    # 헬스체크 통과 대기
    wait_healthy "$inactive"

    # 트래픽 전환
    switch_upstream "$inactive"

    # 구버전 컨테이너 중지 (삭제 X - 롤백용으로 유지)
    echo "[cleanup] Stopping old backend-${active}..."
    $COMPOSE stop "backend-${active}" || echo "[warn] backend-${active} was not running, skipping stop."

    echo "=============================="
    echo " Deploy Success: ${inactive} is now active"
    echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "=============================="
}

main "$@"
