package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.ZoneOffset;
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
    private Instant bookingStartedAt;
    private Instant bookingEndedAt;
    private String bookingTopic;

    public static NoShowHistoryResponseDTO from(NoShowHistory history) {
        Instant bookingStartedAt = history.getBooking().getBookingDate()
            .atTime(history.getBooking().getTimeSlot().getStartTime())
            .toInstant(ZoneOffset.UTC);

        Instant bookingEndedAt = history.getBooking().getBookingDate()
            .atTime(history.getBooking().getTimeSlot().getEndTime())
            .toInstant(ZoneOffset.UTC);

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
