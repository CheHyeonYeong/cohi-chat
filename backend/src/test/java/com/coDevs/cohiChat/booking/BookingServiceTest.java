package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.request.BookingCreateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingScheduleUpdateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingStatusUpdateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingUpdateRequestDTO;
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

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingServiceTest {

    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final UUID HOST_ID = UUID.randomUUID();
    private static final Long TIME_SLOT_ID = 1L;
    private static final LocalDate FUTURE_DATE = LocalDate.now().plusDays(7);
    private static final LocalDate PAST_DATE = LocalDate.now().minusDays(1);
    private static final String TEST_TOPIC = "프로젝트 상담";
    private static final String TEST_DESCRIPTION = "Spring Boot 프로젝트 관련 질문";

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private CalendarRepository calendarRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private GoogleCalendarService googleCalendarService;

    @Mock
    private GoogleCalendarProperties googleCalendarProperties;

    @Mock
    private Member guestMember;

    @Mock
    private TimeSlot timeSlot;

    @InjectMocks
    private BookingService bookingService;

    private BookingCreateRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        given(googleCalendarProperties.getTimezone()).willReturn("Asia/Seoul");
        bookingService.initZoneId();

        requestDTO = BookingCreateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(FUTURE_DATE)
            .topic(TEST_TOPIC)
            .description(TEST_DESCRIPTION)
            .build();
    }

    @Test
    @DisplayName("성공: 게스트가 유효한 예약을 생성할 수 있다")
    void createBookingSuccess() {
        // given
        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response)
            .extracting("timeSlotId", "guestId", "topic", "description", "attendanceStatus")
            .containsExactly(TIME_SLOT_ID, GUEST_ID, TEST_TOPIC, TEST_DESCRIPTION, AttendanceStatus.SCHEDULED);
        assertThat(response.getBookingDate()).isEqualTo(FUTURE_DATE);
        assertThat(response.getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(response.getEndTime()).isEqualTo(LocalTime.of(11, 0));
    }

    @Test
    @DisplayName("실패: 존재하지 않는 타임슬롯에 예약할 수 없다")
    void createBookingFailWhenTimeSlotNotFound() {
        // given - 과거 날짜 검증 통과 후, TimeSlot 조회에서 실패
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TIMESLOT_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 자기 자신에게 예약할 수 없다")
    void createBookingFailWhenSelfBooking() {
        // given
        given(guestMember.getId()).willReturn(HOST_ID); // 게스트 ID == 호스트 ID
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SELF_BOOKING);
    }

    @Test
    @DisplayName("실패: 과거 날짜에 예약할 수 없다")
    void createBookingFailWhenPastDate() {
        // given - 과거 날짜 검증은 DB 조회 전에 수행되므로 mock 설정 불필요
        BookingCreateRequestDTO pastRequest = BookingCreateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(PAST_DATE)
            .topic(TEST_TOPIC)
            .description(TEST_DESCRIPTION)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, pastRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAST_BOOKING);
    }

    @Test
    @DisplayName("실패: 이미 예약된 시간대에 중복 예약할 수 없다")
    void createBookingFailWhenAlreadyExists() {
        // given
        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(true);

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("실패: 해당 요일에 타임슬롯이 없으면 예약할 수 없다")
    void createBookingFailWhenWeekdayNotAvailable() {
        // given
        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        // 예약하려는 날짜의 요일이 타임슬롯의 weekdays에 포함되지 않음
        given(timeSlot.getWeekdays()).willReturn(List.of((FUTURE_DATE.getDayOfWeek().getValue() + 1) % 7));
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WEEKDAY_NOT_AVAILABLE);
    }

    @Test
    @DisplayName("성공: 취소된 예약이 있는 시간대에 재예약할 수 있다")
    void createBookingSuccessWhenCancelledBookingExists() {
        // given - 취소된 예약이 있지만, 활성 예약은 없는 상태
        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        // 취소된 예약만 존재하므로 중복 체크에서 false 반환
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response)
            .extracting("timeSlotId", "guestId", "attendanceStatus")
            .containsExactly(TIME_SLOT_ID, GUEST_ID, AttendanceStatus.SCHEDULED);
    }

    @Test
    @DisplayName("성공: 게스트가 본인 예약 상세 조회")
    void getBookingByIdSuccessAsGuest() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when
        BookingResponseDTO response = bookingService.getBookingById(bookingId, GUEST_ID);

        // then
        assertThat(response)
            .extracting("timeSlotId", "guestId", "topic", "description")
            .containsExactly(TIME_SLOT_ID, GUEST_ID, TEST_TOPIC, TEST_DESCRIPTION);
    }

    @Test
    @DisplayName("성공: 호스트가 본인 예약 상세 조회")
    void getBookingByIdSuccessAsHost() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when
        BookingResponseDTO response = bookingService.getBookingById(bookingId, HOST_ID);

        // then
        assertThat(response)
            .extracting("timeSlotId", "guestId", "topic", "description")
            .containsExactly(TIME_SLOT_ID, GUEST_ID, TEST_TOPIC, TEST_DESCRIPTION);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 ID로 조회")
    void getBookingByIdFailWhenNotFound() {
        // given
        Long bookingId = 999L;
        given(bookingRepository.findById(bookingId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> bookingService.getBookingById(bookingId, GUEST_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 권한 없는 사용자가 예약 조회 시 ACCESS_DENIED")
    void getBookingByIdFailWhenAccessDenied() {
        // given
        Long bookingId = 1L;
        UUID otherUserId = UUID.randomUUID();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when & then - 게스트도 호스트도 아닌 사용자
        assertThatThrownBy(() -> bookingService.getBookingById(bookingId, otherUserId))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("성공: 게스트 ID로 예약 목록 조회")
    void getBookingsByGuestIdSuccess() {
        // given
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        Booking booking1 = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        Booking booking2 = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE.plusDays(1), "토픽2", "설명2");
        given(bookingRepository.findByGuestIdOrderByBookingDateDesc(GUEST_ID))
            .willReturn(List.of(booking2, booking1));

        // when
        List<BookingResponseDTO> responses = bookingService.getBookingsByGuestId(GUEST_ID);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getBookingDate()).isEqualTo(FUTURE_DATE.plusDays(1));
        assertThat(responses.get(1).getBookingDate()).isEqualTo(FUTURE_DATE);
    }

    @Test
    @DisplayName("성공: 게스트 예약이 없으면 빈 목록 반환")
    void getBookingsByGuestIdEmptyList() {
        // given
        given(bookingRepository.findByGuestIdOrderByBookingDateDesc(GUEST_ID))
            .willReturn(List.of());

        // when
        List<BookingResponseDTO> responses = bookingService.getBookingsByGuestId(GUEST_ID);

        // then
        assertThat(responses).isEmpty();
    }

    @Test
    @DisplayName("성공: 호스트 ID로 예약 목록 조회")
    void getBookingsByHostIdSuccess() {
        // given
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        Booking booking1 = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        Booking booking2 = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE.plusDays(1), "토픽2", "설명2");
        given(bookingRepository.findByHostIdOrderByBookingDateDesc(HOST_ID))
            .willReturn(List.of(booking2, booking1));

        // when
        List<BookingResponseDTO> responses = bookingService.getBookingsByHostId(HOST_ID);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getBookingDate()).isEqualTo(FUTURE_DATE.plusDays(1));
        assertThat(responses.get(1).getBookingDate()).isEqualTo(FUTURE_DATE);
    }

    @Test
    @DisplayName("성공: 호스트 예약이 없으면 빈 목록 반환")
    void getBookingsByHostIdEmptyList() {
        // given
        given(bookingRepository.findByHostIdOrderByBookingDateDesc(HOST_ID))
            .willReturn(List.of());

        // when
        List<BookingResponseDTO> responses = bookingService.getBookingsByHostId(HOST_ID);

        // then
        assertThat(responses).isEmpty();
    }

    // ===== 예약 일정 수정 테스트 (Issue #59) =====

    @Test
    @DisplayName("성공: 호스트가 예약 일정을 수정할 수 있다")
    void updateBookingScheduleSuccess() {
        // given
        Long bookingId = 1L;
        LocalDate newDate = FUTURE_DATE.plusDays(7);
        Long newTimeSlotId = 2L;

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // 새 타임슬롯 mock
        TimeSlot newTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(newTimeSlot.getId()).willReturn(newTimeSlotId);
        given(newTimeSlot.getUserId()).willReturn(HOST_ID);
        given(newTimeSlot.getWeekdays()).willReturn(List.of(newDate.getDayOfWeek().getValue() % 7));
        given(newTimeSlot.getStartTime()).willReturn(LocalTime.of(14, 0));
        given(newTimeSlot.getEndTime()).willReturn(LocalTime.of(15, 0));
        given(timeSlotRepository.findById(newTimeSlotId)).willReturn(Optional.of(newTimeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(newTimeSlot), eq(newDate), any(), eq(bookingId)
        )).willReturn(false);

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(newTimeSlotId)
            .bookingDate(newDate)
            .build();

        // when
        BookingResponseDTO response = bookingService.updateBookingSchedule(bookingId, HOST_ID, request);

        // then
        assertThat(response.getTimeSlotId()).isEqualTo(newTimeSlotId);
        assertThat(response.getBookingDate()).isEqualTo(newDate);
        assertThat(response.getStartTime()).isEqualTo(LocalTime.of(14, 0));
        assertThat(response.getEndTime()).isEqualTo(LocalTime.of(15, 0));
    }

    @Test
    @DisplayName("실패: 호스트가 아닌 사용자가 예약 수정 시도")
    void updateBookingScheduleFailWhenNotHost() {
        // given
        Long bookingId = 1L;
        UUID otherUserId = UUID.randomUUID();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(FUTURE_DATE.plusDays(7))
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, otherUserId, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 게스트가 예약 수정 시도")
    void updateBookingScheduleFailWhenGuest() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(FUTURE_DATE.plusDays(7))
            .build();

        // when & then - 게스트도 호스트가 아니므로 수정 불가
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, GUEST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 수정 시도")
    void updateBookingScheduleFailWhenBookingNotFound() {
        // given
        Long bookingId = 999L;
        given(bookingRepository.findById(bookingId)).willReturn(Optional.empty());

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(FUTURE_DATE.plusDays(7))
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 과거 날짜로 예약 수정 시도")
    void updateBookingScheduleFailWhenPastDate() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(PAST_DATE)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAST_BOOKING);
    }

    @Test
    @DisplayName("실패: 타임슬롯 요일과 맞지 않는 날짜로 예약 수정 시도")
    void updateBookingScheduleFailWhenWeekdayNotAvailable() {
        // given
        Long bookingId = 1L;
        LocalDate newDate = FUTURE_DATE.plusDays(7);

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        TimeSlot newTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(newTimeSlot.getUserId()).willReturn(HOST_ID);
        // 예약하려는 날짜의 요일이 타임슬롯의 weekdays에 포함되지 않음
        given(newTimeSlot.getWeekdays()).willReturn(List.of((newDate.getDayOfWeek().getValue() + 1) % 7));
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(newTimeSlot));

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(newDate)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WEEKDAY_NOT_AVAILABLE);
    }

    @Test
    @DisplayName("실패: 중복 예약이 발생하는 날짜로 수정 시도")
    void updateBookingScheduleFailWhenDuplicateBooking() {
        // given
        Long bookingId = 1L;
        LocalDate newDate = FUTURE_DATE.plusDays(7);

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        TimeSlot newTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(newTimeSlot.getUserId()).willReturn(HOST_ID);
        given(newTimeSlot.getWeekdays()).willReturn(List.of(newDate.getDayOfWeek().getValue() % 7));
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(newTimeSlot));
        // 해당 날짜에 이미 다른 예약이 존재
        given(bookingRepository.existsDuplicateBooking(
            eq(newTimeSlot), eq(newDate), any(), eq(bookingId)
        )).willReturn(true);

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(newDate)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 타임슬롯으로 변경 시도")
    void updateBookingScheduleFailWhenTimeSlotNotFound() {
        // given
        Long bookingId = 1L;
        Long newTimeSlotId = 999L;

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));
        given(timeSlotRepository.findById(newTimeSlotId)).willReturn(Optional.empty());

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(newTimeSlotId)
            .bookingDate(FUTURE_DATE.plusDays(7))
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TIMESLOT_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 다른 호스트의 타임슬롯으로 변경 시도")
    void updateBookingScheduleFailWhenDifferentHostTimeSlot() {
        // given
        Long bookingId = 1L;
        Long newTimeSlotId = 2L;
        UUID anotherHostId = UUID.randomUUID();
        LocalDate newDate = FUTURE_DATE.plusDays(7);

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        TimeSlot anotherHostTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(anotherHostTimeSlot.getUserId()).willReturn(anotherHostId); // 다른 호스트의 타임슬롯
        given(timeSlotRepository.findById(newTimeSlotId)).willReturn(Optional.of(anotherHostTimeSlot));

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(newTimeSlotId)
            .bookingDate(newDate)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingSchedule(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    // ===== 예약 상태 변경 테스트 (Issue #61) =====

    @Test
    @DisplayName("성공: 호스트가 예약 상태를 ATTENDED로 변경")
    void updateBookingStatusToAttendedSuccess() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.ATTENDED)
            .build();

        // when
        BookingResponseDTO response = bookingService.updateBookingStatus(bookingId, HOST_ID, request);

        // then
        assertThat(response.getAttendanceStatus()).isEqualTo(AttendanceStatus.ATTENDED);
    }

    @Test
    @DisplayName("성공: 호스트가 예약 상태를 NO_SHOW로 변경")
    void updateBookingStatusToNoShowSuccess() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.NO_SHOW)
            .build();

        // when
        BookingResponseDTO response = bookingService.updateBookingStatus(bookingId, HOST_ID, request);

        // then
        assertThat(response.getAttendanceStatus()).isEqualTo(AttendanceStatus.NO_SHOW);
    }

    @Test
    @DisplayName("성공: 호스트가 예약 상태를 LATE로 변경")
    void updateBookingStatusToLateSuccess() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.LATE)
            .build();

        // when
        BookingResponseDTO response = bookingService.updateBookingStatus(bookingId, HOST_ID, request);

        // then
        assertThat(response.getAttendanceStatus()).isEqualTo(AttendanceStatus.LATE);
    }

    @Test
    @DisplayName("실패: 호스트가 아닌 사용자가 상태 변경 시도")
    void updateBookingStatusFailWhenNotHost() {
        // given
        Long bookingId = 1L;
        UUID otherUserId = UUID.randomUUID();
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.ATTENDED)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingStatus(bookingId, otherUserId, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 게스트가 상태 변경 시도")
    void updateBookingStatusFailWhenGuest() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.ATTENDED)
            .build();

        // when & then - 게스트는 호스트가 아니므로 상태 변경 불가
        assertThatThrownBy(() -> bookingService.updateBookingStatus(bookingId, GUEST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 상태 변경 시도")
    void updateBookingStatusFailWhenBookingNotFound() {
        // given
        Long bookingId = 999L;
        given(bookingRepository.findById(bookingId)).willReturn(Optional.empty());

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.ATTENDED)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingStatus(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 이미 취소된 예약 상태 변경 시도")
    void updateBookingStatusFailWhenAlreadyCancelled() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE.plusDays(1), TEST_TOPIC, TEST_DESCRIPTION);
        booking.cancel(); // 예약 취소 (CANCELLED)
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.ATTENDED)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingStatus(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_MODIFIABLE);
    }

    @Test
    @DisplayName("실패: 호스트가 CANCELLED 상태로 변경 시도")
    void updateBookingStatusFailWhenInvalidStatus() {
        // given
        Long bookingId = 1L;
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingStatusUpdateRequestDTO request = BookingStatusUpdateRequestDTO.builder()
            .status(AttendanceStatus.CANCELLED)
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBookingStatus(bookingId, HOST_ID, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_BOOKING_STATUS);
    }

    // ===== 예약 취소 테스트 (Issue #61) =====

    @Test
    @DisplayName("성공: 게스트가 사전 예약 취소 (CANCELLED)")
    void cancelBookingSuccess() {
        // given
        Long bookingId = 1L;
        LocalDate futureBookingDate = LocalDate.now().plusDays(3); // 사전 취소
        Booking booking = Booking.create(timeSlot, GUEST_ID, futureBookingDate, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when
        bookingService.cancelBooking(bookingId, GUEST_ID);

        // then
        assertThat(booking.getAttendanceStatus()).isEqualTo(AttendanceStatus.CANCELLED);
    }

    @Test
    @DisplayName("성공: 게스트가 당일 예약 취소 (SAME_DAY_CANCEL)")
    void cancelBookingSameDaySuccess() {
        // given
        Long bookingId = 1L;
        LocalDate today = LocalDate.now(); // 당일 취소
        Booking booking = Booking.create(timeSlot, GUEST_ID, today, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when
        bookingService.cancelBooking(bookingId, GUEST_ID);

        // then
        assertThat(booking.getAttendanceStatus()).isEqualTo(AttendanceStatus.SAME_DAY_CANCEL);
    }

    @Test
    @DisplayName("실패: 게스트가 아닌 사용자가 예약 취소 시도")
    void cancelBookingFailWhenNotGuest() {
        // given
        Long bookingId = 1L;
        UUID otherUserId = UUID.randomUUID();
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when & then
        assertThatThrownBy(() -> bookingService.cancelBooking(bookingId, otherUserId))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 호스트가 게스트 예약 취소 시도")
    void cancelBookingFailWhenHost() {
        // given
        Long bookingId = 1L;
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when & then - 호스트는 게스트가 아니므로 취소 불가
        assertThatThrownBy(() -> bookingService.cancelBooking(bookingId, HOST_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 취소 시도")
    void cancelBookingFailWhenBookingNotFound() {
        // given
        Long bookingId = 999L;
        given(bookingRepository.findById(bookingId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> bookingService.cancelBooking(bookingId, GUEST_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 이미 완료된 예약(ATTENDED) 취소 시도")
    void cancelBookingFailWhenAlreadyAttended() {
        // given
        Long bookingId = 1L;
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        booking.updateStatus(AttendanceStatus.ATTENDED); // 이미 출석 처리됨
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when & then
        assertThatThrownBy(() -> bookingService.cancelBooking(bookingId, GUEST_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_CANCELLABLE);
    }

    @Test
    @DisplayName("실패: 이미 취소된 예약 재취소 시도")
    void cancelBookingFailWhenAlreadyCancelled() {
        // given
        Long bookingId = 1L;
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE.plusDays(1), TEST_TOPIC, TEST_DESCRIPTION);
        booking.cancel(); // 이미 취소됨
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when & then
        assertThatThrownBy(() -> bookingService.cancelBooking(bookingId, GUEST_ID))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_CANCELLABLE);
    }

    // ===== 게스트 예약 수정 테스트 (Issue #60) =====

    @Test
    @DisplayName("성공: 게스트가 본인 예약을 수정할 수 있다")
    void updateBookingSuccess() {
        // given
        Long bookingId = 1L;
        String newTopic = "새로운 주제";
        String newDescription = "새로운 설명";
        LocalDate newBookingDate = FUTURE_DATE.plusDays(3);

        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getWeekdays()).willReturn(List.of(newBookingDate.getDayOfWeek().getValue() % 7));

        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(newBookingDate), any(), eq(bookingId)
        )).willReturn(false);

        BookingUpdateRequestDTO updateRequest = BookingUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(newBookingDate)
            .topic(newTopic)
            .description(newDescription)
            .build();

        // when
        BookingResponseDTO response = bookingService.updateBooking(bookingId, GUEST_ID, updateRequest);

        // then
        assertThat(response.getTopic()).isEqualTo(newTopic);
        assertThat(response.getDescription()).isEqualTo(newDescription);
        assertThat(response.getBookingDate()).isEqualTo(newBookingDate);
    }

    @Test
    @DisplayName("실패: 호스트가 게스트용 수정 API로 수정 시도")
    void updateBookingFailWhenHostTriesToUpdate() {
        // given
        Long bookingId = 1L;
        TimeSlot mockTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(mockTimeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(mockTimeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingUpdateRequestDTO updateRequest = BookingUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(FUTURE_DATE)
            .topic("새 주제")
            .description("새 설명")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBooking(bookingId, HOST_ID, updateRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 다른 게스트가 수정 시도")
    void updateBookingFailWhenOtherGuestTriesToUpdate() {
        // given
        Long bookingId = 1L;
        UUID otherGuestId = UUID.randomUUID();
        TimeSlot mockTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(mockTimeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(mockTimeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingUpdateRequestDTO updateRequest = BookingUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(FUTURE_DATE)
            .topic("새 주제")
            .description("새 설명")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBooking(bookingId, otherGuestId, updateRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 수정 시도")
    void updateBookingFailWhenBookingNotFound() {
        // given
        Long bookingId = 999L;
        given(bookingRepository.findById(bookingId)).willReturn(Optional.empty());

        BookingUpdateRequestDTO updateRequest = BookingUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(FUTURE_DATE)
            .topic("새 주제")
            .description("새 설명")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBooking(bookingId, GUEST_ID, updateRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 과거 날짜로 예약 수정 시도")
    void updateBookingFailWhenPastDate() {
        // given
        Long bookingId = 1L;
        TimeSlot mockTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(mockTimeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(mockTimeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        BookingUpdateRequestDTO updateRequest = BookingUpdateRequestDTO.builder()
            .timeSlotId(TIME_SLOT_ID)
            .bookingDate(PAST_DATE)
            .topic("새 주제")
            .description("새 설명")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBooking(bookingId, GUEST_ID, updateRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAST_BOOKING);
    }

    @Test
    @DisplayName("실패: 다른 호스트의 타임슬롯으로 예약 수정 시도")
    void updateBookingFailWhenTimeSlotBelongsToOtherHost() {
        // given
        Long bookingId = 1L;
        Long newTimeSlotId = 2L;
        UUID otherHostId = UUID.randomUUID();

        TimeSlot originalTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(originalTimeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(originalTimeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        TimeSlot otherHostTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(otherHostTimeSlot.getUserId()).willReturn(otherHostId);
        given(timeSlotRepository.findById(newTimeSlotId)).willReturn(Optional.of(otherHostTimeSlot));

        BookingUpdateRequestDTO updateRequest = BookingUpdateRequestDTO.builder()
            .timeSlotId(newTimeSlotId)
            .bookingDate(FUTURE_DATE)
            .topic("새 주제")
            .description("새 설명")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.updateBooking(bookingId, GUEST_ID, updateRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    // ===== 날짜 범위 검증 테스트 (Issue #240) =====

    @Test
    @DisplayName("실패: 타임슬롯 날짜 범위 밖 예약 시 실패")
    void createBookingFailWhenDateOutOfRange() {
        // given
        LocalDate startDate = FUTURE_DATE.plusDays(10);
        LocalDate endDate = FUTURE_DATE.plusDays(20);

        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartDate()).willReturn(startDate);
        given(timeSlot.getEndDate()).willReturn(endDate);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));

        // when & then - FUTURE_DATE는 startDate보다 이전이므로 범위 밖
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_DATE_OUT_OF_RANGE);
    }

    @Test
    @DisplayName("성공: 타임슬롯 날짜 범위가 null(무기한)이면 예약 가능")
    void createBookingSuccessWhenNoDateRange() {
        // given
        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getStartDate()).willReturn(null);
        given(timeSlot.getEndDate()).willReturn(null);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response.getTimeSlotId()).isEqualTo(TIME_SLOT_ID);
    }

    @Test
    @DisplayName("성공: 예약 날짜가 타임슬롯 시작일과 같으면 예약 가능 (경계값)")
    void createBookingSuccessWhenDateEqualsStartDate() {
        // given
        LocalDate startDate = FUTURE_DATE;
        LocalDate endDate = FUTURE_DATE.plusDays(10);

        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getStartDate()).willReturn(startDate);
        given(timeSlot.getEndDate()).willReturn(endDate);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response.getBookingDate()).isEqualTo(FUTURE_DATE);
    }

    @Test
    @DisplayName("성공: 예약 날짜가 타임슬롯 종료일과 같으면 예약 가능 (경계값)")
    void createBookingSuccessWhenDateEqualsEndDate() {
        // given
        LocalDate endDate = FUTURE_DATE;
        LocalDate startDate = FUTURE_DATE.minusDays(10);

        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlot.getStartDate()).willReturn(startDate);
        given(timeSlot.getEndDate()).willReturn(endDate);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response.getBookingDate()).isEqualTo(FUTURE_DATE);
    }

    @Test
    @DisplayName("실패: 예약 날짜가 타임슬롯 종료일 다음날이면 범위 밖")
    void createBookingFailWhenDateIsOneDayAfterEndDate() {
        // given
        LocalDate startDate = FUTURE_DATE.minusDays(10);
        LocalDate endDate = FUTURE_DATE.minusDays(1);

        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartDate()).willReturn(startDate);
        given(timeSlot.getEndDate()).willReturn(endDate);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_DATE_OUT_OF_RANGE);
    }

    @Test
    @DisplayName("실패: 예약 날짜가 타임슬롯 시작일 전날이면 범위 밖")
    void createBookingFailWhenDateIsOneDayBeforeStartDate() {
        // given
        LocalDate startDate = FUTURE_DATE.plusDays(1);
        LocalDate endDate = FUTURE_DATE.plusDays(10);

        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartDate()).willReturn(startDate);
        given(timeSlot.getEndDate()).willReturn(endDate);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guestMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_DATE_OUT_OF_RANGE);
    }

    // ===== Google Calendar 연동 테스트 (Issue #63) =====

    @Test
    @DisplayName("성공: 예약 생성 시 Google Calendar 이벤트가 생성된다")
    void createBookingWithGoogleCalendarEvent() {
        // given
        String googleCalendarId = "test-calendar-id@group.calendar.google.com";
        String googleEventId = "created-event-id";

        given(guestMember.getId()).willReturn(GUEST_ID);
        given(guestMember.getDisplayName()).willReturn("홍길동");
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));
        given(memberRepository.findById(GUEST_ID)).willReturn(Optional.of(guestMember));

        Calendar calendar = Calendar.create(HOST_ID, List.of("topic"), "desc", googleCalendarId);
        given(calendarRepository.findById(HOST_ID)).willReturn(Optional.of(calendar));
        given(googleCalendarService.createEvent(
            anyString(), anyString(), any(), any(), eq(googleCalendarId)
        )).willReturn(googleEventId);

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response.getGoogleEventId()).isEqualTo(googleEventId);
        verify(googleCalendarService).createEvent(
            eq("홍길동님과의 미팅"), anyString(), any(), any(), eq(googleCalendarId)
        );
    }

    @Test
    @DisplayName("성공: 호스트 캘린더가 없어도 예약은 정상 생성된다")
    void createBookingWithoutCalendar() {
        // given
        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));
        given(calendarRepository.findById(HOST_ID)).willReturn(Optional.empty());

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response.getGoogleEventId()).isNull();
        verify(googleCalendarService, never()).createEvent(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("성공: 예약 수정 시 Google Calendar 이벤트가 업데이트된다")
    void updateBookingScheduleWithGoogleCalendarUpdate() {
        // given
        Long bookingId = 1L;
        LocalDate newDate = FUTURE_DATE.plusDays(7);
        Long newTimeSlotId = 2L;
        String googleCalendarId = "test-calendar-id@group.calendar.google.com";
        String googleEventId = "existing-event-id";

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        booking.setGoogleEventId(googleEventId);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        given(guestMember.getDisplayName()).willReturn("홍길동");
        given(memberRepository.findById(GUEST_ID)).willReturn(Optional.of(guestMember));

        TimeSlot newTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(newTimeSlot.getId()).willReturn(newTimeSlotId);
        given(newTimeSlot.getUserId()).willReturn(HOST_ID);
        given(newTimeSlot.getWeekdays()).willReturn(List.of(newDate.getDayOfWeek().getValue() % 7));
        given(newTimeSlot.getStartTime()).willReturn(LocalTime.of(14, 0));
        given(newTimeSlot.getEndTime()).willReturn(LocalTime.of(15, 0));
        given(timeSlotRepository.findById(newTimeSlotId)).willReturn(Optional.of(newTimeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(newTimeSlot), eq(newDate), any(), eq(bookingId)
        )).willReturn(false);

        Calendar calendar = Calendar.create(HOST_ID, List.of("topic"), "desc", googleCalendarId);
        given(calendarRepository.findById(HOST_ID)).willReturn(Optional.of(calendar));
        given(googleCalendarService.updateEvent(
            eq(googleEventId), anyString(), anyString(), any(), any(), eq(googleCalendarId)
        )).willReturn(true);

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(newTimeSlotId)
            .bookingDate(newDate)
            .build();

        // when
        bookingService.updateBookingSchedule(bookingId, HOST_ID, request);

        // then
        verify(googleCalendarService).updateEvent(
            eq(googleEventId), eq("홍길동님과의 미팅"), anyString(), any(), any(), eq(googleCalendarId)
        );
    }

    @Test
    @DisplayName("성공: 예약 취소 시 Google Calendar 이벤트가 삭제된다")
    void cancelBookingWithGoogleCalendarDelete() {
        // given
        Long bookingId = 1L;
        String googleCalendarId = "test-calendar-id@group.calendar.google.com";
        String googleEventId = "event-to-delete";
        LocalDate futureBookingDate = LocalDate.now().plusDays(3);

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, futureBookingDate, TEST_TOPIC, TEST_DESCRIPTION);
        booking.setGoogleEventId(googleEventId);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        Calendar calendar = Calendar.create(HOST_ID, List.of("topic"), "desc", googleCalendarId);
        given(calendarRepository.findById(HOST_ID)).willReturn(Optional.of(calendar));
        given(googleCalendarService.deleteEvent(eq(googleEventId), eq(googleCalendarId))).willReturn(true);

        // when
        bookingService.cancelBooking(bookingId, GUEST_ID);

        // then
        verify(googleCalendarService).deleteEvent(eq(googleEventId), eq(googleCalendarId));
    }

    @Test
    @DisplayName("성공: googleEventId가 없으면 Google Calendar 삭제를 호출하지 않는다")
    void cancelBookingWithoutGoogleEventId() {
        // given
        Long bookingId = 1L;
        LocalDate futureBookingDate = LocalDate.now().plusDays(3);

        Booking booking = Booking.create(timeSlot, GUEST_ID, futureBookingDate, TEST_TOPIC, TEST_DESCRIPTION);
        // googleEventId is null
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        // when
        bookingService.cancelBooking(bookingId, GUEST_ID);

        // then
        verify(googleCalendarService, never()).deleteEvent(any(), any());
    }

    @Test
    @DisplayName("성공: Google Calendar API 실패해도 예약은 정상 생성된다")
    void createBookingSucceedsWhenGoogleCalendarFails() {
        // given
        String googleCalendarId = "test-calendar-id@group.calendar.google.com";

        given(guestMember.getId()).willReturn(GUEST_ID);
        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getWeekdays()).willReturn(List.of(FUTURE_DATE.getDayOfWeek().getValue() % 7));
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(timeSlot.getEndTime()).willReturn(LocalTime.of(11, 0));
        given(timeSlot.getId()).willReturn(TIME_SLOT_ID);
        given(timeSlotRepository.findById(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(timeSlot), eq(FUTURE_DATE), any(), isNull()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));
        given(memberRepository.findById(GUEST_ID)).willReturn(Optional.of(guestMember));

        Calendar calendar = Calendar.create(HOST_ID, List.of("topic"), "desc", googleCalendarId);
        given(calendarRepository.findById(HOST_ID)).willReturn(Optional.of(calendar));
        // Google Calendar API 실패 (null 반환)
        given(googleCalendarService.createEvent(
            anyString(), anyString(), any(), any(), eq(googleCalendarId)
        )).willReturn(null);

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then - 예약은 정상 생성되고 googleEventId만 null
        assertThat(response.getTopic()).isEqualTo(TEST_TOPIC);
        assertThat(response.getGoogleEventId()).isNull();
    }

    @Test
    @DisplayName("성공: Google Calendar 업데이트 실패해도 예약 수정은 정상 완료된다")
    void updateBookingScheduleSucceedsWhenGoogleCalendarUpdateFails() {
        // given
        Long bookingId = 1L;
        LocalDate newDate = FUTURE_DATE.plusDays(7);
        Long newTimeSlotId = 2L;
        String googleCalendarId = "test-calendar-id@group.calendar.google.com";
        String googleEventId = "existing-event-id";

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, FUTURE_DATE, TEST_TOPIC, TEST_DESCRIPTION);
        booking.setGoogleEventId(googleEventId);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        given(memberRepository.findById(GUEST_ID)).willReturn(Optional.of(guestMember));

        TimeSlot newTimeSlot = org.mockito.Mockito.mock(TimeSlot.class);
        given(newTimeSlot.getId()).willReturn(newTimeSlotId);
        given(newTimeSlot.getUserId()).willReturn(HOST_ID);
        given(newTimeSlot.getWeekdays()).willReturn(List.of(newDate.getDayOfWeek().getValue() % 7));
        given(newTimeSlot.getStartTime()).willReturn(LocalTime.of(14, 0));
        given(newTimeSlot.getEndTime()).willReturn(LocalTime.of(15, 0));
        given(timeSlotRepository.findById(newTimeSlotId)).willReturn(Optional.of(newTimeSlot));
        given(bookingRepository.existsDuplicateBooking(
            eq(newTimeSlot), eq(newDate), any(), eq(bookingId)
        )).willReturn(false);

        Calendar calendar = Calendar.create(HOST_ID, List.of("topic"), "desc", googleCalendarId);
        given(calendarRepository.findById(HOST_ID)).willReturn(Optional.of(calendar));
        // Google Calendar 업데이트 실패
        given(googleCalendarService.updateEvent(
            eq(googleEventId), anyString(), anyString(), any(), any(), eq(googleCalendarId)
        )).willReturn(false);

        BookingScheduleUpdateRequestDTO request = BookingScheduleUpdateRequestDTO.builder()
            .timeSlotId(newTimeSlotId)
            .bookingDate(newDate)
            .build();

        // when
        BookingResponseDTO response = bookingService.updateBookingSchedule(bookingId, HOST_ID, request);

        // then - 예약 수정은 정상 완료
        assertThat(response.getTimeSlotId()).isEqualTo(newTimeSlotId);
        assertThat(response.getBookingDate()).isEqualTo(newDate);
    }

    @Test
    @DisplayName("성공: Google Calendar 삭제 실패해도 예약 취소는 정상 완료된다")
    void cancelBookingSucceedsWhenGoogleCalendarDeleteFails() {
        // given
        Long bookingId = 1L;
        String googleCalendarId = "test-calendar-id@group.calendar.google.com";
        String googleEventId = "event-to-delete";
        LocalDate futureBookingDate = LocalDate.now().plusDays(3);

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        Booking booking = Booking.create(timeSlot, GUEST_ID, futureBookingDate, TEST_TOPIC, TEST_DESCRIPTION);
        booking.setGoogleEventId(googleEventId);
        given(bookingRepository.findById(bookingId)).willReturn(Optional.of(booking));

        Calendar calendar = Calendar.create(HOST_ID, List.of("topic"), "desc", googleCalendarId);
        given(calendarRepository.findById(HOST_ID)).willReturn(Optional.of(calendar));
        // Google Calendar 삭제 실패
        given(googleCalendarService.deleteEvent(eq(googleEventId), eq(googleCalendarId))).willReturn(false);

        // when
        bookingService.cancelBooking(bookingId, GUEST_ID);

        // then - 예약 취소는 정상 완료
        assertThat(booking.getAttendanceStatus()).isEqualTo(AttendanceStatus.CANCELLED);
    }
}
