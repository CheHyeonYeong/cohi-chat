package com.coDevs.cohiChat.booking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.chat.request.ChatReadStateUpdateRequestDTO;
import com.coDevs.cohiChat.chat.response.ChatReadStateResponseDTO;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.member.MemberService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Chat", description = "Booking chat API")
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingChatController {

    private final ChatService chatService;
    private final MemberService memberService;

    @Operation(summary = "Get booking chat room", description = "Returns the chat room linked to the booking.")
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

    @Operation(summary = "Update booking chat read state", description = "Stores the current member's last read message for the booking chat room.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Chat read state updated"),
        @ApiResponse(responseCode = "400", description = "Invalid request body or messageId"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Requester is not part of the booking"),
        @ApiResponse(responseCode = "404", description = "Booking or chat room was not found")
    })
    @PatchMapping("/{bookingId}/chat-room/read")
    public ResponseEntity<ApiResponseDTO<ChatReadStateResponseDTO>> updateChatReadState(
        @PathVariable Long bookingId,
        @Valid @RequestBody ChatReadStateUpdateRequestDTO request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        var requester = memberService.getMember(userDetails.getUsername());
        ChatReadStateResponseDTO response =
            chatService.updateLastReadMessageId(bookingId, requester.getId(), request.getMessageId());
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }
}