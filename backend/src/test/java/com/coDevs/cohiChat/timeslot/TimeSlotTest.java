package com.coDevs.cohiChat.timeslot;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

class TimeSlotTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final LocalTime TEST_START_TIME = LocalTime.of(10, 0);
    private static final LocalTime TEST_END_TIME = LocalTime.of(11, 0);
    private static final List<Integer> TEST_WEEKDAYS = List.of(0, 1, 2); // 월, 화, 수

    @Test
    @DisplayName("성공: 모든 필수 항목이 존재하면 타임슬롯 생성")
    void createTimeSlotSuccess() {
        // when
        TimeSlot timeSlot = TimeSlot.create(
            TEST_USER_ID,
            TEST_START_TIME,
            TEST_END_TIME,
            TEST_WEEKDAYS
        );

        // then
        assertThat(timeSlot.getUserId()).isEqualTo(TEST_USER_ID);
        assertThat(timeSlot.getStartTime()).isEqualTo(TEST_START_TIME);
        assertThat(timeSlot.getEndTime()).isEqualTo(TEST_END_TIME);
        assertThat(timeSlot.getWeekdays()).isEqualTo(TEST_WEEKDAYS);
    }

    @Test
    @DisplayName("성공: weekdays가 리스트로 저장됨")
    void weekdaysAsList() {
        // given
        List<Integer> weekdays = List.of(0, 3, 5); // 월, 목, 토

        // when
        TimeSlot timeSlot = TimeSlot.create(
            TEST_USER_ID,
            TEST_START_TIME,
            TEST_END_TIME,
            weekdays
        );

        // then
        assertThat(timeSlot.getWeekdays()).hasSize(3);
        assertThat(timeSlot.getWeekdays()).containsExactlyInAnyOrder(0, 3, 5);
    }

    @Test
    @DisplayName("성공: weekdayEntities가 생성됨")
    void weekdayEntitiesCreated() {
        // given
        List<Integer> weekdays = List.of(0, 1, 2);

        // when
        TimeSlot timeSlot = TimeSlot.create(
            TEST_USER_ID,
            TEST_START_TIME,
            TEST_END_TIME,
            weekdays
        );

        // then
        assertThat(timeSlot.getWeekdayEntities()).hasSize(3);
        assertThat(timeSlot.getWeekdayEntities())
            .allMatch(w -> w.getTimeSlot() == timeSlot);
    }
}
