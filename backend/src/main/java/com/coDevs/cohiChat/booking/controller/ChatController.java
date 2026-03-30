package com.coDevs.cohiChat.booking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.member.MemberService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Chat", description = "채팅 API")
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MemberService memberService;

    @Operation(summary = "채팅방 조회", description = "예약과 연결된 채팅방 roomId를 반환합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Chat room lookup succeeded"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Requester is not part of the booking"),
        @ApiResponse(responseCode = "404", description = "Booking or chat room was not found")
    })
    @GetMapping("/{bookingId}/chat-room")
    public ResponseEntity<ApiResponseDTO<ChatRoomResponseDTO>> getChatRoom(
        @PathVariable Long bookingId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        var requester = memberService.getMember(userDetails.getUsername());
        ChatRoomResponseDTO response = chatService.getChatRoomByBookingId(bookingId, requester.getId());
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }
}