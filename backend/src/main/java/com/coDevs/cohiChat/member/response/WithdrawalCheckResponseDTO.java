package com.coDevs.cohiChat.member.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WithdrawalCheckResponseDTO {

    private boolean canWithdraw;
    private int affectedBookingsCount;
    private List<AffectedBookingDTO> affectedBookings;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class AffectedBookingDTO {
        private Long bookingId;
        private LocalDate bookingDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private String topic;
        private String role; // "HOST" or "GUEST"
    }

    public static WithdrawalCheckResponseDTO of(List<AffectedBookingDTO> affectedBookings) {
        return WithdrawalCheckResponseDTO.builder()
            .canWithdraw(true)
            .affectedBookingsCount(affectedBookings.size())
            .affectedBookings(affectedBookings)
            .build();
    }
}
