package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.NoShowHistory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class NoShowHistoryResponseDTO {

    private Long id;
    private Long bookingId;
    private UUID hostId;
    private UUID reportedBy;
    private String reason;
    private Instant reportedAt;
    private OffsetDateTime bookingStartedAt;
    private OffsetDateTime bookingEndedAt;
    private String bookingTopic;

    public static NoShowHistoryResponseDTO from(NoShowHistory history) {
        return from(history, ZoneId.of("Asia/Seoul"));
    }

    public static NoShowHistoryResponseDTO from(NoShowHistory history, ZoneId zoneId) {
        OffsetDateTime bookingStartedAt = history.getBooking().getBookingDate()
            .atTime(history.getBooking().getTimeSlot().getStartTime())
            .atZone(zoneId)
            .toOffsetDateTime();

        OffsetDateTime bookingEndedAt = history.getBooking().getBookingDate()
            .atTime(history.getBooking().getTimeSlot().getEndTime())
            .atZone(zoneId)
            .toOffsetDateTime();

        return NoShowHistoryResponseDTO.builder()
            .id(history.getId())
            .bookingId(history.getBooking().getId())
            .hostId(history.getHostId())
            .reportedBy(history.getReportedBy())
            .reason(history.getReason())
            .reportedAt(history.getReportedAt())
            .bookingStartedAt(bookingStartedAt)
            .bookingEndedAt(bookingEndedAt)
            .bookingTopic(history.getBooking().getTopic())
            .build();
    }
}
