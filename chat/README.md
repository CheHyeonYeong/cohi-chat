# cohi-chat / chat server

cohiChat chat server built with NestJS and Fastify.

Branch status:

- This branch is held for events or long polling follow-up only.
- It is not an MVP merge target.
- Existing `rooms`, `messages`, and `read` APIs are not owned by this branch.
- See `../docs/chat-poll-follow-up.md` for the final split, exclusions, and hold reasons.

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
- Poll draft API kept for follow-up only: `GET /api/chat/poll?roomId=<uuid>&sinceMessageId=<uuid>&timeout=25`

Contract notes:

- This branch does not define the merge contract for `rooms`, `messages`, or `read`.
- Long polling waits up to 25 seconds and returns `[]` on timeout.
- Client and proxy timeouts should be at least 35 seconds to leave a 10 second buffer over the 25 second server wait.
- Omitting `sinceMessageId` means "wait only for messages created after this poll request starts".
- Timestamps are returned as UTC ISO-8601 strings.
- `ChatPollRegistry` is in-memory and assumes a single Nest process.
- If chat later runs with multiple instances or separate writer processes, add an external signal layer such as Redis pub/sub in a follow-up change.

## Swagger Manual Test

1. Start the server with `pnpm run start:dev`.
2. Open `http://localhost:3001/api/swagger-ui`.
3. Click `Authorize` and paste the Spring access token without the `Bearer` prefix.
4. Use an existing valid `roomId` from the current runtime environment.
5. Call `GET /api/chat/poll` with that `roomId` and `timeout=25`.
6. If there is no new message, the request should stay open for about 25 seconds and then return `[]`.
7. This verifies the local poll draft only. It does not make this branch merge-ready for MVP.

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
