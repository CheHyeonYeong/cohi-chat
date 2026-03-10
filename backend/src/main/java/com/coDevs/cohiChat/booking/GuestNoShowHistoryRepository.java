package com.coDevs.cohiChat.booking;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.booking.entity.GuestNoShowHistory;

public interface GuestNoShowHistoryRepository extends JpaRepository<GuestNoShowHistory, Long> {

    @Query("SELECT h FROM GuestNoShowHistory h JOIN FETCH h.booking WHERE h.guestId = :guestId ORDER BY h.reportedAt DESC")
    List<GuestNoShowHistory> findByGuestIdOrderByReportedAtDesc(@Param("guestId") UUID guestId);

    boolean existsByBookingIdAndReportedBy(Long bookingId, java.util.UUID reportedBy);
}
