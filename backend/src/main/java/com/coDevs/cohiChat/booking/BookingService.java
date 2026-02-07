package com.coDevs.cohiChat.booking;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.request.BookingCreateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingScheduleUpdateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingStatusUpdateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingUpdateRequestDTO;
import com.coDevs.cohiChat.booking.response.BookingPublicResponseDTO;
import com.coDevs.cohiChat.booking.response.BookingResponseDTO;
import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.google.calendar.GoogleCalendarService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final CalendarRepository calendarRepository;
    private final GoogleCalendarService googleCalendarService;

    @Transactional
    public BookingResponseDTO createBooking(Member guest, BookingCreateRequestDTO request) {
        validateNotPastBooking(request.getBookingDate());

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
            .orElseThrow(() -> new CustomException(ErrorCode.TIMESLOT_NOT_FOUND));

        validateNotSelfBooking(guest, timeSlot);
        validateWeekdayAvailable(timeSlot, request.getBookingDate());
        validateNotDuplicateBooking(timeSlot, request.getBookingDate(), null);

        Booking booking = Booking.create(
            timeSlot,
            guest.getId(),
            request.getBookingDate(),
            request.getTopic(),
            request.getDescription()
        );

        Booking savedBooking = bookingRepository.save(booking);

        createGoogleCalendarEvent(savedBooking, timeSlot);

        return BookingResponseDTO.from(savedBooking);
    }

    private void createGoogleCalendarEvent(Booking booking, TimeSlot timeSlot) {
        UUID hostId = timeSlot.getUserId();
        calendarRepository.findById(hostId).ifPresent(calendar -> {
            LocalDateTime startDateTime = LocalDateTime.of(
                booking.getBookingDate(),
                timeSlot.getStartTime()
            );
            LocalDateTime endDateTime = LocalDateTime.of(
                booking.getBookingDate(),
                timeSlot.getEndTime()
            );

            String eventId = googleCalendarService.createEvent(
                booking.getTopic(),
                booking.getDescription(),
                startDateTime,
                endDateTime,
                calendar.getGoogleCalendarId()
            );

            if (eventId != null) {
                booking.setGoogleEventId(eventId);
                log.info("Google Calendar event created for booking: {}", booking.getId());
            }
        });
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

    private void validateNotDuplicateBooking(TimeSlot timeSlot, LocalDate bookingDate, Long excludedId) {
        boolean exists = bookingRepository.existsDuplicateBooking(
            timeSlot,
            bookingDate,
            AttendanceStatus.getCancelledStatuses(),
            excludedId
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

    @Transactional
    public BookingResponseDTO updateBookingSchedule(Long bookingId, UUID hostId, BookingScheduleUpdateRequestDTO request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateHostAccess(booking, hostId);
        validateNotPastBooking(request.getBookingDate());

        TimeSlot newTimeSlot = timeSlotRepository.findById(request.getTimeSlotId())
            .orElseThrow(() -> new CustomException(ErrorCode.TIMESLOT_NOT_FOUND));

        if (!newTimeSlot.getUserId().equals(hostId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        validateWeekdayAvailable(newTimeSlot, request.getBookingDate());
        validateNotDuplicateBooking(newTimeSlot, request.getBookingDate(), bookingId);

        booking.updateSchedule(newTimeSlot, request.getBookingDate());

        updateGoogleCalendarEvent(booking, newTimeSlot, request.getBookingDate());

        return BookingResponseDTO.from(booking);
    }

    private void updateGoogleCalendarEvent(Booking booking, TimeSlot timeSlot, LocalDate bookingDate) {
        if (booking.getGoogleEventId() == null) {
            return;
        }

        UUID hostId = timeSlot.getUserId();
        calendarRepository.findById(hostId).ifPresent(calendar -> {
            LocalDateTime startDateTime = LocalDateTime.of(
                bookingDate,
                timeSlot.getStartTime()
            );
            LocalDateTime endDateTime = LocalDateTime.of(
                bookingDate,
                timeSlot.getEndTime()
            );

            boolean updated = googleCalendarService.updateEvent(
                booking.getGoogleEventId(),
                booking.getTopic(),
                booking.getDescription(),
                startDateTime,
                endDateTime,
                calendar.getGoogleCalendarId()
            );

            if (updated) {
                log.info("Google Calendar event updated for booking: {}", booking.getId());
            }
        });
    }

    private void validateHostAccess(Booking booking, UUID requesterId) {
        if (!booking.getTimeSlot().getUserId().equals(requesterId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    @Transactional
    public BookingResponseDTO updateBookingStatus(Long bookingId, UUID hostId, BookingStatusUpdateRequestDTO request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateHostAccess(booking, hostId);

        if (!booking.getAttendanceStatus().isModifiable()) {
            throw new CustomException(ErrorCode.BOOKING_NOT_MODIFIABLE);
        }

        if (!request.getStatus().isHostSettable()) {
            throw new CustomException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        booking.updateStatus(request.getStatus());

        return BookingResponseDTO.from(booking);
    }

    @Transactional
    public void cancelBooking(Long bookingId, UUID guestId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateGuestAccess(booking, guestId);

        if (!booking.getAttendanceStatus().isCancellable()) {
            throw new CustomException(ErrorCode.BOOKING_NOT_CANCELLABLE);
        }

        deleteGoogleCalendarEvent(booking);

        booking.cancel();
    }

    private void deleteGoogleCalendarEvent(Booking booking) {
        if (booking.getGoogleEventId() == null) {
            return;
        }

        UUID hostId = booking.getTimeSlot().getUserId();
        calendarRepository.findById(hostId).ifPresent(calendar -> {
            boolean deleted = googleCalendarService.deleteEvent(
                booking.getGoogleEventId(),
                calendar.getGoogleCalendarId()
            );

            if (deleted) {
                log.info("Google Calendar event deleted for booking: {}", booking.getId());
            }
        });
    }

    @Transactional
    public BookingResponseDTO updateBooking(Long bookingId, UUID guestId, BookingUpdateRequestDTO request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateGuestAccess(booking, guestId);
        validateNotPastBooking(request.getBookingDate());

        TimeSlot newTimeSlot = timeSlotRepository.findById(request.getTimeSlotId())
            .orElseThrow(() -> new CustomException(ErrorCode.TIMESLOT_NOT_FOUND));

        UUID originalHostId = booking.getTimeSlot().getUserId();
        if (!newTimeSlot.getUserId().equals(originalHostId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        validateWeekdayAvailable(newTimeSlot, request.getBookingDate());
        validateNotDuplicateBooking(newTimeSlot, request.getBookingDate(), bookingId);

        booking.update(request.getTopic(), request.getDescription(), newTimeSlot, request.getBookingDate());

        updateGoogleCalendarEventForGuestUpdate(booking, newTimeSlot, request);

        return BookingResponseDTO.from(booking);
    }

    private void updateGoogleCalendarEventForGuestUpdate(Booking booking, TimeSlot timeSlot, BookingUpdateRequestDTO request) {
        if (booking.getGoogleEventId() == null) {
            return;
        }

        UUID hostId = timeSlot.getUserId();
        calendarRepository.findById(hostId).ifPresent(calendar -> {
            LocalDateTime startDateTime = LocalDateTime.of(
                request.getBookingDate(),
                timeSlot.getStartTime()
            );
            LocalDateTime endDateTime = LocalDateTime.of(
                request.getBookingDate(),
                timeSlot.getEndTime()
            );

            boolean updated = googleCalendarService.updateEvent(
                booking.getGoogleEventId(),
                request.getTopic(),
                request.getDescription(),
                startDateTime,
                endDateTime,
                calendar.getGoogleCalendarId()
            );

            if (updated) {
                log.info("Google Calendar event updated for booking: {}", booking.getId());
            }
        });
    }

    @Transactional(readOnly = true)
    public List<BookingPublicResponseDTO> getBookingsByHostAndDate(UUID hostId, int year, int month) {
        validateYearMonth(year, month);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1);

        List<Booking> bookings = bookingRepository.findByHostIdAndDateRange(hostId, startDate, endDate);
        return bookings.stream()
            .map(BookingPublicResponseDTO::from)
            .toList();
    }

    private void validateYearMonth(int year, int month) {
        if (month < 1 || month > 12) {
            throw new CustomException(ErrorCode.INVALID_YEAR_MONTH);
        }
        if (year < 1900 || year > 2100) {
            throw new CustomException(ErrorCode.INVALID_YEAR_MONTH);
        }
    }

    private void validateGuestAccess(Booking booking, UUID requesterId) {
        if (!booking.getGuestId().equals(requesterId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }
}
