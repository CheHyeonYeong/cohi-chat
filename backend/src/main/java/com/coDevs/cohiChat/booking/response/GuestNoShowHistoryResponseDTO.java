package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.GuestNoShowHistory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GuestNoShowHistoryResponseDTO {

    private Long id;
    private Long bookingId;
    private UUID guestId;
    private UUID reportedBy;
    private String reason;
    private Instant reportedAt;
    private LocalDate bookingDate;
    private String bookingTopic;

    public static GuestNoShowHistoryResponseDTO from(GuestNoShowHistory history) {
        return GuestNoShowHistoryResponseDTO.builder()
            .id(history.getId())
            .bookingId(history.getBooking().getId())
            .guestId(history.getGuestId())
            .reportedBy(history.getReportedBy())
            .reason(history.getReason())
            .reportedAt(history.getReportedAt())
            .bookingDate(history.getBooking().getBookingDate())
            .bookingTopic(history.getBooking().getTopic())
            .build();
    }
}
