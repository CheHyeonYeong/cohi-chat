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

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
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
    private static final List<Integer> TEST_WEEKDAYS = List.of(0, 1, 2); // 일, 월, 화

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private CalendarRepository calendarRepository;

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
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any(), anyList(), any(), any()))
            .willReturn(List.of());
        given(timeSlotRepository.save(any(TimeSlot.class))).willAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("성공: 호스트가 유효한 타임슬롯을 생성할 수 있다")
    void createTimeSlotSuccess() {
        // given
        givenSuccessfulCreateMocks();

        // when
        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(hostMember, requestDTO);

        // then
        assertThat(response)
            .extracting("startTime", "endTime")
            .containsExactly(TEST_START_TIME, TEST_END_TIME);
        assertThat(response.getWeekdays()).containsExactlyInAnyOrderElementsOf(TEST_WEEKDAYS);
    }

    @Test
    @DisplayName("실패: 게스트는 타임슬롯을 생성할 수 없다")
    void createTimeSlotFailWhenGuest() {
        // given
        given(hostMember.getRole()).willReturn(Role.GUEST);

        // when & then
        assertThatThrownBy(() -> timeSlotService.createTimeSlot(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.GUEST_ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 캘린더가 없으면 타임슬롯을 생성할 수 없다")
    void createTimeSlotFailWhenCalendarNotFound() {
        // given
        givenHostMember();
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> timeSlotService.createTimeSlot(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 겹치는 시간대가 있으면 타임슬롯을 생성할 수 없다")
    void createTimeSlotFailWhenOverlapping() {
        // given
        givenHostMember();
        givenCalendarExists();

        TimeSlot existingTimeSlot = TimeSlot.create(
            TEST_USER_ID,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any(), anyList(), any(), any()))
            .willReturn(List.of(existingTimeSlot));

        // when & then
        assertThatThrownBy(() -> timeSlotService.createTimeSlot(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TIMESLOT_OVERLAP);
    }

    @Test
    @DisplayName("성공: 겹침 체크 시 요청한 weekdays가 Repository에 전달된다")
    void createTimeSlotPassesWeekdaysToRepository() {
        // given
        givenHostMember();
        givenCalendarExists();

        List<Integer> requestWeekdays = List.of(3, 4); // 목, 금
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(requestWeekdays)
            .build();

        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any(), anyList(), any(), any()))
            .willReturn(List.of());
        given(timeSlotRepository.save(any(TimeSlot.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        timeSlotService.createTimeSlot(hostMember, request);

        // then - Repository에 올바른 weekdays가 전달되었는지 검증
        then(timeSlotRepository).should().findOverlappingTimeSlots(
            eq(TEST_USER_ID),
            eq(TEST_START_TIME),
            eq(TEST_END_TIME),
            eq(requestWeekdays),
            any(),
            any()
        );
    }

    @Test
    @DisplayName("성공: 호스트의 타임슬롯 목록 조회")
    void getTimeSlotsByHostSuccess() {
        // given
        givenHostMember();
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.of(calendar));

        TimeSlot timeSlot1 = TimeSlot.create(TEST_USER_ID, LocalTime.of(10, 0), LocalTime.of(11, 0), List.of(0));
        TimeSlot timeSlot2 = TimeSlot.create(TEST_USER_ID, LocalTime.of(14, 0), LocalTime.of(15, 0), List.of(1));
        given(timeSlotRepository.findByUserIdOrderByStartTimeAsc(TEST_USER_ID)).willReturn(List.of(timeSlot1, timeSlot2));

        // when
        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHost(hostMember);

        // then
        assertThat(response).hasSize(2);
    }

    // ===== 날짜 범위 지정 테스트 =====

    @Test
    @DisplayName("성공: 날짜 범위가 지정된 타임슬롯 생성")
    void createTimeSlotWithDateRangeSuccess() {
        // given
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

        // when
        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(hostMember, request);

        // then
        assertThat(response.getStartDate()).isEqualTo(startDate);
        assertThat(response.getEndDate()).isEqualTo(endDate);
    }

    @Test
    @DisplayName("성공: 날짜 범위 없이(무기한) 타임슬롯 생성")
    void createTimeSlotWithoutDateRangeSuccess() {
        // given
        givenSuccessfulCreateMocks();

        // when
        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(hostMember, requestDTO);

        // then
        assertThat(response.getStartDate()).isNull();
        assertThat(response.getEndDate()).isNull();
    }
}
