# cohi-chat / chat server

cohiChat chat server built with NestJS and Fastify.

Branch status:

- This branch is a long polling and events follow-up draft.
- It is not a merge-ready MVP chat integration yet.
- See `../docs/chat-poll-follow-up.md` for scope, deferrals, and merge hold reasons.

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
- Message list API: `GET /api/chat/rooms/:roomId/messages?beforeMessageId=<uuid>&limit=50`
- Send message API: `POST /api/chat/rooms/:roomId/messages`
- Read cursor API: `POST /api/chat/rooms/:roomId/read`
- Long polling API: `GET /api/chat/poll?roomId=<uuid>&sinceMessageId=<uuid>&timeout=25`

Contract notes:

- `lastMessage` is `null` when the room has no messages.
- `GET /api/chat/rooms/:roomId/messages` returns messages in ascending order and pages backward with `beforeMessageId`.
- `POST /api/chat/rooms/:roomId/read` stores the caller read cursor and returns the remaining `unreadCount`.
- Long polling waits up to 25 seconds and returns `[]` on timeout.
- Client and proxy timeouts should be at least 35 seconds to leave a 10 second buffer over the 25 second server wait.
- Omitting `sinceMessageId` means "wait only for messages created after this poll request starts".
- Timestamps are returned as UTC ISO-8601 strings.
- This branch does not require PostgreSQL triggers, `LISTEN/NOTIFY`, or Redis pub/sub.
- `POST /api/chat/rooms/:roomId/messages` persists the message and then wakes pending poll requests for the same room in the same chat server process.
- If chat later runs with multiple instances or separate writer processes, add an external signal layer such as Redis pub/sub in a follow-up change.

## Swagger Manual Test

1. Start the server with `pnpm run start:dev`.
2. Open `http://localhost:3001/api/swagger-ui`.
3. Click `Authorize` and paste the Spring access token without the `Bearer` prefix.
4. Call `GET /api/chat/rooms` and copy one `id` value.
5. Call `GET /api/chat/poll` with that `roomId` and `timeout=25`.
6. If there is no new message, the request should stay open for about 25 seconds and then return `[]`.
7. While the poll request is waiting, call `POST /api/chat/rooms/:roomId/messages` for the same room and confirm the poll returns immediately.

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
