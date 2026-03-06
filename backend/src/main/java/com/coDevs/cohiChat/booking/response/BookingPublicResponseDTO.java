package com.coDevs.cohiChat.booking.response;

import java.time.Instant;
import java.time.ZoneOffset;

import com.coDevs.cohiChat.booking.entity.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공개 API용 예약 응답 DTO.
 * SSE 스트리밍 중복 제거를 위해 id 포함.
 * startedAt/endedAt: UTC 기준 Instant (FE에서 로컬 타임존 변환).
 */
@Getter
@Builder
@AllArgsConstructor
public class BookingPublicResponseDTO {

    private long id;
    private Instant startedAt;
    private Instant endedAt;

    public static BookingPublicResponseDTO from(Booking booking) {
        Instant startedAt = booking.getBookingDate()
            .atTime(booking.getTimeSlot().getStartTime())
            .toInstant(ZoneOffset.UTC);

        Instant endedAt = booking.getBookingDate()
            .atTime(booking.getTimeSlot().getEndTime())
            .toInstant(ZoneOffset.UTC);

        return BookingPublicResponseDTO.builder()
            .id(booking.getId())
            .startedAt(startedAt)
            .endedAt(endedAt)
            .build();
    }
}
