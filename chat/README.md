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
- Long polling API: `GET /api/chat/poll?roomId=<uuid>&sinceMessageId=<uuid>&timeout=25`

Contract notes:

- `lastMessage` is `null` when the room has no messages.
- Long polling waits up to 25 seconds and returns `[]` on timeout.
- Omitting `sinceMessageId` means "wait only for messages created after this poll request starts".
- Timestamps are returned as UTC ISO-8601 strings.

## Swagger Manual Test

1. Start the server with `pnpm run start:dev`.
2. Open `http://localhost:3001/api/swagger-ui`.
3. Click `Authorize` and paste the Spring access token without the `Bearer ` prefix.
4. Call `GET /api/chat/rooms` and copy one `id` value.
5. Call `GET /api/chat/poll` with that `roomId` and `timeout=25`.
6. If there is no new message, the request should stay open for about 25 seconds and then return `[]`.
7. To verify the immediate-return path, create a new message for the same room through another writer path or direct DB setup while the poll request is waiting.

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
