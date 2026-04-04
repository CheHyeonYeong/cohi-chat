package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.ZoneId;

import com.coDevs.cohiChat.booking.entity.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import static com.coDevs.cohiChat.global.util.TimeUtils.toUtcInstant;

/**
 * 공개 API용 예약 응답 DTO.
 * SSE 스트리밍 중복 제거를 위해 id 포함.
 * startedAt/endedAt: UTC 기준 Instant (FE에서 로컬 타임존 변환).
 */
@Getter
@Builder
@AllArgsConstructor
public class BookingPublicResponseDTO {

    private final long id;
    private final Instant startedAt;
    private final Instant endedAt;

    public static BookingPublicResponseDTO from(Booking booking, ZoneId zoneId) {
        var timeSlot = booking.getTimeSlot();
        var date = booking.getBookingDate();

        return BookingPublicResponseDTO.builder()
            .id(booking.getId())
            .startedAt(toUtcInstant(date, timeSlot.getStartTime(), zoneId))
            .endedAt(toUtcInstant(date, timeSlot.getEndTime(), zoneId))
            .build();
    }
}
