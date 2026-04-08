# chat module guide

This document describes the current `chat/` implementation on `khs_499_clean`.

Branch status:

- This branch owns the MVP long polling transport only.
- Existing `rooms`, `messages`, and `read` APIs are not owned by this branch.
- Cross-service ownership and TODO live in `../docs/chat-poll-follow-up.md`.

## Scope

- NestJS + Fastify chat server
- JWT access token verification using the same secret as the Spring backend
- API focus in this branch:
  - `GET /api/chat/poll`
- Existing runtime APIs such as `rooms`, `messages`, and `read` are outside this branch ownership.

## Architecture

```text
Client
  -> GET /api/chat/poll
NestJS chat server
  -> poll room membership validation
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
- `GET /api/chat/poll` waits up to 25 seconds and returns `[]` when no new message arrives.
- Client and proxy timeouts should be at least 35 seconds to keep a 10 second margin over the 25 second server wait.
- Omitting `sinceMessageId` means the poll watches only messages created after the request starts.
- `ChatPollRegistry` is in-memory and assumes a single Nest process.
- sender-side message commit must call `notifyRoomActivity(roomId)` to wake same-room poll waiters
- Swagger lives at `/api/swagger-ui`.

## Integration note

- This branch keeps only the transport layer needed for MVP automatic refresh.
- `rooms`, `messages`, and `read` must stay in their owner branches.
- Keep `GET /api/chat/poll` for the current MVP and defer `GET /api/chat/rooms/:roomId/events` to a later contract PR.
- The current wake-up path is sufficient only for a single chat server instance that handles both writes and polling in the same process.
- If the chat server later scales to multiple instances or split writer processes, introduce Redis pub/sub or another shared signal layer in a separate follow-up.

## Manual verification

1. Run `pnpm run start:dev` in `chat/`.
2. Open Swagger at `http://localhost:3001/api/swagger-ui`.
3. Authorize with a Spring access token string without the `Bearer` prefix.
4. Use an existing valid `roomId` from the current runtime environment.
5. Call `GET /api/chat/poll` with `roomId` and `timeout=25`.
6. Confirm the timeout path returns `[]` after about 25 seconds.
7. Confirm the sender-side message flow wakes the same room waiter by calling `notifyRoomActivity(roomId)` after commit.

## Notes

- Long polling registers the room waiter before the first fetch so a same-process wake-up is not missed between the initial query and the wait phase.
- Do not expand direct SQL from this branch.
- If the later events follow-up changes the schema contract, align `prisma/schema.prisma`, `schema.sql`, `README.md`, and tests together.
