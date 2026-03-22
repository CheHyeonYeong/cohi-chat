# Cohi-Chat / chat 모듈 전용 가이드

> 이 파일은 `src/chat/` 폴더 안에서만 적용되는 규칙입니다.
> 루트 CLAUDE.md의 공통 규칙을 상속하고, 채팅 모듈 전용 컨텍스트를 추가합니다.

---

## 내 상황

- Java 21 / Spring Boot 백엔드 경험 있음
- Node.js / NestJS 거의 처음 — **반드시 Spring과 비교해서 설명할 것**
- 학습하면서 함께 만드는 중이므로 코드보다 이해가 먼저

---

## 채팅 모듈 아키텍처

```
Client (React)
  ↓ Long Polling (GET /chat/poll)
NestJS 채팅 서버 (이 모듈)
  ↓ SQL 직접 조회
PostgreSQL (Spring과 공유 RDS)

Spring 서버
  → POST /internal/rooms/upsert  (예약 확정 시 채팅방 생성 요청)
  → RabbitMQ produce             (채팅 메시지 알림 이벤트)
```

---

## DB 스키마 (확정)

### chat_room
```sql
CREATE TABLE chat_room (
    id                UUID          NOT NULL DEFAULT gen_random_uuid(),
    type              VARCHAR(20)   NOT NULL,   -- ONE_TO_ONE | GROUP (멤버 수로도 판단 가능, 타입 컬럼 제거 논의 중)
    status            VARCHAR(20)   NOT NULL,   -- ACTIVE | INACTIVE
    external_ref_type VARCHAR(50)   NOT NULL,   -- RESERVATION 등
    external_ref_id   UUID          NOT NULL,   -- 예약 ID 등
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ   NULL,        -- soft delete. 1달 메시지 없으면 배치가 설정
    CONSTRAINT pk_chat_room PRIMARY KEY (id)
);
-- FK 없음. 애플리케이션 레벨에서 관리
```

### room_member
```sql
CREATE TABLE room_member (
    id                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    room_id              UUID        NOT NULL,
    member_id            UUID        NOT NULL,   -- Spring member id
    last_read_message_id UUID        NULL,        -- read cursor. 읽음 기준
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ NULL,        -- 그룹 채팅 나가기 전용 (1차 미사용)
    CONSTRAINT pk_room_member PRIMARY KEY (id),
    CONSTRAINT uq_room_member UNIQUE (room_id, member_id)
);
-- role 컬럼 없음: HOST 테이블 분리로 역할 구분
-- FK 없음. 애플리케이션 레벨에서 관리
CREATE INDEX idx_room_member_room_id ON room_member(room_id);
```

### message
```sql
CREATE TABLE message (
    id           UUID          NOT NULL DEFAULT gen_random_uuid(),  -- UUID v7 권장
    room_id      UUID          NOT NULL,
    sender_id    UUID          NULL,        -- NULL이면 시스템 메시지
    message_type VARCHAR(30)   NOT NULL,   -- TEXT | RESERVATION_CARD | SYSTEM
    content      VARCHAR(2000) NULL,        -- 정책상 1000자. 이모지 여유 확보
    payload      JSONB         NULL,        -- RESERVATION_CARD: 예약 snapshot / SYSTEM: 메타데이터
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
    -- updated_at 없음: 불변 데이터
    -- deleted_at 없음: soft delete 미지원 (1차)
);
-- FK 없음. 애플리케이션 레벨에서 관리
CREATE INDEX idx_message_room_id_created_at ON message(room_id, created_at DESC);
```

---

## 핵심 정책 (구현 시 반드시 확인)

| 항목 | 정책 |
|------|------|
| 채팅방 생성 | Spring이 POST /internal/rooms/upsert 호출 → NestJS가 생성 |
| 채팅방 재사용 | external_ref_id 기준 조회 → soft delete 상태면 deleted_at = null 복구 |
| 예약 카드 | 채팅방 생성 시 RESERVATION_CARD 메시지 자동 저장 |
| 시스템 메시지 | 미팅 하루 전 / 1시간 전 SYSTEM 메시지 (Spring 스케줄러 트리거) |
| Long Polling | timeout 25초. 메시지 있으면 즉시 응답, 없으면 25초 후 빈 배열 |
| 읽음 처리 | 브라우저 포커스 이벤트 기반. FE가 트리거 → PATCH /rooms/:id/read |
| unread 계산 | `SELECT COUNT(*) WHERE id > last_read_message_id` |
| soft delete | 1달 메시지 없으면 배치가 chat_room.deleted_at 설정. room_member/message는 건드리지 않음 |
| 메시지 제한 | text only / 최대 1000자 / 공백-only 차단 |
| FK 관리 | DB FK 없음. 애플리케이션 레벨에서 직접 검증 |

---

## API 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /chat/rooms | 방 목록 + 마지막 메시지 + unread 수 |
| GET | /chat/rooms/:roomId/messages | 메시지 커서 페이징 |
| POST | /chat/rooms/:roomId/messages | 메시지 전송 |
| PATCH | /chat/rooms/:roomId/read | 읽음 처리 |
| GET | /chat/poll | Long Polling 엔드포인트 |
| POST | /internal/rooms/upsert | Spring 전용. 채팅방 생성/복구 |

---

## 구현 우선순위

```
1단계 (MVP)
  - POST /internal/rooms/upsert (채팅방 생성/복구/RESERVATION_CARD)
  - GET  /chat/poll             (Long Polling 핵심)
  - POST /chat/rooms/:id/messages (메시지 전송)
  - PATCH /chat/rooms/:id/read    (읽음 처리)

2단계
  - GET /chat/rooms              (목록 + unread)
  - GET /chat/rooms/:id/messages (커서 페이징)
  - soft delete 배치 연동

3단계
  - SYSTEM 메시지 스케줄러
  - RabbitMQ produce (채팅 → 알림 이벤트)
```

---

## Claude 행동 규칙 (이 모듈 전용)

1. **코드 짜기 전 개념 먼저** — Spring 대응 개념과 함께 설명
   - 예: `NestJS @Injectable() = Spring @Service`
   - 예: `NestJS Module = Spring @Configuration + Component Scan 범위`
   - 예: `TypeORM Repository = Spring JpaRepository`

2. **모르는 용어 즉시 짚기** — NestJS/Node 용어 등장 시 Spring 대응 용어로 즉시 설명

3. **단계별 구현** — 기능 전체를 한 번에 주지 말고 단계별로 같이 짜기

4. **구현 후 코멘트 필수** — "왜 이렇게 짰는지" 한 줄 설명 추가

5. **실수 즉시 지적** — 잘못된 패턴, NestJS 안티패턴, 타입 오류 바로 잡기

6. **Long Polling 구현 시 주의사항**
   - Node.js는 싱글 스레드 이벤트 루프 — blocking 코드 절대 금지
   - 25초 대기는 `setTimeout` + `Promise`로 구현
   - Spring의 `DeferredResult`와 동작 방식 비교해서 설명할 것

7. **TypeScript 타입 엄격하게** — `any` 사용 금지. DTO, Entity 타입 명시 필수
