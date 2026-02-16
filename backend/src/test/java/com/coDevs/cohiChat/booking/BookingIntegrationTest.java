package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.request.BookingCreateRequestDTO;
import com.coDevs.cohiChat.booking.response.BookingResponseDTO;
import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@SpringBootTest
@ActiveProfiles("test")
@Import(com.coDevs.cohiChat.config.EmbeddedRedisConfig.class)
@Transactional
class BookingIntegrationTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private CalendarRepository calendarRepository;

    @Autowired
    private MemberRepository memberRepository;

    private Member host;
    private Member guest;
    private TimeSlot timeSlot;
    private LocalDate futureMonday;

    @BeforeEach
    void setUp() {
        // 호스트 생성
        host = Member.create(
            "testhost",
            "Test Host",
            "host@test.com",
            "encodedPassword",
            Role.HOST
        );
        host = memberRepository.save(host);

        // 게스트 생성
        guest = Member.create(
            "testguest",
            "Test Guest",
            "guest@test.com",
            "encodedPassword",
            Role.GUEST
        );
        guest = memberRepository.save(guest);

        // 호스트 캘린더 생성 (테스트에서 사용하는 모든 topic 포함)
        Calendar calendar = Calendar.create(
            host.getId(),
            List.of("커리어 상담", "프로젝트 상담", "첫 번째 상담", "두 번째 상담", "재예약 상담"),
            "게스트에게 보여줄 설명입니다.",
            "test@group.calendar.google.com"
        );
        calendarRepository.save(calendar);

        // 타임슬롯 생성 (월,화,수 10:00-11:00)
        timeSlot = TimeSlot.create(
            host.getId(),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2) // 월, 화, 수 (일요일=0 기준이면 월=1이지만, Java DayOfWeek 기준 월=1, % 7 = 1)
        );
        timeSlot = timeSlotRepository.save(timeSlot);

        // 다음 월요일 찾기 (DayOfWeek.MONDAY = 1, % 7 = 1)
        LocalDate today = LocalDate.now();
        int daysUntilMonday = (8 - today.getDayOfWeek().getValue()) % 7;
        if (daysUntilMonday == 0) daysUntilMonday = 7;
        futureMonday = today.plusDays(daysUntilMonday);
    }

    @Test
    @DisplayName("통합 테스트: 예약 생성 성공")
    void createBookingSuccess() {
        // given
        BookingCreateRequestDTO request = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureMonday)
            .topic("프로젝트 상담")
            .description("Spring Boot 프로젝트 관련 질문")
            .build();

        // when
        BookingResponseDTO response = bookingService.createBooking(guest, request);

        // then
        assertThat(response.getId()).isNotNull();
        assertThat(response.getTimeSlotId()).isEqualTo(timeSlot.getId());
        assertThat(response.getGuestId()).isEqualTo(guest.getId());
        assertThat(response.getBookingDate()).isEqualTo(futureMonday);
        assertThat(response.getTopic()).isEqualTo("프로젝트 상담");
        assertThat(response.getDescription()).isEqualTo("Spring Boot 프로젝트 관련 질문");
        assertThat(response.getAttendanceStatus()).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThat(response.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("통합 테스트: 자기 자신 예약 시 SELF_BOOKING 예외")
    void createBookingFailSelfBooking() {
        // given
        BookingCreateRequestDTO request = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureMonday)
            .topic("프로젝트 상담")
            .description("자기 자신에게 예약 시도")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(host, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SELF_BOOKING);
    }

    @Test
    @DisplayName("통합 테스트: 과거 날짜 예약 시 PAST_BOOKING 예외")
    void createBookingFailPastBooking() {
        // given
        BookingCreateRequestDTO request = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(LocalDate.now().minusDays(1))
            .topic("프로젝트 상담")
            .description("과거 날짜에 예약 시도")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guest, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAST_BOOKING);
    }

    @Test
    @DisplayName("통합 테스트: 중복 예약 시 BOOKING_ALREADY_EXISTS 예외")
    void createBookingFailDuplicateBooking() {
        // given - 첫 번째 예약 생성
        BookingCreateRequestDTO firstRequest = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureMonday)
            .topic("첫 번째 상담")
            .description("첫 번째 예약")
            .build();
        bookingService.createBooking(guest, firstRequest);

        // 다른 게스트 생성
        Member anotherGuest = Member.create(
            "anotherguest",
            "Another Guest",
            "another@test.com",
            "encodedPassword",
            Role.GUEST
        );
        anotherGuest = memberRepository.save(anotherGuest);

        // when - 같은 날짜, 같은 타임슬롯에 두 번째 예약 시도
        BookingCreateRequestDTO secondRequest = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureMonday)
            .topic("두 번째 상담")
            .description("두 번째 예약 시도")
            .build();

        // then
        Member finalAnotherGuest = anotherGuest;
        assertThatThrownBy(() -> bookingService.createBooking(finalAnotherGuest, secondRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("통합 테스트: 존재하지 않는 타임슬롯에 예약 시 TIMESLOT_NOT_FOUND 예외")
    void createBookingFailTimeSlotNotFound() {
        // given
        BookingCreateRequestDTO request = BookingCreateRequestDTO.builder()
            .timeSlotId(999L)
            .bookingDate(futureMonday)
            .topic("프로젝트 상담")
            .description("존재하지 않는 타임슬롯")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guest, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TIMESLOT_NOT_FOUND);
    }

    @Test
    @DisplayName("통합 테스트: 타임슬롯에 없는 요일에 예약 시 WEEKDAY_NOT_AVAILABLE 예외")
    void createBookingFailWeekdayNotAvailable() {
        // given - 토요일에 예약 시도 (타임슬롯은 월,화,수만 가능)
        LocalDate today = LocalDate.now();
        int daysUntilSaturday = (13 - today.getDayOfWeek().getValue()) % 7; // 토요일 = 6
        if (daysUntilSaturday == 0) daysUntilSaturday = 7;
        LocalDate futureSaturday = today.plusDays(daysUntilSaturday);

        BookingCreateRequestDTO request = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureSaturday)
            .topic("프로젝트 상담")
            .description("토요일에 예약 시도")
            .build();

        // when & then
        assertThatThrownBy(() -> bookingService.createBooking(guest, request))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WEEKDAY_NOT_AVAILABLE);
    }

    @Test
    @DisplayName("통합 테스트: 같은 타임슬롯 다른 날짜에는 예약 가능")
    void createBookingSuccessDifferentDates() {
        // given - 첫 번째 예약
        BookingCreateRequestDTO firstRequest = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureMonday)
            .topic("첫 번째 상담")
            .description("첫 번째 예약")
            .build();
        bookingService.createBooking(guest, firstRequest);

        // 다음 주 월요일에 두 번째 예약
        LocalDate nextMonday = futureMonday.plusWeeks(1);
        BookingCreateRequestDTO secondRequest = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(nextMonday)
            .topic("두 번째 상담")
            .description("다음 주 월요일 예약")
            .build();

        // when
        BookingResponseDTO response = bookingService.createBooking(guest, secondRequest);

        // then
        assertThat(response.getId()).isNotNull();
        assertThat(response.getBookingDate()).isEqualTo(nextMonday);
    }

    @Test
    @DisplayName("통합 테스트: 취소된 예약이 있는 시간대에 재예약 가능")
    void createBookingSuccessAfterCancellation() {
        // given - 첫 번째 예약 생성 후 취소
        BookingCreateRequestDTO firstRequest = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureMonday)
            .topic("첫 번째 상담")
            .description("첫 번째 예약 - 취소 예정")
            .build();
        BookingResponseDTO firstResponse = bookingService.createBooking(guest, firstRequest);

        // 예약 취소
        var cancelledBooking = bookingRepository.findById(firstResponse.getId()).orElseThrow();
        cancelledBooking.cancel();
        bookingRepository.save(cancelledBooking);

        // 다른 게스트 생성
        Member anotherGuest = Member.create(
            "rebookguest",
            "Rebook Guest",
            "rebook@test.com",
            "encodedPassword",
            Role.GUEST
        );
        anotherGuest = memberRepository.save(anotherGuest);

        // when - 같은 날짜, 같은 타임슬롯에 새 예약 생성
        BookingCreateRequestDTO rebookRequest = BookingCreateRequestDTO.builder()
            .timeSlotId(timeSlot.getId())
            .bookingDate(futureMonday)
            .topic("재예약 상담")
            .description("취소 후 재예약")
            .build();
        BookingResponseDTO rebookResponse = bookingService.createBooking(anotherGuest, rebookRequest);

        // then
        assertThat(rebookResponse.getId()).isNotNull();
        assertThat(rebookResponse.getId()).isNotEqualTo(firstResponse.getId());
        assertThat(rebookResponse.getBookingDate()).isEqualTo(futureMonday);
        assertThat(rebookResponse.getAttendanceStatus()).isEqualTo(AttendanceStatus.SCHEDULED);

        // DB에 2개의 예약이 존재하는지 확인 (취소된 것 + 새 예약)
        assertThat(bookingRepository.count()).isEqualTo(2);
    }
}
