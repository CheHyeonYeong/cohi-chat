package com.coDevs.cohiChat.timeslot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

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
import org.springframework.test.util.ReflectionTestUtils;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;
import com.coDevs.cohiChat.timeslot.request.TimeSlotCreateRequestDTO;
import com.coDevs.cohiChat.timeslot.response.TimeSlotResponseDTO;

@ExtendWith(MockitoExtension.class)
class TimeSlotServiceTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final LocalTime TEST_START_TIME = LocalTime.of(10, 0);
    private static final LocalTime TEST_END_TIME = LocalTime.of(11, 0);
    private static final List<Integer> TEST_WEEKDAYS = List.of(0, 1, 2);

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CalendarRepository calendarRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private Member hostMember;

    @Mock
    private Calendar calendar;

    @InjectMocks
    private TimeSlotService timeSlotService;

    private TimeSlotCreateRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        requestDTO = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(TEST_WEEKDAYS)
            .build();
    }

    private void givenHostMember() {
        given(hostMember.getId()).willReturn(TEST_USER_ID);
        given(hostMember.getRole()).willReturn(Role.HOST);
    }

    private void givenCalendarExists() {
        given(calendar.getUserId()).willReturn(TEST_USER_ID);
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.of(calendar));
    }

    private void givenSuccessfulCreateMocks() {
        givenHostMember();
        givenCalendarExists();
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any(), any(), anyList(), any(), any()))
            .willReturn(List.of());
        given(timeSlotRepository.save(any(TimeSlot.class))).willAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("성공: 호스트가 유효한 타임슬롯을 생성할 수 있다")
    void createTimeSlotSuccess() {
        givenSuccessfulCreateMocks();

        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(hostMember, requestDTO);

        assertThat(response.getStartedAt()).isEqualTo(TEST_START_TIME);
        assertThat(response.getEndedAt()).isEqualTo(TEST_END_TIME);
        assertThat(response.getWeekdays()).containsExactlyInAnyOrderElementsOf(TEST_WEEKDAYS);
    }

    @Test
    @DisplayName("실패: 게스트는 타임슬롯을 생성할 수 없다")
    void createTimeSlotFailWhenGuest() {
        given(hostMember.getRole()).willReturn(Role.GUEST);

        assertThatThrownBy(() -> timeSlotService.createTimeSlot(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.GUEST_ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 캘린더가 없으면 타임슬롯을 생성할 수 없다")
    void createTimeSlotFailWhenCalendarNotFound() {
        givenHostMember();
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> timeSlotService.createTimeSlot(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 겹치는 시간대가 있으면 타임슬롯을 생성할 수 없다")
    void createTimeSlotFailWhenOverlapping() {
        givenHostMember();
        givenCalendarExists();

        TimeSlot existingTimeSlot = TimeSlot.create(
            TEST_USER_ID,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any(), any(), anyList(), any(), any()))
            .willReturn(List.of(existingTimeSlot));

        assertThatThrownBy(() -> timeSlotService.createTimeSlot(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TIMESLOT_OVERLAP);
    }

    @Test
    @DisplayName("성공: 겹침 체크 시 요청한 weekdays가 Repository에 전달된다")
    void createTimeSlotPassesWeekdaysToRepository() {
        givenHostMember();
        givenCalendarExists();

        List<Integer> requestWeekdays = List.of(3, 4);
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(requestWeekdays)
            .build();

        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any(), any(), anyList(), any(), any()))
            .willReturn(List.of());
        given(timeSlotRepository.save(any(TimeSlot.class))).willAnswer(invocation -> invocation.getArgument(0));

        timeSlotService.createTimeSlot(hostMember, request);

        then(timeSlotRepository).should().findOverlappingTimeSlots(
            eq(TEST_USER_ID),
            eq(null),
            eq(TEST_START_TIME),
            eq(TEST_END_TIME),
            eq(requestWeekdays),
            any(),
            any()
        );
    }

    @Test
    @DisplayName("성공: 호스트의 타임슬롯 목록을 조회한다")
    void getTimeSlotsByHostSuccess() {
        givenHostMember();
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.of(calendar));

        TimeSlot timeSlot1 = TimeSlot.create(TEST_USER_ID, LocalTime.of(10, 0), LocalTime.of(11, 0), List.of(0));
        TimeSlot timeSlot2 = TimeSlot.create(TEST_USER_ID, LocalTime.of(14, 0), LocalTime.of(15, 0), List.of(1));
        given(timeSlotRepository.findByUserIdOrderByStartTimeAsc(TEST_USER_ID)).willReturn(List.of(timeSlot1, timeSlot2));

        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHost(hostMember);

        assertThat(response).hasSize(2);
    }

    @Test
    @DisplayName("성공: 날짜 범위가 지정된 타임슬롯을 생성한다")
    void createTimeSlotWithDateRangeSuccess() {
        givenSuccessfulCreateMocks();
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(30);
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(TEST_WEEKDAYS)
            .startDate(startDate)
            .endDate(endDate)
            .build();

        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(hostMember, request);

        assertThat(response.getStartDate()).isEqualTo(startDate);
        assertThat(response.getEndDate()).isEqualTo(endDate);
    }

    @Test
    @DisplayName("성공: 날짜 범위 없이 타임슬롯을 생성한다")
    void createTimeSlotWithoutDateRangeSuccess() {
        givenSuccessfulCreateMocks();

        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(hostMember, requestDTO);

        assertThat(response.getStartDate()).isNull();
        assertThat(response.getEndDate()).isNull();
    }

    @Test
    @DisplayName("실패: 예약이 연결된 타임슬롯은 삭제할 수 없다")
    void deleteTimeSlotSoftDeletesTimeslot() {
        givenHostMember();
        TimeSlot existingTimeSlot = TimeSlot.create(TEST_USER_ID, TEST_START_TIME, TEST_END_TIME, TEST_WEEKDAYS);
        ReflectionTestUtils.setField(existingTimeSlot, "id", 1L);
        given(timeSlotRepository.findByIdWithLock(1L)).willReturn(Optional.of(existingTimeSlot));
        timeSlotService.deleteTimeSlot(hostMember, 1L);

        assertThat(existingTimeSlot.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("성공: 예약 이력이 있어도 타임슬롯은 수정되고 기존 예약 시간은 유지된다")
    void updateTimeSlotWithBookingsUpdatesInPlace() {
        givenHostMember();
        TimeSlot existingTimeSlot = TimeSlot.create(TEST_USER_ID, TEST_START_TIME, TEST_END_TIME, TEST_WEEKDAYS);
        ReflectionTestUtils.setField(existingTimeSlot, "id", 1L);
        Booking booking = Booking.create(existingTimeSlot, UUID.randomUUID(), LocalDate.now().plusDays(3), "주제", "설명");

        TimeSlotCreateRequestDTO updateRequest = TimeSlotCreateRequestDTO.builder()
            .startTime(LocalTime.of(11, 0))
            .endTime(LocalTime.of(12, 0))
            .weekdays(List.of(1, 3))
            .build();

        given(timeSlotRepository.findByIdWithLock(1L)).willReturn(Optional.of(existingTimeSlot));
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any(), any(), anyList(), any(), any()))
            .willReturn(List.of());

        TimeSlotResponseDTO response = timeSlotService.updateTimeSlot(hostMember, 1L, updateRequest);

        assertThat(existingTimeSlot.getStartTime()).isEqualTo(LocalTime.of(11, 0));
        assertThat(existingTimeSlot.getEndTime()).isEqualTo(LocalTime.of(12, 0));
        assertThat(existingTimeSlot.getWeekdays()).containsExactlyInAnyOrder(1, 3);
        assertThat(booking.getTimeSlot()).isSameAs(existingTimeSlot);
        assertThat(booking.getStartTime()).isEqualTo(TEST_START_TIME);
        assertThat(booking.getEndTime()).isEqualTo(TEST_END_TIME);
        assertThat(response.getStartedAt()).isEqualTo(LocalTime.of(11, 0));
        assertThat(response.getEndedAt()).isEqualTo(LocalTime.of(12, 0));
        assertThat(response.getStartDate()).isNull();
    }
}
