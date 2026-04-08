# cohi-chat / chat server

cohiChat chat server built with NestJS and Fastify.

## Stack

- NestJS 11
- Prisma + PostgreSQL
- JWT verification based on Spring-issued access tokens

## Commands

```bash
pnpm install
pnpm run prisma:generate
pnpm run start:dev
pnpm run build
pnpm run test
```

## API Docs

- Swagger UI: `http://localhost:3001/api/swagger-ui`
- Message list API: `GET /api/chat/rooms/{roomId}/messages`
- Message send API: `POST /api/chat/rooms/{roomId}/messages`

## Branch Scope

This branch owns only Nest message runtime APIs.

- Included:
  - `GET /api/chat/rooms/{roomId}/messages`
  - `POST /api/chat/rooms/{roomId}/messages`
- Out of scope:
  - `GET /api/chat/rooms`
  - read/unread ownership
  - long polling / events
  - RabbitMQ notifications
  - system messages

## Swagger Manual Test

### 1. Prerequisites

- Spring backend is running
- chat server is running
- a valid Spring access token
- a `roomId` that belongs to the authenticated user

### 2. Find a room for the JWT subject

JWT `sub` must match `member.username`.

```sql
SELECT
  m.id AS member_id,
  m.username,
  rm.room_id,
  rm.deleted_at
FROM member m
JOIN room_member rm ON rm.member_id = m.id
WHERE m.username = 'your-username'
  AND m.is_deleted = false
  AND m.is_banned = false
  AND rm.deleted_at IS NULL
ORDER BY rm.created_at DESC;
```

Optional: inspect recent messages in the room.

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
WHERE room_id = 'your-room-id'
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### 3. Authorize in Swagger

- Open `http://localhost:3001/api/swagger-ui`
- Click `Authorize`
- Paste the Spring access token only
- Do not include the `Bearer ` prefix

### 4. Test sending a message

Call `POST /api/chat/rooms/{roomId}/messages` with:

```json
{
  "content": "swagger send test"
}
```

Expected results:

- `201 Created` for a valid room member
- response body contains the stored message
- content is trimmed before persistence
- sending a message advances only the sender's read cursor to avoid self-unread

Failure cases:

- whitespace-only content returns `400`
- trimmed content longer than 1000 chars returns `400`
- non-member room access returns `403`
- missing or invalid token returns `401`

### 5. Test paged message history

1. Send at least two messages first.
2. Call `GET /api/chat/rooms/{roomId}/messages?size=2`.
3. Check `messages` and `nextCursor` in the response.
4. If `nextCursor` is not null, call the same API again with `cursor=<nextCursor>`.

Expected results:

- the first page returns the newest messages first
- the next page continues with older messages
- `nextCursor` is an opaque value returned by the previous response
- the cursor is based on `createdAt + id`
- `nextCursor: null` means there are no older messages left

### 6. Validate error cases

- invalid `roomId` format returns `400`
- invalid `cursor` format returns `400`
- a room the user does not belong to returns `403`
- missing token returns `401`

## Schema

- Prisma schema source: `./prisma/schema.prisma`
- SQL DDL reference: `./schema.sql`
- Implementation notes: `./CLAUDE.md`

