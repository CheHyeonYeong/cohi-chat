package com.coDevs.cohiChat.booking;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coDevs.cohiChat.booking.entity.BookingFile;

public interface BookingFileRepository extends JpaRepository<BookingFile, Long> {

    List<BookingFile> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
