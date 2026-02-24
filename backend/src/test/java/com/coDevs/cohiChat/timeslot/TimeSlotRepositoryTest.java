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
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TimeSlotRepositoryTest {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    private UUID userId;
    private TimeSlot savedTimeSlot;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        TimeSlot timeSlot = TimeSlot.create(
            userId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2) // 일, 월, 화
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
        assertThat(found.get().getUserId()).isEqualTo(userId);
        assertThat(found.get().getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(found.get().getEndTime()).isEqualTo(LocalTime.of(11, 0));
        assertThat(found.get().getWeekdays()).containsExactlyInAnyOrder(0, 1, 2);
    }

    @Test
    @DisplayName("성공: userId로 타임슬롯 목록 조회 - startTime 오름차순 정렬")
    void findByUserIdOrderByStartTimeAsc() {
        // given - 여러 시간대의 타임슬롯 생성 (순서 섞어서)
        TimeSlot timeSlot14 = TimeSlot.create(userId, LocalTime.of(14, 0), LocalTime.of(15, 0), List.of(3, 4));
        TimeSlot timeSlot09 = TimeSlot.create(userId, LocalTime.of(9, 0), LocalTime.of(10, 0), List.of(1));
        timeSlotRepository.save(timeSlot14);
        timeSlotRepository.save(timeSlot09);

        // when
        List<TimeSlot> found = timeSlotRepository.findByUserIdOrderByStartTimeAsc(userId);

        // then - startTime 오름차순 정렬 확인
        assertThat(found).hasSize(3);
        assertThat(found.get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(found.get(1).getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(found.get(2).getStartTime()).isEqualTo(LocalTime.of(14, 0));
    }

    @Test
    @DisplayName("성공: 다른 userId로 조회 시 빈 목록 반환")
    void findByUserIdNotFound() {
        // when
        List<TimeSlot> found = timeSlotRepository.findByUserIdOrderByStartTimeAsc(UUID.randomUUID());

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: 시간과 요일이 모두 겹치는 타임슬롯 조회")
    void findOverlappingTimeSlotsWithTimeAndWeekday() {
        // when - 10:30-11:30은 기존 10:00-11:00과 시간이 겹치고, 요일 0도 겹침
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            userId,
            LocalTime.of(10, 30),
            LocalTime.of(11, 30),
            List.of(0),
            null, null
        );

        // then
        assertThat(overlapping).hasSize(1);
        assertThat(overlapping.get(0).getId()).isEqualTo(savedTimeSlot.getId());
    }

    @Test
    @DisplayName("성공: 시간이 겹치지만 요일이 다르면 겹치지 않음")
    void findOverlappingTimeSlotsNoWeekdayOverlap() {
        // when - 시간은 겹치지만 요일 3,4 (목,금)은 기존 0,1,2 (일,월,화)와 겹치지 않음
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            userId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(3, 4),
            null, null
        );

        // then
        assertThat(overlapping).isEmpty();
    }

    @Test
    @DisplayName("성공: 시간이 겹치지 않으면 겹치지 않음")
    void findOverlappingTimeSlotsNoTimeOverlap() {
        // when - 11:00-12:00은 기존 10:00-11:00과 시간이 겹치지 않음 (경계)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            userId,
            LocalTime.of(11, 0),
            LocalTime.of(12, 0),
            List.of(0, 1, 2),
            null, null
        );

        // then
        assertThat(overlapping).isEmpty();
    }

    @Test
    @DisplayName("성공: 다른 사용자의 타임슬롯은 무시")
    void findOverlappingTimeSlotsIgnoresOtherUser() {
        // when - 다른 사용자 ID로 조회
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            UUID.randomUUID(),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2),
            null, null
        );

        // then
        assertThat(overlapping).isEmpty();
    }
}
