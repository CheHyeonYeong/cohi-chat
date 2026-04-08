package com.coDevs.cohiChat.chat.entity;

import java.util.List;

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
        long cursorSeq = messageRepository.findMaxCursorSeq() + 1L;
        List<Message> messages = messageRepository.findByCursorSeqIsNullOrderByCreatedAtAscIdAsc();

        for (Message message : messages) {
            message.updateCursorSeq(cursorSeq++);
        }

        if (!messages.isEmpty()) {
            log.info("[backfillMessageCursorSeq] [SUCCESS] updatedMessages={}", messages.size());
        }

        return messages.size();
    }
}
