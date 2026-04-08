package com.coDevs.cohiChat.chat.entity;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MessageCursorBackfillInitializer implements ApplicationRunner {

    private final MessageCursorService messageCursorService;

    @Override
    public void run(ApplicationArguments args) {
        messageCursorService.backfillMissingCursorSeqs();
    }
}
