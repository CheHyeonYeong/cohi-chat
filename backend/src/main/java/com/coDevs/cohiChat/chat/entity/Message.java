package com.coDevs.cohiChat.chat.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
    name = "message",
    indexes = @Index(name = "idx_message_room_id_cursor_seq_desc", columnList = "room_id, cursor_seq DESC"),
    uniqueConstraints = @UniqueConstraint(
        name = "uq_message_room_id_cursor_seq",
        columnNames = {"room_id", "cursor_seq"}
    )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @Column(name = "sender_id", columnDefinition = "uuid")
    private UUID senderId;

    @Column(name = "message_type", nullable = false, length = 30)
    private String messageType;

    @Column(name = "content", length = 2000)
    private String content;

    @Column(name = "payload", columnDefinition = "jsonb")
    private String payload;

    @Column(name = "cursor_seq")
    private Long cursorSeq;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public void updateCursorSeq(long cursorSeq) {
        this.cursorSeq = cursorSeq;
    }
}
