package com.coDevs.cohiChat.booking;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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
import com.coDevs.cohiChat.google.calendar.GoogleCalendarProperties;
import com.coDevs.cohiChat.google.calendar.GoogleCalendarService;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final CalendarRepository calendarRepository;
    private final MemberRepository memberRepository;
    private final GoogleCalendarService googleCalendarService;
    private final GoogleCalendarProperties googleCalendarProperties;

    private ZoneId calendarZoneId;

    @PostConstruct
    void initZoneId() {
        String timezone = googleCalendarProperties.getTimezone();
        calendarZoneId = (timezone != null) ? ZoneId.of(timezone) : ZoneId.systemDefault();
    }

    @Transactional
    public BookingResponseDTO createBooking(Member guest, BookingCreateRequestDTO request) {
        validateNotPastBooking(request.getBookingDate());

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
            .orElseThrow(() -> new CustomException(ErrorCode.TIMESLOT_NOT_FOUND));

        validateNotSelfBooking(guest, timeSlot);
        validateWeekdayAvailable(timeSlot, request.getBookingDate());
        validateDateInRange(timeSlot, request.getBookingDate());
        validateNotDuplicateBooking(timeSlot, request.getBookingDate(), null);
        validateTopic(timeSlot.getUserId(), request.getTopic());

        Booking booking = Booking.create(
            timeSlot,
            guest.getId(),
            request.getBookingDate(),
            request.getTopic(),
            request.getDescription()
        );

        Booking savedBooking = bookingRepository.save(booking);

        upsertGoogleCalendarEvent(savedBooking, timeSlot, savedBooking.getBookingDate(), savedBooking.getDescription());

        return toBookingResponseDTO(savedBooking);
    }

    private String buildEventSummary(UUID guestId) {
        return memberRepository.findById(guestId)
            .filter(m -> m.getDisplayName() != null)
            .map(m -> m.getDisplayName() + "님과의 미팅")
            .orElse("미팅");
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

    private void validateDateInRange(TimeSlot timeSlot, LocalDate bookingDate) {
        LocalDate start = timeSlot.getStartDate();
        LocalDate end = timeSlot.getEndDate();
        if (start == null && end == null) {
            return;
        }
        if ((start != null && bookingDate.isBefore(start)) || (end != null && bookingDate.isAfter(end))) {
            throw new CustomException(ErrorCode.BOOKING_DATE_OUT_OF_RANGE);
        }
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

    /**
     * 예약 주제(topic)가 호스트 캘린더에 정의된 topics 목록에 포함되는지 검증
     * @param hostId 호스트 ID
     * @param topic 검증할 주제
     */
    private void validateTopic(UUID hostId, String topic) {
        Calendar calendar = calendarRepository.findById(hostId)
            .orElseThrow(() -> new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        if (!calendar.getTopics().contains(topic)) {
            throw new CustomException(ErrorCode.INVALID_TOPIC);
        }
    }

    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long bookingId, UUID requesterId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);

        return toBookingResponseDTO(booking);
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

    private BookingResponseDTO toBookingResponseDTO(Booking booking) {
        Member host = memberRepository.findById(booking.getTimeSlot().getUserId()).orElse(null);
        String username = host != null ? host.getUsername() : null;
        String displayName = host != null ? host.getDisplayName() : null;
        return BookingResponseDTO.from(booking, username, displayName);
    }

    private List<BookingResponseDTO> toBookingResponseDTOs(List<Booking> bookings) {
        List<UUID> hostIds = bookings.stream()
            .map(b -> b.getTimeSlot().getUserId())
            .distinct()
            .toList();
        Map<UUID, Member> hostMap = memberRepository.findAllById(hostIds).stream()
            .collect(Collectors.toMap(Member::getId, m -> m));

        return bookings.stream()
            .map(b -> {
                Member host = hostMap.get(b.getTimeSlot().getUserId());
                String username = host != null ? host.getUsername() : null;
                String displayName = host != null ? host.getDisplayName() : null;
                return BookingResponseDTO.from(b, username, displayName);
            })
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
        validateDateInRange(newTimeSlot, request.getBookingDate());
        validateNotDuplicateBooking(newTimeSlot, request.getBookingDate(), bookingId);

        booking.updateSchedule(newTimeSlot, request.getBookingDate());

        upsertGoogleCalendarEvent(booking, newTimeSlot, request.getBookingDate(), booking.getDescription());

        return toBookingResponseDTO(booking);
    }

    private void upsertGoogleCalendarEvent(Booking booking, TimeSlot timeSlot, LocalDate bookingDate, String description) {
        UUID hostId = timeSlot.getUserId();
        var calendarOpt = calendarRepository.findById(hostId);
        if (calendarOpt.isEmpty()) {
            log.debug("No Google Calendar linked for host: {}", hostId);
            return;
        }

        Calendar calendar = calendarOpt.get();
        Instant startDateTime = toInstant(bookingDate, timeSlot.getStartTime());
        Instant endDateTime = toInstant(bookingDate, timeSlot.getEndTime());
        String summary = buildEventSummary(booking.getGuestId());

        if (booking.getGoogleEventId() == null) {
            String eventId = googleCalendarService.createEvent(
                summary, description, startDateTime, endDateTime, calendar.getGoogleCalendarId()
            );
            if (eventId != null) {
                booking.setGoogleEventId(eventId);
                log.info("Google Calendar event created for booking: {}", booking.getId());
            } else {
                log.warn("Google Calendar event creation returned null for booking: {}", booking.getId());
            }
            return;
        }

        boolean updated = googleCalendarService.updateEvent(
            booking.getGoogleEventId(), summary, description,
            startDateTime, endDateTime, calendar.getGoogleCalendarId()
        );
        if (updated) {
            log.info("Google Calendar event updated for booking: {}", booking.getId());
        }
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

        return toBookingResponseDTO(booking);
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
        validateDateInRange(newTimeSlot, request.getBookingDate());
        validateNotDuplicateBooking(newTimeSlot, request.getBookingDate(), bookingId);
        validateTopic(newTimeSlot.getUserId(), request.getTopic());

        booking.update(request.getTopic(), request.getDescription(), newTimeSlot, request.getBookingDate());

        upsertGoogleCalendarEvent(booking, newTimeSlot, request.getBookingDate(), request.getDescription());

        return toBookingResponseDTO(booking);
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

    private Instant toInstant(LocalDate date, LocalTime time) {
        return date.atTime(time).atZone(calendarZoneId).toInstant();
    }
}
