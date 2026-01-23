package com.coDevs.cohiChat.booking;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * 특정 타임슬롯과 날짜에 취소되지 않은 예약이 존재하는지 확인
     * @param timeSlot 타임슬롯
     * @param bookingDate 예약 날짜
     * @param excludedStatuses 제외할 상태 목록 (CANCELLED, SAME_DAY_CANCEL 등)
     */
    boolean existsByTimeSlotAndBookingDateAndAttendanceStatusNotIn(
        com.coDevs.cohiChat.timeslot.entity.TimeSlot timeSlot,
        LocalDate bookingDate,
        List<AttendanceStatus> excludedStatuses
    );

    /**
     * 게스트 ID로 예약 목록 조회 (예약 날짜 내림차순)
     * FETCH JOIN으로 N+1 문제 방지
     */
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.timeSlot WHERE b.guestId = :guestId ORDER BY b.bookingDate DESC")
    List<Booking> findByGuestIdOrderByBookingDateDesc(@Param("guestId") UUID guestId);

    /**
     * 호스트 ID로 예약 목록 조회 (TimeSlot의 userId가 호스트 ID인 예약, 예약 날짜 내림차순)
     * FETCH JOIN으로 N+1 문제 방지
     */
    @Query("SELECT b FROM Booking b JOIN FETCH b.timeSlot t WHERE t.userId = :hostId ORDER BY b.bookingDate DESC")
    List<Booking> findByHostIdOrderByBookingDateDesc(@Param("hostId") UUID hostId);

    /**
     * 특정 타임슬롯과 날짜에 취소되지 않은 예약이 존재하는지 확인 (특정 예약 ID 제외)
     * 예약 수정 시 자신을 제외하고 중복 검사할 때 사용
     *
     * Query Method 대신 @Query 사용 이유:
     * - 조건이 4개로 메서드명이 과도하게 길어짐 (existsByTimeSlotAndBookingDateAndAttendanceStatusNotInAndIdNot)
     * - Spring Data JPA 공식 문서에서도 복잡한 경우 @Query 권장
     * - JPQL이 쿼리 의도를 더 명확하게 표현함
     */
    @Query("""
    SELECT EXISTS (
        SELECT 1
        FROM Booking b
        WHERE b.timeSlot = :timeSlot
          AND b.bookingDate = :bookingDate
          AND b.attendanceStatus NOT IN :excludedStatuses
          AND b.id <> :excludedId
              )
    """)
    boolean existsDuplicateBookingExcludingSelf(
        @Param("timeSlot") com.coDevs.cohiChat.timeslot.entity.TimeSlot timeSlot,
        @Param("bookingDate") LocalDate bookingDate,
        @Param("excludedStatuses") List<AttendanceStatus> excludedStatuses,
        @Param("excludedId") Long excludedId
    );
}
