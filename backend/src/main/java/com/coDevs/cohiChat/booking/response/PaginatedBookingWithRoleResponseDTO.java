package com.coDevs.cohiChat.booking.response;

import java.util.List;

public record PaginatedBookingWithRoleResponseDTO(
    List<BookingWithRoleResponseDTO> bookings,
    long totalCount,
    int page,
    int size
) {
    public static PaginatedBookingWithRoleResponseDTO of(List<BookingWithRoleResponseDTO> bookings, long totalCount, int page, int size) {
        return new PaginatedBookingWithRoleResponseDTO(bookings, totalCount, page, size);
    }
}
