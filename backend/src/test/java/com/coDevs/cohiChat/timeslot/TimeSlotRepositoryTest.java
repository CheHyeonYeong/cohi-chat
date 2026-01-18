package com.coDevs.cohiChat.timeslot;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TimeSlotRepositoryTest {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    private UUID calendarId;
    private TimeSlot savedTimeSlot;

    @BeforeEach
    void setUp() {
        calendarId = UUID.randomUUID();
        TimeSlot timeSlot = TimeSlot.create(
            calendarId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2) // 월, 화, 수
        );
        savedTimeSlot = timeSlotRepository.save(timeSlot);
    }

    @Test
    @DisplayName("성공: 타임슬롯 저장 및 조회")
    void saveAndFindTimeSlot() {
        // when
        var found = timeSlotRepository.findById(savedTimeSlot.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getCalendarId()).isEqualTo(calendarId);
        assertThat(found.get().getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(found.get().getEndTime()).isEqualTo(LocalTime.of(11, 0));
        assertThat(found.get().getWeekdays()).containsExactly(0, 1, 2);
    }

    @Test
    @DisplayName("성공: calendarId로 타임슬롯 목록 조회")
    void findByCalendarId() {
        // given - 추가 타임슬롯 생성
        TimeSlot anotherTimeSlot = TimeSlot.create(
            calendarId,
            LocalTime.of(14, 0),
            LocalTime.of(15, 0),
            List.of(3, 4) // 목, 금
        );
        timeSlotRepository.save(anotherTimeSlot);

        // when
        List<TimeSlot> found = timeSlotRepository.findByCalendarId(calendarId);

        // then
        assertThat(found).hasSize(2);
    }

    @Test
    @DisplayName("성공: 다른 calendarId로 조회 시 빈 목록 반환")
    void findByCalendarIdNotFound() {
        // when
        List<TimeSlot> found = timeSlotRepository.findByCalendarId(UUID.randomUUID());

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: 겹치는 시간대 조회 - 겹치는 타임슬롯 존재")
    void findOverlappingTimeSlotsExists() {
        // when - 10:30-11:30은 기존 10:00-11:00과 겹침
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            calendarId,
            LocalTime.of(10, 30),
            LocalTime.of(11, 30)
        );

        // then
        assertThat(overlapping).hasSize(1);
        assertThat(overlapping.get(0).getId()).isEqualTo(savedTimeSlot.getId());
    }

    @Test
    @DisplayName("성공: 겹치는 시간대 조회 - 겹치지 않음")
    void findOverlappingTimeSlotsNotExists() {
        // when - 11:00-12:00은 기존 10:00-11:00과 겹치지 않음 (경계)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            calendarId,
            LocalTime.of(11, 0),
            LocalTime.of(12, 0)
        );

        // then
        assertThat(overlapping).isEmpty();
    }

    @Test
    @DisplayName("성공: 겹치는 시간대 조회 - 다른 캘린더는 무시")
    void findOverlappingTimeSlotsIgnoresOtherCalendar() {
        // when - 다른 캘린더 ID로 조회
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            UUID.randomUUID(),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0)
        );

        // then
        assertThat(overlapping).isEmpty();
    }
}
