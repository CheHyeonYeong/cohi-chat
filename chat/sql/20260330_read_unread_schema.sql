ALTER TABLE room_member
    ADD COLUMN IF NOT EXISTS last_read_message_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_room_member_room_id
    ON room_member(room_id);

CREATE INDEX IF NOT EXISTS idx_message_room_id_created_at
    ON message(room_id, created_at DESC);
