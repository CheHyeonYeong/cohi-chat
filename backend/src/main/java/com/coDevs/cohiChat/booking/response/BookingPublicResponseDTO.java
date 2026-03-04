package com.coDevs.cohiChat.booking.response;

import java.time.OffsetDateTime;
import java.time.ZoneId;

import com.coDevs.cohiChat.booking.entity.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공개 API용 예약 응답 DTO.
 * SSE 스트리밍 중복 제거를 위해 id 포함.
 * startedAt/endedAt: ISO 8601 full datetime (날짜+시간+타임존).
 */
@Getter
@Builder
@AllArgsConstructor
public class BookingPublicResponseDTO {

    private long id;
    private OffsetDateTime startedAt;
    private OffsetDateTime endedAt;

    public static BookingPublicResponseDTO from(Booking booking) {
        return from(booking, ZoneId.of("Asia/Seoul"));
    }

    public static BookingPublicResponseDTO from(Booking booking, ZoneId zoneId) {
        OffsetDateTime startedAt = booking.getBookingDate()
            .atTime(booking.getTimeSlot().getStartTime())
            .atZone(zoneId)
            .toOffsetDateTime();

        OffsetDateTime endedAt = booking.getBookingDate()
            .atTime(booking.getTimeSlot().getEndTime())
            .atZone(zoneId)
            .toOffsetDateTime();

        return BookingPublicResponseDTO.builder()
            .id(booking.getId())
            .startedAt(startedAt)
            .endedAt(endedAt)
            .build();
    }
}
