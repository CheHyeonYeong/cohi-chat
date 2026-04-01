package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.NoShowHistory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import static com.coDevs.cohiChat.global.util.TimeUtils.toUtcInstant;

@Getter
@Builder
@AllArgsConstructor
public class NoShowHistoryResponseDTO {

    private final Long id;
    private final Long bookingId;
    private final UUID hostId;
    private final UUID reportedBy;
    private final String reason;
    private final Instant reportedAt;
    private final Instant bookingStartedAt;
    private final Instant bookingEndedAt;
    private final String bookingTopic;

    public static NoShowHistoryResponseDTO from(NoShowHistory history, ZoneId zoneId) {
        var booking = history.getBooking();
        var timeSlot = booking.getTimeSlot();
        var date = booking.getBookingDate();

        return NoShowHistoryResponseDTO.builder()
            .id(history.getId())
            .bookingId(booking.getId())
            .hostId(history.getHostId())
            .reportedBy(history.getReportedBy())
            .reason(history.getReason())
            .reportedAt(history.getReportedAt())
            .bookingStartedAt(toUtcInstant(date, timeSlot.getStartTime(), zoneId))
            .bookingEndedAt(toUtcInstant(date, timeSlot.getEndTime(), zoneId))
            .bookingTopic(booking.getTopic())
            .build();
    }
}
