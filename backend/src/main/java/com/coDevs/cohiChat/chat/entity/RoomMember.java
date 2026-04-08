package com.coDevs.cohiChat.chat.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
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
    name = "room_member",
    indexes = @Index(
        name = "idx_room_member_member_id_deleted_at",
        columnList = "member_id, deleted_at"
    ),
    uniqueConstraints = @UniqueConstraint(
        name = "uq_room_member_room_id_member_id",
        columnNames = {"room_id", "member_id"}
    )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @Column(name = "member_id", nullable = false, columnDefinition = "uuid")
    private UUID memberId;

    @Column(name = "last_read_message_id", columnDefinition = "uuid")
    private UUID lastReadMessageId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public static RoomMember create(ChatRoom room, UUID memberId) {
        RoomMember member = new RoomMember();
        member.room = room;
        member.memberId = memberId;
        return member;
    }

    public void updateLastReadMessageId(UUID lastReadMessageId) {
        this.lastReadMessageId = lastReadMessageId;
    }

    public void restore() {
        this.deletedAt = null;
    }
}
