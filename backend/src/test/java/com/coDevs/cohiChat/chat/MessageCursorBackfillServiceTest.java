package com.coDevs.cohiChat.chat;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.UUID;

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

    private static final UUID ROOM_ID = UUID.randomUUID();

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private MessageCursorBackfillService messageCursorBackfillService;

    @Test
    @DisplayName("appends cursor_seq only to messages that are still null")
    void backfillRoomAppendsOnlyMissingMessages() {
        Message firstMissing = mock(Message.class);
        Message secondMissing = mock(Message.class);

        given(messageRepository.findMaxCursorSeqByRoomId(ROOM_ID)).willReturn(5L);
        given(messageRepository.findByRoomIdAndCursorSeqIsNullOrderByCreatedAtAscIdAsc(ROOM_ID))
            .willReturn(List.of(firstMissing, secondMissing));

        messageCursorBackfillService.backfillRoom(ROOM_ID);

        verify(firstMissing).updateCursorSeq(6L);
        verify(secondMissing).updateCursorSeq(7L);
    }
}
