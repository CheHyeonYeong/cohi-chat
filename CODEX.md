# CODEX.md

Codex 작업 기준 운영 문서입니다.

## 문서 기준

- Claude 기준 운영 문서: `CLAUDE.md`
- 공통 사용 흐름: `README.md`
- 공통으로 지켜야 할 모든 정책은 `CLAUDE.md`를 따른다.

## 기본 원칙

- `main` 브랜치 직접 작업/커밋 금지
- 작업 브랜치 생성 후 작업 (`{이니셜}_{이슈번호}`)
- 변경은 목적 중심으로 최소화
- 변경 후 검증 명령 실행 및 결과 기록

## 표준 작업 절차

1. `main` 최신 동기화
```bash
git checkout main
git pull origin main
```

2. 작업 브랜치 생성
```bash
git checkout -b {이니셜}_{이슈번호}
# 예: git checkout -b khs_353
```

3. 구현 및 검증
- Backend 변경 시
```bash
cd backend
./gradlew test
```
- Frontend 변경 시
```bash
cd frontend
pnpm lint
pnpm test
```

4. 필요 시 main 기준 리베이스
```bash
git fetch origin
git rebase origin/main
```

## 보고 형식

- 문제 원인
- 해결 방법
- 변경 파일
- 회귀 방지 테스트
- 검증 결과

## 환경 참고

- 기본 시간대: `Asia/Seoul` (UTC 아님)
- API 문서(Local): `http://localhost:8080/api/swagger-ui/index.html`
