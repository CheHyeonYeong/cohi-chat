# chat module guide

This document describes the current `chat/` implementation on `khs_499_clean`.

Branch status:

- This branch is reserved for the long polling and future events follow-up only.
- It is not the MVP integration branch and must not merge as-is.
- Existing `rooms`, `messages`, and `read` APIs are not owned by this branch.
- Cross-service scope and hold reasons live in `../docs/chat-poll-follow-up.md`.

## Scope

- NestJS + Fastify chat server
- JWT access token verification using the same secret as the Spring backend
- Follow-up API focus in this branch:
  - `GET /api/chat/poll`
- Existing runtime APIs such as `rooms`, `messages`, and `read` may still be present in the workspace, but they are excluded from this branch ownership and merge scope.

## Architecture

```text
Client
  -> GET /api/chat/poll
NestJS chat server
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
- Swagger lives at `/api/swagger-ui`.

## Integration note

- This branch is for the poll or events follow-up only.
- Spring should merge first for room provisioning ownership.
- The later follow-up should reshape `GET /api/chat/poll` into `GET /api/chat/rooms/:roomId/events`.
- The current wake-up path is sufficient only for a single chat server instance that handles both writes and polling in the same process.
- If the chat server later scales to multiple instances or split writer processes, introduce Redis pub/sub or another shared signal layer in a separate follow-up.

## Manual verification

1. Run `pnpm run start:dev` in `chat/`.
2. Open Swagger at `http://localhost:3001/api/swagger-ui`.
3. Authorize with a Spring access token string without the `Bearer` prefix.
4. Use an existing valid `roomId` from the current runtime environment.
5. Call `GET /api/chat/poll` with `roomId` and `timeout=25`.
6. Confirm the timeout path returns `[]` after about 25 seconds.
7. Treat this as local follow-up verification only, not as MVP merge evidence.

## Notes

- Long polling registers the room waiter before the first fetch so a same-process wake-up is not missed between the initial query and the wait phase.
- If the events follow-up changes the schema contract, align `prisma/schema.prisma`, `schema.sql`, `README.md`, and tests together.
