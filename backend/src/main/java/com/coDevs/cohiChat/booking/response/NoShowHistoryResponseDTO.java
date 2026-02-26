package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.LocalDate;
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
    private LocalDate bookingDate;
    private String bookingTopic;

    public static NoShowHistoryResponseDTO from(NoShowHistory history) {
        return NoShowHistoryResponseDTO.builder()
            .id(history.getId())
            .bookingId(history.getBooking().getId())
            .hostId(history.getHostId())
            .reportedBy(history.getReportedBy())
            .reason(history.getReason())
            .reportedAt(history.getReportedAt())
            .bookingDate(history.getBooking().getBookingDate())
            .bookingTopic(history.getBooking().getTopic())
            .build();
    }
}
