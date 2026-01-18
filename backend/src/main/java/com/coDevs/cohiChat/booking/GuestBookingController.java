package com.coDevs.cohiChat.booking;

import java.util.List;
import java.util.UUID;

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

@Tag(name = "Guest Booking", description = "게스트 예약 조회 API")
@RestController
@RequestMapping("/api/guests")
@RequiredArgsConstructor
public class GuestBookingController {

    private final BookingService bookingService;

    @Operation(summary = "게스트 예약 목록 조회", description = "게스트 ID로 해당 게스트의 예약 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공")
    })
    @GetMapping("/{guestId}/bookings")
    public ResponseEntity<List<BookingResponseDTO>> getBookingsByGuestId(
            @PathVariable UUID guestId
    ) {
        List<BookingResponseDTO> response = bookingService.getBookingsByGuestId(guestId);
        return ResponseEntity.ok(response);
    }
}
