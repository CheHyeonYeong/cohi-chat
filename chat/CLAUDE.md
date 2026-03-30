# Cohi-Chat / chat 모듈 가이드

> 이 문서는 `chat/` 디렉터리의 현재 구현 기준 문서입니다.
> 설계 초안이나 이전 브랜치 계획이 아니라, 실제 코드와 `chat/schema.sql`을 source of truth로 봅니다.

---

## 현재 범위

- NestJS + Fastify 기반 채팅 서버
- Spring이 발급한 JWT access token 검증
- 현재 `khs_500` 구현 범위의 공개 API는 채팅방 목록 조회 1건입니다.

---

## 현재 아키텍처

```text
Client
  -> GET /api/chat/rooms
NestJS chat server
  -> DataSource.query()로 PostgreSQL 직접 조회
PostgreSQL
  -> member / chat_room / room_member / message 조회
```

---

## 구현 기준 스키마

현재 문서 기준 DDL 참조 파일은 `chat/schema.sql` 입니다.

### chat_room

```sql
CREATE TABLE chat_room (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    is_disabled BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_chat_room PRIMARY KEY (id)
);
```

### room_member

```sql
CREATE TABLE room_member (
    id                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    room_id              UUID        NOT NULL,
    member_id            UUID        NOT NULL,
    last_read_message_id UUID        NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ NULL,
    CONSTRAINT pk_room_member PRIMARY KEY (id),
    CONSTRAINT uq_room_member UNIQUE (room_id, member_id)
);

CREATE INDEX idx_room_member_room_id ON room_member(room_id);
```

### message

```sql
CREATE TABLE message (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    room_id      UUID         NOT NULL,
    sender_id    UUID         NULL,
    message_type VARCHAR(30)  NOT NULL,
    content      VARCHAR(2000) NULL,
    payload      JSONB        NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT pk_message PRIMARY KEY (id)
);

CREATE INDEX idx_message_room_id_created_at ON message(room_id, created_at DESC);
```

주의:
- 운영 또는 로컬 DB에는 이전 스키마 컬럼이 남아 있을 수 있습니다.
- 이 문서와 `khs_500` 구현은 `GET /api/chat/rooms`가 실제로 참조하는 컬럼 기준으로만 설명합니다.

---

## 현재 정책

| 항목 | 현재 구현 기준 |
|------|----------------|
| 인증 | Spring access token 검증. JWT `sub`는 username으로 해석 |
| 목록 조회 | `GET /api/chat/rooms` |
| 방 필터 | `chat_room.is_disabled = false` 인 방만 조회 |
| 멤버 필터 | `room_member.deleted_at IS NULL` 인 membership만 사용 |
| unread 계산 | `last_read_message_id` 이후의 메시지 수를 unread로 계산 |
| 마지막 메시지 | 가장 최근 `message.created_at DESC, id DESC` 기준 1건 |
| lastMessage null | 메시지가 없는 방이면 `lastMessage = null` |
| Swagger | `/api/swagger-ui` |

`unread` 정의:
- 사용자가 채팅방에 들어가지 않아 아직 읽지 못한 메시지 전체를 의미합니다.
- 현재 목록 조회 구현은 `last_read_message_id` 이후 메시지 전체를 기준으로 계산합니다.

---

## 현재 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/chat/rooms | 내가 속한 채팅방 목록, 상대방 정보, 마지막 메시지, unread 수 조회 |

주의:
- 이 문서의 API 목록은 현재 브랜치 구현 기준입니다.
- 다른 브랜치에서 작업 중인 전송, 메시지 조회, 읽음 처리 API는 여기서 source of truth로 다루지 않습니다.

---

## 구현 메모

- Swagger UI 경로: `/api/swagger-ui`
- Swagger Authorize에는 access token 원문만 넣고 `Bearer ` 접두사는 따로 입력하지 않습니다.
- JWT 알고리즘은 Spring access token 기준 `HS512`로 검증합니다.

---

## 작업 원칙

1. 문서보다 구현이 우선이 아니라, 문서를 구현과 같이 유지합니다.
2. 스키마 변경 시 `schema.sql`, `README.md`, 이 문서를 함께 갱신합니다.
3. 현재 브랜치에 없는 API를 이미 구현된 것처럼 문서화하지 않습니다.
