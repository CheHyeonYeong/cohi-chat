package com.coDevs.cohiChat.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Map;
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
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.RoomMember;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.RoomMemberRepository;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    private static final Long BOOKING_ID = 42L;
    private static final UUID ROOM_ID = UUID.randomUUID();
    private static final UUID HOST_ID = UUID.randomUUID();
    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final UUID OUTSIDER_ID = UUID.randomUUID();
    private static final UUID BOOKING_EXTERNAL_REF_ID = new UUID(0L, BOOKING_ID);

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private Booking booking;

    @Mock
    private TimeSlot timeSlot;

    @InjectMocks
    private ChatService chatService;

    @Test
    @DisplayName("creates a room and two room members for a booking")
    void provisionRoomForBookingCreatesNewRoomAndMembers() {
        ChatRoom savedRoom = org.mockito.Mockito.mock(ChatRoom.class);

        given(booking.getId()).willReturn(BOOKING_ID);
        given(booking.getTimeSlot()).willReturn(timeSlot);
        given(booking.getGuestId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(savedRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findByExternalRefForUpdate("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.empty());
        given(chatRoomRepository.findAnyByExternalRefForUpdate("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.empty());
        given(chatRoomRepository.saveAndFlush(any(ChatRoom.class))).willReturn(savedRoom);
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, HOST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, GUEST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, HOST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, GUEST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.saveAndFlush(any(RoomMember.class))).willAnswer(invocation -> invocation.getArgument(0));

        UUID roomId = chatService.provisionRoomForBooking(booking);

        assertThat(roomId).isEqualTo(ROOM_ID);
        verify(chatRoomRepository).saveAndFlush(any(ChatRoom.class));
        verify(roomMemberRepository, times(2)).saveAndFlush(any(RoomMember.class));
    }

    @Test
    @DisplayName("restores a soft deleted room for the same booking")
    void provisionRoomForBookingRestoresSoftDeletedRoom() {
        ChatRoom deletedRoom = org.mockito.Mockito.mock(ChatRoom.class);

        given(booking.getId()).willReturn(BOOKING_ID);
        given(booking.getTimeSlot()).willReturn(timeSlot);
        given(booking.getGuestId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(deletedRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findByExternalRefForUpdate("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.empty());
        given(chatRoomRepository.findAnyByExternalRefForUpdate("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.of(deletedRoom));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, HOST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, GUEST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, HOST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, GUEST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.saveAndFlush(any(RoomMember.class))).willAnswer(invocation -> invocation.getArgument(0));

        UUID roomId = chatService.provisionRoomForBooking(booking);

        assertThat(roomId).isEqualTo(ROOM_ID);
        verify(deletedRoom).restore();
        verify(chatRoomRepository, never()).saveAndFlush(any(ChatRoom.class));
    }

    @Test
    @DisplayName("reuses the existing room without duplicating room members")
    void provisionRoomForBookingReusesExistingRoomWithoutDuplicateMembers() {
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);
        RoomMember hostRoomMember = org.mockito.Mockito.mock(RoomMember.class);
        RoomMember guestRoomMember = org.mockito.Mockito.mock(RoomMember.class);

        given(booking.getId()).willReturn(BOOKING_ID);
        given(booking.getTimeSlot()).willReturn(timeSlot);
        given(booking.getGuestId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findByExternalRefForUpdate("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.of(existingRoom));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, HOST_ID))
            .willReturn(Optional.of(hostRoomMember));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, GUEST_ID))
            .willReturn(Optional.of(guestRoomMember));

        UUID roomId = chatService.provisionRoomForBooking(booking);

        assertThat(roomId).isEqualTo(ROOM_ID);
        verify(chatRoomRepository, never()).saveAndFlush(any(ChatRoom.class));
        verify(roomMemberRepository, never()).saveAndFlush(any(RoomMember.class));
    }

    @Test
    @DisplayName("restores only the soft deleted room member")
    void provisionRoomForBookingRestoresSoftDeletedRoomMember() {
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);
        RoomMember deletedGuestMember = org.mockito.Mockito.mock(RoomMember.class);

        given(booking.getId()).willReturn(BOOKING_ID);
        given(booking.getTimeSlot()).willReturn(timeSlot);
        given(booking.getGuestId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findByExternalRefForUpdate("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.of(existingRoom));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, HOST_ID))
            .willReturn(Optional.of(org.mockito.Mockito.mock(RoomMember.class)));
        given(roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(ROOM_ID, GUEST_ID))
            .willReturn(Optional.empty());
        given(roomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, GUEST_ID))
            .willReturn(Optional.of(deletedGuestMember));

        chatService.provisionRoomForBooking(booking);

        verify(deletedGuestMember).restore();
        verify(roomMemberRepository, never()).saveAndFlush(any(RoomMember.class));
    }

    @Test
    @DisplayName("returns chat room id by booking")
    void getChatRoomIdByBookingReturnsExistingRoomId() {
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);

        given(booking.getId()).willReturn(BOOKING_ID);
        given(existingRoom.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findByExternalRef("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.of(existingRoom));

        Optional<UUID> roomId = chatService.getChatRoomIdByBooking(booking);

        assertThat(roomId).contains(ROOM_ID);
    }

    @Test
    @DisplayName("returns chat room for a booking participant")
    void getChatRoomByBookingIdReturnsRoomForParticipant() {
        Booking persistedBooking = org.mockito.Mockito.mock(Booking.class);
        ChatRoom existingRoom = org.mockito.Mockito.mock(ChatRoom.class);

        given(persistedBooking.getId()).willReturn(BOOKING_ID);
        given(persistedBooking.getTimeSlot()).willReturn(timeSlot);
        given(persistedBooking.getGuestId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(persistedBooking));
        given(chatRoomRepository.findByExternalRef("RESERVATION", BOOKING_EXTERNAL_REF_ID))
            .willReturn(Optional.of(existingRoom));
        given(existingRoom.getId()).willReturn(ROOM_ID);

        ChatRoomResponseDTO response = chatService.getChatRoomByBookingId(BOOKING_ID, GUEST_ID);

        assertThat(response.chatRoomId()).isEqualTo(ROOM_ID);
    }

    @Test
    @DisplayName("rejects chat room lookup for a non participant")
    void getChatRoomByBookingIdRejectsOutsider() {
        Booking persistedBooking = org.mockito.Mockito.mock(Booking.class);

        given(persistedBooking.getTimeSlot()).willReturn(timeSlot);
        given(persistedBooking.getGuestId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(persistedBooking));

        assertThatThrownBy(() -> chatService.getChatRoomByBookingId(BOOKING_ID, OUTSIDER_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("returns mapped chat room ids for multiple bookings")
    void getChatRoomIdsByBookingIdsReturnsMappedResult() {
        ChatRoom room = org.mockito.Mockito.mock(ChatRoom.class);

        given(room.getExternalRefId()).willReturn(BOOKING_EXTERNAL_REF_ID);
        given(room.getId()).willReturn(ROOM_ID);
        given(chatRoomRepository.findAllByExternalRefIds("RESERVATION", List.of(BOOKING_EXTERNAL_REF_ID)))
            .willReturn(List.of(room));

        Map<Long, UUID> roomIds = chatService.getChatRoomIdsByBookingIds(List.of(BOOKING_ID));

        assertThat(roomIds).containsEntry(BOOKING_ID, ROOM_ID);
    }
}
