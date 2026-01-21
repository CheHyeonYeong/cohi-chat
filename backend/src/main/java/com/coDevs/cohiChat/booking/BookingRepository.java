package com.coDevs.cohiChat.booking;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

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
}
