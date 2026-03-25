package com.coDevs.cohiChat.chat.service;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.Message;
import com.coDevs.cohiChat.chat.entity.RoomMember;
import com.coDevs.cohiChat.chat.entity.RoomRole;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.MessageRepository;
import com.coDevs.cohiChat.chat.repository.RoomMemberRepository;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final String EXTERNAL_REF_RESERVATION = "RESERVATION";

    private final ChatRoomRepository chatRoomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final MessageRepository messageRepository;
    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void createRoomForBooking(Booking booking) {
        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();

        ChatRoom room = chatRoomRepository.findActiveRoomByHostAndGuestForUpdate(hostId, guestId)
            .orElseGet(() -> createNewRoom(hostId, guestId, booking.getId()));

        insertReservationCard(room, booking);
    }

    @Transactional(readOnly = true)
    public ChatRoomResponseDTO getChatRoom(UUID hostId, UUID guestId) {
        ChatRoom room = chatRoomRepository.findActiveRoomByHostAndGuest(hostId, guestId)
            .orElseThrow(() -> new CustomException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        return new ChatRoomResponseDTO(room.getId());
    }

    @Transactional(readOnly = true)
    public ChatRoomResponseDTO getChatRoomByBookingId(Long bookingId, UUID requesterId) {
        Booking booking = bookingRepository.findByIdWithTimeSlot(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();

        if (!requesterId.equals(hostId) && !requesterId.equals(guestId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        ChatRoom room = chatRoomRepository.findActiveRoomByHostAndGuest(hostId, guestId)
            .orElseThrow(() -> new CustomException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        return new ChatRoomResponseDTO(room.getId());
    }

    @Transactional(readOnly = true)
    public java.util.Optional<UUID> getChatRoomIdByBookingId(Long bookingId) {
        return chatRoomRepository.findByBookingExternalRef(uuidFromLong(bookingId))
            .map(ChatRoom::getId);
    }

    private ChatRoom createNewRoom(UUID hostId, UUID guestId, Long bookingId) {
        ChatRoom room = chatRoomRepository.save(
            ChatRoom.create(EXTERNAL_REF_RESERVATION, uuidFromLong(bookingId))
        );
        roomMemberRepository.save(RoomMember.create(room, hostId, RoomRole.HOST));
        roomMemberRepository.save(RoomMember.create(room, guestId, RoomRole.GUEST));
        return room;
    }

    private void insertReservationCard(ChatRoom room, Booking booking) {
        String payload = buildReservationCardPayload(booking);
        messageRepository.save(Message.createReservationCard(room, payload));
    }

    private String buildReservationCardPayload(Booking booking) {
        try {
            Map<String, String> data = Map.of(
                "topic", booking.getTopic(),
                "bookingDate", booking.getBookingDate().toString(),
                "startTime", booking.getTimeSlot().getStartTime().toString(),
                "endTime", booking.getTimeSlot().getEndTime().toString()
            );
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("RESERVATION_CARD payload 직렬화 실패 (bookingId=" + booking.getId() + ")", e);
        }
    }

    /**
     * Booking ID(Long)를 UUID로 변환. external_ref_id(UUID) 컬럼에 저장하기 위한 임시 변환.
     * 추후 Booking ID를 UUID로 전환 시 제거 예정.
     */
    private UUID uuidFromLong(Long id) {
        return id != null ? new UUID(0L, id) : null;
    }
}
