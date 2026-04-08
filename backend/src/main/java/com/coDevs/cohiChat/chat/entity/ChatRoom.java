package com.coDevs.cohiChat.chat.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
    name = "chat_room",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_chat_room_external_ref",
        columnNames = {"external_ref_type", "external_ref_id"}
    )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "is_disabled", nullable = false)
    private boolean isDisabled = false;

    @Column(name = "external_ref_type", length = 50)
    private String externalRefType;

    @Column(name = "external_ref_id", columnDefinition = "uuid")
    private UUID externalRefId;

    @Column(name = "next_cursor_seq")
    private Long nextCursorSeq;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public static ChatRoom create(String externalRefType, UUID externalRefId) {
        ChatRoom room = new ChatRoom();
        room.externalRefType = externalRefType;
        room.externalRefId = externalRefId;
        room.nextCursorSeq = 1L;
        return room;
    }

    public long allocateNextCursorSeq() {
        long current = nextCursorSeq != null ? nextCursorSeq : 1L;
        nextCursorSeq = current + 1L;
        return current;
    }

    public void initializeNextCursorSeq(long nextCursorSeq) {
        this.nextCursorSeq = nextCursorSeq;
    }

    public void advanceNextCursorSeqTo(long nextCursorSeq) {
        if (this.nextCursorSeq == null || this.nextCursorSeq < nextCursorSeq) {
            this.nextCursorSeq = nextCursorSeq;
        }
    }
}
