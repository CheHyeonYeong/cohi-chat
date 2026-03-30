package com.coDevs.cohiChat.chat.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "chat_room")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ChatRoomType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ChatRoomStatus status;

    @Column(name = "external_ref_type", nullable = false, length = 50)
    private String externalRefType;

    @Column(name = "external_ref_id", nullable = false, columnDefinition = "uuid")
    private UUID externalRefId;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "is_disabled", nullable = false)
    private boolean isDisabled = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public static ChatRoom createReservationRoom(UUID externalRefId) {
        ChatRoom room = new ChatRoom();
        room.type = ChatRoomType.ONE_TO_ONE;
        room.status = ChatRoomStatus.ACTIVE;
        room.externalRefType = "RESERVATION";
        room.externalRefId = externalRefId;
        return room;
    }
}
