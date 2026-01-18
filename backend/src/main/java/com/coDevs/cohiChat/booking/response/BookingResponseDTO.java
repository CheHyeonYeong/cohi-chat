package com.coDevs.cohiChat.booking.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

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
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String topic;
    private String description;
    private AttendanceStatus attendanceStatus;
    private LocalDateTime createdAt;

    public static BookingResponseDTO from(Booking booking, TimeSlot timeSlot) {
        return BookingResponseDTO.builder()
            .id(booking.getId())
            .timeSlotId(booking.getTimeSlotId())
            .guestId(booking.getGuestId())
            .bookingDate(booking.getBookingDate())
            .startTime(timeSlot.getStartTime())
            .endTime(timeSlot.getEndTime())
            .topic(booking.getTopic())
            .description(booking.getDescription())
            .attendanceStatus(booking.getAttendanceStatus())
            .createdAt(booking.getCreatedAt())
            .build();
    }
}
