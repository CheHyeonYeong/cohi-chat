package com.coDevs.cohiChat.booking.response;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaginatedBookingWithRoleResponseDTO {
    private final List<BookingWithRoleResponseDTO> bookings;
    private final long totalCount;
    private final int page;
    private final int size;

    public static PaginatedBookingWithRoleResponseDTO of(List<BookingWithRoleResponseDTO> bookings, long totalCount, int page, int size) {
        return PaginatedBookingWithRoleResponseDTO.builder()
                .bookings(bookings)
                .totalCount(totalCount)
                .page(page)
                .size(size)
                .build();
    }
}
