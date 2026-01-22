package com.coDevs.cohiChat.booking;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.request.BookingCreateRequestDTO;
import com.coDevs.cohiChat.booking.response.BookingResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;

    @Transactional
    public BookingResponseDTO createBooking(Member guest, BookingCreateRequestDTO request) {
        // 1. DB 조회 없이 가능한 검증 먼저
        validateNotPastBooking(request.getBookingDate());

        // 2. DB 조회 필요한 검증 (Pessimistic Lock으로 동시 예약 방지)
        TimeSlot timeSlot = timeSlotRepository.findByIdWithLock(request.getTimeSlotId())
            .orElseThrow(() -> new CustomException(ErrorCode.TIMESLOT_NOT_FOUND));

        validateNotSelfBooking(guest, timeSlot);
        validateWeekdayAvailable(timeSlot, request.getBookingDate());
        validateNotDuplicateBooking(timeSlot, request.getBookingDate());

        Booking booking = Booking.create(
            timeSlot,
            guest.getId(),
            request.getBookingDate(),
            request.getTopic(),
            request.getDescription()
        );

        Booking savedBooking = bookingRepository.save(booking);
        return BookingResponseDTO.from(savedBooking);
    }

    private void validateNotSelfBooking(Member guest, TimeSlot timeSlot) {
        if (guest.getId().equals(timeSlot.getUserId())) {
            throw new CustomException(ErrorCode.SELF_BOOKING);
        }
    }

    private void validateNotPastBooking(LocalDate bookingDate) {
        if (bookingDate.isBefore(LocalDate.now())) {
            throw new CustomException(ErrorCode.PAST_BOOKING);
        }
    }

    /**
     * 예약 날짜의 요일이 타임슬롯에서 허용하는 요일인지 검증
     *
     * 요일 매핑 (일요일 = 0 기준):
     * - 일=0, 월=1, 화=2, 수=3, 목=4, 금=5, 토=6
     *
     * Java DayOfWeek.getValue(): 월=1, 화=2, ..., 일=7
     * 변환: (dayOfWeek.getValue() % 7) -> 일=0, 월=1, ..., 토=6
     */
    private void validateWeekdayAvailable(TimeSlot timeSlot, LocalDate bookingDate) {
        int weekday = convertToSundayBasedWeekday(bookingDate.getDayOfWeek());
        if (!timeSlot.getWeekdays().contains(weekday)) {
            throw new CustomException(ErrorCode.WEEKDAY_NOT_AVAILABLE);
        }
    }

    /**
     * Java DayOfWeek를 일요일=0 기준 요일 숫자로 변환
     * @param dayOfWeek Java DayOfWeek (MONDAY=1 ~ SUNDAY=7)
     * @return 일요일=0 기준 요일 (일=0, 월=1, ..., 토=6)
     */
    private int convertToSundayBasedWeekday(DayOfWeek dayOfWeek) {
        return dayOfWeek.getValue() % 7;
    }

    private void validateNotDuplicateBooking(TimeSlot timeSlot, LocalDate bookingDate) {
        boolean exists = bookingRepository.existsByTimeSlotAndBookingDateAndAttendanceStatusNotIn(
            timeSlot,
            bookingDate,
            AttendanceStatus.getCancelledStatuses()
        );
        if (exists) {
            throw new CustomException(ErrorCode.BOOKING_ALREADY_EXISTS);
        }
    }

    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long bookingId, UUID requesterId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);

        return BookingResponseDTO.from(booking);
    }

    private void validateBookingAccess(Booking booking, UUID requesterId) {
        boolean isGuest = booking.getGuestId().equals(requesterId);
        boolean isHost = booking.getTimeSlot().getUserId().equals(requesterId);

        if (!isGuest && !isHost) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByGuestId(UUID guestId) {
        List<Booking> bookings = bookingRepository.findByGuestIdOrderByBookingDateDesc(guestId);
        return toBookingResponseDTOs(bookings);
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByHostId(UUID hostId) {
        List<Booking> bookings = bookingRepository.findByHostIdOrderByBookingDateDesc(hostId);
        return toBookingResponseDTOs(bookings);
    }

    private List<BookingResponseDTO> toBookingResponseDTOs(List<Booking> bookings) {
        return bookings.stream()
            .map(BookingResponseDTO::from)
            .toList();
    }
}
