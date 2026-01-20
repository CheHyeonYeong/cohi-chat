package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

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

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.request.BookingCreateRequestDTO;
import com.coDevs.cohiChat.booking.response.BookingResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@ExtendWith(MockitoExtension.class)
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
    private Member guestMember;

    @Mock
    private TimeSlot timeSlot;

    @InjectMocks
    private BookingService bookingService;

    private BookingCreateRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
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
        given(timeSlotRepository.findByIdWithLock(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsByTimeSlotIdAndBookingDateAndAttendanceStatusNotIn(
            eq(TIME_SLOT_ID), eq(FUTURE_DATE), any()
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
        given(timeSlotRepository.findByIdWithLock(TIME_SLOT_ID)).willReturn(Optional.empty());

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
        given(timeSlotRepository.findByIdWithLock(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));

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
        given(timeSlotRepository.findByIdWithLock(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        given(bookingRepository.existsByTimeSlotIdAndBookingDateAndAttendanceStatusNotIn(
            eq(TIME_SLOT_ID), eq(FUTURE_DATE), any()
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
        given(timeSlotRepository.findByIdWithLock(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));

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
        given(timeSlotRepository.findByIdWithLock(TIME_SLOT_ID)).willReturn(Optional.of(timeSlot));
        // 취소된 예약만 존재하므로 중복 체크에서 false 반환
        given(bookingRepository.existsByTimeSlotIdAndBookingDateAndAttendanceStatusNotIn(
            eq(TIME_SLOT_ID), eq(FUTURE_DATE), any()
        )).willReturn(false);
        given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        BookingResponseDTO response = bookingService.createBooking(guestMember, requestDTO);

        // then
        assertThat(response)
            .extracting("timeSlotId", "guestId", "attendanceStatus")
            .containsExactly(TIME_SLOT_ID, GUEST_ID, AttendanceStatus.SCHEDULED);
    }
}
