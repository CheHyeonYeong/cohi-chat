package com.coDevs.cohiChat.booking;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

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
     * 특정 타임슬롯과 날짜에 취소되지 않은 예약이 존재하는지 확인
     * @param excludedId 제외할 예약 ID (새 예약 생성 시 null, 수정 시 자신의 ID)
     */
    @Query("""
        SELECT EXISTS (
            SELECT 1 FROM Booking b
            WHERE b.timeSlot = :timeSlot
              AND b.bookingDate = :bookingDate
              AND b.attendanceStatus NOT IN :excludedStatuses
              AND (:excludedId IS NULL OR b.id <> :excludedId)
        )
    """)
    boolean existsDuplicateBooking(
        @Param("timeSlot") com.coDevs.cohiChat.timeslot.entity.TimeSlot timeSlot,
        @Param("bookingDate") LocalDate bookingDate,
        @Param("excludedStatuses") List<AttendanceStatus> excludedStatuses,
        @Param("excludedId") Long excludedId
    );

    /**
     * 호스트의 월별 예약 목록 조회 (날짜 범위 필터링)
     * FETCH JOIN으로 N+1 문제 방지
     */
    @Query("SELECT b FROM Booking b JOIN FETCH b.timeSlot t WHERE t.userId = :hostId AND b.bookingDate >= :startDate AND b.bookingDate < :endDate ORDER BY b.bookingDate")
    List<Booking> findByHostIdAndDateRange(
        @Param("hostId") UUID hostId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * 호스트의 미래 예정된 예약 조회 (취소되지 않은 예약)
     */
    @Query("SELECT b FROM Booking b JOIN FETCH b.timeSlot t WHERE t.userId = :hostId AND b.bookingDate >= :today AND b.attendanceStatus = :status ORDER BY b.bookingDate")
    List<Booking> findFutureBookingsByHostId(
        @Param("hostId") UUID hostId,
        @Param("today") LocalDate today,
        @Param("status") AttendanceStatus status
    );

    /**
     * 게스트의 미래 예정된 예약 조회 (취소되지 않은 예약)
     */
    @Query("SELECT b FROM Booking b JOIN FETCH b.timeSlot t WHERE b.guestId = :guestId AND b.bookingDate >= :today AND b.attendanceStatus = :status ORDER BY b.bookingDate")
    List<Booking> findFutureBookingsByGuestId(
        @Param("guestId") UUID guestId,
        @Param("today") LocalDate today,
        @Param("status") AttendanceStatus status
    );

    /**
     * 특정 호스트의 커피챗 횟수 단일 집계
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.timeSlot.userId = :hostId AND b.attendanceStatus = :status")
    long countAttendedByHostId(@Param("hostId") UUID hostId, @Param("status") AttendanceStatus status);

    /**
     * 호스트 ID 목록의 커피챗 횟수 배치 집계 (N+1 방지)
     */
    @Query("""
        SELECT b.timeSlot.userId AS hostId, COUNT(b) AS count
        FROM Booking b
        WHERE b.timeSlot.userId IN :hostIds
          AND b.attendanceStatus = :status
        GROUP BY b.timeSlot.userId
    """)
    List<HostChatCount> countAttendedByHostIds(
        @Param("hostIds") Collection<UUID> hostIds,
        @Param("status") AttendanceStatus status
    );

    @Query("""
        SELECT COUNT(b)
        FROM Booking b
        WHERE b.timeSlot.userId = :hostId
          AND b.attendanceStatus = :status
    """)
    long countAttendedByHostId(
        @Param("hostId") UUID hostId,
        @Param("status") AttendanceStatus status
    );
}
