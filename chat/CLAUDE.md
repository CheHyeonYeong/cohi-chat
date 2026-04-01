# chat module guide

This document describes the current `chat/` implementation on `khs_499`.

## Scope

- NestJS + Fastify chat server
- JWT access token verification using the same secret as the Spring backend
- Public APIs in this branch:
  - `GET /api/chat/rooms`
  - `GET /api/chat/poll`

## Architecture

```text
Client
  -> GET /api/chat/rooms
  -> GET /api/chat/poll
NestJS chat server
  -> Prisma Client
  -> Prisma.$queryRaw(...) for the room list query
  -> Prisma message polling queries for long polling
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
- `GET /api/chat/poll` waits up to 25 seconds and returns `[]` when no new message arrives.
- Omitting `sinceMessageId` means the poll watches only messages created after the request starts.
- Swagger lives at `/api/swagger-ui`.

## Manual verification

1. Run `pnpm run start:dev` in `chat/`.
2. Open Swagger at `http://localhost:3001/api/swagger-ui`.
3. Authorize with a Spring access token string without the `Bearer ` prefix.
4. Use `GET /api/chat/rooms` to obtain a valid `roomId`.
5. Call `GET /api/chat/poll` with `roomId` and `timeout=25`.
6. Confirm the timeout path returns `[]` after about 25 seconds.
7. Confirm the immediate-return path by inserting or sending a message to the same room while the poll request is still pending.

## Notes

- The room list query is intentionally kept in SQL because it relies on lateral joins and window functions.
- Long polling uses repeated message lookups plus request abort handling tied to the underlying socket close event.
- If the schema changes, update `prisma/schema.prisma`, `schema.sql`, `README.md`, and tests together.
