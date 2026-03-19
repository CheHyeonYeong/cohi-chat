package com.coDevs.cohiChat.chat.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.Message;
import com.coDevs.cohiChat.chat.entity.RoomMember;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.MessageRepository;
import com.coDevs.cohiChat.chat.repository.RoomMemberRepository;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public void createRoomForBooking(Booking booking) {
        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();

        ChatRoom room = chatRoomRepository.findActiveRoomByHostAndGuest(hostId, guestId)
            .orElseGet(() -> createNewRoom(hostId, guestId));

        insertReservationCard(room, booking);
    }

    private ChatRoom createNewRoom(UUID hostId, UUID guestId) {
        ChatRoom room = chatRoomRepository.save(ChatRoom.create());
        roomMemberRepository.save(RoomMember.create(room, hostId, "HOST"));
        roomMemberRepository.save(RoomMember.create(room, guestId, "GUEST"));
        return room;
    }

    private void insertReservationCard(ChatRoom room, Booking booking) {
        String payload = buildReservationCardPayload(booking);
        messageRepository.save(Message.createReservationCard(room, payload));
    }

    private String buildReservationCardPayload(Booking booking) {
        return String.format(
            "{\"topic\":\"%s\",\"bookingDate\":\"%s\",\"startTime\":\"%s\",\"endTime\":\"%s\"}",
            booking.getTopic(),
            booking.getBookingDate(),
            booking.getTimeSlot().getStartTime(),
            booking.getTimeSlot().getEndTime()
        );
    }

    @Transactional(readOnly = true)
    public ChatRoomResponseDTO getChatRoomByBooking(Long bookingId, UUID hostId, UUID guestId) {
        ChatRoom room = chatRoomRepository.findActiveRoomByHostAndGuest(hostId, guestId)
            .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        return new ChatRoomResponseDTO(room.getId());
    }
}
