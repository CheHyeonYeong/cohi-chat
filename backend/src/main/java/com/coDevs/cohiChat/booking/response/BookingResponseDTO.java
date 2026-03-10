package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import static com.coDevs.cohiChat.global.util.TimeUtils.toUtcInstant;

@Getter
@Builder
@AllArgsConstructor
public class BookingResponseDTO {

    private final Long id;
    private final Long timeSlotId;
    private final UUID guestId;
    private final UUID hostId;
    private final Instant startedAt;
    private final Instant endedAt;
    private final String topic;
    private final String description;
    private final AttendanceStatus attendanceStatus;
    private final String googleEventId;
    private final Instant createdAt;
    private final String hostUsername;
    private final String hostDisplayName;
    private final String guestUsername;
    private final String guestDisplayName;

    public static BookingResponseDTO from(Booking booking) {
        return from(booking, null, null, null, null);
    }

    public static BookingResponseDTO from(Booking booking, String hostUsername, String hostDisplayName) {
        return from(booking, hostUsername, hostDisplayName, null, null);
    }

    public static BookingResponseDTO from(
        Booking booking,
        String hostUsername,
        String hostDisplayName,
        String guestUsername,
        String guestDisplayName
    ) {
        var timeSlot = booking.getTimeSlot();
        var date = booking.getBookingDate();

        return BookingResponseDTO.builder()
            .id(booking.getId())
            .timeSlotId(timeSlot.getId())
            .guestId(booking.getGuestId())
            .hostId(timeSlot.getUserId())
            .startedAt(toUtcInstant(date, timeSlot.getStartTime()))
            .endedAt(toUtcInstant(date, timeSlot.getEndTime()))
            .topic(booking.getTopic())
            .description(booking.getDescription())
            .attendanceStatus(booking.getAttendanceStatus())
            .googleEventId(booking.getGoogleEventId())
            .createdAt(booking.getCreatedAt())
            .hostUsername(hostUsername)
            .hostDisplayName(hostDisplayName)
            .guestUsername(guestUsername)
            .guestDisplayName(guestDisplayName)
            .build();
    }
}
