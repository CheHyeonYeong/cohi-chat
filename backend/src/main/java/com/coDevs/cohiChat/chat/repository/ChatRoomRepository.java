package com.coDevs.cohiChat.chat.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.chat.entity.ChatRoom;

import jakarta.persistence.LockModeType;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.externalRefType = :externalRefType
          AND r.externalRefId = :externalRefId
          AND r.deletedAt IS NULL
        """)
    Optional<ChatRoom> findByExternalRef(
        @Param("externalRefType") String externalRefType,
        @Param("externalRefId") UUID externalRefId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.externalRefType = :externalRefType
          AND r.externalRefId = :externalRefId
          AND r.deletedAt IS NULL
        """)
    Optional<ChatRoom> findByExternalRefForUpdate(
        @Param("externalRefType") String externalRefType,
        @Param("externalRefId") UUID externalRefId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.id = :roomId
          AND r.deletedAt IS NULL
        """)
    Optional<ChatRoom> findByIdForUpdate(@Param("roomId") UUID roomId);

    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.externalRefType = :externalRefType
          AND r.externalRefId IN :externalRefIds
          AND r.deletedAt IS NULL
        """)
    List<ChatRoom> findAllByExternalRefIds(
        @Param("externalRefType") String externalRefType,
        @Param("externalRefIds") Collection<UUID> externalRefIds
    );
}
