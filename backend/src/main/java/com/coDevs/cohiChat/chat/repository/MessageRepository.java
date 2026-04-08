package com.coDevs.cohiChat.chat.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.chat.entity.Message;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
        SELECT DISTINCT m.room.id FROM Message m
        WHERE m.cursorSeq IS NULL
        """)
    List<UUID> findRoomIdsWithMissingCursorSeq();

    @Query("""
        SELECT m FROM Message m
        WHERE m.room.id = :roomId
          AND m.cursorSeq IS NULL
        ORDER BY m.createdAt ASC, m.id ASC
        """)
    List<Message> findByRoomIdAndCursorSeqIsNullOrderByCreatedAtAscIdAsc(@Param("roomId") UUID roomId);

    @Query("""
        SELECT COALESCE(MAX(m.cursorSeq), 0) FROM Message m
        WHERE m.room.id = :roomId
        """)
    Long findMaxCursorSeqByRoomId(@Param("roomId") UUID roomId);
}
