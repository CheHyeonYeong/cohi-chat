package com.coDevs.cohiChat.chat;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.chat.entity.Message;
import com.coDevs.cohiChat.chat.entity.MessageCursorBackfillService;
import com.coDevs.cohiChat.chat.repository.MessageRepository;

@ExtendWith(MockitoExtension.class)
class MessageCursorBackfillServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private MessageCursorBackfillService messageCursorBackfillService;

    @Test
    @DisplayName("appends global cursor_seq only to messages that are still null")
    void backfillMissingCursorSeqsAppendsOnlyMissingMessages() {
        Message firstMissing = mock(Message.class);
        Message secondMissing = mock(Message.class);

        given(messageRepository.findMaxCursorSeq()).willReturn(5L);
        given(messageRepository.findByCursorSeqIsNullOrderByCreatedAtAscIdAsc())
            .willReturn(List.of(firstMissing, secondMissing));

        messageCursorBackfillService.backfillMissingCursorSeqs();

        verify(firstMissing).updateCursorSeq(6L);
        verify(secondMissing).updateCursorSeq(7L);
    }
}
