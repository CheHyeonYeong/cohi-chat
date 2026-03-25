package com.coDevs.cohiChat.chat;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.MeetingType;
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.Message;
import com.coDevs.cohiChat.chat.entity.RoomMember;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.MessageRepository;
import com.coDevs.cohiChat.chat.repository.RoomMemberRepository;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ChatRoomRepository chatRoomRepository;
    @Mock private RoomMemberRepository roomMemberRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private ObjectMapper objectMapper;
    @Mock private TimeSlot timeSlot;

    @InjectMocks
    private ChatService chatService;

    private static final UUID HOST_ID = UUID.randomUUID();
    private static final UUID GUEST_ID = UUID.randomUUID();

    @Test
    @DisplayName("새로운 예약 - 채팅방 신규 생성")
    void createRoomForBooking_새로운방_생성() throws Exception {
        // given
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(java.time.LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(java.time.LocalTime.of(11, 0));
        given(chatRoomRepository.findActiveRoomByHostAndGuestForUpdate(HOST_ID, GUEST_ID))
            .willReturn(Optional.empty());
        given(objectMapper.writeValueAsString(any())).willReturn("{}");

        ChatRoom savedRoom = ChatRoom.create("RESERVATION", UUID.randomUUID());
        given(chatRoomRepository.save(any(ChatRoom.class))).willReturn(savedRoom);
        given(roomMemberRepository.save(any(RoomMember.class))).willAnswer(inv -> inv.getArgument(0));
        given(messageRepository.save(any(Message.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        chatService.createRoomForBooking(booking);

        // then
        verify(chatRoomRepository).save(any(ChatRoom.class));
        verify(roomMemberRepository, times(2)).save(any(RoomMember.class)); // HOST + GUEST
        verify(messageRepository).save(any(Message.class));                 // RESERVATION_CARD
    }

    @Test
    @DisplayName("기존 호스트-게스트 재예약 - 기존 채팅방 재사용 (room/member INSERT 없음)")
    void createRoomForBooking_이미존재하는방_재사용() throws Exception {
        // given
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(java.time.LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(java.time.LocalTime.of(11, 0));
        given(objectMapper.writeValueAsString(any())).willReturn("{}");

        ChatRoom existingRoom = ChatRoom.create("RESERVATION", UUID.randomUUID());
        given(chatRoomRepository.findActiveRoomByHostAndGuestForUpdate(HOST_ID, GUEST_ID))
            .willReturn(Optional.of(existingRoom));
        given(messageRepository.save(any(Message.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        chatService.createRoomForBooking(booking);

        // then
        verify(chatRoomRepository, never()).save(any(ChatRoom.class));     // 새 room 생성 없음
        verify(roomMemberRepository, never()).save(any(RoomMember.class)); // 새 member 생성 없음
        verify(messageRepository).save(any(Message.class));                // RESERVATION_CARD만 추가
    }

    private Booking makeBooking() {
        return Booking.create(
            timeSlot, GUEST_ID, LocalDate.now().plusDays(7),
            "테스트 주제", "테스트 설명", MeetingType.ONLINE, null, null
        );
    }
}
