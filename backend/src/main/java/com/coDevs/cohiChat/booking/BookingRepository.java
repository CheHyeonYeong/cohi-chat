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
     */
    boolean existsByTimeSlotAndBookingDateAndAttendanceStatusNotInAndIdNot(
        com.coDevs.cohiChat.timeslot.entity.TimeSlot timeSlot,
        LocalDate bookingDate,
        List<AttendanceStatus> excludedStatuses,
        Long excludedBookingId
    );
}
