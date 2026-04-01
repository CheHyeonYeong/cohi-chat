package com.coDevs.cohiChat.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.MeetingType;
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.RoomMember;
import com.coDevs.cohiChat.chat.repository.ChatMessageQueryRepository;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.RoomMemberRepository;
import com.coDevs.cohiChat.chat.response.ChatReadStateResponseDTO;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    private static final UUID HOST_ID = UUID.randomUUID();
    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final UUID OUTSIDER_ID = UUID.randomUUID();
    private static final UUID ROOM_ID = UUID.randomUUID();
    private static final UUID MESSAGE_ID = UUID.randomUUID();
    private static final UUID NEWER_MESSAGE_ID = UUID.randomUUID();
    private static final UUID OLDER_MESSAGE_ID = UUID.randomUUID();
    private static final Long BOOKING_ID = 1L;

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ChatMessageQueryRepository chatMessageQueryRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private TimeSlot timeSlot;

    @InjectMocks
    private ChatService chatService;

    @Test
    @DisplayName("creates a new room for a new host/guest pair")
    void createRoomForBookingCreatesNewRoom() {
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(memberRepository.findByIdWithLock(HOST_ID))
            .willReturn(Optional.of(org.mockito.Mockito.mock(com.coDevs.cohiChat.member.entity.Member.class)));
        given(memberRepository.findByIdWithLock(GUEST_ID))
            .willReturn(Optional.of(org.mockito.Mockito.mock(com.coDevs.cohiChat.member.entity.Member.class)));
        given(chatRoomRepository.findActiveRoomByMembersForUpdate(HOST_ID, GUEST_ID))
            .willReturn(Optional.empty());

        ChatRoom savedRoom = ChatRoom.create();
        given(chatRoomRepository.save(any(ChatRoom.class))).willReturn(savedRoom);
        given(roomMemberRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

        chatService.createRoomForBooking(booking);

        verify(chatRoomRepository).save(any(ChatRoom.class));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RoomMember>> captor = ArgumentCaptor.forClass(List.class);
        verify(roomMemberRepository).saveAll(captor.capture());
        List<RoomMember> savedMembers = captor.getValue();

        assertThat(savedMembers).hasSize(2);
        assertThat(savedMembers)
            .extracting(RoomMember::getMemberId)
            .containsExactlyInAnyOrder(HOST_ID, GUEST_ID);
        assertThat(savedMembers)
            .extracting(RoomMember::getRoom)
            .containsOnly(savedRoom);
    }

    @Test
    @DisplayName("locks participants in stable order before creating a room")
    void createRoomForBookingLocksParticipantsInStableOrder() {
        UUID higherId = UUID.fromString("70000000-0000-0000-0000-000000000000");
        UUID lowerId = UUID.fromString("10000000-0000-0000-0000-000000000000");
        Booking booking = makeBooking(lowerId);

        given(timeSlot.getUserId()).willReturn(higherId);
        given(memberRepository.findByIdWithLock(lowerId))
            .willReturn(Optional.of(org.mockito.Mockito.mock(com.coDevs.cohiChat.member.entity.Member.class)));
        given(memberRepository.findByIdWithLock(higherId))
            .willReturn(Optional.of(org.mockito.Mockito.mock(com.coDevs.cohiChat.member.entity.Member.class)));
        given(chatRoomRepository.findActiveRoomByMembersForUpdate(higherId, lowerId))
            .willReturn(Optional.of(ChatRoom.create()));

        chatService.createRoomForBooking(booking);

        org.mockito.InOrder inOrder = org.mockito.Mockito.inOrder(memberRepository);
        inOrder.verify(memberRepository).findByIdWithLock(lowerId);
        inOrder.verify(memberRepository).findByIdWithLock(higherId);
    }

    @Test
    @DisplayName("reuses an existing room for the same host/guest pair")
    void createRoomForBookingReusesExistingRoom() {
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(memberRepository.findByIdWithLock(HOST_ID))
            .willReturn(Optional.of(org.mockito.Mockito.mock(com.coDevs.cohiChat.member.entity.Member.class)));
        given(memberRepository.findByIdWithLock(GUEST_ID))
            .willReturn(Optional.of(org.mockito.Mockito.mock(com.coDevs.cohiChat.member.entity.Member.class)));

        ChatRoom existingRoom = ChatRoom.create();
        given(chatRoomRepository.findActiveRoomByMembersForUpdate(HOST_ID, GUEST_ID))
            .willReturn(Optional.of(existingRoom));

        chatService.createRoomForBooking(booking);

        verify(chatRoomRepository, never()).save(any(ChatRoom.class));
        verify(roomMemberRepository, never()).saveAll(any());
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
    @DisplayName("throws BOOKING_NOT_FOUND when booking does not exist")
    void getChatRoomByBookingIdThrowsWhenBookingNotFound() {
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.getChatRoomByBookingId(BOOKING_ID, GUEST_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("throws CHAT_ROOM_NOT_FOUND when no active room exists")
    void getChatRoomByBookingIdThrowsWhenChatRoomNotFound() {
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
        given(chatRoomRepository.findActiveRoomByMembers(HOST_ID, GUEST_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.getChatRoomByBookingId(BOOKING_ID, GUEST_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CHAT_ROOM_NOT_FOUND);
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

    @Test
    @DisplayName("updates last read message id for a booking participant")
    void updateLastReadMessageIdUpdatesRoomMember() {
        Booking booking = makeBooking();
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);
        RoomMember roomMember = RoomMember.create(ChatRoom.create(), GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findActiveRoomByMembers(HOST_ID, GUEST_ID)).willReturn(Optional.of(existingRoom));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, GUEST_ID))
            .willReturn(Optional.of(roomMember));
        given(chatMessageQueryRepository.findCreatedAtByIdAndRoomId(MESSAGE_ID, ROOM_ID))
            .willReturn(Optional.of(Instant.parse("2026-04-01T00:00:10Z")));

        ChatReadStateResponseDTO response = chatService.updateLastReadMessageId(BOOKING_ID, GUEST_ID, MESSAGE_ID);

        assertThat(response.roomId()).isEqualTo(ROOM_ID);
        assertThat(response.lastReadMessageId()).isEqualTo(MESSAGE_ID);
        assertThat(roomMember.getLastReadMessageId()).isEqualTo(MESSAGE_ID);
    }

    @Test
    @DisplayName("keeps the newer last read message when an older message arrives")
    void updateLastReadMessageIdDoesNotRegressReadState() {
        Booking booking = makeBooking();
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);
        RoomMember roomMember = RoomMember.create(ChatRoom.create(), GUEST_ID);
        roomMember.updateLastReadMessageId(NEWER_MESSAGE_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findActiveRoomByMembers(HOST_ID, GUEST_ID)).willReturn(Optional.of(existingRoom));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, GUEST_ID))
            .willReturn(Optional.of(roomMember));
        given(chatMessageQueryRepository.findCreatedAtByIdAndRoomId(OLDER_MESSAGE_ID, ROOM_ID))
            .willReturn(Optional.of(Instant.parse("2026-04-01T00:00:05Z")));
        given(chatMessageQueryRepository.findCreatedAtByIdAndRoomId(NEWER_MESSAGE_ID, ROOM_ID))
            .willReturn(Optional.of(Instant.parse("2026-04-01T00:00:10Z")));

        ChatReadStateResponseDTO response = chatService.updateLastReadMessageId(BOOKING_ID, GUEST_ID, OLDER_MESSAGE_ID);

        assertThat(response.lastReadMessageId()).isEqualTo(NEWER_MESSAGE_ID);
        assertThat(roomMember.getLastReadMessageId()).isEqualTo(NEWER_MESSAGE_ID);
    }

    @Test
    @DisplayName("rejects read state updates from users outside the booking room")
    void updateLastReadMessageIdRejectsOutsider() {
        Booking booking = makeBooking();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));

        assertThatThrownBy(() -> chatService.updateLastReadMessageId(BOOKING_ID, OUTSIDER_ID, MESSAGE_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("rejects read state updates when the message is not in the room")
    void updateLastReadMessageIdRejectsUnknownMessage() {
        Booking booking = makeBooking();
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);
        RoomMember roomMember = RoomMember.create(ChatRoom.create(), GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findActiveRoomByMembers(HOST_ID, GUEST_ID)).willReturn(Optional.of(existingRoom));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, GUEST_ID))
            .willReturn(Optional.of(roomMember));
        given(chatMessageQueryRepository.findCreatedAtByIdAndRoomId(MESSAGE_ID, ROOM_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.updateLastReadMessageId(BOOKING_ID, GUEST_ID, MESSAGE_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }

    private Booking makeBooking() {
        return makeBooking(GUEST_ID);
    }

    private Booking makeBooking(UUID guestId) {
        return Booking.create(
            timeSlot,
            guestId,
            LocalDate.now().plusDays(7),
            "test topic",
            "test description",
            MeetingType.ONLINE,
            null,
            null
        );
    }
}