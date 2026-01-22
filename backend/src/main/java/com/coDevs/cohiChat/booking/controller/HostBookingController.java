package com.coDevs.cohiChat.booking.controller;

import java.util.List;
import java.util.UUID;

import com.coDevs.cohiChat.booking.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.booking.response.BookingResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Host Booking", description = "호스트 예약 조회 API")
@RestController
@RequestMapping("/api/hosts")
@RequiredArgsConstructor
public class HostBookingController {

    private final BookingService bookingService;

    @Operation(summary = "호스트 예약 목록 조회", description = "호스트 ID로 해당 호스트의 예약 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/{hostId}/bookings")
    public ResponseEntity<List<BookingResponseDTO>> getBookingsByHostId(
            @PathVariable UUID hostId
    ) {
        List<BookingResponseDTO> response = bookingService.getBookingsByHostId(hostId);
        return ResponseEntity.ok(response);
    }
}
