package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.ZoneId;

import com.coDevs.cohiChat.booking.entity.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import static com.coDevs.cohiChat.global.util.TimeUtils.toUtcInstant;

@Getter
@Builder
@AllArgsConstructor
public class BookingPublicResponseDTO {

    private final long id;
    private final Long timeSlotId;
    private final Instant startedAt;
    private final Instant endedAt;

    public static BookingPublicResponseDTO from(Booking booking) {
        return from(booking, ZoneId.of("Asia/Seoul"));
    }

    public static BookingPublicResponseDTO from(Booking booking, ZoneId zoneId) {
        var date = booking.getBookingDate();

        return BookingPublicResponseDTO.builder()
            .id(booking.getId())
            .timeSlotId(booking.getTimeSlot().getId())
            .startedAt(toUtcInstant(date, booking.getStartTime(), zoneId))
            .endedAt(toUtcInstant(date, booking.getEndTime(), zoneId))
            .build();
    }
}
