# cohi-chat / chat server

cohiChat 채팅 서버 — NestJS (Fastify) 기반 채팅 전용 서버

## 기술 스택

- NestJS 11, Fastify
- TypeORM + PostgreSQL (Spring과 공유 DB)
- JWT 검증 (발급은 Spring 담당)

## 개발 명령어

```bash
pnpm install       # 의존성 설치
pnpm run start:dev # 개발 서버 (port 3001)
pnpm run build     # 프로덕션 빌드
pnpm run test      # 테스트
```

## 환경변수

`.env.example` 참고

## 배포

`chat/**` 변경 후 main 머지 시 GitHub Actions가 채팅 EC2에 자동 배포
