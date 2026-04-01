# cohi-chat / chat server

cohiChat 채팅 서버의 NestJS(Fastify) 기반 채팅 API입니다.

## 기술 스택

- NestJS 11, Fastify
- Prisma + PostgreSQL
- JWT 검증은 Spring에서 발급한 access token 기준

## 개발 명령어

```bash
pnpm install
pnpm run prisma:generate
pnpm run start:dev
pnpm run build
pnpm run test
```

## Swagger 수동 테스트

### 1. 준비물

- Spring 서버 실행
- chat 서버 실행: `http://localhost:3001/api/swagger-ui`
- Spring에서 발급받은 access token
- 테스트에 사용할 `roomId`

### 2. roomId 찾기

JWT의 `sub`는 `member.username` 이어야 합니다. 사용할 계정이 속한 방은 아래 쿼리로 찾을 수 있습니다.

```sql
SELECT
  m.id AS member_id,
  m.username,
  rm.room_id,
  rm.last_read_message_id,
  rm.deleted_at
FROM member m
JOIN room_member rm ON rm.member_id = m.id
WHERE m.username = '여기에-username'
  AND m.is_deleted = false
  AND m.is_banned = false
  AND rm.deleted_at IS NULL
ORDER BY rm.created_at DESC;
```

최근 메시지 확인이 필요하면 이 쿼리를 사용합니다.

```sql
SELECT
  id,
  room_id,
  sender_id,
  message_type,
  content,
  payload,
  created_at
FROM message
WHERE room_id = '여기에-room-id'
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### 3. Swagger Authorize

- `Authorize` 버튼 클릭
- Spring access token 원문만 입력
- `Bearer ` 접두사는 넣지 않음

### 4. 메시지 전송 테스트

1. `POST /api/chat/rooms/{roomId}/messages`
2. `roomId`에 조회한 UUID 입력
3. body 예시

```json
{
  "content": "swagger send test"
}
```

기대 결과:

- 정상 멤버면 `201 Created`
- 응답 body에 저장된 메시지 정보 반환
- `content`는 trim 된 값으로 저장

실패 케이스:

- `content`가 공백뿐이면 `400`
- trim 후 1000자를 넘으면 `400`
- 방 멤버가 아니면 `403`
- 토큰이 없거나 잘못되면 `401`

### 5. 메시지 목록 조회 테스트

1. 먼저 `POST /messages`로 메시지 2개 이상 전송
2. `GET /api/chat/rooms/{roomId}/messages`
3. `size=2`로 호출
4. 응답의 `messages`와 `nextCursor` 확인
5. `nextCursor`가 있으면 같은 API에 `cursor=<nextCursor>`를 넣어 다음 페이지 조회

기대 결과:

- 첫 호출은 최신 메시지부터 최대 `size`개 반환
- 다음 페이지 호출은 이전 메시지를 이어서 반환
- 더 이전 메시지가 없으면 `nextCursor: null`

### 6. 권한/검증 테스트

- `roomId`를 UUID가 아닌 값으로 호출하면 `400`
- `cursor`를 ISO 8601이 아닌 값으로 호출하면 `400`
- 본인이 속하지 않은 방의 `roomId`로 호출하면 `403`
- 토큰 없이 호출하면 `401`
