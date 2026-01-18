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
     * @param timeSlotId 타임슬롯 ID
     * @param bookingDate 예약 날짜
     * @param excludedStatuses 제외할 상태 목록 (CANCELLED, SAME_DAY_CANCEL 등)
     */
    boolean existsByTimeSlotIdAndBookingDateAndAttendanceStatusNotIn(
        Long timeSlotId,
        LocalDate bookingDate,
        List<AttendanceStatus> excludedStatuses
    );

    /**
     * 게스트 ID로 예약 목록 조회 (예약 날짜 내림차순)
     */
    List<Booking> findByGuestIdOrderByBookingDateDesc(UUID guestId);

    /**
     * 호스트 ID로 예약 목록 조회 (TimeSlot의 userId가 호스트 ID인 예약, 예약 날짜 내림차순)
     */
    @Query("SELECT b FROM Booking b JOIN TimeSlot t ON b.timeSlotId = t.id WHERE t.userId = :hostId ORDER BY b.bookingDate DESC")
    List<Booking> findByHostIdOrderByBookingDateDesc(@Param("hostId") UUID hostId);

    /**
     * 특정 타임슬롯과 날짜에 취소되지 않은 예약이 존재하는지 확인 (자신의 예약은 제외)
     * @param timeSlotId 타임슬롯 ID
     * @param bookingDate 예약 날짜
     * @param excludedStatuses 제외할 상태 목록 (CANCELLED, SAME_DAY_CANCEL 등)
     * @param excludeBookingId 제외할 예약 ID (자기 자신)
     */
    boolean existsByTimeSlotIdAndBookingDateAndAttendanceStatusNotInAndIdNot(
        Long timeSlotId,
        LocalDate bookingDate,
        List<AttendanceStatus> excludedStatuses,
        Long excludeBookingId
    );
}
