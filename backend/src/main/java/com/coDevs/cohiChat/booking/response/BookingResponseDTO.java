package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class BookingResponseDTO {

    private Long id;
    private Long timeSlotId;
    private UUID guestId;
    private UUID hostId;

    private OffsetDateTime startedAt;
    private OffsetDateTime endedAt;
    private String topic;
    private String description;
    private AttendanceStatus attendanceStatus;
    private String googleEventId;
    private Instant createdAt;

    private String hostUsername;
    private String hostDisplayName;

    public static BookingResponseDTO from(Booking booking) {
        return from(booking, null, null, ZoneId.of("Asia/Seoul"));
    }

    public static BookingResponseDTO from(Booking booking, String hostUsername, String hostDisplayName) {
        return from(booking, hostUsername, hostDisplayName, ZoneId.of("Asia/Seoul"));
    }

    public static BookingResponseDTO from(Booking booking, String hostUsername, String hostDisplayName, ZoneId zoneId) {
        OffsetDateTime startedAt = booking.getBookingDate()
            .atTime(booking.getTimeSlot().getStartTime())
            .atZone(zoneId)
            .toOffsetDateTime();

        OffsetDateTime endedAt = booking.getBookingDate()
            .atTime(booking.getTimeSlot().getEndTime())
            .atZone(zoneId)
            .toOffsetDateTime();

        return BookingResponseDTO.builder()
            .id(booking.getId())
            .timeSlotId(booking.getTimeSlot().getId())
            .guestId(booking.getGuestId())
            .hostId(booking.getTimeSlot().getUserId())
            .startedAt(startedAt)
            .endedAt(endedAt)
            .topic(booking.getTopic())
            .description(booking.getDescription())
            .attendanceStatus(booking.getAttendanceStatus())
            .googleEventId(booking.getGoogleEventId())
            .createdAt(booking.getCreatedAt())
            .hostUsername(hostUsername)
            .hostDisplayName(hostDisplayName)
            .build();
    }
}
