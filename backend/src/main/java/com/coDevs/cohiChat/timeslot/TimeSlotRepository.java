package com.coDevs.cohiChat.timeslot;

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

    @Query("SELECT t FROM TimeSlot t WHERE t.userId = :userId " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    List<TimeSlot> findOverlappingTimeSlots(
        @Param("userId") UUID userId,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    /**
     * Pessimistic Lock을 적용하여 타임슬롯 조회
     * 동시 예약 요청 시 race condition 방지
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TimeSlot t WHERE t.id = :id")
    Optional<TimeSlot> findByIdWithLock(@Param("id") Long id);
}
