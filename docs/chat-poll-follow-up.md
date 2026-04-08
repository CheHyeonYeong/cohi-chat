# Chat Events Follow-up Scope

This branch is not an MVP merge target.
Keep `khs_499_mainfix` only as a hold branch for the later events or long polling follow-up.

## Final baseline

- Spring owns chat room provisioning only.
  - create or reuse `chat_room`
  - create or restore `room_member`
  - expose `chatRoomId` from the booking flow
- Nest owns runtime APIs only.
  - current MVP merge scope is existing `rooms`, `messages`, and `read` runtime APIs
  - this branch does not take ownership of those APIs
- Events and long polling are out of the current MVP merge scope.
- Do not expand direct SQL usage from this branch.

## Keep in this branch

- `GET /api/chat/poll` draft controller and service flow
- `ChatPollRegistry` in-memory waiter registry
- same-process wake-up path from message write to poll waiters
- tests and notes that describe the current poll draft behavior
- documentation that explains why this branch is held back from merge

## Move to the later events PR

- `GET /api/chat/poll` implementation, renamed and reshaped into `GET /api/chat/rooms/:roomId/events`
- poll cursor semantics, to be replaced by a stable event cursor
- event payload envelope for message, read or unread, and system event types
- wake-up delivery strategy that works across multiple instances or split writer and poller processes
- RabbitMQ or other external signal delivery only if the event design requires it

## Exclude from the current MVP merge scope

- `GET /api/chat/rooms`
- `GET /api/chat/rooms/:roomId/messages`
- `POST /api/chat/rooms/:roomId/messages`
- `PATCH /api/chat/rooms/:roomId/read`
- room summary query shape
- unread computation contract

These APIs belong to the current MVP runtime surface, but this branch does not own them.
If they change here for the event experiment, do not merge those changes through this branch.

## Single-process limitation

`ChatPollRegistry` is an in-memory waiter registry inside one Nest process.

- `pollMessages()` registers a waiter in memory.
- `sendMessage()` wakes waiters by calling `notifyRoom(roomId)` in the same process.
- this works only when the poll request and the message write hit the same Nest process
- if chat runs on multiple instances, or if writes move to another worker or process, wake-ups can be missed

This limitation must stay explicit in every review and PR note for this branch.

## Why this branch must not merge now

- the branch scope conflicts with the final MVP split
  - Spring should merge first for room provisioning
  - this branch currently mixes event follow-up with existing runtime APIs
- `GET /api/chat/poll` is still a prototype, not the final `/chat/rooms/:roomId/events` contract
- the in-memory poll registry is single-process only
- this branch should not take ownership of `rooms`, `messages`, or `read` API behavior
- direct SQL expansion from this branch would move in the opposite direction of the agreed baseline

## Minimum TODO for `/chat/rooms/:roomId/events`

1. Reduce the follow-up branch to poll or event-only ownership.
2. Replace `GET /api/chat/poll` query parameters with a room-scoped events path.
3. Define the event cursor contract.
4. Define the event envelope and event type list.
5. Decide whether read or unread changes are emitted as events or remain request-response only.
6. Replace the same-process wake-up assumption with a shared signal strategy when multi-instance support becomes necessary.
7. Keep Spring room provisioning and Nest runtime ownership separated while both services share only the column contract.
