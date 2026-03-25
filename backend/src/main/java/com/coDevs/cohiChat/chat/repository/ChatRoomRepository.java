package com.coDevs.cohiChat.chat.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.RoomRole;

import jakarta.persistence.LockModeType;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.id IN (
            SELECT m1.room.id FROM RoomMember m1 WHERE m1.memberId = :hostId AND m1.role = com.coDevs.cohiChat.chat.entity.RoomRole.HOST
        )
        AND r.id IN (
            SELECT m2.room.id FROM RoomMember m2 WHERE m2.memberId = :guestId AND m2.role = com.coDevs.cohiChat.chat.entity.RoomRole.GUEST
        )
        AND r.deletedAt IS NULL
        """)
    Optional<ChatRoom> findActiveRoomByHostAndGuestForUpdate(@Param("hostId") UUID hostId, @Param("guestId") UUID guestId);

    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.id IN (
            SELECT m1.room.id FROM RoomMember m1 WHERE m1.memberId = :hostId AND m1.role = com.coDevs.cohiChat.chat.entity.RoomRole.HOST
        )
        AND r.id IN (
            SELECT m2.room.id FROM RoomMember m2 WHERE m2.memberId = :guestId AND m2.role = com.coDevs.cohiChat.chat.entity.RoomRole.GUEST
        )
        AND r.deletedAt IS NULL
        """)
    Optional<ChatRoom> findActiveRoomByHostAndGuest(@Param("hostId") UUID hostId, @Param("guestId") UUID guestId);

    @Query("SELECT r FROM ChatRoom r WHERE r.externalRefType = 'RESERVATION' AND r.externalRefId = :externalRefId AND r.deletedAt IS NULL")
    Optional<ChatRoom> findByBookingExternalRef(@Param("externalRefId") UUID externalRefId);
}
