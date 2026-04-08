# chat module guide

This document describes the current `chat/` implementation scope for the message-runtime branch.

## Scope

- NestJS + Fastify chat server
- JWT access token verification using the same secret as the Spring backend
- Public API in this branch:
  - `GET /api/chat/rooms/{roomId}/messages`
  - `POST /api/chat/rooms/{roomId}/messages`

## Ownership boundaries

- Spring owns room provisioning:
  - `chat_room` create/reuse
  - `room_member` create/restore
  - booking -> `chatRoomId`
- This branch owns only message runtime APIs.
- `GET /api/chat/rooms` ownership belongs to another branch.
- read/unread endpoints and policies belong to another branch.
- long polling, events, RabbitMQ notifications, and system messages are out of scope here.

## Architecture

```text
Client
  -> GET /api/chat/rooms/{roomId}/messages
  -> POST /api/chat/rooms/{roomId}/messages
NestJS chat server
  -> Prisma Client
  -> Prisma membership checks + message write
  -> SQL only where needed for stable composite cursor pagination
PostgreSQL
  -> member / room_member / message
```

## Current contract

- JWT `sub` is treated as the username from the Spring access token.
- Only active members are allowed:
  - `member.is_deleted = false`
  - `member.is_banned = false`
- Only active room memberships are allowed:
  - `chat_room.is_disabled = false`
  - `room_member.deleted_at IS NULL`
- Message content is trimmed, blank content is rejected, and max length is 1000.
- Message history pagination uses a stable composite cursor based on `createdAt + id`.
- Message send updates only the sender's read cursor to avoid self-unread, but full read/unread ownership remains outside this branch.

## Schema notes

- ORM schema source: `prisma/schema.prisma`
- SQL reference DDL: `schema.sql`
- Keep both files aligned when the schema changes.

## Notes

- Prefer Prisma ORM for business logic in this branch.
- The remaining raw SQL is limited to stable message pagination because the cursor must preserve exact DB ordering semantics.
- Swagger lives at `/api/swagger-ui`.

