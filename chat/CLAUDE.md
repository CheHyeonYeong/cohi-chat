# chat module guide

This document describes the current `chat/` implementation on `khs_499_clean`.

Branch status:

- This branch is reserved for the long polling and future events follow-up.
- It is not the merge-ready MVP integration branch.
- Cross-service scope and hold reasons live in `../docs/chat-poll-follow-up.md`.

## Scope

- NestJS + Fastify chat server
- JWT access token verification using the same secret as the Spring backend
- Public APIs in this branch:
  - `GET /api/chat/rooms`
  - `GET /api/chat/rooms/:roomId/messages`
  - `POST /api/chat/rooms/:roomId/messages`
  - `POST /api/chat/rooms/:roomId/read`
  - `GET /api/chat/poll`

## Architecture

```text
Client
  -> GET /api/chat/rooms
  -> GET /api/chat/rooms/:roomId/messages
  -> POST /api/chat/rooms/:roomId/messages
  -> POST /api/chat/rooms/:roomId/read
  -> GET /api/chat/poll
NestJS chat server
  -> Prisma Client
  -> Prisma.$queryRaw(...) for the room list query
  -> Prisma message queries for message history pagination
  -> Prisma transaction for message write + sender cursor update
  -> Prisma room_member update for read cursor writes
  -> ChatPollRegistry for per-room long-poll waiters
  -> Prisma message queries for immediate and wake-up fetches
PostgreSQL
  -> member / chat_room / room_member / message
```

## Schema source of truth

- ORM schema: `prisma/schema.prisma`
- SQL reference DDL: `schema.sql`

Keep both files aligned when the chat schema changes.

## Current contract

- JWT `sub` is treated as the username from the Spring access token.
- Only active members are allowed:
  - `member.is_deleted = false`
  - `member.is_banned = false`
- Only active rooms and memberships are returned:
  - `chat_room.is_disabled = false`
  - `room_member.deleted_at IS NULL`
- `unreadCount` is the number of messages after `last_read_message_id`.
- `lastMessage` is `null` when the room has never received a message.
- `GET /api/chat/rooms/:roomId/messages` returns messages in ascending order and pages backward with `beforeMessageId`.
- `POST /api/chat/rooms/:roomId/read` updates `room_member.last_read_message_id` for the caller.
- `GET /api/chat/poll` waits up to 25 seconds and returns `[]` when no new message arrives.
- Client and proxy timeouts should be at least 35 seconds to keep a 10 second margin over the 25 second server wait.
- Omitting `sinceMessageId` means the poll watches only messages created after the request starts.
- Swagger lives at `/api/swagger-ui`.

## Integration note

- `#499` intentionally avoids PostgreSQL triggers and `LISTEN/NOTIFY`.
- `POST /api/chat/rooms/:roomId/messages` wakes pending poll requests by calling `ChatPollRegistry.notifyRoom(roomId)` after the message commit succeeds.
- This is sufficient for a single chat server instance that handles both message writes and long polling in the same process.
- If the chat server later scales to multiple instances or split writer processes, introduce Redis pub/sub or another shared signal layer in a separate follow-up.

## Manual verification

1. Run `pnpm run start:dev` in `chat/`.
2. Open Swagger at `http://localhost:3001/api/swagger-ui`.
3. Authorize with a Spring access token string without the `Bearer` prefix.
4. Use `GET /api/chat/rooms` to obtain a valid `roomId`.
5. Call `GET /api/chat/poll` with `roomId` and `timeout=25`.
6. Confirm the timeout path returns `[]` after about 25 seconds.
7. Confirm the immediate-return path by sending a message to the same room through `POST /api/chat/rooms/:roomId/messages` while the poll request is still pending.

## Notes

- The room list query is intentionally kept in SQL because it relies on lateral joins and window functions.
- Long polling registers the room waiter before the first fetch so a same-process wake-up is not missed between the initial query and the wait phase.
- If the schema changes, update `prisma/schema.prisma`, `schema.sql`, `README.md`, and tests together.
