package com.coDevs.cohiChat.timeslot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

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
    private static final List<Integer> TEST_WEEKDAYS = List.of(0, 1, 2); // 월, 화, 수

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
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any()))
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
            .extracting("startTime", "endTime", "weekdays")
            .containsExactly(TEST_START_TIME, TEST_END_TIME, TEST_WEEKDAYS);
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
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any()))
            .willReturn(List.of(existingTimeSlot));

        // when & then
        assertThatThrownBy(() -> timeSlotService.createTimeSlot(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TIMESLOT_OVERLAP);
    }

    @Test
    @DisplayName("성공: 시간이 겹쳐도 요일이 다르면 타임슬롯 생성 가능")
    void createTimeSlotSuccessWhenDifferentWeekdays() {
        // given
        givenHostMember();
        givenCalendarExists();

        // 기존 타임슬롯: 월,화,수 10:00-11:00
        TimeSlot existingTimeSlot = TimeSlot.create(
            TEST_USER_ID,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        given(timeSlotRepository.findOverlappingTimeSlots(any(), any(), any()))
            .willReturn(List.of(existingTimeSlot));

        // 새 타임슬롯: 목,금 10:00-11:00 (요일이 다름)
        TimeSlotCreateRequestDTO differentWeekdaysRequest = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(List.of(3, 4)) // 목, 금
            .build();

        given(timeSlotRepository.save(any(TimeSlot.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(hostMember, differentWeekdaysRequest);

        // then
        assertThat(response.getWeekdays()).containsExactly(3, 4);
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
}
