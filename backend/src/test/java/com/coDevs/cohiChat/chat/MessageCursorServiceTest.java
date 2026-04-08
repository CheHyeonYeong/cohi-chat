package com.coDevs.cohiChat.chat;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.Message;
import com.coDevs.cohiChat.chat.entity.MessageCursorService;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.MessageRepository;

@ExtendWith(MockitoExtension.class)
class MessageCursorServiceTest {

    private static final UUID ROOM_ID = UUID.randomUUID();

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @InjectMocks
    private MessageCursorService messageCursorService;

    @Test
    @DisplayName("신규 메시지는 room counter 기준으로 자동 채번한다")
    void assignCursorSeqIfMissingAllocatesFromRoomCounter() {
        Message message = mock(Message.class);
        ChatRoom messageRoom = mock(ChatRoom.class);
        ChatRoom lockedRoom = mock(ChatRoom.class);

        given(message.getCursorSeq()).willReturn(null);
        given(message.getRoom()).willReturn(messageRoom);
        given(messageRoom.getId()).willReturn(ROOM_ID);
        given(lockedRoom.getNextCursorSeq()).willReturn(8L);
        given(chatRoomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(lockedRoom));
        given(lockedRoom.allocateNextCursorSeq()).willReturn(8L);

        messageCursorService.assignCursorSeqIfMissing(message);

        verify(message).updateCursorSeq(8L);
        verify(messageRepository, never()).findMaxCursorSeqByRoomId(ROOM_ID);
    }

    @Test
    @DisplayName("room counter가 비어 있으면 기존 max(cursor_seq)+1로 초기화한 뒤 채번한다")
    void assignCursorSeqIfMissingInitializesCounterWhenMissing() {
        Message message = mock(Message.class);
        ChatRoom messageRoom = mock(ChatRoom.class);
        ChatRoom lockedRoom = mock(ChatRoom.class);

        given(message.getCursorSeq()).willReturn(null);
        given(message.getRoom()).willReturn(messageRoom);
        given(messageRoom.getId()).willReturn(ROOM_ID);
        given(lockedRoom.getNextCursorSeq()).willReturn(null);
        given(chatRoomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(lockedRoom));
        given(messageRepository.findMaxCursorSeqByRoomId(ROOM_ID)).willReturn(7L);
        given(lockedRoom.allocateNextCursorSeq()).willReturn(8L);

        messageCursorService.assignCursorSeqIfMissing(message);

        verify(lockedRoom).initializeNextCursorSeq(8L);
        verify(message).updateCursorSeq(8L);
    }

    @Test
    @DisplayName("이미 cursor_seq가 있으면 자동 채번하지 않는다")
    void assignCursorSeqIfMissingDoesNothingWhenAlreadyAssigned() {
        Message message = mock(Message.class);

        given(message.getCursorSeq()).willReturn(3L);

        messageCursorService.assignCursorSeqIfMissing(message);

        verify(chatRoomRepository, never()).findByIdForUpdate(ROOM_ID);
        verify(messageRepository, never()).findMaxCursorSeqByRoomId(ROOM_ID);
        verify(message, never()).updateCursorSeq(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    @DisplayName("기존에 일부 cursor_seq가 있으면 그 값은 유지하고 NULL만 뒤에 backfill한다")
    void backfillMissingCursorSeqsAppendsOnlyMissingMessages() {
        ChatRoom room = mock(ChatRoom.class);
        Message firstMissing = mock(Message.class);
        Message secondMissing = mock(Message.class);

        given(messageRepository.findRoomIdsWithMissingCursorSeq()).willReturn(List.of(ROOM_ID));
        given(chatRoomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(room));
        given(messageRepository.findMaxCursorSeqByRoomId(ROOM_ID)).willReturn(5L);
        given(messageRepository.findByRoomIdAndCursorSeqIsNullOrderByCreatedAtAscIdAsc(ROOM_ID))
            .willReturn(List.of(firstMissing, secondMissing));

        messageCursorService.backfillMissingCursorSeqs();

        verify(firstMissing).updateCursorSeq(6L);
        verify(secondMissing).updateCursorSeq(7L);
        verify(room).advanceNextCursorSeqTo(8L);
    }
}
