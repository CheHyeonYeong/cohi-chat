package com.coDevs.cohiChat.timeslot;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

class TimeSlotTest {

    private static final UUID TEST_CALENDAR_ID = UUID.randomUUID();
    private static final LocalTime TEST_START_TIME = LocalTime.of(10, 0);
    private static final LocalTime TEST_END_TIME = LocalTime.of(11, 0);
    private static final List<Integer> TEST_WEEKDAYS = List.of(0, 1, 2); // 월, 화, 수

    @Test
    @DisplayName("성공: 모든 필수 항목이 존재하면 타임슬롯 생성")
    void createTimeSlotSuccess() {
        // when
        TimeSlot timeSlot = TimeSlot.create(
            TEST_CALENDAR_ID,
            TEST_START_TIME,
            TEST_END_TIME,
            TEST_WEEKDAYS
        );

        // then
        assertThat(timeSlot.getCalendarId()).isEqualTo(TEST_CALENDAR_ID);
        assertThat(timeSlot.getStartTime()).isEqualTo(TEST_START_TIME);
        assertThat(timeSlot.getEndTime()).isEqualTo(TEST_END_TIME);
        assertThat(timeSlot.getWeekdays()).isEqualTo(TEST_WEEKDAYS);
    }

    @Test
    @DisplayName("성공: weekdays가 JSON 리스트로 저장됨")
    void weekdaysAsJsonList() {
        // given
        List<Integer> weekdays = List.of(0, 3, 5); // 월, 목, 토

        // when
        TimeSlot timeSlot = TimeSlot.create(
            TEST_CALENDAR_ID,
            TEST_START_TIME,
            TEST_END_TIME,
            weekdays
        );

        // then
        assertThat(timeSlot.getWeekdays()).hasSize(3);
        assertThat(timeSlot.getWeekdays()).containsExactly(0, 3, 5);
    }

    @Test
    @DisplayName("성공: 시간대 겹침 여부 확인 - 겹침")
    void isOverlappingTrue() {
        // given
        TimeSlot existingSlot = TimeSlot.create(
            TEST_CALENDAR_ID,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );

        // when & then - 시간이 겹치고 요일도 겹침
        assertThat(existingSlot.isOverlapping(
            LocalTime.of(10, 30),
            LocalTime.of(11, 30),
            List.of(0)
        )).isTrue();

        // 시간이 겹치고 요일도 겹침 (왼쪽 경계)
        assertThat(existingSlot.isOverlapping(
            LocalTime.of(9, 30),
            LocalTime.of(10, 30),
            List.of(1)
        )).isTrue();

        // 요일이 일부만 겹침 (월,화,수 vs 수,목,금 - 수요일 겹침)
        assertThat(existingSlot.isOverlapping(
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(2, 3, 4)
        )).isTrue();

        // 시간이 부분적으로 겹침 (10:00-11:00 vs 10:30-11:30)
        assertThat(existingSlot.isOverlapping(
            LocalTime.of(10, 30),
            LocalTime.of(11, 30),
            List.of(0, 1, 2)
        )).isTrue();
    }

    @Test
    @DisplayName("성공: 시간대 겹침 여부 확인 - 겹치지 않음")
    void isOverlappingFalse() {
        // given
        TimeSlot existingSlot = TimeSlot.create(
            TEST_CALENDAR_ID,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );

        // when & then - 시간이 겹치지 않음
        assertThat(existingSlot.isOverlapping(
            LocalTime.of(11, 0),
            LocalTime.of(12, 0),
            List.of(0)
        )).isFalse();

        // 시간이 겹치지만 요일이 다름
        assertThat(existingSlot.isOverlapping(
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(3, 4) // 목, 금
        )).isFalse();
    }
}
