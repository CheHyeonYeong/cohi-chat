package com.coDevs.cohiChat.chat.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.RoomMember;
import com.coDevs.cohiChat.chat.repository.ChatMessageQueryRepository;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.RoomMemberRepository;
import com.coDevs.cohiChat.chat.response.ChatReadStateResponseDTO;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageQueryRepository chatMessageQueryRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final BookingRepository bookingRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void createRoomForBooking(Booking booking) {
        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();

        lockParticipants(hostId, guestId);

        chatRoomRepository.findActiveRoomByMembersForUpdate(hostId, guestId)
            .orElseGet(() -> createNewRoom(hostId, guestId));
    }

    @Transactional(readOnly = true)
    public ChatRoomResponseDTO getChatRoomByBookingId(Long bookingId, UUID requesterId) {
        Booking booking = bookingRepository.findByIdWithTimeSlot(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateParticipant(booking, requesterId);

        return getChatRoomIdByBooking(booking)
            .map(ChatRoomResponseDTO::new)
            .orElseThrow(() -> new CustomException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    @Transactional
    public ChatReadStateResponseDTO updateLastReadMessageId(Long bookingId, UUID requesterId, UUID messageId) {
        Booking booking = bookingRepository.findByIdWithTimeSlot(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateParticipant(booking, requesterId);

        UUID roomId = getChatRoomIdByBooking(booking)
            .orElseThrow(() -> new CustomException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        RoomMember roomMember = roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(roomId, requesterId)
            .orElseThrow(() -> new CustomException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        Instant targetMessageCreatedAt = findMessageCreatedAtOrThrow(messageId, roomId);
        UUID currentLastReadMessageId = roomMember.getLastReadMessageId();

        if (currentLastReadMessageId != null) {
            Optional<Instant> currentLastReadCreatedAt = chatMessageQueryRepository
                .findCreatedAtByIdAndRoomId(currentLastReadMessageId, roomId);

            if (currentLastReadCreatedAt.isPresent() && !targetMessageCreatedAt.isAfter(currentLastReadCreatedAt.get())) {
                return new ChatReadStateResponseDTO(roomId, currentLastReadMessageId);
            }
        }

        roomMember.updateLastReadMessageId(messageId);
        return new ChatReadStateResponseDTO(roomId, messageId);
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
        roomMemberRepository.saveAll(List.of(
            RoomMember.create(room, hostId),
            RoomMember.create(room, guestId)
        ));
        return room;
    }

    private void lockParticipants(UUID hostId, UUID guestId) {
        UUID firstId = hostId.compareTo(guestId) <= 0 ? hostId : guestId;
        UUID secondId = hostId.compareTo(guestId) <= 0 ? guestId : hostId;

        memberRepository.findByIdWithLock(firstId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!firstId.equals(secondId)) {
            memberRepository.findByIdWithLock(secondId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        }
    }

    private Instant findMessageCreatedAtOrThrow(UUID messageId, UUID roomId) {
        return chatMessageQueryRepository.findCreatedAtByIdAndRoomId(messageId, roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.INVALID_INPUT));
    }

    private void validateParticipant(Booking booking, UUID requesterId) {
        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();

        if (!requesterId.equals(hostId) && !requesterId.equals(guestId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }
}