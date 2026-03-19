# 무중단 배포 (Zero-Downtime Deployment) 가이드

## 아키텍처

```text
사용자
  │
  ▼
[Nginx :80]
  │ upstream.conf 에 따라 라우팅
  ├──▶ [backend-blue  :8080]  ← 현재 활성
  └──▶ [backend-green :8080]  ← 대기 (이전 버전 or 신규 버전 준비 중)
         │
         └── 공통: [Redis] [Supabase PostgreSQL]
```

Blue-Green 전략:
- 한 번에 하나의 backend 만 트래픽을 처리합니다.
- 새 버전은 비활성 컨테이너에서 먼저 기동되고 헬스체크를 통과한 뒤 트래픽을 받습니다.
- Nginx `upstream.conf` 파일을 교체하고 `nginx -s reload` 하면 기존 연결을 끊지 않고 새 upstream 으로 전환됩니다.

---

## 초기 셋업 (첫 배포)

EC2 서버에서 최초 1회 실행합니다.

```bash
# 1. 저장소 클론 & 환경변수 로드
git clone https://github.com/CheHyeonYeong/cohi-chat.git ~/cohi-chat
cd ~/cohi-chat
# Secrets Manager 에서 .env 로드 (ec2-deploy-common.sh 의 load_secrets)

# 2. JAR 다운로드
aws s3 cp s3://cohi-chat-config/app.jar ./backend/app.jar

# 3. Blue backend 를 active 로 초기 기동
docker-compose -f docker-compose.prod.yml up -d redis backend-blue nginx

# 4. upstream.conf 가 backend-blue 를 가리키는지 확인
cat nginx/upstream.conf
```

---

## 일반 배포 흐름

GitHub Actions `server-deploy-prod.yml` 이 자동으로 수행합니다.

```text
main 브랜치 push
  └─▶ CI 빌드 & JAR → S3
        └─▶ EC2 SSH
              ├─ aws s3 cp ... app.jar
              ├─ docker-compose up -d redis nginx   # 인프라 보장
              └─ bash scripts/blue-green-deploy.sh  # Blue-Green 배포
```

수동 배포가 필요할 경우:

```bash
cd ~/cohi-chat
aws s3 cp s3://cohi-chat-config/app.jar ./backend/app.jar
bash scripts/blue-green-deploy.sh
```

---

## 롤백 절차

배포 후 문제 발생 시 이전 버전으로 즉시 복구합니다.

```bash
cd ~/cohi-chat
bash scripts/rollback.sh
```

롤백 스크립트는 다음을 수행합니다:
1. 현재 비활성 컨테이너(이전 버전) 상태 확인
2. 중지 상태면 재시작 후 헬스체크 대기
3. Nginx upstream 교체 → reload
4. 문제 있는 버전 컨테이너 중지

---

## 장애 시나리오별 대응

### 1. 새 버전 헬스체크 실패

`blue-green-deploy.sh` 가 헬스체크 실패 시 에러와 함께 종료합니다.
기존 활성 컨테이너는 그대로 운영 중이므로 **서비스 영향 없음**.

```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs --tail=100 backend-green

# 원인 수정 후 재배포
bash scripts/blue-green-deploy.sh
```

### 2. Nginx reload 실패

`docker exec cohi-chat-nginx nginx -s reload` 가 실패한 경우:

```bash
# Nginx 설정 문법 검사
docker exec cohi-chat-nginx nginx -t

# upstream.conf 수동 수정
vim ~/cohi-chat/nginx/upstream.conf

# Nginx 재시작
docker-compose -f docker-compose.prod.yml restart nginx
```

### 3. 두 컨테이너 모두 중지된 경우

```bash
# Redis 먼저 확인
docker-compose -f docker-compose.prod.yml up -d redis

# Blue 강제 재시작
docker-compose -f docker-compose.prod.yml up -d backend-blue

# Nginx 기동
docker-compose -f docker-compose.prod.yml up -d nginx

# upstream.conf 가 backend-blue 를 가리키는지 확인
cat nginx/upstream.conf
```

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `docker-compose.prod.yml` | Nginx + Blue/Green backend + Redis 구성 |
| `nginx/nginx.prod.conf` | Nginx 메인 설정 |
| `nginx/upstream.conf` | 활성 backend 지정 (배포 시 동적 교체) |
| `scripts/blue-green-deploy.sh` | 무중단 배포 스크립트 |
| `scripts/rollback.sh` | 롤백 스크립트 |
| `scripts/ec2-deploy-common.sh` | 배포 공통 유틸리티 |
| `.github/workflows/server-deploy-prod.yml` | CI/CD 파이프라인 |
