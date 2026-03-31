# chat module guide

This document describes the current `chat/` implementation on `khs_500`.

## Scope

- NestJS + Fastify chat server
- JWT access token verification using the same secret as the Spring backend
- Public APIs in this branch:
  - `GET /api/chat/rooms`
  - `PATCH /api/chat/rooms/:roomId/read`

## Architecture

```text
Client
  -> GET /api/chat/rooms
  -> PATCH /api/chat/rooms/:roomId/read
NestJS chat server
  -> Prisma Client
  -> Prisma.$queryRaw(...) for the room list query
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
- `PATCH /api/chat/rooms/:roomId/read` updates `room_member.last_read_message_id`
  to the latest message in the room for the authenticated member.
- `lastMessage` is `null` when the room has never received a message.
- Swagger lives at `/api/swagger-ui`.

## Notes

- The room list query is intentionally kept in SQL because it relies on lateral joins and window functions.
- If the schema changes, update `prisma/schema.prisma`, `schema.sql`, `README.md`, and tests together.
