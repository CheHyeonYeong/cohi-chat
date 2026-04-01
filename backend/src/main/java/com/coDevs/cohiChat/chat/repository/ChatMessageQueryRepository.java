package com.coDevs.cohiChat.chat.repository;

import java.util.UUID;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ChatMessageQueryRepository {

    private final EntityManager entityManager;

    public boolean existsByIdAndRoomId(UUID messageId, UUID roomId) {
        Number count = (Number) entityManager.createNativeQuery("""
            SELECT COUNT(1)
            FROM message
            WHERE id = :messageId
              AND room_id = :roomId
            """)
            .setParameter("messageId", messageId)
            .setParameter("roomId", roomId)
            .getSingleResult();

        return count.longValue() > 0;
    }
}
