package com.coDevs.cohiChat.booking;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.booking.entity.NoShowHistory;

public interface NoShowHistoryRepository extends JpaRepository<NoShowHistory, Long> {

    @Query("SELECT h FROM NoShowHistory h JOIN FETCH h.booking WHERE h.hostId = :hostId ORDER BY h.reportedAt DESC")
    List<NoShowHistory> findByHostIdOrderByReportedAtDesc(@Param("hostId") UUID hostId);

    boolean existsByBookingId(Long bookingId);
}
