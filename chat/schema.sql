-- Current chat server DDL reference.
-- Apply this explicitly because Prisma does not manage production schema automatically here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS chat_room (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    is_disabled BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_chat_room PRIMARY KEY (id)
);

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
    CONSTRAINT pk_message PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_message_room_id_created_at
    ON message(room_id, created_at DESC, id DESC);
