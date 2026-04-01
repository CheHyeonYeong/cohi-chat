# cohi-chat / chat server

NestJS(Fastify) chat server for room list, message send, and message history APIs.

## Stack

- NestJS 11
- Fastify
- Prisma + PostgreSQL
- JWT verification with the same token contract as the Spring backend

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
- Room list: `GET /api/chat/rooms`
- Message list: `GET /api/chat/rooms/{roomId}/messages`
- Send message: `POST /api/chat/rooms/{roomId}/messages`

Contract notes:

- `lastMessage` is `null` when the room has no messages.
- Message list is ordered by `createdAt DESC, id DESC`.
- `nextCursor` is `null` when there are no older messages.
- Message content is trimmed before persistence and whitespace-only input is rejected.

## Schema

- Prisma schema source: `./prisma/schema.prisma`
- SQL DDL reference: `./schema.sql`
- Chat-specific implementation notes: `./CLAUDE.md`

Room and membership filtering:

- `member.is_deleted = false`
- `member.is_banned = false`
- `chat_room.is_disabled = false`
- `room_member.deleted_at IS NULL`

## Deploy

Changes under `chat/**` are deployed to the chat EC2 through GitHub Actions after merge to `main`.
