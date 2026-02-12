package com.coDevs.cohiChat.timeslot;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import jakarta.persistence.LockModeType;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    List<TimeSlot> findByUserIdOrderByStartTimeAsc(UUID userId);

    @Query("SELECT DISTINCT t FROM TimeSlot t " +
           "JOIN t.weekdayEntities w " +
           "WHERE t.userId = :userId " +
           "AND t.startTime < :endTime AND t.endTime > :startTime " +
           "AND w.weekday IN :weekdays " +
           "AND (t.endDate IS NULL OR :startDate IS NULL OR t.endDate >= :startDate) " +
           "AND (t.startDate IS NULL OR :endDate IS NULL OR t.startDate <= :endDate)")
    List<TimeSlot> findOverlappingTimeSlots(
        @Param("userId") UUID userId,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("weekdays") List<Integer> weekdays,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TimeSlot t WHERE t.id = :id")
    Optional<TimeSlot> findByIdWithLock(@Param("id") Long id);
}
