package com.coDevs.cohiChat.chat.entity;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.MessageRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageCursorService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Transactional
    public void assignCursorSeqIfMissing(Message message) {
        if (message.getCursorSeq() != null || message.getRoom() == null || message.getRoom().getId() == null) {
            return;
        }

        UUID roomId = message.getRoom().getId();
        ChatRoom room = lockRoom(roomId);
        initializeNextCursorSeqIfMissing(room, roomId);

        message.updateCursorSeq(room.allocateNextCursorSeq());
    }

    @Transactional
    public int backfillMissingCursorSeqs() {
        List<UUID> roomIds = messageRepository.findRoomIdsWithMissingCursorSeq();
        int updatedMessages = 0;

        for (UUID roomId : roomIds) {
            updatedMessages += resequenceRoom(roomId);
        }

        if (updatedMessages > 0) {
            log.info("[backfillMessageCursorSeq] [SUCCESS] updatedMessages={} affectedRooms={}", updatedMessages, roomIds.size());
        }

        return updatedMessages;
    }

    @Transactional
    public int resequenceRoom(UUID roomId) {
        ChatRoom room = lockRoom(roomId);
        long cursorSeq = messageRepository.findMaxCursorSeqByRoomId(roomId) + 1L;
        List<Message> messages = messageRepository.findByRoomIdAndCursorSeqIsNullOrderByCreatedAtAscIdAsc(roomId);

        for (Message message : messages) {
            message.updateCursorSeq(cursorSeq++);
        }

        room.advanceNextCursorSeqTo(cursorSeq);
        return messages.size();
    }

    private ChatRoom lockRoom(UUID roomId) {
        return chatRoomRepository.findByIdForUpdate(roomId)
            .orElseThrow(() -> new IllegalStateException("Chat room not found for cursor sequence assignment: " + roomId));
    }

    private void initializeNextCursorSeqIfMissing(ChatRoom room, UUID roomId) {
        if (room.getNextCursorSeq() != null) {
            return;
        }

        long nextCursorSeq = messageRepository.findMaxCursorSeqByRoomId(roomId) + 1L;
        room.initializeNextCursorSeq(nextCursorSeq);
    }
}
