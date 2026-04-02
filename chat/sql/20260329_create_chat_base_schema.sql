CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SEQUENCE IF NOT EXISTS message_cursor_seq_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS chat_room (
    id                UUID        NOT NULL DEFAULT gen_random_uuid(),
    type              VARCHAR(20) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    external_ref_type VARCHAR(50) NULL,
    external_ref_id   UUID        NULL,
    is_disabled       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ NULL,
    CONSTRAINT pk_chat_room PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_external_ref_deleted_at
    ON chat_room(external_ref_type, external_ref_id, deleted_at);

CREATE TABLE IF NOT EXISTS room_member (
    id                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    room_id              UUID        NOT NULL,
    member_id            UUID        NOT NULL,
    last_read_message_id UUID        NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ NULL,
    CONSTRAINT pk_room_member PRIMARY KEY (id),
    CONSTRAINT uq_room_member UNIQUE (room_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_room_member_member_id_deleted_at
    ON room_member(member_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_room_member_room_id
    ON room_member(room_id);

CREATE TABLE IF NOT EXISTS message (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    room_id      UUID         NOT NULL,
    sender_id    UUID         NULL,
    message_type VARCHAR(30)  NOT NULL,
    content      VARCHAR(2000) NULL,
    payload      JSONB        NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    cursor_seq   BIGINT       NOT NULL DEFAULT nextval('message_cursor_seq_seq'),
    CONSTRAINT pk_message PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_message_cursor_seq
    ON message(cursor_seq);

CREATE INDEX IF NOT EXISTS idx_message_room_id_created_at
    ON message(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_room_id_cursor_seq
    ON message(room_id, cursor_seq DESC);
