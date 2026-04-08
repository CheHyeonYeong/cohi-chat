package com.coDevs.cohiChat.chat.entity;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.chat.repository.MessageRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageCursorBackfillService {

    private final MessageRepository messageRepository;

    @Transactional
    public int backfillMissingCursorSeqs() {
        List<UUID> roomIds = messageRepository.findRoomIdsWithMissingCursorSeq();
        int updatedMessages = 0;

        for (UUID roomId : roomIds) {
            updatedMessages += backfillRoom(roomId);
        }

        if (updatedMessages > 0) {
            log.info("[backfillMessageCursorSeq] [SUCCESS] updatedMessages={} affectedRooms={}", updatedMessages, roomIds.size());
        }

        return updatedMessages;
    }

    @Transactional
    public int backfillRoom(UUID roomId) {
        long cursorSeq = messageRepository.findMaxCursorSeqByRoomId(roomId) + 1L;
        List<Message> messages = messageRepository.findByRoomIdAndCursorSeqIsNullOrderByCreatedAtAscIdAsc(roomId);

        for (Message message : messages) {
            message.updateCursorSeq(cursorSeq++);
        }

        return messages.size();
    }
}
