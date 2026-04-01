package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.MeetingType;

import static com.coDevs.cohiChat.global.util.TimeUtils.toUtcInstant;

public record BookingWithRoleResponseDTO(
    Long id,
    Long timeSlotId,
    UUID guestId,
    UUID hostId,
    Instant startedAt,
    Instant endedAt,
    String topic,
    String description,
    AttendanceStatus attendanceStatus,
    String googleEventId,
    Instant createdAt,
    String hostUsername,
    String hostDisplayName,
    String guestUsername,
    String guestDisplayName,
    MeetingType meetingType,
    String location,
    String meetingLink,
    String role
) {
    public static BookingWithRoleResponseDTO from(Booking booking, String hostUsername, String hostDisplayName,
                                                  String guestUsername, String guestDisplayName, String role) {
        var timeSlot = booking.getTimeSlot();
        var date = booking.getBookingDate();

        return new BookingWithRoleResponseDTO(
            booking.getId(),
            timeSlot.getId(),
            booking.getGuestId(),
            timeSlot.getUserId(),
            toUtcInstant(date, timeSlot.getStartTime()),
            toUtcInstant(date, timeSlot.getEndTime()),
            booking.getTopic(),
            booking.getDescription(),
            booking.getAttendanceStatus(),
            booking.getGoogleEventId(),
            booking.getCreatedAt(),
            hostUsername,
            hostDisplayName,
            guestUsername,
            guestDisplayName,
            booking.getMeetingType(),
            booking.getLocation(),
            booking.getMeetingLink(),
            role
        );
    }
}
