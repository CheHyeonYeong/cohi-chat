# cohi-chat / chat server

cohiChat chat server built with NestJS and Fastify.

Branch status:

- This branch owns the MVP long polling transport only.
- Existing `rooms`, `messages`, and `read` APIs are owned by other branches.
- See `../docs/chat-poll-follow-up.md` for ownership, exclusions, and remaining TODO.

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
- Poll transport API: `GET /api/chat/poll?roomId=<uuid>&sinceMessageId=<uuid>&timeout=25`

Contract notes:

- This branch does not define the merge contract for `rooms`, `messages`, or `read`.
- This branch does own the MVP transport endpoint for automatic refresh.
- Long polling waits up to 25 seconds and returns `[]` on timeout.
- Client and proxy timeouts should be at least 35 seconds to leave a 10 second buffer over the 25 second server wait.
- Omitting `sinceMessageId` means "wait only for messages created after this poll request starts".
- Timestamps are returned as UTC ISO-8601 strings.
- `ChatPollRegistry` is in-memory and assumes a single Nest process.
- Sender-side message commit must call `ChatPollNotifier.notifyRoomActivity(roomId)` to wake same-room poll waiters.
- Message owner branches should import `ChatModule` and inject `ChatPollNotifier` instead of depending on the poll service directly.
- If chat later runs with multiple instances or separate writer processes, add an external signal layer such as Redis pub/sub in a follow-up change.

## Swagger Manual Test

1. Start the server with `pnpm run start:dev`.
2. Open `http://localhost:3001/api/swagger-ui`.
3. Click `Authorize` and paste the Spring access token without the `Bearer` prefix.
4. Use an existing valid `roomId` from the current runtime environment.
5. Call `GET /api/chat/poll` with that `roomId` and `timeout=25`.
6. If there is no new message, the request should stay open for about 25 seconds and then return `[]`.
7. While the poll request is waiting, the sender-side message flow should call `ChatPollNotifier.notifyRoomActivity(roomId)` after commit so the wait returns immediately.

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
