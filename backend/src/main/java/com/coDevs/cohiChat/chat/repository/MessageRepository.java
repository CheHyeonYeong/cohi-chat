package com.coDevs.cohiChat.chat.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.coDevs.cohiChat.chat.entity.Message;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
        SELECT m FROM Message m
        WHERE m.cursorSeq IS NULL
        ORDER BY m.createdAt ASC, m.id ASC
        """)
    List<Message> findByCursorSeqIsNullOrderByCreatedAtAscIdAsc();

    @Query("""
        SELECT COALESCE(MAX(m.cursorSeq), 0) FROM Message m
        """)
    Long findMaxCursorSeq();
}
