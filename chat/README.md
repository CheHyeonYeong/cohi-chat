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

## API 문서

- Swagger UI: `http://localhost:3001/api/swagger-ui`
- 목록 조회: `GET /api/chat/rooms`

응답 계약 메모:
- `lastMessage`는 방에 메시지가 한 번도 없으면 `null`입니다.
- 날짜는 모두 UTC 기준 ISO-8601 문자열로 내려갑니다.

## DB 스키마

- 현재 채팅 서버 구현 기준 DDL 참조: `./schema.sql`
- 구현 기준 상세 문서: `./CLAUDE.md`
- `room_member(room_id, member_id)` 유니크 제약과 인덱스는 위 SQL에 명시되어 있습니다.
- 목록 조회 구현은 `chat_room.is_disabled` 와 `room_member.deleted_at` 기준으로 필터링합니다.

## 배포

`chat/**` 변경 후 main 머지 시 GitHub Actions가 채팅 EC2에 자동 배포
