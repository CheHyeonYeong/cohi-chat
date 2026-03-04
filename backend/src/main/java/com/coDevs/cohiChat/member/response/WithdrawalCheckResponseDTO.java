package com.coDevs.cohiChat.member.response;

import java.time.OffsetDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WithdrawalCheckResponseDTO {

    private int affectedBookingsCount;
    private List<AffectedBookingDTO> affectedBookings;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class AffectedBookingDTO {
        private Long bookingId;
        private OffsetDateTime startedAt;
        private OffsetDateTime endedAt;
        private String topic;
        private String role; // "HOST" or "GUEST"
    }

    public static WithdrawalCheckResponseDTO of(List<AffectedBookingDTO> affectedBookings) {
        return WithdrawalCheckResponseDTO.builder()
            .affectedBookingsCount(affectedBookings.size())
            .affectedBookings(affectedBookings)
            .build();
    }
}
