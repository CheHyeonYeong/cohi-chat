# cohi-chat / chat server

cohiChat chat server built with NestJS and Fastify.

## Stack

- NestJS 11
- Prisma + PostgreSQL
- JWT verification delegated to the Spring backend

## Commands

```bash
pnpm install
pnpm run prisma:generate
pnpm run start:dev
pnpm run build
pnpm run test
```

## Environment

See `.env.example`.

## API Docs

- Swagger UI: `http://localhost:3001/api/swagger-ui`
- Rooms API: `GET /api/chat/rooms`

Contract notes:
- `lastMessage` is `null` when the room has no messages.
- Timestamps are returned as UTC ISO-8601 strings.

## Schema

- Prisma schema source: `./prisma/schema.prisma`
- SQL DDL reference: `./schema.sql`
- Implementation notes: `./CLAUDE.md`

The room list query filters by:
- `member.is_deleted = false`
- `member.is_banned = false`
- `chat_room.is_disabled = false`
- `room_member.deleted_at IS NULL`

## Deploy

Changes under `chat/**` are deployed to the chat EC2 through GitHub Actions after merge to `main`.
