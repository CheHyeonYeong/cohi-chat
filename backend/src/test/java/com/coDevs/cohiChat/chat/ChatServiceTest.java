package com.coDevs.cohiChat.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.time.LocalTime;
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
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    private static final UUID HOST_ID = UUID.randomUUID();
    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final UUID OUTSIDER_ID = UUID.randomUUID();
    private static final UUID ROOM_ID = UUID.randomUUID();
    private static final Long BOOKING_ID = 1L;

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private TimeSlot timeSlot;

    @InjectMocks
    private ChatService chatService;

    @Test
    @DisplayName("creates a new room for a new host/guest pair")
    void createRoomForBookingCreatesNewRoom() throws Exception {
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(chatRoomRepository.findActiveRoomByMembersForUpdate(HOST_ID, GUEST_ID))
            .willReturn(Optional.empty());
        given(objectMapper.writeValueAsString(any())).willReturn("{}");

        ChatRoom savedRoom = ChatRoom.create();
        given(chatRoomRepository.save(any(ChatRoom.class))).willReturn(savedRoom);
        given(roomMemberRepository.save(any(RoomMember.class))).willAnswer(inv -> inv.getArgument(0));
        given(messageRepository.save(any(Message.class))).willAnswer(inv -> inv.getArgument(0));

        chatService.createRoomForBooking(booking);

        verify(chatRoomRepository).save(any(ChatRoom.class));
        verify(roomMemberRepository, times(2)).save(any(RoomMember.class));
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    @DisplayName("reuses an existing room for the same host/guest pair")
    void createRoomForBookingReusesExistingRoom() throws Exception {
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(objectMapper.writeValueAsString(any())).willReturn("{}");

        ChatRoom existingRoom = ChatRoom.create();
        given(chatRoomRepository.findActiveRoomByMembersForUpdate(HOST_ID, GUEST_ID))
            .willReturn(Optional.of(existingRoom));
        given(messageRepository.save(any(Message.class))).willAnswer(inv -> inv.getArgument(0));

        chatService.createRoomForBooking(booking);

        verify(chatRoomRepository, never()).save(any(ChatRoom.class));
        verify(roomMemberRepository, never()).save(any(RoomMember.class));
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    @DisplayName("returns the existing room id for a booking")
    void getChatRoomIdByBookingReturnsExistingRoomId() {
        Booking booking = makeBooking();
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(chatRoomRepository.findActiveRoomByMembers(HOST_ID, GUEST_ID))
            .willReturn(Optional.of(existingRoom));

        assertThat(chatService.getChatRoomIdByBooking(booking)).contains(ROOM_ID);
    }

    @Test
    @DisplayName("returns the room id for a booking participant")
    void getChatRoomByBookingIdReturnsRoomForParticipant() {
        Booking booking = makeBooking();
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
        given(chatRoomRepository.findActiveRoomByMembers(HOST_ID, GUEST_ID))
            .willReturn(Optional.of(existingRoom));

        ChatRoomResponseDTO response = chatService.getChatRoomByBookingId(BOOKING_ID, GUEST_ID);

        assertThat(response.roomId()).isEqualTo(ROOM_ID);
    }

    @Test
    @DisplayName("rejects users outside the booking room")
    void getChatRoomByBookingIdRejectsOutsider() {
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));

        assertThatThrownBy(() -> chatService.getChatRoomByBookingId(BOOKING_ID, OUTSIDER_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    private Booking makeBooking() {
        return Booking.create(
            timeSlot,
            GUEST_ID,
            LocalDate.now().plusDays(7),
            "test topic",
            "test description",
            MeetingType.ONLINE,
            null,
            null
        );
    }
}