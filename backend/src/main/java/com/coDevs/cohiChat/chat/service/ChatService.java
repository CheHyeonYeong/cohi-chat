package com.coDevs.cohiChat.chat.service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.Message;
import com.coDevs.cohiChat.chat.entity.RoomMember;
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

    private final ChatRoomRepository chatRoomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final MessageRepository messageRepository;
    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void createRoomForBooking(Booking booking) {
        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();

        ChatRoom room = chatRoomRepository.findActiveRoomByMembersForUpdate(hostId, guestId)
            .orElseGet(() -> createNewRoom(hostId, guestId));

        insertReservationCard(room, booking);
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

        ChatRoom room = chatRoomRepository.findActiveRoomByMembers(hostId, guestId)
            .orElseThrow(() -> new CustomException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        return new ChatRoomResponseDTO(room.getId());
    }

    @Transactional(readOnly = true)
    public Optional<UUID> getChatRoomIdByBooking(Booking booking) {
        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();
        return chatRoomRepository.findActiveRoomByMembers(hostId, guestId)
            .map(ChatRoom::getId);
    }

    private ChatRoom createNewRoom(UUID hostId, UUID guestId) {
        ChatRoom room = chatRoomRepository.save(ChatRoom.create());
        roomMemberRepository.save(RoomMember.create(room, hostId));
        roomMemberRepository.save(RoomMember.create(room, guestId));
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
}
