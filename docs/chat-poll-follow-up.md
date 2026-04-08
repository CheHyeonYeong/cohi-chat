# Chat Poll Transport Scope

`khs_499_mainfix` owns the MVP long polling transport layer.

Long polling is technically a transport layer, but under the current product rule it is required for MVP because chat is not considered working without automatic refresh or waiting responses.

## Final ownership

- `khs_454`
  - Spring room provisioning
  - create or reuse `chat_room`
  - create or restore `room_member`
  - expose `chatRoomId`
- `khs_497`
  - `GET /api/chat/rooms/:roomId/messages`
  - `POST /api/chat/rooms/:roomId/messages`
- `khs_525`
  - `GET /api/chat/rooms`
  - `PATCH /api/chat/rooms/:roomId/read`
  - `GET /api/chat/unread-summary`
- `khs_499_mainfix`
  - `GET /api/chat/poll`
  - `ChatPollRegistry`
  - send-message wake-up connection after commit

## What stays in this branch

- `GET /api/chat/poll` controller and service flow
- room membership validation for polling
- waiter registration and timeout handling
- same-room wake-up hook through `notifyRoomActivity(roomId)`
- `ChatPollRegistry` in-memory listener registry
- tests and docs for the MVP poll transport behavior

## What this branch must not own

- `GET /api/chat/rooms`
- `GET /api/chat/rooms/:roomId/messages`
- `POST /api/chat/rooms/:roomId/messages`
- `PATCH /api/chat/rooms/:roomId/read`
- unread summary contract
- room summary query contract

If these APIs appear in this branch, treat them as overlap and remove or realign them to the owner branch before merge.

## Why poll stays in MVP

- without poll, the current UX does not auto-refresh incoming messages
- the product rule says chat is not working unless the client can wait for new messages and render them automatically
- current MVP therefore needs a transport endpoint, not only request-response message APIs

## Why `/chat/poll` stays for now

Keep `GET /api/chat/poll` in this branch for the current MVP.

- the current implementation returns message rows only
- the endpoint already matches the minimal transport need
- switching to `/chat/rooms/:roomId/events` now would expand the contract and collide with later event-envelope design work
- `/chat/rooms/:roomId/events` should remain the follow-up target once payload shape, cursor contract, and multi-instance delivery are defined

## Single-process limitation

`ChatPollRegistry` is an in-memory waiter registry inside one Nest process.

- `pollMessages()` registers a waiter in memory
- `notifyRoomActivity(roomId)` wakes listeners in memory
- if the poll request and the message write hit different Nest processes, wake-ups can be missed

This branch is valid for the current same-process MVP assumption only.

## Merge checks for this branch

- poll must remain in MVP scope
- sender-side message commit must wake the same room poll waiter immediately
- poll must apply room membership validation
- this branch must not re-own `rooms`, `messages`, or `read`
- no new direct SQL should be added from this branch

## Remaining TODO

1. Wire `notifyRoomActivity(roomId)` from the message-send owner branch after successful message commit.
2. Confirm FE long polling behavior still satisfies the current automatic refresh UX.
3. Keep `GET /api/chat/poll` stable for MVP and defer `/chat/rooms/:roomId/events` to a later contract PR.
4. Define the later event cursor and envelope design without changing current owner boundaries.
5. Replace the in-memory wake-up mechanism when multi-instance support becomes necessary.
