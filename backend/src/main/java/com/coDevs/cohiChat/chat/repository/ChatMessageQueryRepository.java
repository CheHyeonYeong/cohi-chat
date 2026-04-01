package com.coDevs.cohiChat.chat.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ChatMessageQueryRepository {

    private final EntityManager entityManager;

    public Optional<Instant> findCreatedAtByIdAndRoomId(UUID messageId, UUID roomId) {
        @SuppressWarnings("unchecked")
        var rows = entityManager.createNativeQuery("""
            SELECT created_at
            FROM message
            WHERE id = :messageId
              AND room_id = :roomId
            """)
            .setParameter("messageId", messageId)
            .setParameter("roomId", roomId)
            .getResultList();

        if (rows.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of((Instant) rows.get(0));
    }
}