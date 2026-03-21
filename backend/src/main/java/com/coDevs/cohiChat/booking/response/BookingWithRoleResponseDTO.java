package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.MeetingType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import static com.coDevs.cohiChat.global.util.TimeUtils.toUtcInstant;

@Getter
@Builder
@AllArgsConstructor
public class BookingWithRoleResponseDTO {

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
    private final MeetingType meetingType;
    private final String location;
    private final String meetingLink;
    private final String role;

    public static BookingWithRoleResponseDTO from(Booking booking, String hostUsername, String hostDisplayName,
                                                  String guestUsername, String guestDisplayName, String role) {
        var timeSlot = booking.getTimeSlot();
        var date = booking.getBookingDate();

        return BookingWithRoleResponseDTO.builder()
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
            .meetingType(booking.getMeetingType())
            .location(booking.getLocation())
            .meetingLink(booking.getMeetingLink())
            .role(role)
            .build();
    }
}
