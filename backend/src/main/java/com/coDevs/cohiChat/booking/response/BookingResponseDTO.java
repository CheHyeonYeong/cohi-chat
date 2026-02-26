package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.fasterxml.jackson.annotation.JsonProperty;

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

    @JsonProperty("when")
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String topic;
    private String description;
    private AttendanceStatus attendanceStatus;
    private String googleEventId;
    private Instant createdAt;

    private String hostUsername;
    private String hostDisplayName;

    public static BookingResponseDTO from(Booking booking) {
        return from(booking, null, null);
    }

    public static BookingResponseDTO from(Booking booking, String hostUsername, String hostDisplayName) {
        return BookingResponseDTO.builder()
            .id(booking.getId())
            .timeSlotId(booking.getTimeSlot().getId())
            .guestId(booking.getGuestId())
            .hostId(booking.getTimeSlot().getUserId())
            .bookingDate(booking.getBookingDate())
            .startTime(booking.getTimeSlot().getStartTime())
            .endTime(booking.getTimeSlot().getEndTime())
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
