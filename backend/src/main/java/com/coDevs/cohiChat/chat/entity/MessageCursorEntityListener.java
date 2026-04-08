package com.coDevs.cohiChat.chat.entity;

import jakarta.persistence.PrePersist;

public class MessageCursorEntityListener {

    @PrePersist
    public void assignCursorSeq(Message message) {
        SpringContextHolder.getBean(MessageCursorService.class)
            .assignCursorSeqIfMissing(message);
    }
}
