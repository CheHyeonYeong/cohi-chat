ALTER TABLE room_member
    ADD COLUMN IF NOT EXISTS last_read_message_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_room_member_member_id_deleted_at
    ON room_member(member_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_room_member_room_id
    ON room_member(room_id);

BEGIN;
LOCK TABLE message IN ACCESS EXCLUSIVE MODE;

CREATE SEQUENCE IF NOT EXISTS message_cursor_seq_seq;

ALTER TABLE message
    ADD COLUMN IF NOT EXISTS cursor_seq BIGINT;

WITH ordered_messages AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS next_cursor_seq
    FROM message
    WHERE cursor_seq IS NULL
)
UPDATE message AS target
SET cursor_seq = ordered_messages.next_cursor_seq
FROM ordered_messages
WHERE target.id = ordered_messages.id;

SELECT setval(
    'message_cursor_seq_seq',
    COALESCE((SELECT MAX(cursor_seq) FROM message), 1),
    EXISTS (SELECT 1 FROM message)
);

ALTER TABLE message
    ALTER COLUMN cursor_seq SET DEFAULT nextval('message_cursor_seq_seq');

ALTER TABLE message
    ALTER COLUMN cursor_seq SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_message_cursor_seq
    ON message(cursor_seq);

CREATE INDEX IF NOT EXISTS idx_message_room_id_cursor_seq
    ON message(room_id, cursor_seq DESC);

COMMIT;
