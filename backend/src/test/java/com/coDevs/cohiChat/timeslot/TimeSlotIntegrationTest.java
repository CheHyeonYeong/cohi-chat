package com.coDevs.cohiChat.timeslot;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TimeSlotIntegrationTest {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private CalendarRepository calendarRepository;

    private UUID calendarId;

    @BeforeEach
    void setUp() {
        calendarId = UUID.randomUUID();

        Calendar calendar = Calendar.create(
            calendarId,
            List.of("커리어 상담"),
            "게스트에게 보여줄 설명입니다.",
            "test@group.calendar.google.com"
        );
        calendarRepository.save(calendar);
    }

    @Test
    @DisplayName("통합 테스트: 타임슬롯 생성 및 조회 전체 흐름")
    void createAndRetrieveTimeSlotFlow() {
        // given - 타임슬롯 생성
        TimeSlot timeSlot = TimeSlot.create(
            calendarId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );

        // when - 저장
        TimeSlot savedTimeSlot = timeSlotRepository.save(timeSlot);

        // then - 조회 확인
        assertThat(savedTimeSlot.getId()).isNotNull();
        assertThat(savedTimeSlot.getCalendarId()).isEqualTo(calendarId);
        assertThat(savedTimeSlot.getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(savedTimeSlot.getEndTime()).isEqualTo(LocalTime.of(11, 0));
        assertThat(savedTimeSlot.getWeekdays()).containsExactly(0, 1, 2);
        assertThat(savedTimeSlot.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("통합 테스트: 여러 타임슬롯 생성 후 목록 조회")
    void createMultipleTimeSlotsAndRetrieve() {
        // given
        TimeSlot timeSlot1 = TimeSlot.create(
            calendarId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0)
        );
        TimeSlot timeSlot2 = TimeSlot.create(
            calendarId,
            LocalTime.of(14, 0),
            LocalTime.of(15, 0),
            List.of(1)
        );
        TimeSlot timeSlot3 = TimeSlot.create(
            calendarId,
            LocalTime.of(16, 0),
            LocalTime.of(17, 0),
            List.of(2, 3)
        );

        timeSlotRepository.saveAll(List.of(timeSlot1, timeSlot2, timeSlot3));

        // when
        List<TimeSlot> foundTimeSlots = timeSlotRepository.findByCalendarId(calendarId);

        // then
        assertThat(foundTimeSlots).hasSize(3);
    }

    @Test
    @DisplayName("통합 테스트: 시간대 중복 검증 쿼리")
    void overlappingTimeSlotQuery() {
        // given - 기존 타임슬롯: 10:00-11:00
        TimeSlot existingTimeSlot = TimeSlot.create(
            calendarId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        timeSlotRepository.save(existingTimeSlot);

        // when - 겹치는 시간대 조회 (10:30-11:30)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            calendarId,
            LocalTime.of(10, 30),
            LocalTime.of(11, 30)
        );

        // then
        assertThat(overlapping).hasSize(1);
        assertThat(overlapping.get(0).getId()).isEqualTo(existingTimeSlot.getId());
    }

    @Test
    @DisplayName("통합 테스트: 겹치지 않는 시간대는 조회되지 않음")
    void nonOverlappingTimeSlotQuery() {
        // given - 기존 타임슬롯: 10:00-11:00
        TimeSlot existingTimeSlot = TimeSlot.create(
            calendarId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        timeSlotRepository.save(existingTimeSlot);

        // when - 겹치지 않는 시간대 조회 (11:00-12:00)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            calendarId,
            LocalTime.of(11, 0),
            LocalTime.of(12, 0)
        );

        // then
        assertThat(overlapping).isEmpty();
    }
}
