package com.coDevs.cohiChat.booking.response;

import java.time.LocalDate;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.timeslot.response.TimeSlotPublicResponseDTO;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공개 API용 예약 응답 DTO.
 * 민감 정보(id) 제외, TimeSlotPublicResponseDTO 사용.
 */
@Getter
@Builder
@AllArgsConstructor
public class BookingPublicResponseDTO {

    @JsonProperty("when")
    private LocalDate bookingDate;

    private TimeSlotPublicResponseDTO timeSlot;

    public static BookingPublicResponseDTO from(Booking booking) {
        return BookingPublicResponseDTO.builder()
            .bookingDate(booking.getBookingDate())
            .timeSlot(TimeSlotPublicResponseDTO.from(booking.getTimeSlot()))
            .build();
    }
}
