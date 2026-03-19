package com.coDevs.cohiChat.booking.response;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaginatedBookingResponseDTO {
    private final List<BookingResponseDTO> bookings;
    private final long totalCount;
    private final int page;
    private final int size;

    public static PaginatedBookingResponseDTO of(List<BookingResponseDTO> bookings, long totalCount, int page, int size) {
        return PaginatedBookingResponseDTO.builder()
                .bookings(bookings)
                .totalCount(totalCount)
                .page(page)
                .size(size)
                .build();
    }
}
