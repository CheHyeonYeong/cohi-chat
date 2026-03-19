package com.coDevs.cohiChat.chat.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Chat", description = "채팅 API")
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final BookingRepository bookingRepository;
    private final MemberService memberService;

    @Operation(summary = "채팅방 조회", description = "예약에 연결된 채팅방 roomId를 반환합니다.")
    @GetMapping("/{bookingId}/chat-room")
    public ResponseEntity<ApiResponseDTO<ChatRoomResponseDTO>> getChatRoom(
        @PathVariable Long bookingId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member requester = memberService.getMember(userDetails.getUsername());
        Booking booking = bookingRepository.findByIdWithTimeSlot(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        UUID hostId = booking.getTimeSlot().getUserId();
        UUID guestId = booking.getGuestId();
        UUID requesterId = requester.getId();

        if (!requesterId.equals(hostId) && !requesterId.equals(guestId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        ChatRoomResponseDTO response = chatService.getChatRoomByBooking(bookingId, hostId, guestId);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }
}
