package com.coDevs.cohiChat.booking.response;

import java.time.LocalDate;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.timeslot.response.TimeSlotResponseDTO;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class BookingPublicResponseDTO {

    private Long id;

    @JsonProperty("when")
    private LocalDate bookingDate;

    private TimeSlotResponseDTO timeSlot;

    public static BookingPublicResponseDTO from(Booking booking) {
        return BookingPublicResponseDTO.builder()
            .id(booking.getId())
            .bookingDate(booking.getBookingDate())
            .timeSlot(TimeSlotResponseDTO.from(booking.getTimeSlot()))
            .build();
    }
}
