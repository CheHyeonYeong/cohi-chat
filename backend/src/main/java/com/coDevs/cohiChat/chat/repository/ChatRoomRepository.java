package com.coDevs.cohiChat.chat.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.chat.entity.ChatRoom;

import jakarta.persistence.LockModeType;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r FROM ChatRoom r
        JOIN RoomMember m1 ON m1.room = r AND m1.memberId = :memberId1 AND m1.deletedAt IS NULL
        JOIN RoomMember m2 ON m2.room = r AND m2.memberId = :memberId2 AND m2.deletedAt IS NULL
        WHERE r.deletedAt IS NULL
        """)
    Optional<ChatRoom> findActiveRoomByMembersForUpdate(@Param("memberId1") UUID memberId1, @Param("memberId2") UUID memberId2);

    @Query("""
        SELECT r FROM ChatRoom r
        JOIN RoomMember m1 ON m1.room = r AND m1.memberId = :memberId1 AND m1.deletedAt IS NULL
        JOIN RoomMember m2 ON m2.room = r AND m2.memberId = :memberId2 AND m2.deletedAt IS NULL
        WHERE r.deletedAt IS NULL
        """)
    Optional<ChatRoom> findActiveRoomByMembers(@Param("memberId1") UUID memberId1, @Param("memberId2") UUID memberId2);

}
