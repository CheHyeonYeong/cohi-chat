package com.coDevs.cohiChat.member.response;

import java.time.Instant;
import java.util.List;

import com.coDevs.cohiChat.booking.entity.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import static com.coDevs.cohiChat.global.util.TimeUtils.toUtcInstant;

@Getter
@Builder
@AllArgsConstructor
public class WithdrawalCheckResponseDTO {

    private final int affectedBookingsCount;
    private final List<AffectedBookingDTO> affectedBookings;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class AffectedBookingDTO {
        private final Long bookingId;
        private final Instant startedAt;
        private final Instant endedAt;
        private final String topic;
        private final String role;

        public static AffectedBookingDTO from(Booking booking, String role) {
            var timeSlot = booking.getTimeSlot();
            var date = booking.getBookingDate();

            return AffectedBookingDTO.builder()
                .bookingId(booking.getId())
                .startedAt(toUtcInstant(date, timeSlot.getStartTime()))
                .endedAt(toUtcInstant(date, timeSlot.getEndTime()))
                .topic(booking.getTopic())
                .role(role)
                .build();
        }
    }

    public static WithdrawalCheckResponseDTO of(List<AffectedBookingDTO> affectedBookings) {
        return new WithdrawalCheckResponseDTO(affectedBookings.size(), affectedBookings);
    }
}
