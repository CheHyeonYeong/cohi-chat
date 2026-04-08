package com.coDevs.cohiChat.chat.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.chat.entity.ChatRoom;
import com.coDevs.cohiChat.chat.entity.RoomMember;
import com.coDevs.cohiChat.chat.repository.ChatRoomRepository;
import com.coDevs.cohiChat.chat.repository.RoomMemberRepository;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final String EXTERNAL_REF_RESERVATION = "RESERVATION";

    private final ChatRoomRepository chatRoomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public UUID createRoomForBooking(Booking booking) {
        return provisionRoomForBooking(booking);
    }

    @Transactional
    public UUID provisionRoomForBooking(Booking booking) {
        UUID externalRefId = uuidFromLong(booking.getId());
        ChatRoom room = chatRoomRepository.findByExternalRefForUpdate(EXTERNAL_REF_RESERVATION, externalRefId)
            .orElseGet(() -> createRoom(externalRefId));

        ensureRoomMembers(room, List.of(
            booking.getTimeSlot().getUserId(),
            booking.getGuestId()
        ));

        return room.getId();
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

    @Transactional(readOnly = true)
    public Optional<UUID> getChatRoomIdByBookingId(Long bookingId) {
        return getChatRoomIdByExternalRef(uuidFromLong(bookingId));
    }

    @Transactional(readOnly = true)
    public Optional<UUID> getChatRoomIdByBooking(Booking booking) {
        return getChatRoomIdByExternalRef(uuidFromLong(booking.getId()));
    }

    @Transactional(readOnly = true)
    public Map<Long, UUID> getChatRoomIdsByBookingIds(Collection<Long> bookingIds) {
        if (bookingIds == null || bookingIds.isEmpty()) {
            return Map.of();
        }

        List<UUID> externalRefIds = bookingIds.stream()
            .map(this::uuidFromLong)
            .toList();

        return chatRoomRepository.findAllByExternalRefIds(EXTERNAL_REF_RESERVATION, externalRefIds).stream()
            .collect(Collectors.toMap(
                room -> longFromUuid(room.getExternalRefId()),
                ChatRoom::getId,
                (existing, ignored) -> existing
            ));
    }

    private Optional<UUID> getChatRoomIdByExternalRef(UUID externalRefId) {
        return chatRoomRepository.findByExternalRef(EXTERNAL_REF_RESERVATION, externalRefId)
            .map(ChatRoom::getId);
    }

    private ChatRoom createRoom(UUID externalRefId) {
        try {
            return chatRoomRepository.saveAndFlush(ChatRoom.create(EXTERNAL_REF_RESERVATION, externalRefId));
        } catch (DataIntegrityViolationException exception) {
            return chatRoomRepository.findByExternalRefForUpdate(EXTERNAL_REF_RESERVATION, externalRefId)
                .orElseThrow(() -> exception);
        }
    }

    private void ensureRoomMembers(ChatRoom room, Collection<UUID> memberIds) {
        List<UUID> distinctMemberIds = memberIds.stream().distinct().toList();
        Map<UUID, RoomMember> existingMembers = distinctMemberIds.stream()
            .map(memberId -> roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(room.getId(), memberId))
            .flatMap(Optional::stream)
            .collect(Collectors.toMap(RoomMember::getMemberId, Function.identity()));

        for (UUID memberId : distinctMemberIds) {
            if (existingMembers.containsKey(memberId)) {
                continue;
            }
            createRoomMember(room, memberId);
        }
    }

    private void createRoomMember(ChatRoom room, UUID memberId) {
        try {
            roomMemberRepository.saveAndFlush(RoomMember.create(room, memberId));
        } catch (DataIntegrityViolationException exception) {
            roomMemberRepository.findByRoomIdAndMemberIdAndDeletedAtIsNull(room.getId(), memberId)
                .orElseThrow(() -> exception);
        }
    }

    private void validateParticipant(Booking booking, UUID requesterId) {
        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();

        if (!requesterId.equals(hostId) && !requesterId.equals(guestId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    private UUID uuidFromLong(Long id) {
        return id != null ? new UUID(0L, id) : null;
    }

    private Long longFromUuid(UUID id) {
        return id != null ? id.getLeastSignificantBits() : null;
    }
}
