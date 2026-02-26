#!/bin/bash
# EC2 배포 공통 설정 스크립트
# 사용: source ~/cohi-chat/scripts/ec2-deploy-common.sh

set -euo pipefail

# 환경변수 검증
validate_env() {
    if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ] || [ -z "${AWS_DEFAULT_REGION:-}" ]; then
        echo "Missing AWS envs"
        exit 1
    fi
}

# 필수 명령어 검증
validate_commands() {
    command -v aws >/dev/null 2>&1 || { echo "aws cli not found"; exit 1; }
    command -v docker >/dev/null 2>&1 || { echo "docker not found"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo "docker-compose not found"; exit 1; }
    command -v python3 >/dev/null 2>&1 || { echo "python3 not found"; exit 1; }
}

# AWS 인증 검증
validate_aws_auth() {
    aws sts get-caller-identity || { echo "AWS auth failed"; exit 1; }
}

# Git 저장소 동기화
sync_git_repo() {
    local repository=$1
    local git_ref=$2

    if [ ! -d ~/cohi-chat ]; then
        git clone "https://github.com/${repository}.git" ~/cohi-chat
    fi

    cd ~/cohi-chat

    git fetch origin
    git reset --hard "origin/${git_ref}"
}

# Secrets Manager에서 환경변수 로드
load_secrets() {
    aws secretsmanager get-secret-value --secret-id cohi-chat/prod --query SecretString --output text | \
        python3 -c "import sys,json; data=json.load(sys.stdin); print('\n'.join(f'{k}={v}' for k,v in data.items()))" > .env
}

# Docker 이미지 정리 (빌드 캐시 보호)
cleanup_docker_images() {
    docker image prune -af || true
}

# 배포 시작 로그
log_deploy_start() {
    local git_ref=$1
    echo "Deploy start: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "Git ref: ${git_ref}"
}

# 배포 성공 로그
log_deploy_success() {
    echo "Deploy success: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
}

# 전체 공통 설정 실행
run_common_setup() {
    local repository=$1
    local git_ref=$2

    validate_env
    validate_commands
    validate_aws_auth
    log_deploy_start "$git_ref"
    sync_git_repo "$repository" "$git_ref"
    load_secrets
    cleanup_docker_images
}
