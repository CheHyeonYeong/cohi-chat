package com.coDevs.cohiChat.calendar;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.coDevs.cohiChat.calendar.entity.Calendar;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CalendarRepositoryTest {

    @Autowired
    private CalendarRepository calendarRepository;

    private UUID hostId;
    private Calendar savedCalendar;

    @BeforeEach
    void setUp() {
        hostId = UUID.randomUUID();
        Calendar calendar = Calendar.create(
            hostId,
            List.of("커리어 상담", "이력서 리뷰"),
            "게스트에게 보여줄 설명입니다.",
            "test@group.calendar.google.com"
        );
        savedCalendar = calendarRepository.save(calendar);
    }

    @Test
    @DisplayName("성공: 캘린더 저장 및 조회")
    void saveAndFindCalendar() {
        // when
        Optional<Calendar> found = calendarRepository.findById(savedCalendar.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getHostId()).isEqualTo(hostId);
        assertThat(found.get().getTopics()).containsExactly("커리어 상담", "이력서 리뷰");
    }

    @Test
    @DisplayName("성공: hostId로 캘린더 조회")
    void findByHostId() {
        // when
        Optional<Calendar> found = calendarRepository.findByHostIdAndIsDeletedFalse(hostId);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(savedCalendar.getId());
    }

    @Test
    @DisplayName("성공: 존재하지 않는 hostId로 조회 시 빈 Optional 반환")
    void findByHostIdNotFound() {
        // when
        Optional<Calendar> found = calendarRepository.findByHostIdAndIsDeletedFalse(UUID.randomUUID());

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: hostId로 캘린더 존재 여부 확인 - 존재함")
    void existsByHostIdTrue() {
        // when
        boolean exists = calendarRepository.existsByHostIdAndIsDeletedFalse(hostId);

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("성공: hostId로 캘린더 존재 여부 확인 - 존재하지 않음")
    void existsByHostIdFalse() {
        // when
        boolean exists = calendarRepository.existsByHostIdAndIsDeletedFalse(UUID.randomUUID());

        // then
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("성공: 삭제된 캘린더는 조회되지 않음")
    void deletedCalendarNotFound() {
        // given
        savedCalendar.softDelete();
        calendarRepository.save(savedCalendar);

        // when
        Optional<Calendar> found = calendarRepository.findByHostIdAndIsDeletedFalse(hostId);
        boolean exists = calendarRepository.existsByHostIdAndIsDeletedFalse(hostId);

        // then
        assertThat(found).isEmpty();
        assertThat(exists).isFalse();
    }
}
