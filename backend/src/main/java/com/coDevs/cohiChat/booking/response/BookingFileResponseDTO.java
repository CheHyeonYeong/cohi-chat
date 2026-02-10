package com.coDevs.cohiChat.booking.response;

import java.time.Instant;

import com.coDevs.cohiChat.booking.entity.BookingFile;

public record BookingFileResponseDTO(
    Long id,
    Long bookingId,
    String fileName,
    String originalFileName,
    Long fileSize,
    String contentType,
    Instant createdAt
) {
    public static BookingFileResponseDTO from(BookingFile bookingFile) {
        return new BookingFileResponseDTO(
            bookingFile.getId(),
            bookingFile.getBooking().getId(),
            bookingFile.getFileName(),
            bookingFile.getOriginalFileName(),
            bookingFile.getFileSize(),
            bookingFile.getContentType(),
            bookingFile.getCreatedAt()
        );
    }
}
