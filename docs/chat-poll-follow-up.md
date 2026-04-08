# Chat Poll Follow-up Scope

This branch is reserved for the long polling and future events follow-up only.
Do not merge it as the MVP chat integration until the cross-service contract is closed.

## Current branch responsibility

- Keep the Nest draft limited to:
  - `GET /api/chat/rooms`
  - `GET /api/chat/rooms/:roomId/messages`
  - `POST /api/chat/rooms/:roomId/messages`
  - `POST /api/chat/rooms/:roomId/read`
  - `GET /api/chat/poll`
- Treat the room message list, send, and read endpoints as draft APIs that close the current Nest-side room workflow while the event contract is still pending.
- Keep the current unread computation and room summary query as a draft contract, not the final FE integration contract.

## `/chat/poll` vs future `/chat/rooms/:roomId/events`

`GET /api/chat/poll` is a pull-based prototype.

- Request shape:
  - query params: `roomId`, optional `sinceMessageId`, optional `timeout`
- Response shape:
  - returns message rows only
  - returns `[]` on timeout
- Runtime assumption:
  - same Nest process handles both message write and poll wake-up

The future `GET /api/chat/rooms/:roomId/events` contract should replace this with a room-scoped event API.

- Path shape:
  - room is addressed by path parameter, not a free query tuple
- Payload scope:
  - events, not only messages
  - should be able to carry message, read/unread, and system event types
- Cursor semantics:
  - should use a stable event cursor or event id, not only `sinceMessageId`
- Infra assumption:
  - must survive multi-instance deployment or split writer/poller processes

## Single-process limitation

`ChatPollRegistry` is an in-memory waiter registry inside one Nest process.

- `pollMessages()` registers a waiter in memory.
- `sendMessage()` calls `ChatPollRegistry.notifyRoom(roomId)` after commit.
- This works only when the poll request and the write happen in the same process.
- If chat runs on multiple instances, or if writes move to another worker/process, wake-ups can be missed.

For a merge-ready event design, replace or back this with a shared signal layer such as Redis pub/sub.

## Keep in this branch

- Room summary SQL and DTO mapping in Nest
- Room message list and read cursor draft APIs
- Same-process long polling draft
- Same-process wake-up path from message write to poll waiters
- Tests that verify the long polling draft behavior

## Defer to later event or integration PRs

- Spring response fields that provide a stable `chatRoomId`
- Final `/chat/rooms/:roomId/events` contract
- Multi-instance wake-up strategy
- `RESERVATION_CARD` or other non-text payload contracts
- FE entry contract decision: `bookingId` or `chatRoomId`
- Final decision on whether `GET /chat/rooms` must always include counterpart name/profile
- Shared DB schema ownership between Spring JPA and Nest Prisma

## Merge hold reasons

- Spring does not yet provide a stable `chatRoomId` to the FE entry flow.
- `GET /api/chat/poll` is still a draft endpoint, not the final event contract.
- The current wake-up path is single-process only.
- `RESERVATION_CARD` payload ownership is unresolved.
- FE entry still has an unresolved identifier contract: `bookingId` vs `chatRoomId`.
- Spring entity assumptions and Nest Prisma schema ownership are not yet aligned as one source of truth.

## Recommended decisions for the next PR

- Spring should expose `chatRoomId` on the booking-driven chat entry surface.
  - FE may still start from `bookingId`, but Nest chat APIs should consume `chatRoomId`.
- Do not add `RESERVATION_CARD` from Spring in this branch.
  - First lock the event envelope and payload schema in the event PR.
- Keep counterpart name/profile in `GET /chat/rooms` only if FE needs to render the room list without an extra Spring lookup.
  - If FE already has that data from another source, remove the duplication in the integrating PR.
- Pick one schema source-of-truth workflow before merge.
  - Either Spring migration files define the chat tables and Prisma maps to them, or Prisma becomes the authoritative schema for chat tables.
